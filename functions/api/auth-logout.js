import {
  authMethodNotAllowed,
  clearSessionCookie,
  createAuthCorsHeaders,
  deleteSession,
  withJsonCookie
} from "./_auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createAuthCorsHeaders();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return authMethodNotAllowed(corsHeaders);
  }

  await deleteSession(request, env);
  return withJsonCookie({ ok: true }, 200, corsHeaders, clearSessionCookie());
}
