import {
  ensureUserLicenseState,
  getRequiredPackForFeature,
  hasFeatureAccess
} from "./_billing.js";
import {
  buildContentScope,
  createCorsHeaders,
  ensureReadableAccess,
  ensureSharedContentWriteAccess,
  errorJson,
  getRequesterUserId,
  json,
  readJson,
  resolveShareAccess
} from "./_share-auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const access = await resolveShareAccess(request, env);
  const blockedRead = ensureReadableAccess(access, corsHeaders);
  if (blockedRead) return blockedRead;
  const { key, scopeKey } = buildContentScope(access, "system");

  if (request.method === "GET") {
    const result = await loadSystemConfig(env, { key, scopeKey });
    return json(result, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await readJson(request);
    const blockedWrite = await ensureSharedContentWriteAccess(request, env, access, corsHeaders, input);
    if (blockedWrite) return blockedWrite;
    const blockedBilling = await ensureSystemBillingAccess(request, env, access, input, corsHeaders);
    if (blockedBilling) return blockedBilling;
    const system = sanitizeSystemConfig(input);
    const result = await saveSystemConfig(env, { key, scopeKey, system });
    return json(result, 201, corsHeaders);
  }

  return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
}

async function ensureSystemBillingAccess(request, env, access, input, corsHeaders) {
  if (!access?.projectId) {
    return null;
  }

  const requiredFeature = getRequiredSystemFeature(input);
  if (!requiredFeature) {
    return null;
  }

  const userId = getRequesterUserId(request, input);
  if (!userId) {
    return errorJson("課金機能の保存には user が必要です。", 403, corsHeaders, {
      code: "billing_user_required",
      feature: requiredFeature,
      requiredPack: getRequiredPackForFeature(requiredFeature)
    });
  }

  const license = await ensureUserLicenseState(env, userId);
  if (hasFeatureAccess(license, requiredFeature)) {
    return null;
  }

  return errorJson(getSystemBillingErrorMessage(requiredFeature), 403, corsHeaders, {
    code: "billing_feature_required",
    feature: requiredFeature,
    requiredPack: getRequiredPackForFeature(requiredFeature)
  });
}

function getRequiredSystemFeature(input) {
  if (usesBattlePackSystemConfig(input)) return "battle_controls";
  if (usesEventPackSystemConfig(input)) return "event_controls";
  return "";
}

function usesBattlePackSystemConfig(input) {
  return String(input?.battleMode || "").trim() === "semiAuto";
}

function usesEventPackSystemConfig(input) {
  const config = sanitizeEventConfig(input?.eventConfig);
  return Boolean(
    config.enabled ||
    config.title ||
    config.subtitle ||
    config.storyId ||
    config.exchangeEnabled ||
    config.exchangeLabel ||
    config.exchangeItems.length > 0 ||
    config.displayItems.length > 0 ||
    config.eventCardIds.length > 0 ||
    config.loginBonusEnabled ||
    config.loginBonusLabel ||
    config.loginBonusRewards.length > 0
  );
}

function getSystemBillingErrorMessage(feature) {
  if (feature === "event_controls") {
    return "このイベント設定の保存には Event Pack が必要です。";
  }
  return "このバトル設定の保存には Battle Pack が必要です。";
}

const HOME_ADVANCED_NODE_IDS = new Set([
  "level-label",
  "level-value",
  "player-name",
  "home-config",
  "home-editor",
  "home-share",
  "currency-stamina",
  "currency-gems",
  "currency-gold",
  "event-banner",
  "speech",
  "battle"
]);

