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

  const key = project ? `project:${project}:entries` : room ? `room:${room}:entries` : "entries";
  const scopeKey = project ? `project:${project}` : room ? `room:${room}` : "global";

  if (request.method === "GET") {
    const result = await listEntries(env, { key, scopeKey });
    return json(result, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await request.json();
    const entry = sanitizeEntry(input);
    const result = await saveEntry(env, { key, scopeKey, entry });
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
    folderId: input?.folderId ? text(input.folderId, 80) : null,
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

async function listEntries(env, scope) {
  const d1Entries = await listEntriesFromD1(env, scope.scopeKey);
  if (d1Entries) {
    return { entries: d1Entries, storage: "d1" };
  }

  const entries = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  return { entries: Array.isArray(entries) ? entries : [], storage: "kv" };
}

async function saveEntry(env, scope) {
  const d1Entry = await saveEntryToD1(env, scope.scopeKey, scope.entry);
  if (d1Entry) {
    return { entry: d1Entry, storage: "d1" };
  }

  const items = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  const list = Array.isArray(items) ? items : [];
  const index = list.findIndex(item => item.id === scope.entry.id);

  if (index >= 0) list[index] = scope.entry;
  else list.unshift(scope.entry);

  await env.SOCIA_DATA.put(scope.key, JSON.stringify(list));
  return { entry: scope.entry, storage: "kv" };
}

async function listEntriesFromD1(env, scopeKey) {
  if (!env.SOCIA_DB) return null;
  try {
    const result = await env.SOCIA_DB.prepare(`
      SELECT payload_json
      FROM entry_registries
      WHERE scope_key = ?
      ORDER BY updated_at DESC, created_at DESC
    `).bind(scopeKey).all();

    return (result.results || [])
      .map(row => parseEntryPayload(row.payload_json))
      .filter(Boolean);
  } catch (error) {
    console.warn("Falling back to KV for entry listing:", error);
    return null;
  }
}

async function saveEntryToD1(env, scopeKey, entry) {
  if (!env.SOCIA_DB) return null;
  try {
    await env.SOCIA_DB.prepare(`
      INSERT INTO entry_registries (
        scope_key,
        entry_id,
        name,
        payload_json,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(scope_key, entry_id) DO UPDATE SET
        name = excluded.name,
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `).bind(
      scopeKey,
      entry.id,
      entry.name,
      JSON.stringify(entry),
      new Date().toISOString()
    ).run();

    return entry;
  } catch (error) {
    console.warn("Falling back to KV for entry save:", error);
    return null;
  }
}

function parseEntryPayload(value) {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" ? sanitizeEntry(parsed) : null;
  } catch {
    return null;
  }
}
