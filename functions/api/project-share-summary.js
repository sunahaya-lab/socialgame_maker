import {
  ensureUserLicenseState,
  getEffectiveProjectLicenseState
} from "./_billing.js";
import {
  createCorsHeaders,
  ensureProjectMemberAccess,
  getRequesterUserId,
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

  if (!["GET", "POST"].includes(request.method)) {
    return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
  }

  const body = request.method === "POST" ? await readJson(request) : {};
  const url = new URL(request.url);
  const projectId = String(url.searchParams.get("project") || body.projectId || "").trim();
  if (!projectId) {
    return errorJson("project が必要です。", 400, corsHeaders, { code: "project_required" });
  }

  const access = await ensureProjectMemberAccess(request, env, projectId, body);
  if (!access.ok) {
    return errorJson(access.error, access.status, corsHeaders, { code: access.code });
  }

  const userId = getRequesterUserId(request, body) || access.userId || null;

  try {
    const [projectLicense, actingUserLicense] = await Promise.all([
      getEffectiveProjectLicenseState(env, projectId),
      userId ? ensureUserLicenseState(env, userId) : null
    ]);

    return json({
      projectId,
      licensePlan: projectLicense?.baseTier === "publish" ? "publish" : "free",
      canRotateCollabShare: true,
      canCreatePublicShare: Boolean(projectLicense?.entitlements?.canCreatePublicShare),
      publicShareEnabled: Boolean(projectLicense?.entitlements?.canCreatePublicShare),
      featureAccess: {
        battle: Boolean(actingUserLicense?.entitlements?.canUseBattleControls),
        storyFx: Boolean(actingUserLicense?.entitlements?.canUseStoryFx),
        event: Boolean(actingUserLicense?.entitlements?.canUseEventControls)
      }
    }, 200, corsHeaders);
  } catch (error) {
    console.error("Failed to load project share summary:", error);
    if (isMissingTableError(error)) {
      return json({
        projectId,
        licensePlan: "free",
        canRotateCollabShare: true,
        canCreatePublicShare: false,
        publicShareEnabled: false,
        featureAccess: {
          battle: false,
          storyFx: false,
          event: false
        },
        fallback: true
      }, 200, corsHeaders);
    }
    return errorJson("共有設定の取得に失敗しました。", 500, corsHeaders, {
      code: "project_share_summary_failed"
    });
  }
}

function isMissingTableError(error) {
  const text = String(error?.message || error || "");
  return /no such table/i.test(text);
}
