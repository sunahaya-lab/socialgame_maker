import {
  buildContentScope,
  createCorsHeaders,
  ensureProjectOwnerAccess,
  ensureReadableAccess,
  ensureSharedContentWriteAccess,
  json,
  readJson,
  resolveShareAccess
} from "./_share-auth.js";
import { getSessionUser } from "./_auth.js";
import {
  buildProjectSlug,
  mapProjectRow,
  sanitizeProjectRecord,
  upsertScopedCollectionItem
} from "./_project-store.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const access = await resolveShareAccess(request, env);
  const blockedRead = ensureReadableAccess(access, corsHeaders);
  if (blockedRead) return blockedRead;
  const scope = buildContentScope(access, "projects");

  if (request.method === "GET") {
    const sessionUser = await getSessionUser(request, env).catch(() => null);
    const requesterUserId = String(sessionUser?.id || "").trim() || null;
    const result = await listProjects(env, scope, requesterUserId);
    return json(result, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await readJson(request);
    const blockedWrite = await ensureSharedContentWriteAccess(request, env, access, corsHeaders, input);
    if (blockedWrite) return blockedWrite;

    const sessionUser = await getSessionUser(request, env).catch(() => null);
    const requesterUserId = String(sessionUser?.id || "").trim() || null;
    const project = sanitizeProjectRecord(input, scope.projectId);
    const isUpdate = Boolean(project.id && input?.id);

    if (env?.SOCIA_DB && requesterUserId) {
      if (isUpdate) {
        const ownerAccess = await ensureProjectOwnerAccess(request, env, project.id, input);
        if (!ownerAccess.ok) {
          return json({ error: ownerAccess.error, code: ownerAccess.code }, ownerAccess.status || 403, corsHeaders);
        }
      }
      const d1Project = await saveProjectToD1(env, requesterUserId, project, isUpdate);
      if (d1Project) {
        return json({ project: d1Project, storage: "d1" }, 201, corsHeaders);
      }
    }

    const result = await saveProjectToKv(env, scope, project);
    return json(result, 201, corsHeaders);
  }

  return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
}

async function listProjects(env, scope, requesterUserId) {
  const d1Projects = await listProjectsFromD1(env, requesterUserId, scope.scopeKey);
  if (d1Projects) {
    return { projects: d1Projects, storage: "d1" };
  }
  const projects = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  return { projects: Array.isArray(projects) ? projects : [], storage: "kv" };
}

async function listProjectsFromD1(env, requesterUserId, scopeKey) {
  if (!env?.SOCIA_DB) return null;
  try {
    if (requesterUserId) {
      const result = await env.SOCIA_DB.prepare(`
        SELECT
          projects.id,
          projects.name,
          projects.owner_user_id,
          CASE
            WHEN projects.owner_user_id = ? THEN 'owner'
            ELSE COALESCE(MAX(project_members.role), '')
          END AS member_role,
          projects.created_at,
          projects.updated_at
        FROM projects
        LEFT JOIN project_members
          ON project_members.project_id = projects.id
        WHERE projects.owner_user_id = ?
           OR project_members.user_id = ?
        GROUP BY projects.id, projects.name, projects.owner_user_id, projects.created_at, projects.updated_at
        ORDER BY projects.updated_at DESC, projects.created_at DESC
      `).bind(requesterUserId, requesterUserId, requesterUserId).all();
      return (result.results || []).map(mapProjectRow);
    }

    const legacy = await env.SOCIA_DB.prepare(`
      SELECT project_id, name, created_at, updated_at
      FROM project_registries
      WHERE scope_key = ?
      ORDER BY updated_at DESC, created_at DESC
    `).bind(scopeKey).all();
    return (legacy.results || []).map(mapProjectRow);
  } catch (error) {
    console.warn("Falling back to KV for project listing:", error);
    return null;
  }
}

async function saveProjectToD1(env, requesterUserId, project, isUpdate) {
  if (!env?.SOCIA_DB || !requesterUserId) return null;
  try {
    const now = new Date().toISOString();
    if (isUpdate) {
      await env.SOCIA_DB.prepare(`
        UPDATE projects
        SET name = ?, updated_at = ?
        WHERE id = ?
      `).bind(project.name, now, project.id).run();
      return { ...project, ownerUserId: requesterUserId, memberRole: "owner", updatedAt: now };
    }

    await env.SOCIA_DB.batch([
      env.SOCIA_DB.prepare(`
        INSERT INTO projects (id, owner_user_id, name, slug, description, visibility, created_at, updated_at)
        VALUES (?, ?, ?, ?, '', 'private', ?, ?)
      `).bind(
        project.id,
        requesterUserId,
        project.name,
        buildProjectSlug(project.name, project.id),
        project.createdAt || now,
        now
      ),
      env.SOCIA_DB.prepare(`
        INSERT INTO project_members (id, project_id, user_id, role, created_at, updated_at)
        VALUES (?, ?, ?, 'owner', ?, ?)
      `).bind(
        crypto.randomUUID(),
        project.id,
        requesterUserId,
        project.createdAt || now,
        now
      )
    ]);

    return { ...project, ownerUserId: requesterUserId, memberRole: "owner", updatedAt: now };
  } catch (error) {
    console.warn("Falling back to KV for project save:", error);
    return null;
  }
}

async function saveProjectToKv(env, scope, project) {
  await upsertScopedCollectionItem(env, scope.key, project, "id");
  return { project, storage: "kv" };
}
