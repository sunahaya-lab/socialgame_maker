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

  const key = room ? `room:${room}:gachas` : "gachas";

  if (request.method === "GET") {
    const gachas = (await env.SOCIA_DATA.get(key, "json")) || [];
    return json({ gachas: Array.isArray(gachas) ? gachas : [] }, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await request.json();
    const gacha = sanitizeGacha(input);

    const items = (await env.SOCIA_DATA.get(key, "json")) || [];
    const list = Array.isArray(items) ? items : [];
    const index = list.findIndex(item => item.id === gacha.id);

    if (index >= 0) list[index] = gacha;
    else list.unshift(gacha);

    await env.SOCIA_DATA.put(key, JSON.stringify(list));
    return json({ gacha }, 201, corsHeaders);
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

function sanitizeGacha(input) {
  const text = (value, maxLength, fallback = "") =>
    String(value || fallback).trim().slice(0, maxLength);

  const rates = {};
  for (const [key, value] of Object.entries(input?.rates || {})) {
    const safeKey = String(key || "").toUpperCase().slice(0, 16);
    if (!safeKey) continue;
    rates[safeKey] = Math.max(0, Math.min(100, Number(value) || 0));
  }

  return {
    id: text(input?.id, 80, crypto.randomUUID()),
    title: text(input?.title, 40, "ガチャ"),
    description: text(input?.description, 80, ""),
    bannerImage: sanitizeImageSource(input?.bannerImage),
    featured: Array.isArray(input?.featured) ? input.featured.slice(0, 20).map(value => String(value).slice(0, 80)) : [],
    rates
  };
}

function sanitizeImageSource(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("data:image/")) return text;
  if (/^https:\/\//i.test(text)) return text;
  return "";
}
