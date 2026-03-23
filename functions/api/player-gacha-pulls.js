import { createCorsHeaders, ensureCanonicalCard, ensureCanonicalGacha, ensurePlayerProfile, getPlayerScope, json, loadPlayerCurrencyBalances, readJson } from "./_player-state";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = createCorsHeaders("POST,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, corsHeaders);
  }

  const body = await readJson(request);
  const scope = getPlayerScope(url, body);
  if (!scope.projectId || !scope.userId) {
    return json({ error: "Missing project or user" }, 400, corsHeaders);
  }

  try {
    const profile = await ensurePlayerProfile(env, scope);
    const gachaId = String(body.gachaId || "").trim().slice(0, 80);
    if (!gachaId) {
      return json({ error: "Missing gachaId" }, 400, corsHeaders);
    }

    const projectScope = `project:${scope.projectId}`;
    const [gacha, bridgeGacha] = await Promise.all([
      env.SOCIA_DB.prepare(`SELECT id FROM gachas WHERE id = ?`).bind(gachaId).first(),
      env.SOCIA_DB.prepare(`
        SELECT gacha_id AS id
        FROM gacha_registries
        WHERE scope_key = ? AND gacha_id = ?
      `).bind(projectScope, gachaId).first()
    ]);
    if (!gacha && !bridgeGacha) {
      return json({ error: "Unknown gacha" }, 400, corsHeaders);
    }
    await ensureCanonicalGacha(env, scope.projectId, gachaId);

    const results = Array.isArray(body.results) ? body.results : [];
    if (results.length === 0) {
      return json({ error: "Missing results" }, 400, corsHeaders);
    }

    const pullCount = Math.min(results.length, 100);
    const gemCost = pullCount === 10 ? 300 : pullCount * 30;
    const currencies = await loadPlayerCurrencyBalances(env, profile.id, { requireStorage: true });
    const gems = currencies.find(currency => currency.key === "gems");
    if (!gems?.id || Number(gems.amount || 0) < gemCost) {
      return json({ error: "Not enough gems" }, 400, corsHeaders);
    }

    const now = new Date().toISOString();
    await env.SOCIA_DB.prepare(`
      UPDATE player_currency_balances
      SET amount = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      Math.max(0, Number(gems.amount || 0) - gemCost),
      now,
      gems.id
    ).run();

    const pullGroupId = String(body.pullGroupId || crypto.randomUUID()).trim().slice(0, 80);
    const savedResults = [];

    for (const result of results.slice(0, 100)) {
      const cardId = String(result?.cardId || "").trim().slice(0, 80);
      const rarityAtPull = String(result?.rarityAtPull || result?.rarity || "").trim().toUpperCase().slice(0, 16);
      if (!cardId || !rarityAtPull) continue;

      const [card, bridgeCard] = await Promise.all([
        env.SOCIA_DB.prepare(`SELECT id FROM cards WHERE id = ?`).bind(cardId).first(),
        env.SOCIA_DB.prepare(`
          SELECT entry_id AS id
          FROM entry_registries
          WHERE scope_key = ? AND entry_id = ?
        `).bind(projectScope, cardId).first()
      ]);
      if (!card && !bridgeCard) continue;
      await ensureCanonicalCard(env, scope.projectId, cardId);

      await env.SOCIA_DB.prepare(`
        INSERT INTO gacha_pull_history (
          id, player_profile_id, gacha_id, pull_group_id, card_id, rarity_at_pull, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        profile.id,
        gachaId,
        pullGroupId,
        cardId,
        rarityAtPull,
        now
      ).run();

      const existingInventory = await env.SOCIA_DB.prepare(`
        SELECT id, quantity, first_acquired_at, created_at
        FROM player_inventories
        WHERE player_profile_id = ? AND card_id = ?
      `).bind(profile.id, cardId).first();

      const inventoryId = existingInventory?.id || crypto.randomUUID();
      const nextQuantity = Number(existingInventory?.quantity || 0) + 1;
      const firstAcquiredAt = existingInventory?.first_acquired_at || existingInventory?.created_at || now;

      await env.SOCIA_DB.prepare(`
        INSERT INTO player_inventories (
          id, player_profile_id, card_id, quantity, first_acquired_at, last_acquired_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(player_profile_id, card_id) DO UPDATE SET
          quantity = excluded.quantity,
          last_acquired_at = excluded.last_acquired_at,
          updated_at = excluded.updated_at
      `).bind(
        inventoryId,
        profile.id,
        cardId,
        nextQuantity,
        firstAcquiredAt,
        now,
        existingInventory?.created_at || now,
        now
      ).run();

      savedResults.push({
        cardId,
        rarityAtPull,
        quantity: nextQuantity
      });
    }

    const refreshedCurrencies = await loadPlayerCurrencyBalances(env, profile.id, { requireStorage: true });
    return json({ pullGroupId, results: savedResults, currencies: refreshedCurrencies, storage: "d1" }, 200, corsHeaders);
  } catch (error) {
    return json({ error: error.message || "Failed to record gacha pulls" }, 400, corsHeaders);
  }
}
