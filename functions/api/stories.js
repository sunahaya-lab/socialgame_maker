export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const project = url.searchParams.get("project") || null;
  const room = url.searchParams.get("room") || null;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const key = project ? `project:${project}:stories` : room ? `room:${room}:stories` : "stories";
  const scopeKey = project ? `project:${project}` : room ? `room:${room}` : "global";

  if (request.method === "GET") {
    const result = await listStories(env, { key, scopeKey });
    return json(result, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await request.json();
    const story = sanitizeStory(input);
    const result = await saveStory(env, { key, scopeKey, story });
    return json(result, 201, corsHeaders);
  }

  return json({ error: "Method not allowed" }, 405, corsHeaders);
}

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function sanitizeStory(input) {
  const text = (value, maxLength, fallback = "") =>
    String(value || fallback).trim().slice(0, maxLength);

  const scenes = Array.isArray(input?.scenes)
    ? input.scenes.slice(0, 100).map(scene => ({
        characterId: scene?.characterId ? text(scene.characterId, 80) : null,
        character: scene?.character ? text(scene.character, 40) : null,
        variantName: scene?.variantName ? text(scene.variantName, 30) : null,
        expressionName: scene?.expressionName ? text(scene.expressionName, 30) : null,
        text: text(scene?.text, 500, ""),
        image: sanitizeImageSource(scene?.image),
        bgm: sanitizeMediaSource(scene?.bgm),
        background: sanitizeImageSource(scene?.background)
      }))
    : [];

  return {
    id: text(input?.id, 80, crypto.randomUUID()),
    title: text(input?.title, 60, "ストーリー"),
    type: ["main", "event", "character"].includes(input?.type) ? input.type : "main",
    entryId: input?.entryId ? text(input.entryId, 80) : null,
    folderId: input?.folderId ? text(input.folderId, 80) : null,
    bgm: sanitizeMediaSource(input?.bgm),
    sortOrder: Math.max(0, Number(input?.sortOrder) || 0),
    variantAssignments: Array.isArray(input?.variantAssignments)
      ? input.variantAssignments
          .slice(0, 50)
          .map(item => ({
            characterId: item?.characterId ? text(item.characterId, 80) : null,
            variantName: item?.variantName ? text(item.variantName, 30) : null
          }))
          .filter(item => item.characterId && item.variantName)
      : [],
    scenes
  };
}

function sanitizeImageSource(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("data:image/")) return text;
  if (/^https:\/\//i.test(text)) return text;
  return "";
}

function sanitizeMediaSource(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^https:\/\//i.test(text)) return text;
  return "";
}

async function listStories(env, scope) {
  const d1Stories = await listStoriesFromD1(env, scope.scopeKey);
  if (d1Stories) {
    return { stories: d1Stories, storage: "d1" };
  }

  const stories = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  return { stories: Array.isArray(stories) ? stories : [], storage: "kv" };
}

async function saveStory(env, scope) {
  const d1Story = await saveStoryToD1(env, scope.scopeKey, scope.story);
  if (d1Story) {
    return { story: d1Story, storage: "d1" };
  }

  const items = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  const list = Array.isArray(items) ? items : [];
  const index = list.findIndex(item => item.id === scope.story.id);

  if (index >= 0) list[index] = scope.story;
  else list.unshift(scope.story);

  await env.SOCIA_DATA.put(scope.key, JSON.stringify(list));
  return { story: scope.story, storage: "kv" };
}

async function listStoriesFromD1(env, scopeKey) {
  if (!env.SOCIA_DB) return null;
  try {
    const result = await env.SOCIA_DB.prepare(`
      SELECT payload_json
      FROM story_registries
      WHERE scope_key = ?
      ORDER BY updated_at DESC, created_at DESC
    `).bind(scopeKey).all();

    return (result.results || [])
      .map(row => parseStoryPayload(row.payload_json))
      .filter(Boolean);
  } catch (error) {
    console.warn("Falling back to KV for story listing:", error);
    return null;
  }
}

async function saveStoryToD1(env, scopeKey, story) {
  if (!env.SOCIA_DB) return null;
  try {
    await env.SOCIA_DB.prepare(`
      INSERT INTO story_registries (
        scope_key,
        story_id,
        title,
        payload_json,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(scope_key, story_id) DO UPDATE SET
        title = excluded.title,
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `).bind(
      scopeKey,
      story.id,
      story.title,
      JSON.stringify(story),
      new Date().toISOString()
    ).run();

    return story;
  } catch (error) {
    console.warn("Falling back to KV for story save:", error);
    return null;
  }
}

function parseStoryPayload(value) {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" ? sanitizeStory(parsed) : null;
  } catch {
    return null;
  }
}
