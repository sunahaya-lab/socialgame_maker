import {
  buildContentScope,
  createCorsHeaders,
  ensureReadableAccess,
  ensureSharedContentWriteAccess,
  json,
  readJson,
  resolveShareAccess
} from "./_share-auth.js";
import { sanitizeImageSource, trimText } from "./_content-sanitize.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const access = await resolveShareAccess(request, env);
  const blockedRead = ensureReadableAccess(access, corsHeaders);
  if (blockedRead) return blockedRead;
  const { key } = buildContentScope(access, "announcements");

  if (request.method === "GET") {
    const result = await listAnnouncements(env, key);
    return json(result, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await readJson(request);
    const blockedWrite = await ensureSharedContentWriteAccess(request, env, access, corsHeaders, input);
    if (blockedWrite) return blockedWrite;
    const announcement = sanitizeAnnouncement(input);
    const result = await saveAnnouncement(env, key, announcement);
    return json(result, 201, corsHeaders);
  }

  return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
}

function sanitizeAnnouncement(input) {
  const text = trimText;
  const now = new Date().toISOString();
  return {
    id: text(input?.id, 80, crypto.randomUUID()),
    scopeType: sanitizeScopeType(input?.scopeType),
    title: text(input?.title, 80, "お知らせ"),
    body: text(input?.body, 2000, ""),
    image: sanitizeImageSource(input?.image),
    status: sanitizeStatus(input?.status),
    startAt: sanitizeIsoDateTime(input?.startAt),
    endAt: sanitizeIsoDateTime(input?.endAt),
    sortOrder: sanitizeSortOrder(input?.sortOrder),
    linkType: sanitizeLinkType(input?.linkType),
    linkValue: text(input?.linkValue, 300, ""),
    createdAt: sanitizeIsoDateTime(input?.createdAt) || now,
    updatedAt: sanitizeIsoDateTime(input?.updatedAt) || now
  };
}

function sanitizeScopeType(value) {
  return value === "global" ? "global" : "project";
}

function sanitizeStatus(value) {
  if (value === "scheduled") return "scheduled";
  if (value === "published") return "published";
  if (value === "archived") return "archived";
  return "draft";
}

function sanitizeLinkType(value) {
  if (value === "story") return "story";
  if (value === "gacha") return "gacha";
  if (value === "url") return "url";
  return "none";
}

function sanitizeSortOrder(value) {
  return Math.max(0, Number(value || 0));
}

function sanitizeIsoDateTime(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

async function listAnnouncements(env, key) {
  const items = (await env.SOCIA_DATA.get(key, "json")) || [];
  return { announcements: Array.isArray(items) ? items.map(sanitizeAnnouncement) : [], storage: "kv" };
}

async function saveAnnouncement(env, key, announcement) {
  const items = (await env.SOCIA_DATA.get(key, "json")) || [];
  const list = Array.isArray(items) ? items.map(sanitizeAnnouncement) : [];
  const index = list.findIndex(item => item.id === announcement.id);
  if (index >= 0) list[index] = announcement;
  else list.unshift(announcement);
  await env.SOCIA_DATA.put(key, JSON.stringify(list));
  return { announcement, storage: "kv" };
}
