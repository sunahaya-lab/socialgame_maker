export {
  createCorsHeaders,
  json,
  readJson
} from "./_http.js";

export function getPlayerScope(url, body = {}) {
  const projectId = url.searchParams.get("project") || body.projectId || null;
  const userId = url.searchParams.get("user") || body.userId || null;
  const hasDisplayName = Object.prototype.hasOwnProperty.call(body, "displayName");
  const hasBirthday = Object.prototype.hasOwnProperty.call(body, "birthday");
  const displayName = hasDisplayName ? normalizePlayerDisplayName(body.displayName) : "";
  const birthday = hasBirthday ? normalizePlayerBirthday(body.birthday) : "";
  return { projectId, userId, displayName, birthday, hasDisplayName, hasBirthday };
}

export async function ensurePlayerProfile(env, scope) {
  if (!env.SOCIA_DB) {
    throw new Error("D1 \u30d0\u30a4\u30f3\u30c7\u30a3\u30f3\u30b0 SOCIA_DB \u304c\u5fc5\u8981\u3067\u3059");
  }

  const existing = await getPlayerProfileRow(env, scope.projectId, scope.userId);

  const now = new Date().toISOString();
  if (existing) {
    const nextDisplayName = scope.hasDisplayName
      ? scope.displayName
      : (existing.display_name || "");
    const nextBirthday = scope.hasBirthday
      ? scope.birthday
      : (existing.birthday || "");
    await updatePlayerProfileRow(env, existing.id, nextDisplayName, nextBirthday, now);
    await ensureDefaultCurrencyBalances(env, existing.id);

    return {
      id: existing.id,
      projectId: existing.project_id,
      userId: existing.user_id,
      displayName: nextDisplayName,
      birthday: nextBirthday,
      lastActiveAt: now,
      createdAt: existing.created_at || now,
      updatedAt: now
    };
  }

  await assertParentRowsExist(env, scope.projectId, scope.userId);

  const id = crypto.randomUUID();
  await insertPlayerProfileRow(env, {
    id,
    projectId: scope.projectId,
    userId: scope.userId,
    displayName: scope.displayName || "",
    birthday: scope.birthday || "",
    now
  });
  await ensureDefaultCurrencyBalances(env, id);

  return {
    id,
    projectId: scope.projectId,
    userId: scope.userId,
    displayName: scope.displayName || "",
    birthday: scope.birthday || "",
    lastActiveAt: now,
    createdAt: now,
    updatedAt: now
  };
}

async function getPlayerProfileRow(env, projectId, userId) {
  try {
    return await env.SOCIA_DB.prepare(`
      SELECT id, project_id, user_id, display_name, birthday, last_active_at, created_at, updated_at
      FROM player_profiles
      WHERE project_id = ? AND user_id = ?
    `).bind(projectId, userId).first();
  } catch (error) {
    if (!isBirthdayColumnUnavailable(error)) throw error;
    const row = await env.SOCIA_DB.prepare(`
      SELECT id, project_id, user_id, display_name, last_active_at, created_at, updated_at
      FROM player_profiles
      WHERE project_id = ? AND user_id = ?
    `).bind(projectId, userId).first();
    return row ? { ...row, birthday: "" } : null;
  }
}

