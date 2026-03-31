export const MEMBER_ROLES = new Set(["owner", "editor", "viewer"]);
export const MEMBER_STATUSES = new Set(["active", "invited"]);

export function sanitizeId(value, maxLength = 80) {
  return String(value || "").trim().slice(0, maxLength);
}

export function sanitizeProjectRecord(input, forcedProjectId = null) {
  const text = (value, maxLength, fallback = "") => String(value || fallback).trim().slice(0, maxLength);
  const now = new Date().toISOString();
  return {
    id: text(forcedProjectId || input?.id, 80, crypto.randomUUID()),
    name: text(input?.name, 80, "新しいプロジェクト"),
    createdAt: text(input?.createdAt, 40, now),
    updatedAt: now
  };
}

export function mapProjectRow(row) {
  return {
    id: String(row.id || row.project_id || "").trim(),
    name: String(row.name || "").trim() || "新しいプロジェクト",
    ownerUserId: String(row.owner_user_id || row.ownerUserId || "").trim(),
    memberRole: String(row.member_role || row.memberRole || "").trim(),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || row.created_at || "")
  };
}

export function buildProjectSlug(name, projectId) {
  const base = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = String(projectId || "").replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
  return `${base || "project"}-${suffix || crypto.randomUUID().slice(0, 8)}`;
}

export async function readScopedCollection(env, key) {
  const stored = (await env.SOCIA_DATA.get(key, "json")) || [];
  return Array.isArray(stored) ? stored : [];
}

export async function upsertScopedCollectionItem(env, key, nextItem, matchKey = "id") {
  const list = await readScopedCollection(env, key);
  const index = list.findIndex(item => String(item?.[matchKey] || "") === String(nextItem?.[matchKey] || ""));
  if (index >= 0) list[index] = nextItem;
  else list.unshift(nextItem);
  await env.SOCIA_DATA.put(key, JSON.stringify(list));
  return list;
}

export async function writeScopedCollection(env, key, list) {
  await env.SOCIA_DATA.put(key, JSON.stringify(Array.isArray(list) ? list : []));
}

export function sanitizeRole(value, fallback = "viewer") {
  const role = String(value || fallback).trim();
  return MEMBER_ROLES.has(role) ? role : fallback;
}

export function sanitizeStatus(value, fallback = "active") {
  const status = String(value || fallback).trim();
  return MEMBER_STATUSES.has(status) ? status : fallback;
}

export function sanitizeMemberRecord(value) {
  const now = new Date().toISOString();
  return {
    userId: sanitizeId(value?.userId, 80),
    role: sanitizeRole(value?.role, "viewer"),
    status: sanitizeStatus(value?.status, "active"),
    email: String(value?.email || "").trim(),
    displayName: String(value?.displayName || "").trim(),
    createdAt: String(value?.createdAt || now).trim() || now,
    updatedAt: String(value?.updatedAt || now).trim() || now
  };
}

export function sortMembers(members = []) {
  return members.slice().sort((a, b) => {
    const roleOrder = { owner: 0, editor: 1, viewer: 2 };
    const leftRole = roleOrder[a.role] ?? 99;
    const rightRole = roleOrder[b.role] ?? 99;
    if (leftRole !== rightRole) return leftRole - rightRole;
    const leftStatus = a.status === "active" ? 0 : 1;
    const rightStatus = b.status === "active" ? 0 : 1;
    if (leftStatus !== rightStatus) return leftStatus - rightStatus;
    return String(a.userId || "").localeCompare(String(b.userId || ""));
  });
}

export function buildDefaultOwnerMember(userId) {
  const now = new Date().toISOString();
  return userId ? [{
    userId,
    role: "owner",
    status: "active",
    createdAt: now,
    updatedAt: now
  }] : [];
}

export function mapMemberRow(row) {
  return sanitizeMemberRecord({
    userId: row?.user_id,
    role: row?.role,
    status: row?.status || "active",
    email: row?.email,
    displayName: row?.display_name,
    createdAt: row?.created_at,
    updatedAt: row?.updated_at
  });
}

export async function findUserIdByEmail(env, email) {
  if (!env?.SOCIA_DB) return "";
  const normalized = String(email || "").trim().toLowerCase().slice(0, 160);
  if (!normalized) return "";
  const row = await env.SOCIA_DB.prepare(`
    SELECT id
    FROM users
    WHERE email = ?
    LIMIT 1
  `).bind(normalized).first();
  return String(row?.id || "").trim();
}

export function createInputError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}
