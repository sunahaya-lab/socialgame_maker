import {
  ensureUserLicenseState,
  getBillingCatalog
} from "./_billing.js";
import {
  createCorsHeaders,
  ensureOwnerOperationAccess,
  ensureProjectLicenseState,
  errorJson,
  json,
  readJson
} from "./_share-auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders("GET,POST,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const body = request.method === "POST" ? await readJson(request) : {};
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

  if (request.method === "GET" || request.method === "POST") {
    try {
      const license = await ensureProjectLicenseState(env, projectId);
      const actingUserLicense = ownerAccess.userId
        ? await ensureUserLicenseState(env, ownerAccess.userId)
        : null;

      return json({
        projectId,
        ownerUserId: license.ownerUserId || ownerAccess.userId,
        license,
        billing: {
          catalog: getBillingCatalog(),
          ownerBaseTier: license.baseTier || "free",
          ownerOwnedPacks: license.ownedPacks || [],
          entitlements: license.entitlements || {},
          actingUserLicense
        }
      }, 200, corsHeaders);
    } catch (error) {
      console.error("Failed to load project license:", error);
      return errorJson("プロジェクトの課金状態の取得に失敗しました。", 500, corsHeaders, {
        code: "project_license_read_failed"
      });
    }
  }

  return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
}
