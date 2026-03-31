import { readJson } from "./_http.js";
import {
  authDbUnavailable,
  authError,
  authMethodNotAllowed,
  authOk,
  buildSessionCookie,
  createAuthCorsHeaders,
  createSession,
  findAuthUserByEmail,
  normalizeAuthUser,
  normalizeEmail,
  verifyPassword
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
  if (!env?.SOCIA_DB) {
    return authDbUnavailable(corsHeaders);
  }

  const input = await readJson(request);
  const email = normalizeEmail(input?.email);
  const password = String(input?.password || "");
  if (!email || !password) {
    return authError("メールアドレスとパスワードを入力してください。", 400, corsHeaders, "credentials_required");
  }

  const userRow = await findAuthUserByEmail(env, email);
  if (!userRow?.id) {
    return authError("メールアドレスまたはパスワードが違います。", 401, corsHeaders, "invalid_credentials");
  }

  const ok = await verifyPassword(
    password,
    userRow.password_salt,
    userRow.password_hash,
    Number(userRow.password_iterations || 120000)
  );
  if (!ok) {
    return authError("メールアドレスまたはパスワードが違います。", 401, corsHeaders, "invalid_credentials");
  }

  const user = normalizeAuthUser(userRow);
  const session = await createSession(env, user.id);
  return authOk(user, 200, corsHeaders, buildSessionCookie(session.token, session.expiresAt));
}
