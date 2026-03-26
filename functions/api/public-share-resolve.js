import {
  createCorsHeaders,
  ensureReadableAccess,
  json,
  resolveShareAccess
} from "./_share-auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders("GET,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
  }

  const access = await resolveShareAccess(request, env);
  const blocked = ensureReadableAccess(access, corsHeaders);
  if (blocked) return blocked;

  if (access.shareType !== "public" || access.accessMode !== "play_only" || !access.projectId) {
    return json({
      error: "公開URLが無効です。"
    }, 404, corsHeaders);
  }

  return json({
    projectId: access.projectId,
    accessMode: access.accessMode,
    shareType: "public"
  }, 200, corsHeaders);
}
