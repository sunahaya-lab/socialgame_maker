import { createCorsHeaders, ensurePlayerProfile, getPlayerScope, json, readJson } from "./_player-state";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = createCorsHeaders("GET,POST,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!["GET", "POST"].includes(request.method)) {
    return json({ error: "\u3053\u306e\u30e1\u30bd\u30c3\u30c9\u306f\u5229\u7528\u3067\u304d\u307e\u305b\u3093" }, 405, corsHeaders);
  }

  const body = request.method === "POST" ? await readJson(request) : {};
  const scope = getPlayerScope(url, body);
  if (!scope.projectId || !scope.userId) {
    return json({ error: "project \u307e\u305f\u306f user \u304c\u4e0d\u8db3\u3057\u3066\u3044\u307e\u3059" }, 400, corsHeaders);
  }

  try {
    const profile = await ensurePlayerProfile(env, scope);
    if (request.method === "POST") {
      const preferences = sanitizeHomePreferences(body);
      const saved = await upsertHomePreferences(env, profile.id, preferences);
      return json({ homePreferences: saved, storage: "d1" }, 200, corsHeaders);
    }

    const preferences = await getHomePreferences(env, profile.id);
    return json({ homePreferences: preferences, storage: "d1" }, 200, corsHeaders);
  } catch (error) {
    return json({ error: error.message || "\u30db\u30fc\u30e0\u8a2d\u5b9a\u306e\u4fdd\u5b58\u307e\u305f\u306f\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f" }, 400, corsHeaders);
  }
}

function defaultHomePreferences() {
  return {
    mode: 1,
    card1: "",
    card2: "",
    scale1: 100,
    x1: -10,
    y1: 0,
    scale2: 100,
    x2: 10,
    y2: 0,
    front: 2
  };
}

function sanitizeHomePreferences(input) {
  const value = { ...defaultHomePreferences(), ...(input || {}) };
  return {
    mode: value.mode === 2 ? 2 : 1,
    card1: String(value.card1 || "").trim().slice(0, 80),
    card2: String(value.card2 || "").trim().slice(0, 80),
    scale1: clampInt(value.scale1, 50, 200, 100),
    x1: clampNumber(value.x1, -60, 60, -10),
    y1: clampNumber(value.y1, -30, 50, 0),
    scale2: clampInt(value.scale2, 50, 200, 100),
    x2: clampNumber(value.x2, -60, 60, 10),
    y2: clampNumber(value.y2, -30, 50, 0),
    front: value.front === 1 ? 1 : 2
  };
}

async function getHomePreferences(env, playerProfileId) {
  const row = await safeReadHomePreferences(env, playerProfileId);
  if (!row) return null;
  return mapHomePreferences(row);
}

async function upsertHomePreferences(env, playerProfileId, preferences) {
  const existing = await safeReadHomePreferenceId(env, playerProfileId);
  if (existing === undefined) {
    throw new Error("player_home_preferences \u30c6\u30fc\u30d6\u30eb\u304c\u5229\u7528\u3067\u304d\u307e\u305b\u3093");
  }

  const now = new Date().toISOString();
  if (existing?.id) {
    await env.SOCIA_DB.prepare(`
      UPDATE player_home_preferences
      SET mode = ?, card_1_id = ?, card_2_id = ?, scale_1 = ?, x_1 = ?, y_1 = ?,
          scale_2 = ?, x_2 = ?, y_2 = ?, front = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      preferences.mode,
      preferences.card1 || null,
      preferences.card2 || null,
      preferences.scale1,
      preferences.x1,
      preferences.y1,
      preferences.scale2,
      preferences.x2,
      preferences.y2,
      preferences.front,
      now,
      existing.id
    ).run();
  } else {
    await env.SOCIA_DB.prepare(`
      INSERT INTO player_home_preferences (
        id, player_profile_id, mode, card_1_id, card_2_id, scale_1, x_1, y_1,
        scale_2, x_2, y_2, front, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      playerProfileId,
      preferences.mode,
      preferences.card1 || null,
      preferences.card2 || null,
      preferences.scale1,
      preferences.x1,
      preferences.y1,
      preferences.scale2,
      preferences.x2,
      preferences.y2,
      preferences.front,
      now,
      now
    ).run();
  }

  return preferences;
}

async function safeReadHomePreferences(env, playerProfileId) {
  try {
    return await env.SOCIA_DB.prepare(`
      SELECT mode, card_1_id, card_2_id, scale_1, x_1, y_1, scale_2, x_2, y_2, front
      FROM player_home_preferences
      WHERE player_profile_id = ?
    `).bind(playerProfileId).first();
  } catch (error) {
    console.warn("Player home preferences table unavailable:", error);
    return null;
  }
}

async function safeReadHomePreferenceId(env, playerProfileId) {
  try {
    return await env.SOCIA_DB.prepare(`
      SELECT id
      FROM player_home_preferences
      WHERE player_profile_id = ?
    `).bind(playerProfileId).first();
  } catch (error) {
    console.warn("Player home preferences table unavailable:", error);
    return undefined;
  }
}

function mapHomePreferences(row) {
  return sanitizeHomePreferences({
    mode: Number(row.mode || 1),
    card1: row.card_1_id || "",
    card2: row.card_2_id || "",
    scale1: Number(row.scale_1 || 100),
    x1: Number(row.x_1 ?? -10),
    y1: Number(row.y_1 ?? 0),
    scale2: Number(row.scale_2 || 100),
    x2: Number(row.x_2 ?? 10),
    y2: Number(row.y_2 ?? 0),
    front: Number(row.front || 2)
  });
}

function clampInt(value, min, max, fallback) {
  const next = Number.parseInt(value, 10);
  if (Number.isNaN(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

function clampNumber(value, min, max, fallback) {
  const next = Number(value);
  if (Number.isNaN(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}
