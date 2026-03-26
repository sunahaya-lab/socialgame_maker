const BASE_TIERS = ["free", "publish"];
const PACK_IDS = ["storage_plus", "story_fx", "battle", "defense", "event"];

const PRODUCT_CATALOG = [
  {
    id: "publish",
    kind: "base_tier",
    name: "Publish Pack",
    baseTier: "publish",
    priceJpy: 1980,
    requires: [],
    grants: ["public_share", "animated_assets", "paid_editor_surface", "storage_500mb"]
  },
  {
    id: "story_fx",
    kind: "pack",
    name: "Story FX Pack",
    priceJpy: 980,
    requires: [],
    grants: ["story_fx_controls", "sound_effects"]
  },
  {
    id: "battle",
    kind: "pack",
    name: "Battle Pack",
    priceJpy: 980,
    requires: [],
    grants: ["battle_controls"]
  },
  {
    id: "defense",
    kind: "pack",
    name: "Defense Pack",
    priceJpy: 1280,
    requires: [],
    grants: ["defense_controls"]
  },
  {
    id: "event",
    kind: "pack",
    name: "Event Pack",
    priceJpy: 980,
    requires: [],
    grants: ["event_controls"]
  },
  {
    id: "storage_plus",
    kind: "pack",
    name: "Storage Plus Pack",
    priceJpy: 780,
    requires: ["publish"],
    grants: ["storage_1gb"]
  }
];

const FEATURE_PACK_MAP = {
  battle_controls: "battle",
  defense_controls: "defense",
  event_controls: "event",
  story_fx_controls: "story_fx"
};

export function getBillingCatalog() {
  return PRODUCT_CATALOG.map(item => ({
    ...item,
    requires: [...item.requires],
    grants: [...item.grants]
  }));
}

export function normalizeBaseTier(value) {
  return BASE_TIERS.includes(value) ? value : "free";
}

export function normalizeOwnedPacks(values) {
  const seen = new Set();
  const packs = [];
  for (const value of Array.isArray(values) ? values : []) {
    const packId = String(value || "").trim();
    if (!PACK_IDS.includes(packId) || seen.has(packId)) continue;
    seen.add(packId);
    packs.push(packId);
  }
  packs.sort((left, right) => PACK_IDS.indexOf(left) - PACK_IDS.indexOf(right));
  return packs;
}

export function buildLicenseEntitlements(baseTier, ownedPacks) {
  const normalizedBaseTier = normalizeBaseTier(baseTier);
  const normalizedOwnedPacks = normalizeOwnedPacks(ownedPacks);
  const hasPublish = normalizedBaseTier === "publish";
  const hasStoragePlus = hasPublish && normalizedOwnedPacks.includes("storage_plus");

  return {
    canCreatePublicShare: hasPublish,
    canUseAnimatedAssets: hasPublish,
    canUsePaidEditorSurface: hasPublish,
    canUseStoryFx: normalizedOwnedPacks.includes("story_fx"),
    canUseBattleControls: normalizedOwnedPacks.includes("battle"),
    canUseDefenseControls: normalizedOwnedPacks.includes("defense"),
    canUseEventControls: normalizedOwnedPacks.includes("event"),
    storageLimitMb: hasStoragePlus ? 1024 : hasPublish ? 500 : 25
  };
}

export function isProjectPublicShareAllowed(license) {
  return Boolean(license?.entitlements?.canCreatePublicShare);
}

export function getRequiredPackForFeature(featureKey) {
  return FEATURE_PACK_MAP[featureKey] || null;
}

export function hasFeatureAccess(license, featureKey) {
  switch (featureKey) {
    case "public_share":
      return Boolean(license?.entitlements?.canCreatePublicShare);
    case "battle_controls":
      return Boolean(license?.entitlements?.canUseBattleControls);
    case "defense_controls":
      return Boolean(license?.entitlements?.canUseDefenseControls);
    case "event_controls":
      return Boolean(license?.entitlements?.canUseEventControls);
    case "story_fx_controls":
      return Boolean(license?.entitlements?.canUseStoryFx);
    case "animated_assets":
      return Boolean(license?.entitlements?.canUseAnimatedAssets);
    default:
      return false;
  }
}