async function updatePlayerProfileRow(env, id, displayName, birthday, now) {
  try {
    await env.SOCIA_DB.prepare(`
      UPDATE player_profiles
      SET display_name = ?, birthday = ?, last_active_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(displayName, birthday, now, now, id).run();
  } catch (error) {
    if (!isBirthdayColumnUnavailable(error)) throw error;
    await env.SOCIA_DB.prepare(`
      UPDATE player_profiles
      SET display_name = ?, last_active_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(displayName, now, now, id).run();
  }
}

async function insertPlayerProfileRow(env, input) {
  try {
    await env.SOCIA_DB.prepare(`
      INSERT INTO player_profiles (
        id, project_id, user_id, display_name, birthday, last_active_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      input.id,
      input.projectId,
      input.userId,
      input.displayName,
      input.birthday,
      input.now,
      input.now,
      input.now
    ).run();
  } catch (error) {
    if (!isBirthdayColumnUnavailable(error)) throw error;
    await env.SOCIA_DB.prepare(`
      INSERT INTO player_profiles (
        id, project_id, user_id, display_name, last_active_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      input.id,
      input.projectId,
      input.userId,
      input.displayName,
      input.now,
      input.now,
      input.now
    ).run();
  }
}

function isBirthdayColumnUnavailable(error) {
  return /birthday/i.test(String(error?.message || ""));
}

export function normalizePlayerDisplayName(value) {
  return String(value || "").trim().slice(0, 40);
}

export function normalizePlayerBirthday(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{1,2})[-/](\d{1,2})$/);
  if (!match) {
    throw new Error("誕生日は MM-DD 形式で入力してください");
  }
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error("誕生日は MM-DD 形式で入力してください");
  }
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getDefaultCurrencyDefinitions() {
  return [
    { key: "stamina", amount: 120, maxAmount: 120, recoveryMinutes: 1, recoveryAmount: 1 },
    { key: "gems", amount: 9999, maxAmount: null },
    { key: "gold", amount: 85000, maxAmount: null }
  ];
}

export function getDefaultCurrencyDefinition(key) {
  return getDefaultCurrencyDefinitions().find(currency => currency.key === key) || null;
}

export async function ensureDefaultCurrencyBalances(env, playerProfileId) {
  if (!env?.SOCIA_DB || !playerProfileId) return;
  const now = new Date().toISOString();

  try {
    for (const currency of getDefaultCurrencyDefinitions()) {
      await env.SOCIA_DB.prepare(`
        INSERT INTO player_currency_balances (
          id, player_profile_id, currency_key, amount, max_amount, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(player_profile_id, currency_key) DO NOTHING
      `).bind(
        crypto.randomUUID(),
        playerProfileId,
        currency.key,
        currency.amount,
        currency.maxAmount,
        now,
        now
      ).run();
    }
  } catch (error) {
    console.warn("Player currency balances table unavailable:", error);
  }
}

export async function loadPlayerCurrencyBalances(env, playerProfileId, options = {}) {
  const { persistRecovery = true, requireStorage = false } = options;
  const now = new Date();
  const nowIso = now.toISOString();

  if (!env?.SOCIA_DB || !playerProfileId) {
    if (requireStorage) throw new Error("D1 \u30d0\u30a4\u30f3\u30c7\u30a3\u30f3\u30b0 SOCIA_DB \u304c\u5fc5\u8981\u3067\u3059");
    return getDefaultCurrencyDefinitions().map(currency => makeCurrencyBalance(currency, null, nowIso));
  }

  try {
    await ensureDefaultCurrencyBalances(env, playerProfileId);

    const result = await env.SOCIA_DB.prepare(`
      SELECT id, currency_key, amount, max_amount, created_at, updated_at
      FROM player_currency_balances
      WHERE player_profile_id = ?
      ORDER BY CASE currency_key
        WHEN 'stamina' THEN 1
        WHEN 'gems' THEN 2
        WHEN 'gold' THEN 3
        ELSE 99
      END, currency_key ASC
    `).bind(playerProfileId).all();

    const balances = getDefaultCurrencyDefinitions().map(currency => makeCurrencyBalance(currency, null, nowIso));
    (result.results || []).forEach(row => {
      const key = String(row?.currency_key || "").trim();
      const definition = getDefaultCurrencyDefinition(key);
      if (!definition) return;
      const index = balances.findIndex(item => item.key === key);
      const next = makeCurrencyBalance(definition, row, nowIso);
      if (index >= 0) balances[index] = next;
      else balances.push(next);
    });

    const recoveredBalances = balances.map(balance => applyPassiveCurrencyRecovery(balance, now));

    if (persistRecovery) {
      for (const balance of recoveredBalances) {
        if (!balance.id) continue;
        const previous = balances.find(item => item.key === balance.key);
        if (!previous) continue;
        if (previous.amount === balance.amount && previous.updatedAt === balance.updatedAt) continue;
        await env.SOCIA_DB.prepare(`
          UPDATE player_currency_balances
          SET amount = ?, updated_at = ?
          WHERE id = ?
        `).bind(balance.amount, balance.updatedAt, balance.id).run();
      }
    }

    return recoveredBalances;
  } catch (error) {
    if (requireStorage) throw error;
    console.warn("Player currency balances table unavailable:", error);
    return getDefaultCurrencyDefinitions().map(currency => makeCurrencyBalance(currency, null, nowIso));
  }
}

