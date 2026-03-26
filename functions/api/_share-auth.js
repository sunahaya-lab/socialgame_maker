import {
  createCorsHeaders as createCorsHeadersBase,
  json,
  readJson
} from "./_http.js";
export { json, readJson } from "./_http.js";
import {
  getEffectiveProjectLicenseState,
  isProjectPublicShareAllowed
} from "./_billing.js";

export function createCorsHeaders(methods = "GET,POST,OPTIONS") {
  return createCorsHeadersBase(methods, "Content-Type, X-Socia-Admin-Secret");
}

export function errorJson(message, status, corsHeaders = {}, extra = {}) {
  return json({ error: message, ...extra }, status, corsHeaders);
}

export async function resolveShareAccess(request, env) {
  const url = new URL(request.url);
  const explicitProjectId = url.searchParams.get("project") || null;
  const legacyRoomId = url.searchParams.get("room") || null;
  const collabToken = url.searchParams.get("collab") || null;
  const publicShareToken = url.searchParams.get("share") || null;

  const base = {
    projectId: explicitProjectId,
    legacyRoomId,
    collabToken,
    publicShareToken,
    accessMode: explicitProjectId ? "direct_project" : legacyRoomId ? "edit_and_play" : "none",
    accessSource: explicitProjectId ? "project" : legacyRoomId ? "legacy_room" : "none",
    shareType: explicitProjectId ? "direct" : legacyRoomId ? "legacy_room" : "none",
    invalidToken: false
  };

  if (!env?.SOCIA_DB) {
    return base;
  }

  if (collabToken) {
    const collab = await resolveCollabToken(env, collabToken);
    if (!collab) {
      return {
        ...base,
        projectId: explicitProjectId,
        accessMode: "none",
        accessSource: "collab_token",
        shareType: "collab",
        invalidToken: true
      };
    }
    return {
      ...base,
      projectId: collab.projectId,
      accessMode: "edit_and_play",
      accessSource: "collab_token",
      shareType: "collab",
      invalidToken: false
    };
  }

  if (publicShareToken) {
    const publicShare = await resolvePublicShareToken(env, publicShareToken);
    if (!publicShare) {
      return {
        ...base,
        projectId: explicitProjectId,
        accessMode: "none",
        accessSource: "public_token",
        shareType: "public",
        invalidToken: true
      };
    }
    return {
      ...base,
      projectId: publicShare.projectId,
      accessMode: "play_only",
      accessSource: "public_token",
      shareType: "public",
      invalidToken: false
    };
  }

  return base;
}

export function getRequesterUserId(request, body = null) {
  const url = new URL(request.url);
  const queryUserId = String(url.searchParams.get("user") || "").trim();
  const bodyUserId = String(body?.userId || "").trim();
  return queryUserId || bodyUserId || null;
}

export async function ensureProjectOwnerAccess(request, env, projectId, body = null) {
  const userId = getRequesterUserId(request, body);
  if (!projectId || !userId) {
    return {
      ok: false,
      status: 403,
      code: "owner_required",
      error: "この操作はプロジェクトの所有者だけが実行できます。"
    };
  }

  if (!env?.SOCIA_DB) {
    return {
      ok: true,
      userId
    };
  }

  try {
    const row = await env.SOCIA_DB.prepare(`
      SELECT owner_user_id
      FROM projects
      WHERE id = ?
      LIMIT 1
    `).bind(projectId).first();

    if (!row?.owner_user_id || String(row.owner_user_id).trim() !== userId) {
      return {
        ok: false,
        status: 403,
        code: "owner_required",
        error: "この操作はプロジェクトの所有者だけが実行できます。"
      };
    }

    return {
      ok: true,
      userId
    };
  } catch (error) {
    console.warn("Failed to verify project owner access:", error);
    return {
      ok: false,
      status: 500,
      code: "owner_check_failed",
      error: "プロジェクト所有者の確認に失敗しました。"
    };
  }
}

