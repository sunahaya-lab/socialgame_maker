import { HOME_ADVANCED_NODE_IDS } from "./_system-config-defaults.js";

export function sanitizeLayoutPresets(value) {
  const source = value && typeof value === "object" ? value : {};
  const home = source.home && typeof source.home === "object" ? source.home : {};
  return {
    home: {
      mode: ["preset", "advanced"].includes(home.mode) ? home.mode : "preset",
      layout: ["single-focus", "dual-stage"].includes(home.layout) ? home.layout : "single-focus",
      speech: ["right-bubble", "left-bubble", "hidden"].includes(home.speech) ? home.speech : "right-bubble",
      advancedNodes: sanitizeAdvancedNodes(home.advancedNodes),
      customParts: sanitizeCustomParts(home.customParts)
    }
  };
}

export function sanitizeAdvancedNodes(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 40)
    .map(item => sanitizeAdvancedNode(item))
    .filter(Boolean);
}

export function sanitizeLayoutAssets(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    home: Array.isArray(source.home)
      ? source.home.slice(0, 200).map(sanitizeLayoutAsset).filter(Boolean)
      : []
  };
}

export function sanitizeLayoutAsset(value) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || "").trim().slice(0, 80);
  const src = String(value.src || "").trim().slice(0, 2_000_000);
  if (!id || !src) return null;
  const now = new Date().toISOString();
  return {
    id,
    name: String(value.name || id).trim().slice(0, 80),
    src,
    ownerMemberId: String(value.ownerMemberId || "local-editor").trim().slice(0, 80) || "local-editor",
    createdAt: String(value.createdAt || now),
    updatedAt: String(value.updatedAt || value.createdAt || now)
  };
}

export function sanitizeAssetFolders(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    home: Array.isArray(source.home)
      ? source.home.slice(0, 200).map((item, index) => sanitizeAssetFolder(item, index)).filter(Boolean)
      : []
  };
}

export function sanitizeAssetFolder(value, index = 0) {
  if (!value || typeof value !== "object") return null;
  const kind = value.kind === "shared" || value.kind === "team_owned"
    ? "team_owned"
    : "personal";
  const id = String(value.id || "").trim().slice(0, 80);
  const name = String(value.name || "").trim().slice(0, 80);
  if (!id || !name) return null;
  const now = new Date().toISOString();
  return {
    id,
    name,
    ownerMemberId: kind === "personal"
      ? (String(value.ownerMemberId || "local-editor").trim().slice(0, 80) || "local-editor")
      : null,
    kind,
    assetIds: kind === "team_owned" && Array.isArray(value.sourceRefs) && value.sourceRefs.length > 0
      ? []
      : Array.from(new Set((Array.isArray(value.assetIds) ? value.assetIds : []).map(item => String(item || "").trim().slice(0, 80)).filter(Boolean))),
    sourceRefs: kind === "team_owned" ? sanitizeFolderSourceRefs(value.sourceRefs) : [],
    sortOrder: Math.max(0, Number(value.sortOrder ?? index) || 0),
    createdAt: String(value.createdAt || now),
    updatedAt: String(value.updatedAt || value.createdAt || now)
  };
}

export function sanitizeFolderSourceRefs(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 100)
    .map(item => ({
      memberId: String(item?.memberId || "").trim().slice(0, 80),
      folderId: String(item?.folderId || "").trim().slice(0, 80)
    }))
    .filter(item => item.memberId && item.folderId);
}

export function sanitizeCustomParts(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 100)
    .map((item, index) => sanitizeCustomPart(item, index))
    .filter(Boolean);
}

export function sanitizeCustomPart(value, index = 0) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || `custom-home-part-${index + 1}`).trim().slice(0, 80);
  const assetId = String(value.assetId || "").trim().slice(0, 2_000_000);
  return {
    id,
    name: String(value.name || id).trim().slice(0, 80) || id,
    role: String(value.role || "decorative").trim().slice(0, 80) || "decorative",
    x: Number(value.x) || 0,
    y: Number(value.y) || 0,
    w: Math.max(0, Number(value.w) || 120),
    h: Math.max(0, Number(value.h) || 120),
    z: Number(value.z) || 50,
    visible: value.visible !== false,
    assetId
  };
}

export function sanitizeAdvancedNode(value) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || "").trim();
  if (!HOME_ADVANCED_NODE_IDS.has(id)) return null;
  return {
    id,
    x: Number(value.x) || 0,
    y: Number(value.y) || 0,
    w: Math.max(0, Number(value.w) || 0),
    h: Math.max(0, Number(value.h) || 0),
    z: Number(value.z) || 0,
    visible: value.visible !== false,
    assetId: String(value.assetId || "").slice(0, 2_000_000),
    showText: value.showText !== false
  };
}

export function sanitizeFolderList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 100)
    .map((item, index) => ({
      id: String(item?.id || crypto.randomUUID()).trim().slice(0, 80),
      name: String(item?.name || "").trim().slice(0, 40),
      sortOrder: Math.max(0, Number(item?.sortOrder ?? index) || 0)
    }))
    .filter(item => item.id && item.name)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}