function makeCurrencyBalance(definition, row, fallbackTimestamp) {
  return {
    id: row?.id || null,
    key: definition.key,
    amount: Math.max(0, Number(row?.amount ?? definition.amount ?? 0)),
    maxAmount: row?.max_amount === null || row?.max_amount === undefined
      ? (definition.maxAmount === null || definition.maxAmount === undefined ? null : Number(definition.maxAmount || 0))
      : Math.max(0, Number(row.max_amount || 0)),
    createdAt: row?.created_at || fallbackTimestamp,
    updatedAt: row?.updated_at || fallbackTimestamp
  };
}

function applyPassiveCurrencyRecovery(balance, now) {
  const definition = getDefaultCurrencyDefinition(balance?.key);
  if (!definition?.recoveryMinutes || !definition?.recoveryAmount) return balance;

  const maxAmount = balance.maxAmount === null || balance.maxAmount === undefined
    ? null
    : Math.max(0, Number(balance.maxAmount || 0));
  const currentAmount = Math.max(0, Number(balance.amount || 0));
  if (maxAmount === null || currentAmount >= maxAmount) return balance;

  const updatedAtMs = Date.parse(balance.updatedAt || "");
  const nowMs = now.getTime();
  if (!Number.isFinite(updatedAtMs) || nowMs <= updatedAtMs) return balance;

  const elapsedUnits = Math.floor((nowMs - updatedAtMs) / (definition.recoveryMinutes * 60 * 1000));
  if (elapsedUnits <= 0) return balance;

  const nextAmount = Math.min(maxAmount, currentAmount + elapsedUnits * definition.recoveryAmount);
  const nextUpdatedAt = nextAmount >= maxAmount
    ? now.toISOString()
    : new Date(updatedAtMs + elapsedUnits * definition.recoveryMinutes * 60 * 1000).toISOString();

  return {
    ...balance,
    amount: nextAmount,
    updatedAt: nextUpdatedAt
  };
}

export async function assertParentRowsExist(env, projectId, userId) {
  const [project, user] = await Promise.all([
    env.SOCIA_DB.prepare(`SELECT id FROM projects WHERE id = ?`).bind(projectId).first(),
    env.SOCIA_DB.prepare(`SELECT id FROM users WHERE id = ?`).bind(userId).first()
  ]);

  if (!user) {
    const now = new Date().toISOString();
    await env.SOCIA_DB.prepare(`
      INSERT INTO users (id, auth_subject, email, display_name, created_at, updated_at)
      VALUES (?, ?, NULL, '', ?, ?)
    `).bind(userId, `local:${userId}`, now, now).run();
  }

  if (!project) {
    const now = new Date().toISOString();
    const slug = makeProjectSlug(projectId);
    await env.SOCIA_DB.prepare(`
      INSERT INTO projects (id, owner_user_id, name, slug, description, visibility, created_at, updated_at)
      VALUES (?, ?, ?, ?, '', 'private', ?, ?)
    `).bind(projectId, userId, projectId, slug, now, now).run();
  }
}

function makeProjectSlug(projectId) {
  const base = String(projectId || "project")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "project";
  return `${base}-${String(projectId || "").slice(0, 8).toLowerCase()}`;
}