export async function ensureUserLicenseState(env, userId) {
  const normalizedUserId = String(userId || "").trim();
  const now = new Date().toISOString();

  if (!normalizedUserId) {
    return buildResolvedLicenseState({
      userId: null,
      baseTier: "free",
      ownedPacks: [],
      grantedAt: null,
      updatedAt: now,
      source: "missing_user"
    });
  }

  if (!env?.SOCIA_DB) {
    return buildResolvedLicenseState({
      userId: normalizedUserId,
      baseTier: "free",
      ownedPacks: [],
      grantedAt: null,
      updatedAt: now,
      source: "no_d1"
    });
  }

  await env.SOCIA_DB.prepare(`
    INSERT INTO user_license_profiles (
      user_id,
      base_tier,
      granted_at,
      created_at,
      updated_at
    )
    VALUES (?, 'free', NULL, ?, ?)
    ON CONFLICT(user_id) DO NOTHING
  `).bind(normalizedUserId, now, now).run();

  const profile = await env.SOCIA_DB.prepare(`
    SELECT user_id, base_tier, granted_at, updated_at
    FROM user_license_profiles
    WHERE user_id = ?
    LIMIT 1
  `).bind(normalizedUserId).first();

  const packRows = await env.SOCIA_DB.prepare(`
    SELECT pack_id
    FROM user_owned_packs
    WHERE user_id = ?
    ORDER BY
      CASE pack_id
        WHEN 'storage_plus' THEN 1
        WHEN 'story_fx' THEN 2
        WHEN 'battle' THEN 3
        WHEN 'defense' THEN 4
        WHEN 'event' THEN 5
        ELSE 99
      END,
      pack_id ASC
  `).bind(normalizedUserId).all();

  return buildResolvedLicenseState({
    userId: normalizedUserId,
    baseTier: profile?.base_tier || "free",
    ownedPacks: packRows?.results?.map(row => row.pack_id) || [],
    grantedAt: profile?.granted_at || null,
    updatedAt: profile?.updated_at || now,
    source: "user_license"
  });
}

export async function getProjectOwnerLicenseState(env, projectId) {
  const normalizedProjectId = String(projectId || "").trim();
  const now = new Date().toISOString();

  if (!normalizedProjectId || !env?.SOCIA_DB) {
    return {
      projectId: normalizedProjectId,
      ownerUserId: null,
      license: buildResolvedLicenseState({
        userId: null,
        baseTier: "free",
        ownedPacks: [],
        grantedAt: null,
        updatedAt: now,
        source: normalizedProjectId ? "no_d1" : "missing_project"
      })
    };
  }

  const owner = await env.SOCIA_DB.prepare(`
    SELECT owner_user_id
    FROM projects
    WHERE id = ?
    LIMIT 1
  `).bind(normalizedProjectId).first();

  const ownerUserId = String(owner?.owner_user_id || "").trim() || null;
  const userLicense = await ensureUserLicenseState(env, ownerUserId);
  const legacyLicense = await getLegacyProjectLicenseState(env, normalizedProjectId);

  if (isProjectPublicShareAllowed(userLicense) || !legacyLicense.publicShareEnabled) {
    return {
      projectId: normalizedProjectId,
      ownerUserId,
      license: userLicense
    };
  }

  return {
    projectId: normalizedProjectId,
    ownerUserId,
    license: buildResolvedLicenseState({
      userId: ownerUserId,
      baseTier: "publish",
      ownedPacks: userLicense.ownedPacks,
      grantedAt: legacyLicense.licensedAt,
      updatedAt: legacyLicense.updatedAt || now,
      source: "legacy_project_state"
    })
  };
}

