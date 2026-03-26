import {
  buildContentScope,
  createCorsHeaders,
  ensureReadableAccess,
  ensureSharedContentWriteAccess,
  json,
  readJson,
  resolveShareAccess
} from "./_share-auth.js";
import { clampNumber, sanitizeImageSource, trimText } from "./_content-sanitize.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const access = await resolveShareAccess(request, env);
  const blockedRead = ensureReadableAccess(access, corsHeaders);
  if (blockedRead) return blockedRead;
  const { key, scopeKey } = buildContentScope(access, "gachas");

  if (request.method === "GET") {
    const result = await listGachas(env, { key, scopeKey });
    return json(result, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await readJson(request);
    const blockedWrite = await ensureSharedContentWriteAccess(request, env, access, corsHeaders, input);
    if (blockedWrite) return blockedWrite;
    const gacha = sanitizeGacha(input);
    const result = await saveGacha(env, { key, scopeKey, gacha });
    return json(result, 201, corsHeaders);
  }

  return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
}

function sanitizeGacha(input) {
  const text = trimText;

  const rates = {};
  for (const [key, value] of Object.entries(input?.rates || {})) {
    const safeKey = String(key || "").toUpperCase().slice(0, 16);
    if (!safeKey) continue;
    rates[safeKey] = clampNumber(value, 0, 100, 0);
  }

  return {
    id: text(input?.id, 80, crypto.randomUUID()),
    title: text(input?.title, 40, "ガチャ"),
    gachaType: sanitizeGachaType(input?.gachaType),
    description: text(input?.description, 80, ""),
    bannerImage: sanitizeImageSource(input?.bannerImage),
    displayMode: sanitizeDisplayMode(input?.displayMode),
    heroImages: sanitizeHeroImages(input),
    featured: Array.isArray(input?.featured) ? input.featured.slice(0, 20).map(value => String(value).slice(0, 80)) : [],
    rates
  };
}

function sanitizeGachaType(value) {
  if (value === "equipment") return "equipment";
  if (value === "mixed") return "mixed";
  return "character";
}

function sanitizeDisplayMode(value) {
  return value === "manualImages" ? "manualImages" : "featuredCards";
}

function sanitizeHeroImages(input) {
  const directImages = Array.isArray(input?.heroImages)
    ? input.heroImages
    : [input?.bannerImage, input?.heroImage2, input?.heroImage3];

  return directImages
    .map(sanitizeImageSource)
    .filter(Boolean)
    .slice(0, 3);
}

async function listGachas(env, scope) {
  const d1Gachas = await listGachasFromD1(env, scope.scopeKey);
  if (d1Gachas) {
    return { gachas: d1Gachas, storage: "d1" };
  }

  const gachas = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  return { gachas: Array.isArray(gachas) ? gachas : [], storage: "kv" };
}

async function saveGacha(env, scope) {
  const d1Gacha = await saveGachaToD1(env, scope.scopeKey, scope.gacha);
  if (d1Gacha) {
    return { gacha: d1Gacha, storage: "d1" };
  }

  const items = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  const list = Array.isArray(items) ? items : [];
  const index = list.findIndex(item => item.id === scope.gacha.id);

  if (index >= 0) list[index] = scope.gacha;
  else list.unshift(scope.gacha);

  await env.SOCIA_DATA.put(scope.key, JSON.stringify(list));
  return { gacha: scope.gacha, storage: "kv" };
}

async function listGachasFromD1(env, scopeKey) {
  if (!env.SOCIA_DB) return null;
  try {
    const result = await env.SOCIA_DB.prepare(`
      SELECT payload_json
      FROM gacha_registries
      WHERE scope_key = ?
      ORDER BY updated_at DESC, created_at DESC
    `).bind(scopeKey).all();

    return (result.results || [])
      .map(row => parseGachaPayload(row.payload_json))
      .filter(Boolean);
  } catch (error) {
    console.warn("Falling back to KV for gacha listing:", error);
    return null;
  }
}

async function saveGachaToD1(env, scopeKey, gacha) {
  if (!env.SOCIA_DB) return null;
  try {
    await env.SOCIA_DB.prepare(`
      INSERT INTO gacha_registries (
        scope_key,
        gacha_id,
        title,
        payload_json,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(scope_key, gacha_id) DO UPDATE SET
        title = excluded.title,
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `).bind(
      scopeKey,
      gacha.id,
      gacha.title,
      JSON.stringify(gacha),
      new Date().toISOString()
    ).run();

    return gacha;
  } catch (error) {
    console.warn("Falling back to KV for gacha save:", error);
    return null;
  }
}

function parseGachaPayload(value) {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" ? sanitizeGacha(parsed) : null;
  } catch {
    return null;
  }
}
