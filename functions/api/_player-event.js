import {
  ensureCanonicalCard,
  ensureDefaultCurrencyBalances,
  loadPlayerCurrencyBalances
} from "./_player-state";

export async function loadProjectEventConfig(env, projectId) {
  if (!env?.SOCIA_DB || !projectId) return {};
  const scopeKey = `project:${projectId}`;
  try {
    const row = await env.SOCIA_DB.prepare(`
      SELECT payload_json
      FROM system_config_registries
      WHERE scope_key = ?
      LIMIT 1
    `).bind(scopeKey).first();
    const payload = safeJsonParse(row?.payload_json);
    return payload?.eventConfig && typeof payload.eventConfig === "object"
      ? payload.eventConfig
      : {};
  } catch (error) {
    console.warn("Failed to load event config:", error);
    return {};
  }
}

export function resolveStableEventKey(config = {}) {
  const explicit = String(config?.eventKey || "").trim();
  if (explicit) return explicit.slice(0, 120);
  const storyId = String(config?.storyId || "").trim();
  if (storyId) return storyId.slice(0, 120);
  const title = String(config?.title || "").trim().toLowerCase();
  if (title) {
    return title.replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "event";
  }
  return "event";
}

export function getLoginBonusEventKey(config = {}) {
  return `${resolveStableEventKey(config)}::login`;
}

export function getExchangeEventKey(config = {}) {
  return `${resolveStableEventKey(config)}::exchange`;
}

export async function ensureEventCurrencyBalances(env, playerProfileId, config = {}) {
  if (!env?.SOCIA_DB || !playerProfileId) return;
  await ensureDefaultCurrencyBalances(env, playerProfileId);
  const rows = Array.isArray(config?.eventCurrencies) ? config.eventCurrencies : [];
  const now = new Date().toISOString();
  for (const row of rows) {
    const key = String(row?.key || "").trim();
    if (!key) continue;
    await env.SOCIA_DB.prepare(`
      INSERT INTO player_currency_balances (
        id, player_profile_id, currency_key, amount, max_amount, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, NULL, ?, ?)
      ON CONFLICT(player_profile_id, currency_key) DO NOTHING
    `).bind(
      crypto.randomUUID(),
      playerProfileId,
      key,
      Math.max(0, Number(row?.initialAmount || 0)),
      now,
      now
    ).run();
  }
}

export async function loadPlayerEventState(env, playerProfileId, config = {}) {
  if (!env?.SOCIA_DB || !playerProfileId) {
    return {
      eventItems: {},
      loginBonuses: {},
      eventExchangePurchases: {}
    };
  }

  await ensureEventCurrencyBalances(env, playerProfileId, config);
  const loginKey = getLoginBonusEventKey(config);
  const exchangeKey = getExchangeEventKey(config);
  const stableEventKey = resolveStableEventKey(config);

  try {
    const [itemRows, loginRow, exchangeRows] = await Promise.all([
      env.SOCIA_DB.prepare(`
        SELECT item_key, amount
        FROM player_event_item_balances
        WHERE player_profile_id = ? AND event_key = ?
        ORDER BY item_key ASC
      `).bind(playerProfileId, stableEventKey).all(),
      env.SOCIA_DB.prepare(`
        SELECT claimed_days, last_claimed_on
        FROM player_event_login_bonus_progress
        WHERE player_profile_id = ? AND event_key = ?
        LIMIT 1
      `).bind(playerProfileId, loginKey).first(),
      env.SOCIA_DB.prepare(`
        SELECT item_id, purchased_count
        FROM player_event_exchange_purchases
        WHERE player_profile_id = ? AND event_key = ?
        ORDER BY item_id ASC
      `).bind(playerProfileId, exchangeKey).all()
    ]);

    return {
      eventItems: Object.fromEntries(
        (itemRows?.results || []).map(row => [row.item_key, Math.max(0, Number(row.amount || 0))])
      ),
      loginBonuses: loginRow
        ? {
            [loginKey]: {
              claimedDays: Math.max(0, Number(loginRow.claimed_days || 0)),
              lastClaimedOn: loginRow.last_claimed_on || null
            }
          }
        : {},
      eventExchangePurchases: {
        [exchangeKey]: Object.fromEntries(
          (exchangeRows?.results || []).map(row => [row.item_id, Math.max(0, Number(row.purchased_count || 0))])
        )
      }
    };
  } catch (error) {
    console.warn("Failed to load player event state:", error);
    return {
      eventItems: {},
      loginBonuses: {},
      eventExchangePurchases: {}
    };
  }
}

