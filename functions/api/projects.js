import {
  buildContentScope,
  createCorsHeaders,
  ensureReadableAccess,
  ensureSharedContentWriteAccess,
  json,
  readJson,
  resolveShareAccess
} from "./_share-auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const access = await resolveShareAccess(request, env);
  const blockedRead = ensureReadableAccess(access, corsHeaders);
  if (blockedRead) return blockedRead;
  const { key, scopeKey, projectId } = buildContentScope(access, "projects");

  if (request.method === "GET") {
    const result = await listProjects(env, { key, scopeKey });
    return json(result, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await readJson(request);
    const blockedWrite = await ensureSharedContentWriteAccess(request, env, access, corsHeaders, input);
    if (blockedWrite) return blockedWrite;
    const project = sanitizeProject(input, projectId);
    const result = await saveProject(env, { key, scopeKey, project });
    return json(result, 201, corsHeaders);
  }

  return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
}

function sanitizeProject(input, forcedProjectId = null) {
  const text = (value, maxLength, fallback = "") =>
    String(value || fallback).trim().slice(0, maxLength);

  const now = new Date().toISOString();
  return {
    id: text(forcedProjectId || input?.id, 80, crypto.randomUUID()),
    name: text(input?.name, 80, "新しいプロジェクト"),
    createdAt: text(input?.createdAt, 40, now),
    updatedAt: now
  };
}

async function listProjects(env, scope) {
  const d1Projects = await listProjectsFromD1(env, scope.scopeKey);
  if (d1Projects) {
    return { projects: d1Projects, storage: "d1" };
  }

  const projects = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  return { projects: Array.isArray(projects) ? projects : [], storage: "kv" };
}

async function saveProject(env, scope) {
  const d1Project = await saveProjectToD1(env, scope.scopeKey, scope.project);
  if (d1Project) {
    return { project: d1Project, storage: "d1" };
  }

  const items = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  const list = Array.isArray(items) ? items : [];
  const index = list.findIndex(item => item.id === scope.project.id);
  if (index >= 0) list[index] = scope.project;
  else list.unshift(scope.project);
  await env.SOCIA_DATA.put(scope.key, JSON.stringify(list));
  return { project: scope.project, storage: "kv" };
}

async function listProjectsFromD1(env, scopeKey) {
  if (!env.SOCIA_DB) return null;
  try {
    const result = await env.SOCIA_DB.prepare(`
      SELECT project_id, name, created_at, updated_at
      FROM project_registries
      WHERE scope_key = ?
      ORDER BY updated_at DESC, created_at DESC
    `).bind(scopeKey).all();

    return (result.results || []).map(row => ({
      id: String(row.project_id || "").trim(),
      name: String(row.name || "").trim() || "新しいプロジェクト",
      createdAt: String(row.created_at || ""),
      updatedAt: String(row.updated_at || row.created_at || "")
    }));
  } catch (error) {
    console.warn("Falling back to KV for project listing:", error);
    return null;
  }
}

async function saveProjectToD1(env, scopeKey, project) {
  if (!env.SOCIA_DB) return null;
  try {
    await env.SOCIA_DB.prepare(`
      INSERT INTO project_registries (scope_key, project_id, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(scope_key, project_id) DO UPDATE SET
        name = excluded.name,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
    `).bind(
      scopeKey,
      project.id,
      project.name,
      project.createdAt,
      project.updatedAt
    ).run();

    return project;
  } catch (error) {
    console.warn("Falling back to KV for project save:", error);
    return null;
  }
}
