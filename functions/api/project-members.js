import { getSessionUser } from "./_auth.js";
import {
  createCorsHeaders,
  ensureProjectMemberAccess,
  ensureProjectOwnerAccess,
  errorJson,
  json,
  readJson
} from "./_share-auth.js";
import {
  createInputError,
  buildDefaultOwnerMember,
  findUserIdByEmail,
  mapMemberRow,
  sanitizeId,
  sanitizeMemberRecord,
  sanitizeRole,
  sortMembers,
  writeScopedCollection
} from "./_project-store.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const projectId = sanitizeId(url.searchParams.get("project"), 80);
  const sessionUser = await getSessionUser(request, env).catch(() => null);
  const requesterUserId = sanitizeId(sessionUser?.id, 80);

  if (request.method === "GET") {
    if (!projectId) {
      return errorJson("project が指定されていません。", 400, corsHeaders, { code: "project_required" });
    }
    if (env?.SOCIA_DB) {
      const access = await ensureProjectMemberAccess(request, env, projectId);
      if (!access.ok) {
        return errorJson(access.error, access.status || 403, corsHeaders, { code: access.code });
      }
    }
    const members = await loadMembers(env, projectId, requesterUserId);
    return json({ members, storage: env?.SOCIA_DB ? "d1" : "kv" }, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await readJson(request);
    const bodyProjectId = sanitizeId(input?.projectId || projectId, 80);
    if (!bodyProjectId) {
      return errorJson("projectId が指定されていません。", 400, corsHeaders, { code: "project_required" });
    }
    if (!requesterUserId) {
      return errorJson("この操作にはログインが必要です。", 401, corsHeaders, { code: "auth_required" });
    }

    if (env?.SOCIA_DB) {
      const ownerAccess = await ensureProjectOwnerAccess(request, env, bodyProjectId, input);
      if (!ownerAccess.ok) {
        return errorJson(ownerAccess.error, ownerAccess.status || 403, corsHeaders, { code: ownerAccess.code });
      }
    }

    const action = String(input?.action || "").trim();
    try {
      const members = action === "invite"
        ? await inviteMember(env, bodyProjectId, input, requesterUserId)
        : action === "update-role"
          ? await updateMemberRole(env, bodyProjectId, input, requesterUserId)
          : null;

      if (!members) {
        return errorJson("未対応の action です。", 400, corsHeaders, { code: "unsupported_action" });
      }
      return json({ members, storage: env?.SOCIA_DB ? "d1" : "kv" }, 200, corsHeaders);
    } catch (error) {
      return errorJson(String(error?.message || "入力内容を確認してください。"), 400, corsHeaders, {
        code: String(error?.code || "invalid_member_input")
      });
    }
  }

  return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
}

async function loadMembers(env, projectId, requesterUserId) {
  if (env?.SOCIA_DB) {
    const d1Members = await loadMembersFromD1(env, projectId);
    if (d1Members) return d1Members;
  }

  const key = buildKvMembersKey(projectId);
  const stored = await env.SOCIA_DATA.get(key, "json");
  const list = Array.isArray(stored) ? stored.map(sanitizeMemberRecord).filter(item => item.userId) : [];
  return sortMembers(list.length > 0 ? list : buildDefaultOwnerMember(requesterUserId));
}

async function loadMembersFromD1(env, projectId) {
  try {
    const result = await env.SOCIA_DB.prepare(`
      SELECT project_members.user_id, project_members.role, users.email, users.display_name, project_members.created_at, project_members.updated_at
      FROM project_members
      LEFT JOIN users ON users.id = project_members.user_id
      WHERE project_members.project_id = ?
      ORDER BY project_members.updated_at DESC
    `).bind(projectId).all();
    return sortMembers((result.results || []).map(mapMemberRow).filter(item => item.userId));
  } catch (error) {
    console.warn("Falling back to KV for project members:", error);
    return null;
  }
}

