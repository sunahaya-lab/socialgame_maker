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

  const key = project ? `project:${project}:base-chars` : room ? `room:${room}:base-chars` : "base-chars";
  const scopeKey = project ? `project:${project}` : room ? `room:${room}` : "global";

  if (request.method === "GET") {
    const result = await listBaseChars(env, { key, scopeKey });
    return json(result, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await request.json();
    const item = sanitizeBaseChar(input);
    const result = await saveBaseChar(env, { key, scopeKey, item });
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

function sanitizeBaseChar(input) {
  const text = (value, maxLength, fallback = "") =>
    String(value || fallback).trim().slice(0, maxLength);

  const color = /^#[0-9a-fA-F]{6}$/.test(input?.color) ? input.color : "#a29bfe";

  return {
    id: text(input?.id, 80, crypto.randomUUID()),
    name: text(input?.name, 30, "キャラ"),
    description: text(input?.description, 80, ""),
    birthday: /^\d{2}-\d{2}$/.test(String(input?.birthday || "").trim())
      ? String(input.birthday).trim()
      : "",
    color,
    portrait: sanitizeImageSource(input?.portrait),
    voiceLines: sanitizeRecord(input?.voiceLines),
    homeVoices: sanitizeRecord(input?.homeVoices),
    homeOpinions: sanitizeRelationList(input?.homeOpinions),
    homeConversations: sanitizeConversationList(input?.homeConversations),
    homeBirthdays: sanitizeRelationList(input?.homeBirthdays),
    expressions: sanitizeImageList(input?.expressions),
    variants: sanitizeImageList(input?.variants)
  };
}

function sanitizeRecord(value) {
  const out = {};
  if (!value || typeof value !== "object") return out;
  for (const [key, val] of Object.entries(value)) {
    out[String(key)] = String(val || "").trim().slice(0, 200);
  }
  return out;
}

function sanitizeRelationList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => ({
      targetBaseCharId: String(item?.targetBaseCharId || "").trim().slice(0, 80),
      text: String(item?.text || "").trim().slice(0, 200)
    }))
    .filter(item => item.targetBaseCharId && item.text);
}

function sanitizeConversationList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => ({
      targetBaseCharId: String(item?.targetBaseCharId || "").trim().slice(0, 80),
      selfText: String(item?.selfText || "").trim().slice(0, 200),
      partnerText: String(item?.partnerText || "").trim().slice(0, 200)
    }))
    .filter(item => item.targetBaseCharId && (item.selfText || item.partnerText));
}

function sanitizeImageList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => ({
      name: String(item?.name || "").trim().slice(0, 40),
      image: sanitizeImageSource(item?.image)
    }))
    .filter(item => item.name && item.image);
}

function sanitizeImageSource(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("data:image/")) return text;
  if (/^https:\/\//i.test(text)) return text;
  return "";
}

async function listBaseChars(env, scope) {
  const d1Items = await listBaseCharsFromD1(env, scope.scopeKey);
  if (d1Items) {
    return { baseChars: d1Items, storage: "d1" };
  }

  const items = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  return { baseChars: Array.isArray(items) ? items : [], storage: "kv" };
}

async function saveBaseChar(env, scope) {
  const d1Item = await saveBaseCharToD1(env, scope.scopeKey, scope.item);
  if (d1Item) {
    return { baseChar: d1Item, storage: "d1" };
  }

  const items = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  const list = Array.isArray(items) ? items : [];
  const index = list.findIndex(entry => entry.id === scope.item.id);
  if (index >= 0) list[index] = scope.item;
  else list.unshift(scope.item);
  await env.SOCIA_DATA.put(scope.key, JSON.stringify(list));
  return { baseChar: scope.item, storage: "kv" };
}

async function listBaseCharsFromD1(env, scopeKey) {
  if (!env.SOCIA_DB) return null;
  try {
    const result = await env.SOCIA_DB.prepare(`
      SELECT payload_json
      FROM base_character_registries
      WHERE scope_key = ?
      ORDER BY updated_at DESC, created_at DESC
    `).bind(scopeKey).all();

    return (result.results || [])
      .map(row => parseBaseCharPayload(row.payload_json))
      .filter(Boolean);
  } catch (error) {
    console.warn("Falling back to KV for base character listing:", error);
    return null;
  }
}

async function saveBaseCharToD1(env, scopeKey, item) {
  if (!env.SOCIA_DB) return null;
  try {
    await env.SOCIA_DB.prepare(`
      INSERT INTO base_character_registries (
        scope_key,
        base_character_id,
        name,
        payload_json,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(scope_key, base_character_id) DO UPDATE SET
        name = excluded.name,
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `).bind(
      scopeKey,
      item.id,
      item.name,
      JSON.stringify(item),
      new Date().toISOString()
    ).run();

    return item;
  } catch (error) {
    console.warn("Falling back to KV for base character save:", error);
    return null;
  }
}

function parseBaseCharPayload(value) {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" ? sanitizeBaseChar(parsed) : null;
  } catch {
    return null;
  }
}
