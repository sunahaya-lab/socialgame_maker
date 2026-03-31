import { createCorsHeaders as createCorsHeadersBase, json } from "./_http.js";

const SESSION_COOKIE = "socia_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 120000;

export function createAuthCorsHeaders() {
  return createCorsHeadersBase("GET,POST,OPTIONS", "Content-Type");
}

export function authMethodNotAllowed(corsHeaders) {
  return withJsonCookie({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
}

export function authDbUnavailable(corsHeaders) {
  return withJsonCookie({ error: "認証DBが利用できません。" }, 503, corsHeaders);
}

export function authError(message, status, corsHeaders, code = "") {
  return withJsonCookie({ error: message, ...(code ? { code } : {}) }, status, corsHeaders);
}

export function authOk(user, status, corsHeaders, cookieValue = "") {
  return withJsonCookie({
    ok: true,
    user: normalizeAuthUser(user)
  }, status, corsHeaders, cookieValue);
}

export function authSessionPayload(user) {
  return {
    authenticated: Boolean(user?.id),
    user: user?.id ? normalizeAuthUser(user) : null
  };
}

export function withJsonCookie(data, status, corsHeaders, cookieValue) {
  const headers = {
    ...corsHeaders,
    "Content-Type": "application/json; charset=utf-8"
  };
  if (cookieValue) headers["Set-Cookie"] = cookieValue;
  return new Response(JSON.stringify(data), { status, headers });
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function buildSessionCookie(token, expiresAt) {
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase().slice(0, 160);
}

export function normalizeDisplayName(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 80);
}

export function validatePassword(value) {
  const password = String(value || "");
  return password.length >= 8 && password.length <= 200;
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

export function normalizeAuthUser(user) {
  return {
    id: String(user?.id || "").trim(),
    email: String(user?.email || "").trim(),
    displayName: String(user?.displayName || user?.display_name || user?.email || "").trim()
  };
}

export async function createPasswordRecord(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS);
  return {
    salt: bytesToHex(salt),
    hash,
    iterations: PASSWORD_ITERATIONS
  };
}

export async function verifyPassword(password, saltHex, expectedHash, iterations = PASSWORD_ITERATIONS) {
  const salt = hexToBytes(saltHex);
  const actualHash = await derivePasswordHash(password, salt, iterations);
  return timingSafeEqual(actualHash, String(expectedHash || ""));
}

export async function findAuthUserByEmail(env, email) {
  if (!env?.SOCIA_DB) return null;
  try {
    const row = await env.SOCIA_DB.prepare(`
      SELECT users.id, users.email, users.display_name, user_credentials.password_hash, user_credentials.password_salt, user_credentials.password_iterations
      FROM user_credentials
      INNER JOIN users ON users.id = user_credentials.user_id
      WHERE user_credentials.email = ?
      LIMIT 1
    `).bind(email).first();
    return row || null;
  } catch (error) {
    console.warn("Failed to find auth user by email:", error);
    return null;
  }
}

export async function createAuthUser(env, { email, displayName, password }) {
  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordRecord = await createPasswordRecord(password);

  await env.SOCIA_DB.batch([
    env.SOCIA_DB.prepare(`
      INSERT INTO users (id, auth_subject, email, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, `email:${email}`, email, displayName, now, now),
    env.SOCIA_DB.prepare(`
      INSERT INTO user_credentials (user_id, email, password_hash, password_salt, password_iterations, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, email, passwordRecord.hash, passwordRecord.salt, passwordRecord.iterations, now, now)
  ]);

  return normalizeAuthUser({
    id: userId,
    email,
    displayName
  });
}

export async function createSession(env, userId) {
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
  const sessionId = crypto.randomUUID();

  await env.SOCIA_DB.prepare(`
    INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    sessionId,
    userId,
    tokenHash,
    expiresAt,
    now.toISOString(),
    now.toISOString()
  ).run();

  return { token, expiresAt };
}

export async function getSessionUser(request, env) {
  if (!env?.SOCIA_DB) return null;
  const token = getCookie(request.headers.get("Cookie"), SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const nowIso = new Date().toISOString();
  try {
    const row = await env.SOCIA_DB.prepare(`
      SELECT users.id, users.email, users.display_name, user_sessions.id AS session_id, user_sessions.expires_at
      FROM user_sessions
      INNER JOIN users ON users.id = user_sessions.user_id
      WHERE user_sessions.token_hash = ?
      LIMIT 1
    `).bind(tokenHash).first();
    if (!row?.id || !row?.expires_at || String(row.expires_at) <= nowIso) {
      return null;
    }
    await env.SOCIA_DB.prepare(`
      UPDATE user_sessions
      SET last_seen_at = ?
      WHERE id = ?
    `).bind(nowIso, String(row.session_id || "")).run();
    return normalizeAuthUser(row);
  } catch (error) {
    console.warn("Failed to resolve auth session:", error);
    return null;
  }
}

export async function deleteSession(request, env) {
  if (!env?.SOCIA_DB) return;
  const token = getCookie(request.headers.get("Cookie"), SESSION_COOKIE);
  if (!token) return;
  const tokenHash = await sha256Hex(token);
  await env.SOCIA_DB.prepare(`
    DELETE FROM user_sessions
    WHERE token_hash = ?
  `).bind(tokenHash).run().catch(() => {});
}

export async function requireAuthSession(request, env, corsHeaders) {
  const user = await getSessionUser(request, env);
  if (user?.id) return { ok: true, user };
  return {
    ok: false,
    response: json({ error: "ログインが必要です。", code: "auth_required" }, 401, corsHeaders)
  };
}

async function derivePasswordHash(password, saltBytes, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(password || "")),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBytes,
      iterations
    },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value || "")));
  return bytesToHex(new Uint8Array(digest));
}

function getCookie(cookieHeader, name) {
  const source = String(cookieHeader || "");
  const prefix = `${name}=`;
  return source
    .split(/;\s*/)
    .find(part => part.startsWith(prefix))
    ?.slice(prefix.length) || "";
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const normalized = String(hex || "").trim();
  const bytes = new Uint8Array(Math.floor(normalized.length / 2));
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(normalized.slice(index * 2, index * 2 + 2), 16) || 0;
  }
  return bytes;
}

function timingSafeEqual(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}
