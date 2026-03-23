import { createCorsHeaders, ensurePlayerProfile, getPlayerScope, json, readJson } from "./_player-state";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = createCorsHeaders("GET,POST,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!["GET", "POST"].includes(request.method)) {
    return json({ error: "Method not allowed" }, 405, corsHeaders);
  }

  const body = request.method === "POST" ? await readJson(request) : {};
  const scope = getPlayerScope(url, body);
  if (!scope.projectId || !scope.userId) {
    return json({ error: "Missing project or user" }, 400, corsHeaders);
  }

  try {
    const profile = await ensurePlayerProfile(env, scope);
    return json({ profile, storage: "d1" }, 200, corsHeaders);
  } catch (error) {
    return json({ error: error.message || "Failed to ensure player profile" }, 400, corsHeaders);
  }
}
