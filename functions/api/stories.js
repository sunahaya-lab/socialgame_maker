export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const room = url.searchParams.get("room") || null;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const key = room ? `room:${room}:stories` : "stories";

  if (request.method === "GET") {
    const stories = (await env.SOCIA_DATA.get(key, "json")) || [];
    return json({ stories: Array.isArray(stories) ? stories : [] }, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await request.json();
    const story = sanitizeStory(input);

    const items = (await env.SOCIA_DATA.get(key, "json")) || [];
    const list = Array.isArray(items) ? items : [];
    const index = list.findIndex(item => item.id === story.id);

    if (index >= 0) list[index] = story;
    else list.unshift(story);

    await env.SOCIA_DATA.put(key, JSON.stringify(list));
    return json({ story }, 201, corsHeaders);
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
    bgm: sanitizeMediaSource(input?.bgm),
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