export async function getEffectiveProjectLicenseState(env, projectId) {
  const ownerState = await getProjectOwnerLicenseState(env, projectId);
  const license = ownerState.license;
  return {
    ownerUserId: ownerState.ownerUserId,
    publicShareEnabled: license.entitlements.canCreatePublicShare ? 1 : 0,
    licensePlan: license.baseTier === "publish" ? "paid" : "free",
    licensedAt: license.grantedAt,
    licenseExpiresAt: null,
    updatedAt: license.updatedAt,
    source: license.source,
    baseTier: license.baseTier,
    ownedPacks: [...license.ownedPacks],
    entitlements: { ...license.entitlements }
  };
}

export async function upsertUserLicenseState(env, userId, nextState, options = {}) {
  if (!env?.SOCIA_DB) {
    throw new Error("SOCIA_DB binding is required");
  }

  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    throw new Error("userId is required");
  }

  const baseTier = normalizeBaseTier(nextState?.baseTier);
  const ownedPacks = normalizeOwnedPacks(nextState?.ownedPacks);
  const now = new Date().toISOString();
  const grantedByUserId = String(options?.grantedByUserId || "").trim() || null;

  await env.SOCIA_DB.prepare(`
    INSERT INTO user_license_profiles (
      user_id,
      base_tier,
      granted_at,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      base_tier = excluded.base_tier,
      granted_at = excluded.granted_at,
      updated_at = excluded.updated_at
  `).bind(
    normalizedUserId,
    baseTier,
    baseTier === "publish" ? now : null,
    now,
    now
  ).run();

  const statements = [
    env.SOCIA_DB.prepare(`
      DELETE FROM user_owned_packs
      WHERE user_id = ?
    `).bind(normalizedUserId),
    ...ownedPacks.map(packId => env.SOCIA_DB.prepare(`
      INSERT INTO user_owned_packs (
        user_id,
        pack_id,
        granted_at,
        granted_by_user_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(normalizedUserId, packId, now, grantedByUserId, now, now))
  ];

  await env.SOCIA_DB.batch(statements);
  return ensureUserLicenseState(env, normalizedUserId);
}

function buildResolvedLicenseState(input) {
  const baseTier = normalizeBaseTier(input?.baseTier);
  const ownedPacks = normalizeOwnedPacks(input?.ownedPacks);
  return {
    userId: input?.userId || null,
    baseTier,
    ownedPacks,
    grantedAt: input?.grantedAt || null,
    updatedAt: input?.updatedAt || new Date().toISOString(),
    source: input?.source || "user_license",
    entitlements: buildLicenseEntitlements(baseTier, ownedPacks)
  };
}

async function getLegacyProjectLicenseState(env, projectId) {
  const normalizedProjectId = String(projectId || "").trim();
  const now = new Date().toISOString();

  if (!normalizedProjectId || !env?.SOCIA_DB) {
    return {
      publicShareEnabled: 0,
      licensePlan: "free",
      licensedAt: null,
      licenseExpiresAt: null,
      updatedAt: now
    };
  }

  try {
    const row = await env.SOCIA_DB.prepare(`
      SELECT public_share_enabled, license_plan, licensed_at, license_expires_at, updated_at
      FROM project_license_states
      WHERE project_id = ?
      LIMIT 1
    `).bind(normalizedProjectId).first();

    return {
      publicShareEnabled: Number(row?.public_share_enabled || 0),
      licensePlan: String(row?.license_plan || "free"),
      licensedAt: row?.licensed_at || null,
      licenseExpiresAt: row?.license_expires_at || null,
      updatedAt: row?.updated_at || now
    };
  } catch {
    return {
      publicShareEnabled: 0,
      licensePlan: "free",
      licensedAt: null,
      licenseExpiresAt: null,
      updatedAt: now
    };
  }
}
