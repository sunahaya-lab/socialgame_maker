import { createCorsHeaders, ensurePlayerProfile, getPlayerScope, json, readJson } from "./_player-state";
import { loadProjectEventConfig, purchasePlayerEventExchangeItem } from "./_player-event.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = createCorsHeaders("POST,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "このメソッドは利用できません" }, 405, corsHeaders);
  }

  const body = await readJson(request);
  const scope = getPlayerScope(url, body);
  const itemId = String(body.itemId || "").trim();
  if (!scope.projectId || !scope.userId) {
    return json({ error: "project または user が不足しています" }, 400, corsHeaders);
  }
  if (!itemId) {
    return json({ error: "itemId が必要です", code: "item_required" }, 400, corsHeaders);
  }

  try {
    const profile = await ensurePlayerProfile(env, scope);
    const config = await loadProjectEventConfig(env, scope.projectId);
    const result = await purchasePlayerEventExchangeItem(env, profile.id, scope.projectId, config, itemId);
    if (!result.ok) {
      return json({ error: mapEventErrorMessage(result.code), code: result.code }, 400, corsHeaders);
    }
    return json({
      item: result.item,
      rewardResult: result.rewardResult,
      currencies: result.currencies,
      eventState: result.eventState,
      storage: "d1"
    }, 200, corsHeaders);
  } catch (error) {
    console.error("Failed to purchase event exchange item:", error);
    return json({ error: "交換所の購入に失敗しました", code: "event_exchange_purchase_failed" }, 400, corsHeaders);
  }
}

function mapEventErrorMessage(code) {
  switch (code) {
    case "exchange_not_configured":
      return "交換所が設定されていません";
    case "exchange_item_not_found":
      return "指定された交換品が見つかりません";
    case "exchange_out_of_stock":
      return "この交換品は上限に達しています";
    case "exchange_currency_shortage":
      return "交換に必要な通貨が足りません";
    default:
      return "交換所の購入に失敗しました";
  }
}
