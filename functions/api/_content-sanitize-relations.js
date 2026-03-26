import { trimText } from "./_content-sanitize.js";

export function sanitizeRecord(value) {
  const out = {};
  if (!value || typeof value !== "object") return out;
  for (const [key, val] of Object.entries(value)) {
    out[String(key)] = trimText(val, 200, "");
  }
  return out;
}

export function sanitizeRelationList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => ({
      targetBaseCharId: trimText(item?.targetBaseCharId, 80, ""),
      text: trimText(item?.text, 200, "")
    }))
    .filter(item => item.targetBaseCharId && item.text);
}

export function sanitizeConversationList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => ({
      targetBaseCharId: trimText(item?.targetBaseCharId, 80, ""),
      selfText: trimText(item?.selfText, 200, ""),
      partnerText: trimText(item?.partnerText, 200, "")
    }))
    .filter(item => item.targetBaseCharId && (item.selfText || item.partnerText));
}
