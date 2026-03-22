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

  const key = room ? `room:${room}:system` : "system";

  if (request.method === "GET") {
    const system = sanitizeSystemConfig((await env.SOCIA_DATA.get(key, "json")) || defaultSystemConfig());
    return json({ system }, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await request.json();
    const system = sanitizeSystemConfig(input);
    await env.SOCIA_DATA.put(key, JSON.stringify(system));
    return json({ system }, 201, corsHeaders);
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
    orientation: "auto"
  };
}

function sanitizeSystemConfig(input) {
  return {
    rarityMode: input?.rarityMode === "stars5" ? "stars5" : "classic4",
    orientation: ["auto", "portrait", "landscape", "fullscreen"].includes(input?.orientation)
      ? input.orientation
      : "auto"
  };
}