function defaultEventConfig() {
  return {
    enabled: false,
    title: "",
    subtitle: "",
    storyId: "",
    eventCurrencies: [
      { key: "event_medal", label: "イベントメダル", initialAmount: 0 },
      { key: "event_ticket", label: "イベントチケット", initialAmount: 0 }
    ],
    exchangeEnabled: false,
    exchangeLabel: "",
    exchangeItems: [
      { id: "event-exchange-1", label: "育成ポイント補給", costCurrencyKey: "gold", costAmount: 5000, rewardKind: "growth", rewardValue: "resonance", rewardAmount: 100, stock: 1 },
      { id: "event-exchange-2", label: "スタミナ補給", costCurrencyKey: "gems", costAmount: 50, rewardKind: "currency", rewardValue: "stamina", rewardAmount: 60, stock: 3 },
      { id: "event-exchange-3", label: "記念バッジ", costCurrencyKey: "gems", costAmount: 30, rewardKind: "event_item", rewardValue: "event-badge", rewardAmount: 1, stock: 5 }
    ],
    displayItems: [
      { id: "event-badge", label: "記念バッジ", description: "イベント画面に並べるだけの記念アイテムです。" }
    ],
    eventCardIds: [
      { cardId: "", label: "イベント限定", acquireText: "交換所で入手" }
    ],
    loginBonusEnabled: false,
    loginBonusLabel: "",
    loginBonusRewards: [
      { day: 1, currencyKey: "gems", amount: 50, label: "ジェム x50" },
      { day: 2, currencyKey: "gold", amount: 3000, label: "ゴールド x3000" },
      { day: 3, currencyKey: "gems", amount: 50, label: "ジェム x50" },
      { day: 4, currencyKey: "stamina", amount: 30, label: "スタミナ x30" },
      { day: 5, currencyKey: "gold", amount: 5000, label: "ゴールド x5000" },
      { day: 6, currencyKey: "gems", amount: 100, label: "ジェム x100" },
      { day: 7, currencyKey: "gems", amount: 150, label: "ジェム x150" }
    ]
  };
}

function defaultSystemConfig() {
  return {
    rarityMode: "classic4",
    gachaCatalogMode: "characters_only",
    orientation: "auto",
    battleMode: "fullAuto",
    battleVisualMode: "cardIllustration",
    eventConfig: defaultEventConfig(),
    layoutPresets: {
      home: {
        mode: "preset",
        layout: "single-focus",
        speech: "right-bubble",
        advancedNodes: [],
        customParts: []
      }
    },
    layoutAssets: {
      home: []
    },
    assetFolders: {
      home: []
    },
    cardFolders: [],
    storyFolders: []
  };
}

function sanitizeSystemConfig(input) {
  return {
    rarityMode: input?.rarityMode === "stars5" ? "stars5" : "classic4",
    gachaCatalogMode: sanitizeGachaCatalogMode(input?.gachaCatalogMode),
    orientation: ["auto", "portrait", "landscape", "fullscreen"].includes(input?.orientation)
      ? input.orientation
      : "auto",
    battleMode: ["fullAuto", "semiAuto"].includes(input?.battleMode)
      ? input.battleMode
      : "fullAuto",
    battleVisualMode: ["cardIllustration", "sdCharacter"].includes(input?.battleVisualMode)
      ? input.battleVisualMode
      : "cardIllustration",
    eventConfig: sanitizeEventConfig(input?.eventConfig),
    layoutPresets: sanitizeLayoutPresets(input?.layoutPresets),
    layoutAssets: sanitizeLayoutAssets(input?.layoutAssets),
    assetFolders: sanitizeAssetFolders(input?.assetFolders),
    cardFolders: sanitizeFolderList(input?.cardFolders),
    storyFolders: sanitizeFolderList(input?.storyFolders)
  };
}

