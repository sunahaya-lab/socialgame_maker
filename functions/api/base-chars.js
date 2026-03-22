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

  const key = room ? `room:${room}:base-chars` : "base-chars";

  if (request.method === "GET") {
    const items = (await env.SOCIA_DATA.get(key, "json")) || [];
    return json({ baseChars: Array.isArray(items) ? items : [] }, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await request.json();
    const item = sanitizeBaseChar(input);

    const items = (await env.SOCIA_DATA.get(key, "json")) || [];
    const list = Array.isArray(items) ? items : [];

    const index = list.findIndex(entry => entry.id === item.id);
    if (index >= 0) list[index] = item;
    else list.unshift(item);

    await env.SOCIA_DATA.put(key, JSON.stringify(list));

    return json({ baseChar: item }, 201, corsHeaders);
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
