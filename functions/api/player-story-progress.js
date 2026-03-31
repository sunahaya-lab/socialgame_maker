import { createCorsHeaders, ensureCanonicalStory, ensurePlayerProfile, getPlayerScope, json, readJson } from "./_player-state";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = createCorsHeaders("GET,POST,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const body = request.method === "POST" ? await readJson(request) : {};
  const scope = getPlayerScope(url, body);
  if (!scope.projectId || !scope.userId) {
    return json({ error: "project \u307e\u305f\u306f user \u304c\u4e0d\u8db3\u3057\u3066\u3044\u307e\u3059" }, 400, corsHeaders);
  }

  try {
    const profile = await ensurePlayerProfile(env, scope);

    if (request.method === "GET") {
      const rows = await env.SOCIA_DB.prepare(`
        SELECT id, story_id, status, last_scene_index, read_at, unlocked_at, created_at, updated_at
        FROM story_progress
        WHERE player_profile_id = ?
        ORDER BY updated_at DESC, created_at DESC
      `).bind(profile.id).all();
      return json({ storyProgress: (rows.results || []).map(mapStoryProgress), storage: "d1" }, 200, corsHeaders);
    }

    if (request.method !== "POST") {
      return json({ error: "\u3053\u306e\u30e1\u30bd\u30c3\u30c9\u306f\u5229\u7528\u3067\u304d\u307e\u305b\u3093" }, 405, corsHeaders);
    }

    const storyId = String(body.storyId || "").trim().slice(0, 80);
    if (!storyId) {
      return json({ error: "storyId \u304c\u5fc5\u8981\u3067\u3059" }, 400, corsHeaders);
    }

    // Shared story visibility is driven by the current runtime dataset.
    // Progress persistence should not hard-fail when the canonical D1 mirror
    // has not been backfilled yet, otherwise NEW/CLEAR state gets stuck.
    await ensureCanonicalStory(env, scope.projectId, storyId);
    await ensureStoryProgressTarget(env, scope.projectId, storyId);

    const status = ["locked", "unlocked", "in_progress", "completed"].includes(body.status)
      ? body.status
      : "in_progress";
    const lastSceneIndex = Math.max(0, Number(body.lastSceneIndex) || 0);
    const now = new Date().toISOString();
    const unlockedAt = status === "locked" ? null : String(body.unlockedAt || now).trim().slice(0, 40);
    const readAt = status === "completed"
      ? String(body.readAt || now).trim().slice(0, 40)
      : body.readAt
        ? String(body.readAt).trim().slice(0, 40)
        : null;

    const existing = await env.SOCIA_DB.prepare(`
      SELECT id, created_at
      FROM story_progress
      WHERE player_profile_id = ? AND story_id = ?
    `).bind(profile.id, storyId).first();

    const id = existing?.id || crypto.randomUUID();
    const createdAt = existing?.created_at || now;
    await env.SOCIA_DB.prepare(`
      INSERT INTO story_progress (
        id, player_profile_id, story_id, status, last_scene_index, read_at, unlocked_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(player_profile_id, story_id) DO UPDATE SET
        status = excluded.status,
        last_scene_index = excluded.last_scene_index,
        read_at = excluded.read_at,
        unlocked_at = excluded.unlocked_at,
        updated_at = excluded.updated_at
    `).bind(
      id,
      profile.id,
      storyId,
      status,
      lastSceneIndex,
      readAt,
      unlockedAt,
      createdAt,
      now
    ).run();

    return json({
      storyProgress: {
        id,
        storyId,
        status,
        lastSceneIndex,
        readAt,
        unlockedAt,
        createdAt,
        updatedAt: now
      },
      storage: "d1"
    }, 200, corsHeaders);
  } catch (error) {
    return json({ error: error.message || "\u30b9\u30c8\u30fc\u30ea\u30fc\u9032\u884c\u306e\u66f4\u65b0\u306b\u5931\u6557\u3057\u307e\u3057\u305f" }, 400, corsHeaders);
  }
}

function mapStoryProgress(row) {
  return {
    id: row.id,
    storyId: row.story_id,
    status: row.status,
    lastSceneIndex: Number(row.last_scene_index || 0),
    readAt: row.read_at || null,
    unlockedAt: row.unlocked_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null
  };
}

async function ensureStoryProgressTarget(env, projectId, storyId) {
  const existing = await env.SOCIA_DB.prepare(`SELECT id FROM stories WHERE id = ?`).bind(storyId).first();
  if (existing?.id) return existing.id;

  const now = new Date().toISOString();
  await env.SOCIA_DB.prepare(`
    INSERT OR IGNORE INTO stories (
      id, project_id, type, title, metadata_json, created_at, updated_at
    )
    VALUES (?, ?, 'main', ?, '{}', ?, ?)
  `).bind(
    storyId,
    projectId,
    storyId,
    now,
    now
  ).run();

  return storyId;
}
