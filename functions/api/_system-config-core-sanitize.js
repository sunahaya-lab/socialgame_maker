import {
  sanitizeEquipmentMode,
  sanitizeFontPreset,
  sanitizeGachaCatalogMode
} from "./_system-config-defaults.js";
import {
  sanitizeEventConfig
} from "./_system-config-event-sanitize.js";
import {
  sanitizeAssetFolders,
  sanitizeFolderList,
  sanitizeLayoutAssets,
  sanitizeLayoutPresets
} from "./_system-config-layout-sanitize.js";

export function sanitizeSystemConfig(input) {
  return {
    rarityMode: input?.rarityMode === "stars5" ? "stars5" : "classic4",
    gachaCatalogMode: sanitizeGachaCatalogMode(input?.gachaCatalogMode),
    equipmentMode: sanitizeEquipmentMode(input?.equipmentMode),
    orientation: ["portrait", "landscape"].includes(input?.orientation)
      ? input.orientation
      : "portrait",
    fontPreset: sanitizeFontPreset(input?.fontPreset),
    battleMode: ["fullAuto", "semiAuto"].includes(input?.battleMode)
      ? input.battleMode
      : "fullAuto",
    battleVisualMode: ["cardIllustration", "sdCharacter"].includes(input?.battleVisualMode)
      ? input.battleVisualMode
      : "cardIllustration",
    titleScreen: sanitizeTitleScreenConfig(input?.titleScreen),
    eventConfig: sanitizeEventConfig(input?.eventConfig),
    layoutPresets: sanitizeLayoutPresets(input?.layoutPresets),
    layoutAssets: sanitizeLayoutAssets(input?.layoutAssets),
    assetFolders: sanitizeAssetFolders(input?.assetFolders),
    musicAssets: sanitizeMusicAssets(input?.musicAssets),
    homeBgmAssetId: String(input?.homeBgmAssetId || "").trim().slice(0, 120),
    battleBgmAssetId: String(input?.battleBgmAssetId || "").trim().slice(0, 120),
    titleMasters: sanitizeTitleMasters(input?.titleMasters),
    cardFolders: sanitizeFolderList(input?.cardFolders),
    storyFolders: sanitizeFolderList(input?.storyFolders)
  };
}

function sanitizeTitleMasters(list) {
  const map = new Map();
  (Array.isArray(list) ? list : []).forEach((item, index) => {
    const id = String(item?.id || `title-master-${index + 1}`).trim().slice(0, 120);
    const label = String(item?.label || "").trim().slice(0, 80);
    if (!id || !label) return;
    const unlockConditionType = ["always", "project_owner", "project_member", "formation_pair", "formation_squad"].includes(String(item?.unlockConditionType || "").trim())
      ? String(item.unlockConditionType).trim()
      : "always";
    map.set(id, {
      id,
      label,
      category: String(item?.category || "custom").trim().slice(0, 40) || "custom",
      description: String(item?.description || "").trim().slice(0, 160),
      style: {
        backgroundType: String(item?.style?.backgroundType || "").trim() === "split" ? "split" : "solid",
        colorA: /^#[0-9a-fA-F]{6}$/.test(String(item?.style?.colorA || "").trim()) ? String(item.style.colorA).trim() : "#666666",
        colorB: /^#[0-9a-fA-F]{6}$/.test(String(item?.style?.colorB || "").trim()) ? String(item.style.colorB).trim() : "#666666",
        textColor: /^#[0-9a-fA-F]{6}$/.test(String(item?.style?.textColor || "").trim()) ? String(item.style.textColor).trim() : "#ffffff"
      },
      unlockConditionType,
      unlockConfig: item?.unlockConfig && typeof item.unlockConfig === "object" ? item.unlockConfig : {}
    });
  });
  return Array.from(map.values());
}

function sanitizeTitleScreenConfig(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    version: Math.max(1, Number(source.version || 1) || 1),
    enabled: source.enabled === true,
    backgroundImage: String(source.backgroundImage || "").trim().slice(0, 2_000_000),
    logoImage: String(source.logoImage || "").trim().slice(0, 2_000_000),
    pressStartText: String(source.pressStartText || "Press Start").trim().slice(0, 60) || "Press Start",
    tapToStartEnabled: source.tapToStartEnabled !== false
  };
}

function sanitizeMusicAssets(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 10)
    .map(item => sanitizeMusicAsset(item))
    .filter(Boolean);
}

function sanitizeMusicAsset(value) {
  if (!value || typeof value !== "object") return null;
  const id = String(value.id || "").trim().slice(0, 120);
  const src = String(value.src || "").trim().slice(0, 2_000_000);
  if (!id || !src) return null;
  return {
    id,
    src,
    name: String(value.name || id).trim().slice(0, 120) || id,
    mimeType: String(value.mimeType || "").trim().slice(0, 120),
    size: Math.max(0, Number(value.size || 0) || 0)
  };
}
