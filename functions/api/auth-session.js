import {
  authMethodNotAllowed,
  authSessionPayload,
  createAuthCorsHeaders,
  getSessionUser,
  withJsonCookie
} from "./_auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createAuthCorsHeaders();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "GET") {
    return authMethodNotAllowed(corsHeaders);
  }

  const user = await getSessionUser(request, env);
  return withJsonCookie(authSessionPayload(user), 200, corsHeaders);
}
