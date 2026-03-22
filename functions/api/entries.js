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

  const key = room ? `room:${room}:entries` : "entries";

  if (request.method === "GET") {
    const entries = (await env.SOCIA_DATA.get(key, "json")) || [];
    return json({ entries: Array.isArray(entries) ? entries : [] }, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await request.json();
    const entry = sanitizeEntry(input);

    const items = (await env.SOCIA_DATA.get(key, "json")) || [];
    const list = Array.isArray(items) ? items : [];
    const index = list.findIndex(item => item.id === entry.id);

    if (index >= 0) list[index] = entry;
    else list.unshift(entry);

    await env.SOCIA_DATA.put(key, JSON.stringify(list));
    return json({ entry }, 201, corsHeaders);
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

function sanitizeEntry(input) {
  const text = (value, maxLength, fallback = "") =>
    String(value || fallback).trim().slice(0, maxLength);

  const allowedRarities = ["N", "R", "SR", "SSR", "UR", "STAR1", "STAR2", "STAR3", "STAR4", "STAR5", "1", "2", "3", "4", "5"];
  const rawRarity = String(input?.rarity || "").toUpperCase();
  const rarity = allowedRarities.includes(rawRarity) ? rawRarity : "SR";

  return {
    id: text(input?.id, 80, crypto.randomUUID()),
    name: text(input?.name, 40, "カード"),
    baseCharId: input?.baseCharId ? text(input.baseCharId, 80) : null,
    catch: text(input?.catch, 120, ""),
    rarity,
    attribute: text(input?.attribute, 24, ""),
    image: sanitizeImageSource(input?.image),
    lines: Array.isArray(input?.lines) ? input.lines.slice(0, 20).map(line => text(line, 120, "")).filter(Boolean) : [],
    voiceLines: sanitizeRecord(input?.voiceLines),
    homeVoices: sanitizeRecord(input?.homeVoices),
    homeOpinions: sanitizeRelationList(input?.homeOpinions),
    homeConversations: sanitizeConversationList(input?.homeConversations),
    homeBirthdays: sanitizeRelationList(input?.homeBirthdays)
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

function sanitizeImageSource(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("data:image/")) return text;
  if (/^https:\/\//i.test(text)) return text;
  return "";
}