export async function claimPlayerEventLoginBonus(env, playerProfileId, config = {}) {
  const rewards = Array.isArray(config?.loginBonusRewards) ? config.loginBonusRewards : [];
  if (!config?.loginBonusEnabled || rewards.length <= 0) {
    return { ok: false, code: "login_bonus_not_configured" };
  }

  await ensureEventCurrencyBalances(env, playerProfileId, config);
  const eventKey = getLoginBonusEventKey(config);
  const progressState = await loadPlayerEventState(env, playerProfileId, config);
  const progress = progressState.loginBonuses[eventKey] || { claimedDays: 0, lastClaimedOn: null };
  const today = new Date().toISOString().slice(0, 10);
  if (progress.lastClaimedOn === today) {
    return { ok: false, code: "login_bonus_already_claimed" };
  }

  const rewardIndex = rewards.length > 0 ? (Math.max(0, Number(progress.claimedDays || 0)) % rewards.length) : 0;
  const reward = rewards[rewardIndex] || null;
  if (!reward) {
    return { ok: false, code: "login_bonus_not_configured" };
  }

  const nextAmount = await addCurrencyAmount(env, playerProfileId, reward.currencyKey, Number(reward.amount || 0), {
    initialAmount: Number(reward.initialAmount || 0)
  });
  const now = new Date().toISOString();
  await env.SOCIA_DB.prepare(`
    INSERT INTO player_event_login_bonus_progress (
      id, player_profile_id, event_key, claimed_days, last_claimed_on, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_profile_id, event_key) DO UPDATE SET
      claimed_days = excluded.claimed_days,
      last_claimed_on = excluded.last_claimed_on,
      updated_at = excluded.updated_at
  `).bind(
    crypto.randomUUID(),
    playerProfileId,
    eventKey,
    Math.max(0, Number(progress.claimedDays || 0)) + 1,
    today,
    now,
    now
  ).run();

  return {
    ok: true,
    reward,
    currencies: await loadPlayerCurrencyBalances(env, playerProfileId, { requireStorage: true, persistRecovery: false }),
    eventState: await loadPlayerEventState(env, playerProfileId, config),
    rewardCurrencyAmount: nextAmount
  };
}

export async function purchasePlayerEventExchangeItem(env, playerProfileId, projectId, config = {}, itemId = "") {
  const items = Array.isArray(config?.exchangeItems) ? config.exchangeItems : [];
  if (!config?.exchangeEnabled || items.length <= 0) {
    return { ok: false, code: "exchange_not_configured" };
  }

  const item = items.find(entry => String(entry?.id || "").trim() === String(itemId || "").trim());
  if (!item) {
    return { ok: false, code: "exchange_item_not_found" };
  }

  await ensureEventCurrencyBalances(env, playerProfileId, config);
  const exchangeKey = getExchangeEventKey(config);
  const eventState = await loadPlayerEventState(env, playerProfileId, config);
  const purchaseMap = eventState.eventExchangePurchases[exchangeKey] || {};
  const purchasedCount = Math.max(0, Number(purchaseMap[item.id] || 0));
  const stock = Math.max(0, Number(item.stock || 0));
  if (purchasedCount >= stock) {
    return { ok: false, code: "exchange_out_of_stock", item };
  }

  const ownedCurrency = await getCurrencyAmount(env, playerProfileId, item.costCurrencyKey, config);
  const costAmount = Math.max(0, Number(item.costAmount || 0));
  if (ownedCurrency < costAmount) {
    return { ok: false, code: "exchange_currency_shortage", item };
  }

  await addCurrencyAmount(env, playerProfileId, item.costCurrencyKey, -costAmount, config);

  let rewardResult = null;
  if (item.rewardKind === "event_item") {
    rewardResult = await addEventItemAmount(env, playerProfileId, resolveStableEventKey(config), item.rewardValue, Number(item.rewardAmount || 0));
  } else if (item.rewardKind === "currency") {
    rewardResult = await addCurrencyAmount(env, playerProfileId, item.rewardValue, Number(item.rewardAmount || 0), config);
  } else if (item.rewardKind === "card") {
    rewardResult = await addCardInventoryAmount(env, playerProfileId, projectId, item.rewardValue, Number(item.rewardAmount || 0));
  } else if (item.rewardKind === "growth") {
    rewardResult = {
      kind: "growth",
      value: String(item.rewardValue || "").trim(),
      amount: Math.max(0, Number(item.rewardAmount || 0))
    };
  }

  const now = new Date().toISOString();
  await env.SOCIA_DB.prepare(`
    INSERT INTO player_event_exchange_purchases (
      id, player_profile_id, event_key, item_id, purchased_count, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_profile_id, event_key, item_id) DO UPDATE SET
      purchased_count = excluded.purchased_count,
      updated_at = excluded.updated_at
  `).bind(
    crypto.randomUUID(),
    playerProfileId,
    exchangeKey,
    item.id,
    purchasedCount + 1,
    now,
    now
  ).run();

  return {
    ok: true,
    item,
    rewardResult,
    currencies: await loadPlayerCurrencyBalances(env, playerProfileId, { requireStorage: true, persistRecovery: false }),
    eventState: await loadPlayerEventState(env, playerProfileId, config)
  };
}

