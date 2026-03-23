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

  const key = project ? `project:${project}:system` : room ? `room:${room}:system` : "system";
  const scopeKey = project ? `project:${project}` : room ? `room:${room}` : "global";

  if (request.method === "GET") {
    const result = await loadSystemConfig(env, { key, scopeKey });
    return json(result, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await request.json();
    const system = sanitizeSystemConfig(input);
    const result = await saveSystemConfig(env, { key, scopeKey, system });
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

function defaultSystemConfig() {
  return {
    rarityMode: "classic4",
    orientation: "auto",
    cardFolders: [],
    storyFolders: []
  };
}

function sanitizeSystemConfig(input) {
  return {
    rarityMode: input?.rarityMode === "stars5" ? "stars5" : "classic4",
    orientation: ["auto", "portrait", "landscape", "fullscreen"].includes(input?.orientation)
      ? input.orientation
      : "auto",
    cardFolders: sanitizeFolderList(input?.cardFolders),
    storyFolders: sanitizeFolderList(input?.storyFolders)
  };
}

function sanitizeFolderList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 100)
    .map((item, index) => ({
      id: String(item?.id || crypto.randomUUID()).trim().slice(0, 80),
      name: String(item?.name || "").trim().slice(0, 40),
      sortOrder: Math.max(0, Number(item?.sortOrder ?? index) || 0)
    }))
    .filter(item => item.id && item.name)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

async function loadSystemConfig(env, scope) {
  const d1System = await loadSystemConfigFromD1(env, scope.scopeKey);
  if (d1System) {
    return { system: d1System, storage: "d1" };
  }

  const system = sanitizeSystemConfig((await env.SOCIA_DATA.get(scope.key, "json")) || defaultSystemConfig());
  return { system, storage: "kv" };
}

async function saveSystemConfig(env, scope) {
  const d1System = await saveSystemConfigToD1(env, scope.scopeKey, scope.system);
  if (d1System) {
    return { system: d1System, storage: "d1" };
  }

  await env.SOCIA_DATA.put(scope.key, JSON.stringify(scope.system));
  return { system: scope.system, storage: "kv" };
}

async function loadSystemConfigFromD1(env, scopeKey) {
  if (!env.SOCIA_DB) return null;
  try {
    const result = await env.SOCIA_DB.prepare(`
      SELECT payload_json
      FROM system_config_registries
      WHERE scope_key = ?
    `).bind(scopeKey).first();

    if (!result?.payload_json) {
      return defaultSystemConfig();
    }

    return parseSystemPayload(result.payload_json);
  } catch (error) {
    console.warn("Falling back to KV for system config load:", error);
    return null;
  }
}

async function saveSystemConfigToD1(env, scopeKey, system) {
  if (!env.SOCIA_DB) return null;
  try {
    await env.SOCIA_DB.prepare(`
      INSERT INTO system_config_registries (scope_key, payload_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(scope_key) DO UPDATE SET
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `).bind(
      scopeKey,
      JSON.stringify(system),
      new Date().toISOString()
    ).run();

    return system;
  } catch (error) {
    console.warn("Falling back to KV for system config save:", error);
    return null;
  }
}

function parseSystemPayload(value) {
  try {
    return sanitizeSystemConfig(JSON.parse(String(value || "{}")));
  } catch {
    return defaultSystemConfig();
  }
}
