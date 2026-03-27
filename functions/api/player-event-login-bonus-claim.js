import { createCorsHeaders, ensurePlayerProfile, getPlayerScope, json, readJson } from "./_player-state";
import { claimPlayerEventLoginBonus, loadProjectEventConfig } from "./_player-event.js";

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
  if (!scope.projectId || !scope.userId) {
    return json({ error: "project または user が不足しています" }, 400, corsHeaders);
  }

  try {
    const profile = await ensurePlayerProfile(env, scope);
    const config = await loadProjectEventConfig(env, scope.projectId);
    const result = await claimPlayerEventLoginBonus(env, profile.id, config);
    if (!result.ok) {
      return json({ error: mapEventErrorMessage(result.code), code: result.code }, 400, corsHeaders);
    }
    return json({
      reward: result.reward,
      currencies: result.currencies,
      eventState: result.eventState,
      storage: "d1"
    }, 200, corsHeaders);
  } catch (error) {
    console.error("Failed to claim event login bonus:", error);
    return json({ error: "ログインボーナスの受け取りに失敗しました", code: "event_login_bonus_claim_failed" }, 400, corsHeaders);
  }
}

function mapEventErrorMessage(code) {
  switch (code) {
    case "login_bonus_not_configured":
      return "ログインボーナスが設定されていません";
    case "login_bonus_already_claimed":
      return "今日はすでに受け取り済みです";
    default:
      return "ログインボーナスの受け取りに失敗しました";
  }
}
