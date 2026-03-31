import {
  buildContentScope,
  createCorsHeaders,
  ensureReadableAccess,
  ensureSharedContentWriteAccess,
  json,
  readJson,
  resolveShareAccess
} from "./_share-auth.js";
import {
  ensureSystemBillingAccess
} from "./_system-config-billing.js";
import {
  loadSystemConfig,
  saveSystemConfig
} from "./_system-config-storage.js";
import {
  sanitizeSystemConfig
} from "./_system-config-core-sanitize.js";

// SECTION 01: request entry + access orchestration
export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const access = await resolveShareAccess(request, env);
  const blockedRead = ensureReadableAccess(access, corsHeaders);
  if (blockedRead) return blockedRead;
  const { key, scopeKey } = buildContentScope(access, "system");

  if (request.method === "GET") {
    const result = await loadSystemConfig(env, { key, scopeKey }, sanitizeSystemConfig);
    return json(result, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await readJson(request);
    const blockedWrite = await ensureSharedContentWriteAccess(request, env, access, corsHeaders, input);
    if (blockedWrite) return blockedWrite;
    const blockedBilling = await ensureSystemBillingAccess({ request, env, access, input, corsHeaders });
    if (blockedBilling) return blockedBilling;
    const system = sanitizeSystemConfig(input);
    const result = await saveSystemConfig(env, { key, scopeKey, system });
    return json(result, 201, corsHeaders);
  }

  return json({ error: "???????????????" }, 405, corsHeaders);
}
