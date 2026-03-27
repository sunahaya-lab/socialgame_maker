export function trimText(value, maxLength, fallback = "") {
  return String(value || fallback).trim().slice(0, maxLength);
}

export function sanitizeImageSource(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("data:image/")) return text;
  if (/^https:\/\//i.test(text)) return text;
  if (/^\/api\/assets-content\?id=[A-Za-z0-9_-]+$/i.test(text)) return text;
  return "";
}

export function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}