function sanitizeEventConfig(value) {
  const source = value && typeof value === "object" ? value : {};
  const defaults = defaultEventConfig();
  return {
    enabled: source.enabled === true,
    title: String(source.title || defaults.title).trim().slice(0, 80),
    subtitle: String(source.subtitle || defaults.subtitle).trim().slice(0, 200),
    storyId: String(source.storyId || defaults.storyId).trim().slice(0, 80),
    eventCurrencies: sanitizeEventCurrencies(source.eventCurrencies, defaults.eventCurrencies),
    exchangeEnabled: source.exchangeEnabled === true,
    exchangeLabel: String(source.exchangeLabel || defaults.exchangeLabel).trim().slice(0, 40),
    exchangeItems: sanitizeExchangeItems(source.exchangeItems, defaults.exchangeItems),
    displayItems: sanitizeDisplayItems(source.displayItems, defaults.displayItems),
    eventCardIds: sanitizeEventCardIds(source.eventCardIds, defaults.eventCardIds),
    loginBonusEnabled: source.loginBonusEnabled === true,
    loginBonusLabel: String(source.loginBonusLabel || defaults.loginBonusLabel).trim().slice(0, 40),
    loginBonusRewards: sanitizeLoginBonusRewards(source.loginBonusRewards, defaults.loginBonusRewards)
  };
}

function sanitizeEventCurrencies(value, fallback = []) {
  const source = Array.isArray(value) && value.length > 0 ? value : fallback;
  return source
    .slice(0, 20)
    .map((item, index) => ({
      key: sanitizeCurrencyKey(item?.key, `event_currency_${index + 1}`),
      label: String(item?.label || "").trim().slice(0, 40),
      initialAmount: Math.max(0, Math.floor(Number(item?.initialAmount || 0) || 0))
    }))
    .filter(item => item.key && item.label);
}

function sanitizeExchangeItems(value, fallback = []) {
  const source = Array.isArray(value) && value.length > 0 ? value : fallback;
  return source
    .slice(0, 30)
    .map((item, index) => ({
      id: String(item?.id || `event-exchange-${index + 1}`).trim().slice(0, 80),
      label: String(item?.label || "").trim().slice(0, 80),
      costCurrencyKey: sanitizeCurrencyKey(item?.costCurrencyKey, "gold"),
      costAmount: Math.max(1, Math.floor(Number(item?.costAmount || 0) || 0)),
      rewardKind: ["currency", "growth", "event_item", "card"].includes(String(item?.rewardKind || "").trim())
        ? String(item.rewardKind).trim()
        : "currency",
      rewardValue: String(item?.rewardValue || item?.rewardCurrencyKey || "").trim().slice(0, 80),
      rewardAmount: Math.max(1, Math.floor(Number(item?.rewardAmount || 0) || 0)),
      stock: Math.max(1, Math.floor(Number(item?.stock || 0) || 1))
    }))
    .filter(item => item.id && item.label && item.costAmount > 0 && item.rewardAmount > 0 && item.rewardValue);
}

function sanitizeDisplayItems(value, fallback = []) {
  const source = Array.isArray(value) && value.length > 0 ? value : fallback;
  return source
    .slice(0, 100)
    .map((item, index) => ({
      id: String(item?.id || `event-item-${index + 1}`).trim().slice(0, 80),
      label: String(item?.label || "").trim().slice(0, 80),
      description: String(item?.description || "").trim().slice(0, 200),
      image: String(item?.image || "").trim().slice(0, 2_000_000)
    }))
    .filter(item => item.id && item.label);
}

function sanitizeEventCardIds(value, fallback = []) {
  const source = Array.isArray(value) && value.length > 0 ? value : fallback;
  const seen = new Set();
  return source
    .map(item => {
      if (typeof item === "string") {
        const cardId = String(item || "").trim().slice(0, 80);
        if (!cardId || seen.has(cardId)) return null;
        seen.add(cardId);
        return {
          cardId,
          label: "",
          acquireText: ""
        };
      }
      const cardId = String(item?.cardId || item?.id || "").trim().slice(0, 80);
      if (!cardId || seen.has(cardId)) return null;
      seen.add(cardId);
      return {
        cardId,
        label: String(item?.label || "").trim().slice(0, 40),
        acquireText: String(item?.acquireText || "").trim().slice(0, 80)
      };
    })
    .filter(Boolean)
    .slice(0, 50);
}

