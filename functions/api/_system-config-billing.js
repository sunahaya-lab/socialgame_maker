import {
  ensureUserLicenseState,
  getRequiredPackForFeature,
  hasFeatureAccess
} from "./_billing.js";
import {
  errorJson,
  getRequesterUserId
} from "./_share-auth.js";
import {
  sanitizeEventConfig
} from "./_system-config-event-sanitize.js";

// SECTION 01: billing gate entry
export async function ensureSystemBillingAccess({ request, env, access, input, corsHeaders }) {
  if (!access?.projectId) {
    return null;
  }

  const requiredFeature = getRequiredSystemFeature(input);
  if (!requiredFeature) {
    return null;
  }

  const userId = getRequesterUserId(request, input);
  if (!userId) {
    return errorJson("\u8ab2\u91d1\u6a5f\u80fd\u306e\u4fdd\u5b58\u306b\u306f user \u304c\u5fc5\u8981\u3067\u3059\u3002", 403, corsHeaders, {
      code: "billing_user_required",
      feature: requiredFeature,
      requiredPack: getRequiredPackForFeature(requiredFeature)
    });
  }

  const license = await ensureUserLicenseState(env, userId);
  if (hasFeatureAccess(license, requiredFeature)) {
    return null;
  }

  return errorJson(getSystemBillingErrorMessage(requiredFeature), 403, corsHeaders, {
    code: "billing_feature_required",
    feature: requiredFeature,
    requiredPack: getRequiredPackForFeature(requiredFeature)
  });
}

// SECTION 02: required-feature detection
export function getRequiredSystemFeature(input) {
  if (usesBattlePackSystemConfig(input)) return "battle_controls";
  if (usesEventPackSystemConfig(input)) return "event_controls";
  return "";
}

export function usesBattlePackSystemConfig(input) {
  return String(input?.battleMode || "").trim() === "semiAuto";
}

export function usesEventPackSystemConfig(input) {
  const config = sanitizeEventConfig(input?.eventConfig);
  const hasVisibleEventBody = Boolean(
    config.title ||
    config.subtitle ||
    config.storyId
  );
  return Boolean(
    config.enabled ||
    config.exchangeEnabled ||
    config.exchangeLabel ||
    config.eventCardIds.some(item => String(item?.cardId || "").trim()) ||
    config.loginBonusEnabled ||
    config.loginBonusLabel ||
    (config.enabled && hasVisibleEventBody)
  );
}

// SECTION 03: billing error text
export function getSystemBillingErrorMessage(feature) {
  if (feature === "event_controls") {
    return "\u3053\u306e\u30a4\u30d9\u30f3\u30c8\u8a2d\u5b9a\u306e\u4fdd\u5b58\u306b\u306f Event Pack \u304c\u5fc5\u8981\u3067\u3059\u3002";
  }
  return "\u3053\u306e\u30d0\u30c8\u30eb\u8a2d\u5b9a\u306e\u4fdd\u5b58\u306b\u306f Battle Pack \u304c\u5fc5\u8981\u3067\u3059\u3002";
}