async function inviteMember(env, projectId, input, requesterUserId) {
  const targetUserId = await resolveInviteTarget(env, input);
  const role = sanitizeRole(input?.role, "viewer");
  if (role === "owner") {
    throw createInputError("招待時に owner は指定できません。", "invalid_invite_role");
  }

  if (env?.SOCIA_DB) {
    const existing = await env.SOCIA_DB.prepare(`
      SELECT id, role
      FROM project_members
      WHERE project_id = ? AND user_id = ?
      LIMIT 1
    `).bind(projectId, targetUserId).first();
    const now = new Date().toISOString();
    if (existing?.id) {
      if (String(existing.role || "") === "owner") {
        throw createInputError("owner は変更できません。", "owner_locked");
      }
      await env.SOCIA_DB.prepare(`
        UPDATE project_members
        SET role = ?, updated_at = ?
        WHERE id = ?
      `).bind(role, now, String(existing.id)).run();
    } else {
      await env.SOCIA_DB.prepare(`
        INSERT INTO project_members (id, project_id, user_id, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), projectId, targetUserId, role, now, now).run();
    }
    return loadMembers(env, projectId, requesterUserId);
  }

  const currentMembers = await loadMembers(env, projectId, requesterUserId);
  const existingIndex = currentMembers.findIndex(member => member.userId === targetUserId);
  const now = new Date().toISOString();
  const nextMembers = currentMembers.slice();
  if (existingIndex >= 0) {
    nextMembers[existingIndex] = { ...nextMembers[existingIndex], role, status: "invited", updatedAt: now };
  } else {
    nextMembers.push({ userId: targetUserId, role, status: "invited", createdAt: now, updatedAt: now });
  }
  await writeScopedCollection(env, buildKvMembersKey(projectId), sortMembers(nextMembers));
  return sortMembers(nextMembers);
}

async function updateMemberRole(env, projectId, input, requesterUserId) {
  const targetUserId = sanitizeId(input?.targetUserId, 80);
  if (!targetUserId) {
    throw createInputError("権限を変更するユーザーIDが指定されていません。", "target_user_required");
  }
  const role = sanitizeRole(input?.role, "viewer");
  if (role === "owner") {
    throw createInputError("owner への変更はまだ対応していません。", "owner_promotion_unsupported");
  }

  if (env?.SOCIA_DB) {
    const existing = await env.SOCIA_DB.prepare(`
      SELECT id, role
      FROM project_members
      WHERE project_id = ? AND user_id = ?
      LIMIT 1
    `).bind(projectId, targetUserId).first();
    if (!existing?.id) {
      throw createInputError("対象ユーザーが見つかりません。", "member_not_found");
    }
    if (String(existing.role || "") === "owner") {
      throw createInputError("owner の権限はここでは変更できません。", "owner_locked");
    }
    await env.SOCIA_DB.prepare(`
      UPDATE project_members
      SET role = ?, updated_at = ?
      WHERE id = ?
    `).bind(role, new Date().toISOString(), String(existing.id)).run();
    return loadMembers(env, projectId, requesterUserId);
  }

  const currentMembers = await loadMembers(env, projectId, requesterUserId);
  const index = currentMembers.findIndex(member => member.userId === targetUserId);
  if (index < 0) {
    throw createInputError("対象ユーザーが見つかりません。", "member_not_found");
  }
  if (currentMembers[index].role === "owner") {
    throw createInputError("owner の権限はここでは変更できません。", "owner_locked");
  }
  const nextMembers = currentMembers.slice();
  nextMembers[index] = { ...nextMembers[index], role, updatedAt: new Date().toISOString() };
  await writeScopedCollection(env, buildKvMembersKey(projectId), sortMembers(nextMembers));
  return sortMembers(nextMembers);
}

async function resolveInviteTarget(env, input) {
  const directUserId = sanitizeId(input?.targetUserId, 80);
  if (directUserId) return directUserId;

  const targetEmail = String(input?.targetEmail || "").trim().toLowerCase().slice(0, 160);
  if (env?.SOCIA_DB && targetEmail) {
    const resolvedUserId = await findUserIdByEmail(env, targetEmail);
    if (resolvedUserId) return resolvedUserId;
    throw createInputError("このメールアドレスのアカウントは見つかりません。", "invite_user_not_found");
  }

  throw createInputError("招待するメールアドレスまたはユーザーIDを入力してください。", "target_user_required");
}

function buildKvMembersKey(projectId) {
  return `project-members:${projectId}`;
}
