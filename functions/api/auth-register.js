import { readJson } from "./_http.js";
import {
  authDbUnavailable,
  authError,
  authMethodNotAllowed,
  authOk,
  buildSessionCookie,
  createAuthCorsHeaders,
  createAuthUser,
  createSession,
  findAuthUserByEmail,
  isValidEmail,
  normalizeDisplayName,
  normalizeEmail,
  validatePassword
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
  const displayName = normalizeDisplayName(input?.displayName, email.split("@")[0] || "user");

  if (!email || !isValidEmail(email)) {
    return authError("メールアドレスを確認してください。", 400, corsHeaders, "invalid_email");
  }
  if (!validatePassword(password)) {
    return authError("パスワードは8文字以上で入力してください。", 400, corsHeaders, "invalid_password");
  }

  const existingUser = await findAuthUserByEmail(env, email);
  if (existingUser?.id || existingUser?.user_id) {
    return authError("このメールアドレスは既に登録されています。", 409, corsHeaders, "email_taken");
  }

  const user = await createAuthUser(env, { email, displayName, password });
  const session = await createSession(env, user.id);
  return authOk(user, 201, corsHeaders, buildSessionCookie(session.token, session.expiresAt));
}
