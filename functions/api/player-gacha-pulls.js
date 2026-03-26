import {
  createCorsHeaders,
  ensureCanonicalCard,
  ensureCanonicalGacha,
  ensurePlayerProfile,
  getPlayerScope,
  json,
  loadPlayerCurrencyBalances,
  readJson
} from "./_player-state";

const DEFAULT_RARITY_MODE = "classic4";
const RARITY_MODES = {
  classic4: {
    tiers: ["N", "R", "SR", "SSR"],
    defaultRates: { N: 40, R: 30, SR: 20, SSR: 10 }
  },
  stars5: {
    tiers: ["STAR1", "STAR2", "STAR3", "STAR4", "STAR5"],
    defaultRates: { STAR1: 40, STAR2: 30, STAR3: 15, STAR4: 10, STAR5: 5 }
  }
};

const RARITY_RANKS = {
  N: 1,
  R: 2,
  SR: 3,
  SSR: 4,
  UR: 5,
  STAR1: 1,
  STAR2: 2,
  STAR3: 3,
  STAR4: 4,
  STAR5: 5,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = createCorsHeaders("POST,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "\u3053\u306e\u30e1\u30bd\u30c3\u30c9\u306f\u5229\u7528\u3067\u304d\u307e\u305b\u3093" }, 405, corsHeaders);
  }

  const body = await readJson(request);
  const scope = getPlayerScope(url, body);
  if (!scope.projectId || !scope.userId) {
    return json({ error: "project \u307e\u305f\u306f user \u304c\u4e0d\u8db3\u3057\u3066\u3044\u307e\u3059" }, 400, corsHeaders);
  }

  try {
    const profile = await ensurePlayerProfile(env, scope);
    const gachaId = String(body.gachaId || "").trim().slice(0, 80);
    if (!gachaId) {
      return json({ error: "gachaId \u304c\u5fc5\u8981\u3067\u3059" }, 400, corsHeaders);
    }

    const requestedCount = resolveRequestedPullCount(body);
    if (!requestedCount) {
      return json({ error: "\u30ac\u30c1\u30e3\u56de\u6570\u304c\u4e0d\u6b63\u3067\u3059" }, 400, corsHeaders);
    }

    const gacha = await loadResolvedGacha(env, scope.projectId, gachaId);
    if (!gacha) {
      return json({ error: "\u6307\u5b9a\u3055\u308c\u305f\u30ac\u30c1\u30e3\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093" }, 400, corsHeaders);
    }
    await ensureCanonicalGacha(env, scope.projectId, gachaId);

    const gachaType = normalizeGachaType(gacha.gachaType);
    if (gachaType !== "character") {
      return json({ error: "\u3053\u306e\u30ac\u30c1\u30e3\u7a2e\u5225\u306f\u307e\u3060\u672a\u5b9f\u88c5\u3067\u3059" }, 400, corsHeaders);
    }

    const cards = await loadAvailableCharacterCards(env, scope.projectId, gacha);
    if (!cards.length) {
      return json({ error: "\u30ac\u30c1\u30e3\u30d7\u30fc\u30eb\u306b\u30ab\u30fc\u30c9\u304c\u3042\u308a\u307e\u305b\u3093" }, 400, corsHeaders);
    }

    const rarityMode = await loadProjectRarityMode(env, scope.projectId);
    const rollRates = normalizeRates(gacha.rates || {}, rarityMode, cards);
    const rolledResults = rollGachaResults(cards, requestedCount, rollRates, rarityMode);
    if (rolledResults.length !== requestedCount) {
      throw new Error("\u30ac\u30c1\u30e3\u7d50\u679c\u306e\u751f\u6210\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
    }

    const gemCost = requestedCount === 10 ? 300 : requestedCount * 30;
    const currencies = await loadPlayerCurrencyBalances(env, profile.id, { requireStorage: true, persistRecovery: false });
    const gems = currencies.find(currency => currency.key === "gems");
    if (!gems?.id || Number(gems.amount || 0) < gemCost) {
      return json({ error: "\u30b8\u30a7\u30e0\u304c\u8db3\u308a\u307e\u305b\u3093" }, 400, corsHeaders);
    }

    const now = new Date().toISOString();
    const pullGroupId = String(body.pullGroupId || crypto.randomUUID()).trim().slice(0, 80);
    const uniqueCardIds = [...new Set(rolledResults.map(result => result.cardId))];
    const existingInventoryMap = await loadExistingInventoryMap(env, profile.id, uniqueCardIds);
    const inventoryPlan = buildInventoryPlan(existingInventoryMap, rolledResults, now);
    const nextGemAmount = Math.max(0, Number(gems.amount || 0) - gemCost);

    const statements = [
      env.SOCIA_DB.prepare(`
        UPDATE player_currency_balances
        SET amount = ?, updated_at = ?
        WHERE id = ?
      `).bind(nextGemAmount, now, gems.id)
    ];

    for (const result of rolledResults) {
      await ensureCanonicalCard(env, scope.projectId, result.cardId);
      statements.push(
        env.SOCIA_DB.prepare(`
          INSERT INTO gacha_pull_history (
            id, player_profile_id, gacha_id, pull_group_id, card_id, rarity_at_pull, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          profile.id,
          gachaId,
          pullGroupId,
          result.cardId,
          result.rarityAtPull,
          now
        )
      );
    }

    for (const entry of inventoryPlan.values()) {
      statements.push(
        env.SOCIA_DB.prepare(`
          INSERT INTO player_inventories (
            id, player_profile_id, card_id, quantity, first_acquired_at, last_acquired_at, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(player_profile_id, card_id) DO UPDATE SET
            quantity = excluded.quantity,
            last_acquired_at = excluded.last_acquired_at,
            updated_at = excluded.updated_at
        `).bind(
          entry.id,
          profile.id,
          entry.cardId,
          entry.quantity,
          entry.firstAcquiredAt,
          now,
          entry.createdAt,
          now
        )
      );
    }

    await env.SOCIA_DB.batch(statements);

    const refreshedCurrencies = await loadPlayerCurrencyBalances(env, profile.id, { requireStorage: true, persistRecovery: false });
    const savedResults = rolledResults.map(result => ({
      cardId: result.cardId,
      rarityAtPull: result.rarityAtPull,
      quantity: inventoryPlan.get(result.cardId)?.quantity || 1
    }));

    return json({ pullGroupId, results: savedResults, currencies: refreshedCurrencies, storage: "d1" }, 200, corsHeaders);
  } catch (error) {
    return json({ error: error.message || "\u30ac\u30c1\u30e3\u7d50\u679c\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f" }, 400, corsHeaders);
  }
}

function resolveRequestedPullCount(body) {
  const requestedCount = Math.floor(Number(body?.count || 0));
  if ([1, 10].includes(requestedCount)) return requestedCount;

  if (!Array.isArray(body?.results) || body.results.length === 0) return 0;
  const results = body.results.slice(0, 10);
  const isValidLegacyPayload = results.every(item => {
    if (!item || typeof item !== "object") return false;
    const cardId = String(item.cardId || "").trim();
    const rarityAtPull = String(item.rarityAtPull || item.rarity || "").trim();
    return Boolean(cardId && rarityAtPull);
  });
  if (!isValidLegacyPayload) return 0;
  return [1, 10].includes(results.length) ? results.length : 0;
}

async function loadResolvedGacha(env, projectId, gachaId) {
  const scopeKey = `project:${projectId}`;
  const registry = await env.SOCIA_DB.prepare(`
    SELECT payload_json
    FROM gacha_registries
    WHERE scope_key = ? AND gacha_id = ?
  `).bind(scopeKey, gachaId).first();
  if (registry?.payload_json) {
    return parseGachaPayload(registry.payload_json, gachaId);
  }

  const canonical = await env.SOCIA_DB.prepare(`
    SELECT id, title, description, metadata_json
    FROM gachas
    WHERE project_id = ? AND id = ?
  `).bind(projectId, gachaId).first();
  if (!canonical) return null;

  const metadata = safeJsonParse(canonical.metadata_json);
  return {
    id: canonical.id,
    title: String(canonical.title || gachaId),
    description: String(canonical.description || ""),
    gachaType: normalizeGachaType(metadata.gachaType),
    featured: Array.isArray(metadata.featured) ? metadata.featured.map(value => String(value || "").trim()).filter(Boolean) : [],
    rates: metadata.rates && typeof metadata.rates === "object" ? metadata.rates : {}
  };
}

function parseGachaPayload(value, fallbackId = "") {
  const parsed = safeJsonParse(value);
  return {
    id: String(parsed.id || fallbackId).trim(),
    title: String(parsed.title || fallbackId).trim(),
    description: String(parsed.description || "").trim(),
    gachaType: normalizeGachaType(parsed.gachaType),
    featured: Array.isArray(parsed.featured) ? parsed.featured.map(item => String(item || "").trim()).filter(Boolean) : [],
    rates: parsed.rates && typeof parsed.rates === "object" ? parsed.rates : {}
  };
}

function normalizeGachaType(value) {
  if (value === "equipment") return "equipment";
  if (value === "mixed") return "mixed";
  return "character";
}

async function loadProjectRarityMode(env, projectId) {
  const scopeKey = `project:${projectId}`;
  try {
    const row = await env.SOCIA_DB.prepare(`
      SELECT payload_json
      FROM system_config_registries
      WHERE scope_key = ?
    `).bind(scopeKey).first();
    const payload = safeJsonParse(row?.payload_json);
    return payload?.rarityMode === "stars5" ? "stars5" : DEFAULT_RARITY_MODE;
  } catch {
    return DEFAULT_RARITY_MODE;
  }
}

async function loadAvailableCharacterCards(env, projectId, gacha) {
  const featuredIds = Array.isArray(gacha.featured) ? [...new Set(gacha.featured)] : [];
  if (featuredIds.length > 0) {
    const cards = await Promise.all(featuredIds.map(cardId => loadSingleCard(env, projectId, cardId)));
    return cards.filter(Boolean);
  }

  const scopeKey = `project:${projectId}`;
  const [registryRows, canonicalRows] = await Promise.all([
    env.SOCIA_DB.prepare(`
      SELECT entry_id, payload_json
      FROM entry_registries
      WHERE scope_key = ?
    `).bind(scopeKey).all(),
    env.SOCIA_DB.prepare(`
      SELECT id, name, rarity, metadata_json
      FROM cards
      WHERE project_id = ?
    `).bind(projectId).all()
  ]);

  const merged = new Map();
  for (const row of registryRows.results || []) {
    const payload = safeJsonParse(row.payload_json);
    const id = String(row.entry_id || payload.id || "").trim();
    if (!id) continue;
    merged.set(id, {
      id,
      name: String(payload.name || id),
      rarity: String(payload.rarity || (DEFAULT_RARITY_MODE === "classic4" ? "SR" : "STAR3"))
    });
  }
  for (const row of canonicalRows.results || []) {
    const metadata = safeJsonParse(row.metadata_json);
    const id = String(row.id || "").trim();
    if (!id) continue;
    merged.set(id, {
      id,
      name: String(row.name || metadata.name || id),
      rarity: String(row.rarity || metadata.rarity || merged.get(id)?.rarity || "SR")
    });
  }

  return [...merged.values()].filter(card => card.id);
}

async function loadSingleCard(env, projectId, cardId) {
  const scopeKey = `project:${projectId}`;
  const registry = await env.SOCIA_DB.prepare(`
    SELECT payload_json
    FROM entry_registries
    WHERE scope_key = ? AND entry_id = ?
  `).bind(scopeKey, cardId).first();
  if (registry?.payload_json) {
    const payload = safeJsonParse(registry.payload_json);
    return {
      id: cardId,
      name: String(payload.name || cardId),
      rarity: String(payload.rarity || "SR")
    };
  }

  const canonical = await env.SOCIA_DB.prepare(`
    SELECT id, name, rarity, metadata_json
    FROM cards
    WHERE project_id = ? AND id = ?
  `).bind(projectId, cardId).first();
  if (!canonical) return null;
  const metadata = safeJsonParse(canonical.metadata_json);
  return {
    id: String(canonical.id || cardId),
    name: String(canonical.name || metadata.name || cardId),
    rarity: String(canonical.rarity || metadata.rarity || "SR")
  };
}

function normalizeRates(rates, mode, cards) {
  const config = getRarityConfig(mode);
  const availableRarities = new Set(cards.map(card => normalizeRarityValue(card.rarity, mode)));
  const baseRates = { ...config.defaultRates };

  for (const [key, value] of Object.entries(rates || {})) {
    const rarity = normalizeRarityValue(key, mode);
    baseRates[rarity] = Math.max(0, Number(value) || 0);
  }

  const filtered = {};
  let total = 0;
  for (const rarity of config.tiers) {
    if (!availableRarities.has(rarity)) continue;
    const amount = Math.max(0, Number(baseRates[rarity] || 0));
    filtered[rarity] = amount;
    total += amount;
  }

  if (total <= 0) {
    const evenWeight = 100 / Math.max(1, availableRarities.size);
    for (const rarity of availableRarities) filtered[rarity] = evenWeight;
  }

  return filtered;
}

function rollGachaResults(cards, count, rates, mode) {
  const byRarity = new Map();
  for (const card of cards) {
    const rarity = normalizeRarityValue(card.rarity, mode);
    if (!byRarity.has(rarity)) byRarity.set(rarity, []);
    byRarity.get(rarity).push(card);
  }

  const results = [];
  for (let index = 0; index < count; index += 1) {
    const rarity = rollRarity(rates);
    const pool = byRarity.get(rarity) || [];
    if (!pool.length) {
      throw new Error("\u30ac\u30c1\u30e3\u30d7\u30fc\u30eb\u306e\u69cb\u6210\u304c\u4e0d\u6b63\u3067\u3059");
    }
    const selected = pool[Math.floor(Math.random() * pool.length)];
    results.push({
      cardId: selected.id,
      rarityAtPull: normalizeRarityValue(selected.rarity, mode)
    });
  }
  return results;
}

function rollRarity(rates) {
  const entries = Object.entries(rates).filter(([, value]) => Number(value) > 0);
  if (!entries.length) {
    throw new Error("\u30ac\u30c1\u30e3\u63d0\u4f9b\u5272\u5408\u304c\u4e0d\u6b63\u3067\u3059");
  }

  const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
  let roll = Math.random() * total;
  for (const [rarity, value] of entries) {
    roll -= Number(value || 0);
    if (roll < 0) return rarity;
  }
  return entries[entries.length - 1][0];
}

async function loadExistingInventoryMap(env, playerProfileId, cardIds) {
  const map = new Map();
  for (const cardId of cardIds) {
    const row = await env.SOCIA_DB.prepare(`
      SELECT id, quantity, first_acquired_at, created_at
      FROM player_inventories
      WHERE player_profile_id = ? AND card_id = ?
    `).bind(playerProfileId, cardId).first();
    if (row) map.set(cardId, row);
  }
  return map;
}

function buildInventoryPlan(existingInventoryMap, rolledResults, now) {
  const plan = new Map();
  for (const result of rolledResults) {
    const existing = plan.get(result.cardId) || existingInventoryMap.get(result.cardId) || null;
    const quantity = Number(existing?.quantity || 0) + 1;
    plan.set(result.cardId, {
      id: existing?.id || crypto.randomUUID(),
      cardId: result.cardId,
      quantity,
      firstAcquiredAt: existing?.first_acquired_at || existing?.firstAcquiredAt || existing?.created_at || existing?.createdAt || now,
      createdAt: existing?.created_at || existing?.createdAt || now
    });
  }
  return plan;
}

function getRarityConfig(mode) {
  return RARITY_MODES[mode] || RARITY_MODES[DEFAULT_RARITY_MODE];
}

function getRarityRank(value) {
  return RARITY_RANKS[String(value || "").toUpperCase()] || 1;
}

function normalizeRarityValue(value, mode) {
  const config = getRarityConfig(mode);
  const rank = getRarityRank(value);
  const safeRank = Math.max(1, Math.min(config.tiers.length, rank));
  return config.tiers[safeRank - 1] || config.tiers[0];
}

function safeJsonParse(value) {
  try {
    return JSON.parse(String(value || "{}"));
  } catch {
    return {};
  }
}
