import {
  buildContentScope,
  createCorsHeaders,
  ensureReadableAccess,
  ensureSharedContentWriteAccess,
  json,
  readJson,
  resolveShareAccess
} from "./_share-auth.js";
import { sanitizeImageSource, trimText } from "./_content-sanitize.js";

const EQUIPMENT_CARD_STORAGE_MODE = "kv";

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = createCorsHeaders();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const access = await resolveShareAccess(request, env);
  const blockedRead = ensureReadableAccess(access, corsHeaders);
  if (blockedRead) return blockedRead;
  const { key, scopeKey } = buildContentScope(access, "equipment-cards");

  if (request.method === "GET") {
    const result = await listEquipmentCards(env, { key, scopeKey });
    return json(result, 200, corsHeaders);
  }

  if (request.method === "POST") {
    const input = await readJson(request);
    const blockedWrite = await ensureSharedContentWriteAccess(request, env, access, corsHeaders, input);
    if (blockedWrite) return blockedWrite;
    const equipmentCard = sanitizeEquipmentCard(input);
    const result = await saveEquipmentCard(env, { key, scopeKey, equipmentCard });
    return json(result, 201, corsHeaders);
  }

  return json({ error: "このメソッドは利用できません。" }, 405, corsHeaders);
}

function sanitizeEquipmentCard(input) {
  const text = trimText;
  const allowedRarities = ["N", "R", "SR", "SSR", "UR", "STAR1", "STAR2", "STAR3", "STAR4", "STAR5", "1", "2", "3", "4", "5"];
  const allowedSlotTypes = ["weapon", "armor", "accessory", "other"];
  const rawRarity = String(input?.rarity || "").toUpperCase();
  const rarity = allowedRarities.includes(rawRarity) ? rawRarity : "SR";
  const slotType = allowedSlotTypes.includes(String(input?.slotType || "")) ? String(input.slotType) : "other";

  return {
    id: text(input?.id, 80, crypto.randomUUID()),
    name: text(input?.name, 40, "装備カード"),
    description: text(input?.description, 120, ""),
    rarity,
    slotType,
    image: sanitizeImageSource(input?.image),
    catch: text(input?.catch, 120, ""),
    passiveText: text(input?.passiveText, 200, ""),
    activeSkillName: text(input?.activeSkillName, 60, ""),
    activeSkillText: text(input?.activeSkillText, 200, ""),
    sortOrder: Math.max(0, Number(input?.sortOrder) || 0)
  };
}

async function listEquipmentCards(env, scope) {
  const equipmentCards = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  return {
    equipmentCards: Array.isArray(equipmentCards) ? equipmentCards : [],
    storage: EQUIPMENT_CARD_STORAGE_MODE
  };
}

async function saveEquipmentCard(env, scope) {
  const items = (await env.SOCIA_DATA.get(scope.key, "json")) || [];
  const list = Array.isArray(items) ? items : [];
  const index = list.findIndex(item => item.id === scope.equipmentCard.id);

  if (index >= 0) list[index] = scope.equipmentCard;
  else list.unshift(scope.equipmentCard);

  await env.SOCIA_DATA.put(scope.key, JSON.stringify(list));
  return { equipmentCard: scope.equipmentCard, storage: EQUIPMENT_CARD_STORAGE_MODE };
}