export function ensureInternalAdminAccess(request, env) {
  const configuredSecret = String(env?.SOCIA_ADMIN_SECRET || "").trim();
  if (!configuredSecret) {
    return {
      ok: false,
      status: 503,
      code: "admin_secret_required",
      error: "共有管理APIは開発用シークレット設定が必要です。"
    };
  }

  const providedSecret = String(request.headers.get("X-Socia-Admin-Secret") || "").trim();
  if (!providedSecret || providedSecret !== configuredSecret) {
    return {
      ok: false,
      status: 403,
      code: "admin_secret_invalid",
      error: "共有管理APIは開発用シークレットが必要です。"
    };
  }

  return { ok: true };
}

export async function ensureOwnerOperationAccess(request, env, projectId, body = null) {
  const internalAccess = ensureInternalAdminAccess(request, env);
  if (!internalAccess.ok) {
    return internalAccess;
  }
  return ensureProjectOwnerAccess(request, env, projectId, body);
}

export async function ensureProjectLicenseState(env, projectId) {
  return getEffectiveProjectLicenseState(env, projectId);
}

export function isProjectLicenseActive(license, now = new Date()) {
  void now;
  return isProjectPublicShareAllowed(license);
}

export function buildContentScope(access, collectionKey) {
  const projectId = String(access?.projectId || "").trim();
  const legacyRoomId = String(access?.legacyRoomId || "").trim();
  const key = projectId
    ? `project:${projectId}:${collectionKey}`
    : legacyRoomId
      ? `room:${legacyRoomId}:${collectionKey}`
      : collectionKey;
  const scopeKey = projectId
    ? `project:${projectId}`
    : legacyRoomId
      ? `room:${legacyRoomId}`
      : "global";
  return { key, scopeKey, projectId, legacyRoomId };
}

export function ensureReadableAccess(access, corsHeaders) {
  if (access?.invalidToken) {
    return errorJson("この共有URLは無効になっています。", 410, corsHeaders, {
      code: "share_invalid"
    });
  }
  return null;
}

export function ensureWritableAccess(access, corsHeaders) {
  if (access?.invalidToken) {
    return errorJson("この共有URLは無効になっています。", 410, corsHeaders, {
      code: "share_invalid"
    });
  }
  if (access?.accessMode === "play_only") {
    return errorJson("公開共有では編集できません。", 403, corsHeaders, {
      code: "share_read_only"
    });
  }
  return null;
}

export async function ensureSharedContentWriteAccess(request, env, access, corsHeaders, body = null) {
  const blockedWrite = ensureWritableAccess(access, corsHeaders);
  if (blockedWrite) return blockedWrite;

  if (access?.accessSource === "project" && access?.projectId) {
    const ownerAccess = await ensureProjectOwnerAccess(request, env, access.projectId, body);
    if (!ownerAccess?.ok) {
      return errorJson(ownerAccess?.error || "書き込み権限の確認に失敗しました。", ownerAccess?.status || 403, corsHeaders, {
        code: ownerAccess?.code || "write_forbidden"
      });
    }
  }

  return null;
}

async function resolveCollabToken(env, token) {
  try {
    const row = await env.SOCIA_DB.prepare(`
      SELECT project_id, status, version
      FROM project_collab_shares
      WHERE active_token = ?
      LIMIT 1
    `).bind(token).first();
    if (!row || row.status !== "active") return null;
    return {
      projectId: row.project_id,
      version: Number(row.version || 1)
    };
  } catch (error) {
    console.warn("Failed to resolve collaborative share token:", error);
    return null;
  }
}

async function resolvePublicShareToken(env, token) {
  try {
    const row = await env.SOCIA_DB.prepare(`
      SELECT project_id, status, access_mode, snapshot_version
      FROM project_public_shares
      WHERE active_token = ?
      LIMIT 1
    `).bind(token).first();
    if (!row || row.status !== "active") return null;

    const license = await ensureProjectLicenseState(env, row.project_id);
    if (!isProjectLicenseActive(license)) {
      return null;
    }

    return {
      projectId: row.project_id,
      accessMode: row.access_mode || "play_only",
      snapshotVersion: row.snapshot_version === null || row.snapshot_version === undefined
        ? null
        : Number(row.snapshot_version || 0)
    };
  } catch (error) {
    console.warn("Failed to resolve public share token:", error);
    return null;
  }
}
