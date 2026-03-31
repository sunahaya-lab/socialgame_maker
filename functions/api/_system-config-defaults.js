export const HOME_ADVANCED_NODE_IDS = new Set([
  "level-label",
  "level-value",
  "player-name",
  "home-config",
  "home-editor",
  "home-share",
  "currency-stamina",
  "currency-gems",
  "currency-gold",
  "event-banner",
  "speech",
  "battle"
]);

export function defaultEventConfig() {
  return {
    enabled: false,
    title: "",
    subtitle: "",
    storyId: "",
    eventCurrencies: [
      { key: "event_medal", label: "イベントメダル", initialAmount: 0 },
      { key: "event_ticket", label: "イベントチケット", initialAmount: 0 }
    ],
    exchangeEnabled: false,
    exchangeLabel: "",
    exchangeItems: [
      { id: "event-exchange-1", label: "育成ポイント補給", costCurrencyKey: "gold", costAmount: 5000, rewardKind: "growth", rewardValue: "resonance", rewardAmount: 100, stock: 1 },
      { id: "event-exchange-2", label: "スタミナ補給", costCurrencyKey: "gems", costAmount: 50, rewardKind: "currency", rewardValue: "stamina", rewardAmount: 60, stock: 3 },
      { id: "event-exchange-3", label: "記念バッジ", costCurrencyKey: "gems", costAmount: 30, rewardKind: "event_item", rewardValue: "event-badge", rewardAmount: 1, stock: 5 }
    ],
    displayItems: [
      { id: "event-badge", label: "記念バッジ", description: "イベント画面に並べるだけの記念アイテムです。" }
    ],
    eventCardIds: [
      { cardId: "", label: "イベント限定", acquireText: "交換所で入手" }
    ],
    loginBonusEnabled: false,
    loginBonusLabel: "",
    loginBonusRewards: [
      { day: 1, currencyKey: "gems", amount: 50, label: "ジェム x50" },
      { day: 2, currencyKey: "gold", amount: 3000, label: "ゴールド x3000" },
      { day: 3, currencyKey: "gems", amount: 50, label: "ジェム x50" },
      { day: 4, currencyKey: "stamina", amount: 30, label: "スタミナ x30" },
      { day: 5, currencyKey: "gold", amount: 5000, label: "ゴールド x5000" },
      { day: 6, currencyKey: "gems", amount: 100, label: "ジェム x100" },
      { day: 7, currencyKey: "gems", amount: 150, label: "ジェム x150" }
    ]
  };
}

export function defaultSystemConfig() {
  return {
    rarityMode: "classic4",
    gachaCatalogMode: "characters_only",
    equipmentMode: "disabled",
    orientation: "portrait",
    fontPreset: "zen-kaku-gothic-new",
    battleMode: "fullAuto",
    battleVisualMode: "cardIllustration",
    titleScreen: {
      version: 1,
      enabled: true,
      backgroundImage: "",
      logoImage: "",
      pressStartText: "Press Start",
      tapToStartEnabled: true
    },
    eventConfig: defaultEventConfig(),
    layoutPresets: {
      home: {
        mode: "preset",
        layout: "single-focus",
        speech: "right-bubble",
        advancedNodes: [],
        customParts: []
      }
    },
    layoutAssets: {
      home: []
    },
    assetFolders: {
      home: []
    },
    musicAssets: [],
    homeBgmAssetId: "",
    battleBgmAssetId: "",
    titleMasters: [],
    cardFolders: [],
    storyFolders: []
  };
}

export function sanitizeEquipmentMode(value) {
  const normalized = String(value || "").trim();
  if (normalized === "database_only") return "database_only";
  if (normalized === "enabled") return "enabled";
  return "disabled";
}

export function sanitizeFontPreset(value) {
  const normalized = String(value || "").trim();
  return [
    "zen-kaku-gothic-new",
    "noto-sans-jp",
    "m-plus-rounded-1c",
    "yusei-magic",
    "dotgothic16"
  ].includes(normalized)
    ? normalized
    : "zen-kaku-gothic-new";
}

export function sanitizeGachaCatalogMode(value) {
  return String(value || "").trim() === "full_catalog"
    ? "full_catalog"
    : "characters_only";
}