function sanitizeLoginBonusRewards(value, fallback = []) {
  const source = Array.isArray(value) && value.length > 0 ? value : fallback;
  return source
    .slice(0, 14)
    .map((item, index) => ({
      day: Math.max(1, Math.min(31, Number(item?.day ?? index + 1) || (index + 1))),
      currencyKey: sanitizeCurrencyKey(item?.currencyKey, "gems"),
      amount: Math.max(1, Math.floor(Number(item?.amount || 0) || 0)),
      label: String(item?.label || "").trim().slice(0, 80)
    }))
    .filter(item => item.amount > 0)
    .map(item => ({
      ...item,
      label: item.label || `${item.currencyKey} x${item.amount}`
    }));
}

function sanitizeCurrencyKey(value, fallback = "gems") {
  const key = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 40);
  return key || fallback;
}

function sanitizeGachaCatalogMode(value) {
  return ["characters_only", "mixed_shared", "split_catalogs"].includes(value)
    ? value
    : "characters_only";
}

function sanitizeLayoutPresets(value) {
  const source = value && typeof value === "object" ? value : {};
  const home = source.home && typeof source.home === "object" ? source.home : {};
  return {
    home: {
      mode: ["preset", "advanced"].includes(home.mode) ? home.mode : "preset",
      layout: ["single-focus", "dual-stage"].includes(home.layout) ? home.layout : "single-focus",
      speech: ["right-bubble", "left-bubble", "hidden"].includes(home.speech) ? home.speech : "right-bubble",
      advancedNodes: sanitizeAdvancedNodes(home.advancedNodes),
      customParts: sanitizeCustomParts(home.customParts)
    }
  };
}

function sanitizeAdvancedNodes(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 40)
    .map(item => sanitizeAdvancedNode(item))
    .filter(Boolean);
}

function sanitizeLayoutAssets(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    home: Array.isArray(source.home)
      ? source.home.slice(0, 200).map(sanitizeLayoutAsset).filter(Boolean)
      : []
  };
}

function sanitizeLayoutAsset(value) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || "").trim().slice(0, 80);
  const src = String(value.src || "").trim().slice(0, 2_000_000);
  if (!id || !src) return null;
  const now = new Date().toISOString();
  return {
    id,
    name: String(value.name || id).trim().slice(0, 80),
    src,
    ownerMemberId: String(value.ownerMemberId || "local-editor").trim().slice(0, 80) || "local-editor",
    createdAt: String(value.createdAt || now),
    updatedAt: String(value.updatedAt || value.createdAt || now)
  };
}

function sanitizeAssetFolders(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    home: Array.isArray(source.home)
      ? source.home.slice(0, 200).map((item, index) => sanitizeAssetFolder(item, index)).filter(Boolean)
      : []
  };
}

function sanitizeAssetFolder(value, index = 0) {
  if (!value || typeof value !== "object") return null;
  const kind = value.kind === "shared"
    ? "shared"
    : value.kind === "team_owned"
      ? "team_owned"
      : "personal";
  const id = String(value.id || "").trim().slice(0, 80);
  const name = String(value.name || "").trim().slice(0, 80);
  if (!id || !name) return null;
  const now = new Date().toISOString();
  return {
    id,
    name,
    ownerMemberId: kind === "personal"
      ? (String(value.ownerMemberId || "local-editor").trim().slice(0, 80) || "local-editor")
      : null,
    kind,
    assetIds: kind === "shared"
      ? []
      : Array.from(new Set((Array.isArray(value.assetIds) ? value.assetIds : []).map(item => String(item || "").trim().slice(0, 80)).filter(Boolean))),
    sourceRefs: kind === "shared" ? sanitizeFolderSourceRefs(value.sourceRefs) : [],
    sortOrder: Math.max(0, Number(value.sortOrder ?? index) || 0),
    createdAt: String(value.createdAt || now),
    updatedAt: String(value.updatedAt || value.createdAt || now)
  };
}