export async function ensureCanonicalStory(env, projectId, storyId) {
  const existing = await env.SOCIA_DB.prepare(`SELECT id FROM stories WHERE id = ?`).bind(storyId).first();
  if (existing) return existing.id;

  const scopeKey = `project:${projectId}`;
  const bridge = await env.SOCIA_DB.prepare(`
    SELECT payload_json
    FROM story_registries
    WHERE scope_key = ? AND story_id = ?
  `).bind(scopeKey, storyId).first();
  if (!bridge?.payload_json) return null;

  const payload = JSON.parse(String(bridge.payload_json || "{}"));
  const now = new Date().toISOString();
  await env.SOCIA_DB.prepare(`
    INSERT INTO stories (id, project_id, type, title, target_card_id, bgm_asset_id, sort_order, metadata_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)
  `).bind(
    storyId,
    projectId,
    ["main", "event", "character"].includes(payload.type) ? payload.type : "main",
    String(payload.title || storyId).slice(0, 200),
    Math.max(0, Number(payload.sortOrder) || 0),
    JSON.stringify({
      entryId: payload.entryId || null,
      bgm: payload.bgm || "",
      variantAssignments: Array.isArray(payload.variantAssignments) ? payload.variantAssignments : [],
      scenes: Array.isArray(payload.scenes) ? payload.scenes : []
    }),
    now,
    now
  ).run();

  return storyId;
}

export async function ensureCanonicalGacha(env, projectId, gachaId) {
  const existing = await env.SOCIA_DB.prepare(`SELECT id FROM gachas WHERE id = ?`).bind(gachaId).first();
  if (existing) return existing.id;

  const scopeKey = `project:${projectId}`;
  const bridge = await env.SOCIA_DB.prepare(`
    SELECT payload_json
    FROM gacha_registries
    WHERE scope_key = ? AND gacha_id = ?
  `).bind(scopeKey, gachaId).first();
  if (!bridge?.payload_json) return null;

  const payload = JSON.parse(String(bridge.payload_json || "{}"));
  const now = new Date().toISOString();
  await env.SOCIA_DB.prepare(`
    INSERT INTO gachas (id, project_id, title, description, banner_asset_id, sort_order, metadata_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, 0, ?, ?, ?)
  `).bind(
    gachaId,
    projectId,
    String(payload.title || gachaId).slice(0, 200),
    String(payload.description || "").slice(0, 500),
    JSON.stringify({
      bannerImage: payload.bannerImage || "",
      featured: Array.isArray(payload.featured) ? payload.featured : [],
      rates: payload.rates || {},
      gachaType: payload.gachaType || "character"
    }),
    now,
    now
  ).run();

  return gachaId;
}

export async function ensureCanonicalCard(env, projectId, cardId) {
  const existing = await env.SOCIA_DB.prepare(`SELECT id FROM cards WHERE id = ?`).bind(cardId).first();
  if (existing) return existing.id;

  const scopeKey = `project:${projectId}`;
  const bridge = await env.SOCIA_DB.prepare(`
    SELECT payload_json
    FROM entry_registries
    WHERE scope_key = ? AND entry_id = ?
  `).bind(scopeKey, cardId).first();
  if (!bridge?.payload_json) return null;

  const payload = JSON.parse(String(bridge.payload_json || "{}"));
  const now = new Date().toISOString();
  await env.SOCIA_DB.prepare(`
    INSERT INTO cards (id, project_id, base_character_id, name, catch_text, rarity, attribute, image_asset_id, sort_order, metadata_json, created_at, updated_at)
    VALUES (?, ?, NULL, ?, ?, ?, ?, NULL, 0, ?, ?, ?)
  `).bind(
    cardId,
    projectId,
    String(payload.name || cardId).slice(0, 200),
    String(payload.catch || "").slice(0, 500),
    String(payload.rarity || "SR").slice(0, 32),
    String(payload.attribute || "").slice(0, 80),
    JSON.stringify({
      image: payload.image || "",
      baseCharId: payload.baseCharId || null,
      voiceLines: payload.voiceLines || {},
      homeVoices: payload.homeVoices || {}
    }),
    now,
    now
  ).run();

  return cardId;
}
