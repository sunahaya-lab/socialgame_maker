import {
  createCorsHeaders,
  ensureProjectShareManageAccess,
  errorJson,
  json,
  readJson
} from "./_share-auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders("POST,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
  }

  const body = await readJson(request);
  const url = new URL(request.url);
  const projectId = String(url.searchParams.get("project") || body.projectId || "").trim();
  if (!projectId) {
    return errorJson("project が必要です。", 400, corsHeaders, { code: "project_required" });
  }

  const access = await ensureProjectShareManageAccess(request, env, projectId, body);
  if (!access.ok) {
    return errorJson(access.error, access.status, corsHeaders, { code: access.code });
  }

  if (!env?.SOCIA_DB) {
    return errorJson("D1 バインディング SOCIA_DB が必要です。", 500, corsHeaders, { code: "d1_required" });
  }

  const now = new Date().toISOString();
  const token = createShareToken();
  try {
    await env.SOCIA_DB.prepare(`
      INSERT INTO project_collab_shares (
        project_id,
        active_token,
        version,
        status,
        rotated_by_user_id,
        rotated_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, 1, 'active', ?, ?, ?, ?)
      ON CONFLICT(project_id) DO UPDATE SET
        active_token = excluded.active_token,
        version = project_collab_shares.version + 1,
        status = 'active',
        rotated_by_user_id = excluded.rotated_by_user_id,
        rotated_at = excluded.rotated_at,
        updated_at = excluded.updated_at
    `).bind(
      projectId,
      token,
      access.userId,
      now,
      now,
      now
    ).run();

    const current = await env.SOCIA_DB.prepare(`
      SELECT project_id, active_token, version, status, rotated_at, updated_at
      FROM project_collab_shares
      WHERE project_id = ?
      LIMIT 1
    `).bind(projectId).first();

    return json({
      collabShare: {
        projectId,
        token: current?.active_token || token,
        version: Number(current?.version || 1),
        status: current?.status || "active",
        rotatedAt: current?.rotated_at || now,
        updatedAt: current?.updated_at || now
      }
    }, 200, corsHeaders);
  } catch (error) {
    console.error("Failed to rotate collaborative share:", error);
    if (isMissingTableError(error)) {
      return errorJson("共有URL用のテーブルがまだ適用されていません。0009 migration を適用してください。", 503, corsHeaders, {
        code: "share_tables_missing"
      });
    }
    return errorJson("共同編集URLの再発行に失敗しました。", 500, corsHeaders, {
      code: "collab_share_rotate_failed"
    });
  }
}

function createShareToken() {
  return `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function isMissingTableError(error) {
  const text = String(error?.message || error || "");
  return /no such table/i.test(text);
}
