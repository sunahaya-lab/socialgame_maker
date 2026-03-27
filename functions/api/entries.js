import {
  ensureUserLicenseState,
  getRequiredPackForFeature,
  hasFeatureAccess
} from "./_billing.js";
import {
  buildContentScope,
  createCorsHeaders,
  ensureReadableAccess,
  ensureSharedContentWriteAccess,
  errorJson,
  getRequesterUserId,
  json,
  readJson,
  resolveShareAccess
} from "./_share-auth.js";
import { sanitizeImageSource, trimText } from "./_content-sanitize.js";
import {
  sanitizeCropImages,
  sanitizeCropPresets,
  sanitizeSdImages,
  sanitizeBattleKit
} from "./_content-sanitize-entry.js";
import {
  sanitizeConversationList,
  sanitizeRecord,
  sanitizeRelationList
} from "./_content-sanitize-relations.js";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const access = await resolveShareAccess(request, env);
  const blockedRead = ensureReadableAccess(access, corsHeaders);
  if (blockedRead) return blockedRead;
  const { key, scopeKey } = buildContentScope(access, "entries");

  if (request.method === "GET") {
    const result = await listEntries(env, { key, scopeKey });
    return json(result, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await readJson(request);
    const blockedWrite = await ensureSharedContentWriteAccess(request, env, access, corsHeaders, input);
    if (blockedWrite) return blockedWrite;
    const blockedBilling = await ensureEntryBillingAccess(request, env, access, input, corsHeaders);
    if (blockedBilling) return blockedBilling;
    const entry = sanitizeEntry(input);
    const result = await saveEntry(env, { key, scopeKey, entry });
    return json(result, 201, corsHeaders);
  }

  return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
}

async function ensureEntryBillingAccess(request, env, access, input, corsHeaders) {
  if (!access?.projectId || !usesBattleFeature(input)) {
    return null;
  }

  const userId = getRequesterUserId(request, input);
  if (!userId) {
    return errorJson("Battle Pack 機能の保存には user が必要です。", 403, corsHeaders, {
      code: "billing_user_required",
      feature: "battle_controls",
      requiredPack: getRequiredPackForFeature("battle_controls")
    });
  }

  const license = await ensureUserLicenseState(env, userId);
  if (hasFeatureAccess(license, "battle_controls")) {
    return null;
  }

  return errorJson("このバトル設定の保存には Battle Pack が必要です。", 403, corsHeaders, {
    code: "billing_feature_required",
    feature: "battle_controls",
    requiredPack: getRequiredPackForFeature("battle_controls")
  });
}

function usesBattleFeature(input) {
  const battleKit = input?.battleKit;
  if (!battleKit || typeof battleKit !== "object") return false;

  if (Number(battleKit.hp) || Number(battleKit.atk)) return true;

  return ["normalSkill", "activeSkill", "passiveSkill", "linkSkill", "specialSkill"].some(key => {
    const skill = battleKit?.[key];
    if (!skill || typeof skill !== "object") return false;
    return Boolean(
      String(skill.name || "").trim() ||
      Number(skill.recast) ||
      (Array.isArray(skill.parts) && skill.parts.some(part =>
        String(part?.type || "").trim() ||
        String(part?.magnitude || "").trim() ||
        String(part?.detail || "").trim()
      ))
    );
  });
}

function sanitizeEntry(input) {
  const text = trimText;

  const allowedRarities = ["N", "R", "SR", "SSR", "UR", "STAR1", "STAR2", "STAR3", "STAR4", "STAR5", "1", "2", "3", "4", "5"];
  const rawRarity = String(input?.rarity || "").toUpperCase();
  const rarity = allowedRarities.includes(rawRarity) ? rawRarity : "SR";

  return {
    id: text(input?.id, 80, crypto.randomUUID()),
    name: text(input?.name, 40, "カード"),
    baseCharId: input?.baseCharId ? text(input.baseCharId, 80) : null,
    folderId: input?.folderId ? text(input.folderId, 80) : null,
    catch: text(input?.catch, 120, ""),
    rarity,
    attribute: text(input?.attribute, 24, ""),
    image: sanitizeImageSource(input?.image),
    cropImages: sanitizeCropImages(input?.cropImages || input?.autoCrops),
    cropPresets: sanitizeCropPresets(input?.cropPresets),
    sdImages: sanitizeSdImages(input?.sdImages),
    battleKit: sanitizeBattleKit(input?.battleKit),
    lines: Array.isArray(input?.lines) ? input.lines.slice(0, 20).map(line => text(line, 120, "")).filter(Boolean) : [],
    voiceLines: sanitizeRecord(input?.voiceLines),
    homeVoices: sanitizeRecord(input?.homeVoices),
    homeOpinions: sanitizeRelationList(input?.homeOpinions),
    homeConversations: sanitizeConversationList(input?.homeConversations),
    homeBirthdays: sanitizeRelationList(input?.homeBirthdays)
  };
}

async function listEntries(env, scope) {
  const d1Entries = await listEntriesFromD1(env, scope.scopeKey);
  if (d1Entries) {
    return { entries: d1Entries, storage: "d1" };
  }

  const entries = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  return { entries: Array.isArray(entries) ? entries : [], storage: "kv" };
}

async function saveEntry(env, scope) {
  const d1Entry = await saveEntryToD1(env, scope.scopeKey, scope.entry);
  if (d1Entry) {
    return { entry: d1Entry, storage: "d1" };
  }

  const items = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  const list = Array.isArray(items) ? items : [];
  const index = list.findIndex(item => item.id === scope.entry.id);

  if (index >= 0) list[index] = scope.entry;
  else list.unshift(scope.entry);

  await env.SOCIA_DATA.put(scope.key, JSON.stringify(list));
  return { entry: scope.entry, storage: "kv" };
}

async function listEntriesFromD1(env, scopeKey) {
  if (!env.SOCIA_DB) return null;
  try {
    const result = await env.SOCIA_DB.prepare(`
      SELECT payload_json
      FROM entry_registries
      WHERE scope_key = ?
      ORDER BY updated_at DESC, created_at DESC
    `).bind(scopeKey).all();

    return (result.results || [])
      .map(row => parseEntryPayload(row.payload_json))
      .filter(Boolean);
  } catch (error) {
    console.warn("Falling back to KV for entry listing:", error);
    return null;
  }
}

async function saveEntryToD1(env, scopeKey, entry) {
  if (!env.SOCIA_DB) return null;
  try {
    await env.SOCIA_DB.prepare(`
      INSERT INTO entry_registries (
        scope_key,
        entry_id,
        name,
        payload_json,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(scope_key, entry_id) DO UPDATE SET
        name = excluded.name,
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at
    `).bind(
      scopeKey,
      entry.id,
      entry.name,
      JSON.stringify(entry),
      new Date().toISOString()
    ).run();

    return entry;
  } catch (error) {
    console.warn("Falling back to KV for entry save:", error);
    return null;
  }
}

function parseEntryPayload(value) {
  try {
    const parsed = JSON.parse(String(value || "{}"));
    return parsed && typeof parsed === "object" ? sanitizeEntry(parsed) : null;
  } catch {
    return null;
  }
}