function sanitizeFolderSourceRefs(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 100)
    .map(item => ({
      memberId: String(item?.memberId || "").trim().slice(0, 80),
      folderId: String(item?.folderId || "").trim().slice(0, 80)
    }))
    .filter(item => item.memberId && item.folderId);
}

function sanitizeCustomParts(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 100)
    .map((item, index) => sanitizeCustomPart(item, index))
    .filter(Boolean);
}

function sanitizeCustomPart(value, index = 0) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || `custom-home-part-${index + 1}`).trim().slice(0, 80);
  const assetId = String(value.assetId || "").trim().slice(0, 2_000_000);
  return {
    id,
    name: String(value.name || id).trim().slice(0, 80) || id,
    role: String(value.role || "decorative").trim().slice(0, 80) || "decorative",
    x: Number(value.x) || 0,
    y: Number(value.y) || 0,
    w: Math.max(0, Number(value.w) || 120),
    h: Math.max(0, Number(value.h) || 120),
    z: Number(value.z) || 50,
    visible: value.visible !== false,
    assetId
  };
}

function sanitizeAdvancedNode(value) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || "").trim();
  if (!HOME_ADVANCED_NODE_IDS.has(id)) return null;
  return {
    id,
    x: Number(value.x) || 0,
    y: Number(value.y) || 0,
    w: Math.max(0, Number(value.w) || 0),
    h: Math.max(0, Number(value.h) || 0),
    z: Number(value.z) || 0,
    visible: value.visible !== false,
    assetId: String(value.assetId || "").slice(0, 2_000_000),
    showText: value.showText !== false
  };
}

function sanitizeFolderList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 100)
    .map((item, index) => ({
      id: String(item?.id || crypto.randomUUID()).trim().slice(0, 80),
      name: String(item?.name || "").trim().slice(0, 40),
      sortOrder: Math.max(0, Number(item?.sortOrder ?? index) || 0)
    }))
    .filter(item => item.id && item.name)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

async function loadSystemConfig(env, scope) {
  const d1System = await loadSystemConfigFromD1(env, scope.scopeKey);
  if (d1System) {
    return { system: d1System, storage: "d1" };
  }

  const system = sanitizeSystemConfig((await env.SOCIA_DATA.get(scope.key, "json")) || defaultSystemConfig());
  return { system, storage: "kv" };
}

async function saveSystemConfig(env, scope) {
  const d1System = await saveSystemConfigToD1(env, scope.scopeKey, scope.system);
  if (d1System) {
    return { system: d1System, storage: "d1" };
  }

  await env.SOCIA_DATA.put(scope.key, JSON.stringify(scope.system));
  return { system: scope.system, storage: "kv" };
}

async function loadSystemConfigFromD1(env, scopeKey) {
  if (!env.SOCIA_DB) return null;
  try {
    const result = await env.SOCIA_DB.prepare(`
      SELECT payload_json
      FROM system_config_registries
      WHERE scope_key = ?
    `).bind(scopeKey).first();

    if (!result?.payload_json) {
      return defaultSystemConfig();
    }

    return parseSystemPayload(result.payload_json);
  } catch (error) {
    console.warn("Falling back to KV for system config load:", error);
    return null;
  }
}

async function saveSystemConfigToD1(env, scopeKey, system) {
  if (!env.SOCIA_DB) return null;
  try {
    await env.SOCIA_DB.prepare(`
      INSERT INTO system_config_registries (scope_key, payload_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(scope_key) DO UPDATE SET
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `).bind(
      scopeKey,
      JSON.stringify(system),
      new Date().toISOString()
    ).run();

    return system;
  } catch (error) {
    console.warn("Falling back to KV for system config save:", error);
    return null;
  }
}

function parseSystemPayload(value) {
  try {
    return sanitizeSystemConfig(JSON.parse(String(value || "{}")));
  } catch {
    return defaultSystemConfig();
  }
}
