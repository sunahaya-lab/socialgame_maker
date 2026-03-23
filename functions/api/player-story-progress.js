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
    return json({ error: "Missing project or user" }, 400, corsHeaders);
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
      return json({ error: "Method not allowed" }, 405, corsHeaders);
    }

    const storyId = String(body.storyId || "").trim().slice(0, 80);
    if (!storyId) {
      return json({ error: "Missing storyId" }, 400, corsHeaders);
    }

    const projectScope = `project:${scope.projectId}`;
    const [story, bridgeStory] = await Promise.all([
      env.SOCIA_DB.prepare(`SELECT id FROM stories WHERE id = ?`).bind(storyId).first(),
      env.SOCIA_DB.prepare(`
        SELECT story_id AS id
        FROM story_registries
        WHERE scope_key = ? AND story_id = ?
      `).bind(projectScope, storyId).first()
    ]);
    if (!story && !bridgeStory) {
      return json({ error: "Unknown story" }, 400, corsHeaders);
    }
    await ensureCanonicalStory(env, scope.projectId, storyId);

    const status = ["locked", "unlocked", "in_progress", "completed"].includes(body.status)
      ? body.status
      : "in_progress";
    const lastSceneIndex = Math.max(0, Number(body.lastSceneIndex) || 0);
    const now = new Date().toISOString();
    const unlockedAt = status === "locked"
      ? null
      : String(body.unlockedAt || now).trim().slice(0, 40);
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
    return json({ error: error.message || "Failed to update story progress" }, 400, corsHeaders);
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
