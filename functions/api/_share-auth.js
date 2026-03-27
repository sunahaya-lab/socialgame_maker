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
      error: "\u3053\u306e\u64cd\u4f5c\u306f\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u306e\u6240\u6709\u8005\u3060\u3051\u304c\u5b9f\u884c\u3067\u304d\u307e\u3059\u3002"
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

    if (!row?.owner_user_id) {
      const legacyAccess = await ensureLegacyProjectRegistryAccess(env, projectId, userId);
      if (legacyAccess.ok) return legacyAccess;
      return {
        ok: false,
        status: 403,
        code: "owner_required",
        error: "\u3053\u306e\u64cd\u4f5c\u306f\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u306e\u6240\u6709\u8005\u3060\u3051\u304c\u5b9f\u884c\u3067\u304d\u307e\u3059\u3002"
      };
    }

    if (String(row.owner_user_id).trim() !== userId) {
      return {
        ok: false,
        status: 403,
        code: "owner_required",
        error: "\u3053\u306e\u64cd\u4f5c\u306f\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u306e\u6240\u6709\u8005\u3060\u3051\u304c\u5b9f\u884c\u3067\u304d\u307e\u3059\u3002"
      };
    }

    return {
      ok: true,
      userId
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      const legacyAccess = await ensureLegacyProjectRegistryAccess(env, projectId, userId);
      if (legacyAccess.ok) return legacyAccess;
    }
    console.warn("Failed to verify project owner access:", error);
    return {
      ok: false,
      status: 500,
      code: "owner_check_failed",
      error: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u6240\u6709\u8005\u306e\u78ba\u8a8d\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002"
    };
  }
}

export async function ensureProjectMemberAccess(request, env, projectId, body = null) {
  const ownerAccess = await ensureProjectOwnerAccess(request, env, projectId, body);
  if (ownerAccess.ok) return ownerAccess;

  const userId = getRequesterUserId(request, body);
  if (!projectId || !userId) {
    return {
      ok: false,
      status: 403,
      code: "member_required",
      error: "\u3053\u306e\u64cd\u4f5c\u306f\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u30e1\u30f3\u30d0\u30fc\u3060\u3051\u304c\u5b9f\u884c\u3067\u304d\u307e\u3059\u3002"
    };
  }

  if (!env?.SOCIA_DB) {
    return {
      ok: true,
      userId,
      role: "viewer"
    };
  }

  try {
    const row = await env.SOCIA_DB.prepare(`
      SELECT role
      FROM project_members
      WHERE project_id = ? AND user_id = ?
      LIMIT 1
    `).bind(projectId, userId).first();
    if (!row?.role) {
      return {
        ok: false,
        status: 403,
        code: "member_required",
        error: "\u3053\u306e\u64cd\u4f5c\u306f\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u30e1\u30f3\u30d0\u30fc\u3060\u3051\u304c\u5b9f\u884c\u3067\u304d\u307e\u3059\u3002"
      };
    }
    return {
      ok: true,
      userId,
      role: String(row.role || "viewer")
    };
  } catch (error) {
    if (isMissingTableError(error)) {
      return {
        ok: true,
        userId,
        role: "viewer",
        fallback: "project_members_missing"
      };
    }
    console.warn("Failed to verify project member access:", error);
    return {
      ok: false,
      status: 500,
      code: "member_check_failed",
      error: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u30e1\u30f3\u30d0\u30fc\u78ba\u8a8d\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002"
    };
  }
}

export async function ensureProjectShareManageAccess(request, env, projectId, body = null) {
  return ensureProjectOwnerAccess(request, env, projectId, body);
}

export function ensureInternalAdminAccess(request, env) {
  const configuredSecret = String(env?.SOCIA_ADMIN_SECRET || "").trim();
  if (!configuredSecret) {
    return {
      ok: false,
      status: 503,
      code: "admin_secret_required",
      error: "\u5171\u6709\u7ba1\u7406API\u306f\u958b\u767a\u7528\u30b7\u30fc\u30af\u30ec\u30c3\u30c8\u8a2d\u5b9a\u304c\u5fc5\u8981\u3067\u3059\u3002"
    };
  }

  const providedSecret = String(request.headers.get("X-Socia-Admin-Secret") || "").trim();
  if (!providedSecret || providedSecret !== configuredSecret) {
    return {
      ok: false,
      status: 403,
      code: "admin_secret_invalid",
      error: "\u5171\u6709\u7ba1\u7406API\u306f\u958b\u767a\u7528\u30b7\u30fc\u30af\u30ec\u30c3\u30c8\u304c\u5fc5\u8981\u3067\u3059\u3002"
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
    return errorJson("\u3053\u306e\u5171\u6709URL\u306f\u7121\u52b9\u306b\u306a\u3063\u3066\u3044\u307e\u3059\u3002", 410, corsHeaders, {
      code: "share_invalid"
    });
  }
  return null;
}

export function ensureWritableAccess(access, corsHeaders) {
  if (access?.invalidToken) {
    return errorJson("\u3053\u306e\u5171\u6709URL\u306f\u7121\u52b9\u306b\u306a\u3063\u3066\u3044\u307e\u3059\u3002", 410, corsHeaders, {
      code: "share_invalid"
    });
  }
  if (access?.accessMode === "play_only") {
    return errorJson("\u516c\u958b\u5171\u6709\u3067\u306f\u7de8\u96c6\u3067\u304d\u307e\u305b\u3093\u3002", 403, corsHeaders, {
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
      return errorJson(ownerAccess?.error || "\u66f8\u304d\u8fbc\u307f\u6a29\u9650\u306e\u78ba\u8a8d\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002", ownerAccess?.status || 403, corsHeaders, {
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

async function ensureLegacyProjectRegistryAccess(env, projectId, userId) {
  if (!env?.SOCIA_DB || !projectId || !userId) {
    return { ok: false };
  }

  try {
    const row = await env.SOCIA_DB.prepare(`
      SELECT project_id
      FROM project_registries
      WHERE project_id = ?
      LIMIT 1
    `).bind(projectId).first();
    if (!row?.project_id) {
      return { ok: false };
    }
    return {
      ok: true,
      userId,
      role: "owner",
      fallback: "legacy_project_registry"
    };
  } catch (error) {
    if (!isMissingTableError(error)) {
      console.warn("Failed to verify legacy project registry access:", error);
    }
    return { ok: false };
  }
}

function isMissingTableError(error) {
  const text = String(error?.message || error || "");
  return /no such table/i.test(text);
}