async function addEventItemAmount(env, playerProfileId, eventKey, itemKey, delta) {
  const safeItemKey = String(itemKey || "").trim();
  const safeDelta = Number(delta || 0);
  if (!safeItemKey || !Number.isFinite(safeDelta)) {
    return { itemKey: safeItemKey, amount: 0 };
  }

  const row = await env.SOCIA_DB.prepare(`
    SELECT id, amount, created_at
    FROM player_event_item_balances
    WHERE player_profile_id = ? AND event_key = ? AND item_key = ?
    LIMIT 1
  `).bind(playerProfileId, eventKey, safeItemKey).first();
  const nextAmount = Math.max(0, Number(row?.amount || 0) + safeDelta);
  const now = new Date().toISOString();
  await env.SOCIA_DB.prepare(`
    INSERT INTO player_event_item_balances (
      id, player_profile_id, event_key, item_key, amount, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_profile_id, event_key, item_key) DO UPDATE SET
      amount = excluded.amount,
      updated_at = excluded.updated_at
  `).bind(
    row?.id || crypto.randomUUID(),
    playerProfileId,
    eventKey,
    safeItemKey,
    nextAmount,
    row?.created_at || now,
    now
  ).run();
  return { itemKey: safeItemKey, amount: nextAmount };
}

async function addCurrencyAmount(env, playerProfileId, currencyKey, delta, config = {}) {
  const safeKey = String(currencyKey || "").trim();
  const safeDelta = Number(delta || 0);
  if (!safeKey || !Number.isFinite(safeDelta)) return 0;

  await ensureEventCurrencyBalances(env, playerProfileId, config);
  const row = await env.SOCIA_DB.prepare(`
    SELECT id, amount, max_amount, created_at
    FROM player_currency_balances
    WHERE player_profile_id = ? AND currency_key = ?
    LIMIT 1
  `).bind(playerProfileId, safeKey).first();
  const maxAmount = row?.max_amount === null || row?.max_amount === undefined
    ? null
    : Math.max(0, Number(row.max_amount || 0));
  const nextBase = Math.max(0, Number(row?.amount || 0) + safeDelta);
  const nextAmount = maxAmount === null ? nextBase : Math.min(maxAmount, nextBase);
  const now = new Date().toISOString();
  await env.SOCIA_DB.prepare(`
    UPDATE player_currency_balances
    SET amount = ?, updated_at = ?
    WHERE id = ?
  `).bind(nextAmount, now, row?.id).run();
  return nextAmount;
}

async function getCurrencyAmount(env, playerProfileId, currencyKey, config = {}) {
  const safeKey = String(currencyKey || "").trim();
  if (!safeKey) return 0;
  await ensureEventCurrencyBalances(env, playerProfileId, config);
  const row = await env.SOCIA_DB.prepare(`
    SELECT amount
    FROM player_currency_balances
    WHERE player_profile_id = ? AND currency_key = ?
    LIMIT 1
  `).bind(playerProfileId, safeKey).first();
  return Math.max(0, Number(row?.amount || 0));
}

async function addCardInventoryAmount(env, playerProfileId, projectId, cardId, amount) {
  const safeCardId = String(cardId || "").trim();
  const safeAmount = Math.max(0, Number(amount || 0));
  if (!safeCardId || safeAmount <= 0) {
    return { cardId: safeCardId, quantity: 0 };
  }

  await ensureCanonicalCard(env, projectId, safeCardId);
  const row = await env.SOCIA_DB.prepare(`
    SELECT id, quantity, first_acquired_at, created_at
    FROM player_inventories
    WHERE player_profile_id = ? AND card_id = ?
    LIMIT 1
  `).bind(playerProfileId, safeCardId).first();
  const now = new Date().toISOString();
  const nextQuantity = Math.max(0, Number(row?.quantity || 0) + safeAmount);
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
    row?.id || crypto.randomUUID(),
    playerProfileId,
    safeCardId,
    nextQuantity,
    row?.first_acquired_at || now,
    now,
    row?.created_at || now,
    now
  ).run();
  return { cardId: safeCardId, quantity: nextQuantity };
}

function safeJsonParse(value) {
  try {
    return JSON.parse(String(value || "{}"));
  } catch {
    return {};
  }
}
