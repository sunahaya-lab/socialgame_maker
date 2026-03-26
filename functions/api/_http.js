export function createCorsHeaders(methods = "GET,POST,OPTIONS", allowHeaders = "Content-Type") {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": allowHeaders,
    "Access-Control-Allow-Methods": methods
  };
}

export function json(data, status, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
