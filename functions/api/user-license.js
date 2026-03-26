import {
  ensureUserLicenseState,
  getBillingCatalog,
  upsertUserLicenseState
} from "./_billing.js";
import {
  createCorsHeaders,
  ensureInternalAdminAccess,
  errorJson,
  getRequesterUserId,
  json,
  readJson
} from "./_share-auth.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders("GET,POST,OPTIONS");

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const access = ensureInternalAdminAccess(request, env);
  if (!access.ok) {
    return errorJson(access.error, access.status, corsHeaders, { code: access.code });
  }

  if (!env?.SOCIA_DB) {
    return errorJson("D1 バインディング SOCIA_DB が必要です。", 500, corsHeaders, {
      code: "d1_required"
    });
  }

  const body = request.method === "POST" ? await readJson(request) : {};
  const userId = getRequesterUserId(request, body);
  if (!userId) {
    return errorJson("user が必要です。", 400, corsHeaders, { code: "user_required" });
  }

  try {
    if (request.method === "GET") {
      const license = await ensureUserLicenseState(env, userId);
      return json({ userId, license, catalog: getBillingCatalog() }, 200, corsHeaders);
    }

    if (request.method === "POST") {
      const license = await upsertUserLicenseState(env, userId, body, {
        grantedByUserId: body?.grantedByUserId
      });
      return json({ userId, license, catalog: getBillingCatalog() }, 200, corsHeaders);
    }
  } catch (error) {
    console.error("Failed to handle user license request:", error);
    return errorJson("ユーザー課金状態の更新に失敗しました。", 500, corsHeaders, {
      code: "user_license_update_failed"
    });
  }

  return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
}
