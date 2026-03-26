import { clampNumber, sanitizeImageSource, trimText } from "./_content-sanitize.js";

export function sanitizeCropImages(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    icon: sanitizeImageSource(source.icon),
    formationPortrait: sanitizeImageSource(source.formationPortrait),
    formationWide: sanitizeImageSource(source.formationWide),
    cutin: sanitizeImageSource(source.cutin)
  };
}

export function sanitizeCropPresets(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    icon: sanitizeCropPresetItem(source.icon),
    formationPortrait: sanitizeCropPresetItem(source.formationPortrait),
    formationWide: sanitizeCropPresetItem(source.formationWide),
    cutin: sanitizeCropPresetItem(source.cutin)
  };
}

export function sanitizeSdImages(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    idle: sanitizeImageSource(source.idle),
    attack: sanitizeImageSource(source.attack),
    damaged: sanitizeImageSource(source.damaged)
  };
}

export function sanitizeBattleKit(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    hp: clampNumber(source.hp, 0, 999999, 1000),
    atk: clampNumber(source.atk, 0, 999999, 100),
    normalSkill: sanitizeSkillConfig(source.normalSkill),
    activeSkill: sanitizeSkillConfig(source.activeSkill),
    passiveSkill: sanitizeSkillConfig(source.passiveSkill),
    linkSkill: sanitizeSkillConfig(source.linkSkill),
    specialSkill: sanitizeSkillConfig(source.specialSkill)
  };
}

function sanitizeSkillConfig(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    name: trimText(source.name, 60, ""),
    recast: clampNumber(source.recast, 0, 999, 0),
    parts: Array.isArray(source.parts)
      ? source.parts.slice(0, 12).map(sanitizeSkillPart).filter(part => part.type || part.magnitude || part.detail)
      : []
  };
}

function sanitizeSkillPart(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    type: trimText(source.type, 30, ""),
    magnitude: trimText(source.magnitude, 20, ""),
    detail: trimText(source.detail, 60, "")
  };
}

function sanitizeCropPresetItem(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    offsetX: clampNumber(source.offsetX, -1, 1, 0),
    offsetY: clampNumber(source.offsetY, -1, 1, 0),
    zoom: clampNumber(source.zoom, 0.7, 2.5, 1)
  };
}
