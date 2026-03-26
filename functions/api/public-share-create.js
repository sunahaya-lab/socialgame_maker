import {
  createCorsHeaders,
  ensureOwnerOperationAccess,
  ensureProjectLicenseState,
  errorJson,
  isProjectLicenseActive,
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

  const ownerAccess = await ensureOwnerOperationAccess(request, env, projectId, body);
  if (!ownerAccess.ok) {
    return errorJson(ownerAccess.error, ownerAccess.status, corsHeaders, { code: ownerAccess.code });
  }

  if (!env?.SOCIA_DB) {
    return errorJson("D1 バインディング SOCIA_DB が必要です。", 500, corsHeaders, { code: "d1_required" });
  }

  try {
    const license = await ensureProjectLicenseState(env, projectId);
    if (!isProjectLicenseActive(license)) {
      return errorJson("この機能は有料版のプロジェクトでのみ利用できます。", 403, corsHeaders, {
        code: "paid_feature_required"
      });
    }

    const now = new Date().toISOString();
    const token = createShareToken();

    await env.SOCIA_DB.prepare(`
      INSERT INTO project_public_shares (
        project_id,
        active_token,
        status,
        access_mode,
        snapshot_version,
        rotated_by_user_id,
        rotated_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, 'active', 'play_only', NULL, ?, ?, ?, ?)
      ON CONFLICT(project_id) DO UPDATE SET
        active_token = excluded.active_token,
        status = 'active',
        access_mode = 'play_only',
        rotated_by_user_id = excluded.rotated_by_user_id,
        rotated_at = excluded.rotated_at,
        updated_at = excluded.updated_at
    `).bind(
      projectId,
      token,
      ownerAccess.userId,
      now,
      now,
      now
    ).run();

    const current = await env.SOCIA_DB.prepare(`
      SELECT project_id, active_token, status, access_mode, snapshot_version, rotated_at, updated_at
      FROM project_public_shares
      WHERE project_id = ?
      LIMIT 1
    `).bind(projectId).first();

    return json({
      publicShare: {
        projectId,
        token: current?.active_token || token,
        status: current?.status || "active",
        accessMode: current?.access_mode || "play_only",
        snapshotVersion: current?.snapshot_version ?? null,
        rotatedAt: current?.rotated_at || now,
        updatedAt: current?.updated_at || now
      }
    }, 200, corsHeaders);
  } catch (error) {
    console.error("Failed to create public share:", error);
    return errorJson("公開URLの発行に失敗しました。", 500, corsHeaders, {
      code: "public_share_create_failed"
    });
  }
}

function createShareToken() {
  return `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
