import { createCorsHeaders, ensurePlayerProfile, getPlayerScope, json, readJson } from "./_player-state";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = createCorsHeaders("GET,POST,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!["GET", "POST"].includes(request.method)) {
    return json({ error: "\u3053\u306e\u30e1\u30bd\u30c3\u30c9\u306f\u5229\u7528\u3067\u304d\u307e\u305b\u3093" }, 405, corsHeaders);
  }

  const body = request.method === "POST" ? await readJson(request) : {};
  const scope = getPlayerScope(url, body);
  if (!scope.projectId || !scope.userId) {
    return json({ error: "project \u307e\u305f\u306f user \u304c\u4e0d\u8db3\u3057\u3066\u3044\u307e\u3059" }, 400, corsHeaders);
  }

  try {
    const profile = await ensurePlayerProfile(env, scope);
    return json({ profile, storage: "d1" }, 200, corsHeaders);
  } catch (error) {
    return json({ error: error.message || "\u30d7\u30ec\u30a4\u30e4\u30fc\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u306e\u6e96\u5099\u306b\u5931\u6557\u3057\u307e\u3057\u305f" }, 400, corsHeaders);
  }
}
