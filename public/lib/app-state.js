(function () {
  function getDefaultSystemConfig(defaultRarityMode) {
    return {
      rarityMode: defaultRarityMode,
      gachaCatalogMode: "characters_only",
      orientation: "portrait",
      battleMode: "fullAuto",
      battleVisualMode: "cardIllustration",
      eventConfig: {
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
      },
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
      cardFolders: [],
      storyFolders: []
    };
  }

  function getDefaultCurrencies() {
    return [
      { key: "stamina", amount: 120, maxAmount: 120, updatedAt: null },
      { key: "gems", amount: 9999, maxAmount: null, updatedAt: null },
      { key: "gold", amount: 85000, maxAmount: null, updatedAt: null }
    ];
  }

  function getDefaultPlayerState(projectId = null, userId = null) {
    return {
      profile: {
        id: null,
        projectId: projectId || null,
        userId,
        displayName: "",
        lastActiveAt: null,
        createdAt: null,
        updatedAt: null
      },
      inventory: [],
      equipmentInventory: [],
      cardInstances: [],
      equipmentInstances: [],
      gachaHistory: [],
      storyProgress: [],
      homePreferences: null,
      loginBonuses: {},
      eventExchangePurchases: {},
      eventItems: {},
      currencies: getDefaultCurrencies(),
      cardGrowth: {},
      equipmentGrowth: {},
      growthResources: {
        resonance: 0,
        evolveMaterial: 0
      }
    };
  }

  function getDefaultHomeConfig() {
    return {
      mode: 1,
      card1: "",
      card2: "",
      backgroundImage: "",
      scale1: 100,
      x1: -10,
      y1: 0,
      scale2: 100,
      x2: 10,
      y2: 0,
      front: 2
    };
  }

  function getHomeLayoutPreset(config) {
    const mode = config?.layoutPresets?.home?.mode;
    const layout = config?.layoutPresets?.home?.layout;
    const speech = config?.layoutPresets?.home?.speech;
    return {
      mode: ["preset", "advanced"].includes(mode) ? mode : "preset",
      layout: ["single-focus", "dual-stage"].includes(layout) ? layout : "single-focus",
      speech: ["right-bubble", "left-bubble", "hidden"].includes(speech) ? speech : "right-bubble",
      advancedNodes: Array.isArray(config?.layoutPresets?.home?.advancedNodes)
        ? config.layoutPresets.home.advancedNodes
        : [],
      customParts: Array.isArray(config?.layoutPresets?.home?.customParts)
        ? config.layoutPresets.home.customParts
        : []
    };
  }

  function getHomeCharacterBaseOffset(layoutPreset, config, index) {
    if (layoutPreset?.layout === "dual-stage") {
      return index === 1
        ? { x: -24, bottom: 72 }
        : { x: 16, bottom: 72 };
    }

    if (index === 2) {
      return { x: 10, bottom: 60 };
    }

    return {
      x: Number(config?.mode || 1) === 2 ? -14 : 0,
      bottom: 60
    };
  }

  function getDefaultPartyFormation() {
    return ["", "", "", "", ""];
  }

  function normalizeLayoutAssetRecord(asset, fallbackOwnerId = "local-editor") {
    if (!asset || typeof asset !== "object") return null;
    const id = String(asset.id || "").trim();
    const src = String(asset.src || "").trim();
    if (!id || !src) return null;
    const now = new Date().toISOString();
    return {
      id,
      name: String(asset.name || id).trim().slice(0, 80) || id,
      src,
      ownerMemberId: String(asset.ownerMemberId || fallbackOwnerId || "local-editor").trim().slice(0, 80) || "local-editor",
      createdAt: String(asset.createdAt || now),
      updatedAt: String(asset.updatedAt || asset.createdAt || now)
    };
  }

  function normalizeFolderSourceRefs(sourceRefs) {
    if (!Array.isArray(sourceRefs)) return [];
    return sourceRefs
      .map(item => ({
        memberId: String(item?.memberId || "").trim().slice(0, 80),
        folderId: String(item?.folderId || "").trim().slice(0, 80)
      }))
      .filter(item => item.memberId && item.folderId);
  }

  function normalizeAssetFolderRecord(folder, index = 0, fallbackOwnerId = "local-editor") {
    if (!folder || typeof folder !== "object") return null;
    const kind = folder.kind === "shared" ? "shared" : "personal";
    const id = String(folder.id || "").trim().slice(0, 80);
    const name = String(folder.name || "").trim().slice(0, 80);
    if (!id || !name) return null;
    const now = new Date().toISOString();
    return {
      id,
      name,
      ownerMemberId: kind === "personal"
        ? (String(folder.ownerMemberId || fallbackOwnerId || "local-editor").trim().slice(0, 80) || "local-editor")
        : null,
      kind,
      assetIds: kind === "personal"
        ? Array.from(new Set((Array.isArray(folder.assetIds) ? folder.assetIds : []).map(value => String(value || "").trim()).filter(Boolean)))
        : [],
      sourceRefs: kind === "shared" ? normalizeFolderSourceRefs(folder.sourceRefs) : [],
      sortOrder: Math.max(0, Number(folder.sortOrder ?? index) || 0),
      createdAt: String(folder.createdAt || now),
      updatedAt: String(folder.updatedAt || folder.createdAt || now)
    };
  }

  function normalizeAssetFoldersConfig(config, fallbackOwnerId = "local-editor") {
    const source = config && typeof config === "object" ? config : {};
    return {
      home: (Array.isArray(source.home) ? source.home : [])
        .map((folder, index) => normalizeAssetFolderRecord(folder, index, fallbackOwnerId))
        .filter(Boolean)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"))
    };
  }

  function getDefaultHomeAssetFolderId(ownerMemberId = "local-editor") {
    return `home-personal-${String(ownerMemberId || "local-editor").trim() || "local-editor"}`;
  }

  function createDefaultHomeAssetFolder(ownerMemberId = "local-editor") {
    const safeOwnerId = String(ownerMemberId || "local-editor").trim().slice(0, 80) || "local-editor";
    const now = new Date().toISOString();
    return {
      id: getDefaultHomeAssetFolderId(safeOwnerId),
      name: "My Home Assets",
      ownerMemberId: safeOwnerId,
      kind: "personal",
      assetIds: [],
      sourceRefs: [],
      sortOrder: 0,
      createdAt: now,
      updatedAt: now
    };
  }

  function getHomeAssetFolders(config, ownerMemberId = "local-editor") {
    const normalized = normalizeAssetFoldersConfig(config?.assetFolders, ownerMemberId);
    if (normalized.home.length > 0) return normalized.home;
    return [createDefaultHomeAssetFolder(ownerMemberId)];
  }

  function resolveSharedAssetFolderAssets(folder, allFolders = [], allAssets = [], fallbackOwnerId = "local-editor") {
    if (!folder || folder.kind !== "shared") return [];
    const assetMap = new Map(
      (Array.isArray(allAssets) ? allAssets : [])
        .map(asset => normalizeLayoutAssetRecord(asset, fallbackOwnerId))
        .filter(Boolean)
        .map(asset => [asset.id, asset])
    );
    const seen = new Set();
    const result = [];
    (folder.sourceRefs || []).forEach(ref => {
      const sourceFolder = allFolders.find(candidate =>
        candidate.kind === "personal" &&
        candidate.ownerMemberId === ref.memberId &&
        candidate.id === ref.folderId
      );
      if (!sourceFolder) return;
      (sourceFolder.assetIds || []).forEach(assetId => {
        if (seen.has(assetId)) return;
        const asset = assetMap.get(assetId);
        if (!asset) return;
        seen.add(assetId);
        result.push(asset);
      });
    });
    return result;
  }

  function resolveHomeAssetFolderAssets(folderOrId, config, ownerMemberId = "local-editor") {
    const allFolders = getHomeAssetFolders(config, ownerMemberId);
    const allAssets = (Array.isArray(config?.layoutAssets?.home) ? config.layoutAssets.home : [])
      .map(asset => normalizeLayoutAssetRecord(asset, ownerMemberId))
      .filter(Boolean);
    const assetMap = new Map(allAssets.map(asset => [asset.id, asset]));
    const folder = typeof folderOrId === "string"
      ? allFolders.find(item => item.id === folderOrId)
      : folderOrId;
    if (!folder) return [];
    if (folder.kind === "shared") {
      return resolveSharedAssetFolderAssets(folder, allFolders, allAssets, ownerMemberId);
    }
    return (folder.assetIds || []).map(assetId => assetMap.get(assetId)).filter(Boolean);
  }

  function upsertHomeLayoutAssetInConfig(config, assetInput = {}, options = {}) {
    const ownerMemberId = String(options.ownerMemberId || assetInput.ownerMemberId || "local-editor").trim().slice(0, 80) || "local-editor";
    const defaultSystemConfig = typeof options.defaultSystemConfig === "function"
      ? options.defaultSystemConfig
      : () => getDefaultSystemConfig("classic4");
    const currentConfig = config || defaultSystemConfig();
    const homeAssets = (Array.isArray(currentConfig?.layoutAssets?.home) ? currentConfig.layoutAssets.home : [])
      .map(asset => normalizeLayoutAssetRecord(asset, ownerMemberId))
      .filter(Boolean);
    const nextAsset = normalizeLayoutAssetRecord({
      ...assetInput,
      ownerMemberId,
      updatedAt: new Date().toISOString()
    }, ownerMemberId);
    if (!nextAsset) return { config: currentConfig, asset: null, folderId: "" };

    const existingAsset = homeAssets.find(asset => asset.id === nextAsset.id);
    const mergedAsset = existingAsset
      ? { ...existingAsset, ...nextAsset, createdAt: existingAsset.createdAt || nextAsset.createdAt }
      : nextAsset;
    const nextAssets = existingAsset
      ? homeAssets.map(asset => asset.id === mergedAsset.id ? mergedAsset : asset)
      : [...homeAssets, mergedAsset];

    const fallbackFolder = createDefaultHomeAssetFolder(ownerMemberId);
    const homeFolders = getHomeAssetFolders(currentConfig, ownerMemberId)
      .map((folder, index) => normalizeAssetFolderRecord(folder, index, ownerMemberId))
      .filter(Boolean);
    const personalFolderId = assetInput.folderId || getDefaultHomeAssetFolderId(ownerMemberId);
    let hasTargetFolder = false;
    const nextFolders = homeFolders.map((folder, index) => {
      const isTarget = folder.id === personalFolderId && folder.kind === "personal";
      if (!isTarget) return { ...folder, sortOrder: Math.max(0, Number(folder.sortOrder ?? index) || 0) };
      hasTargetFolder = true;
      return {
        ...folder,
        ownerMemberId,
        assetIds: Array.from(new Set([...(folder.assetIds || []), mergedAsset.id])),
        updatedAt: new Date().toISOString()
      };
    });

    if (!hasTargetFolder) {
      nextFolders.push({
        ...fallbackFolder,
        id: personalFolderId,
        assetIds: [mergedAsset.id]
      });
    }

    return {
      asset: mergedAsset,
      folderId: personalFolderId,
      config: {
        ...currentConfig,
        layoutAssets: {
          ...(currentConfig?.layoutAssets || {}),
          home: nextAssets
        },
        assetFolders: {
          ...(currentConfig?.assetFolders || {}),
          home: nextFolders
        }
      }
    };
  }

  function getDefaultBattleState() {
    return {
      enemyName: "訓練用ダミー",
      enemyHp: 900,
      enemyMaxHp: 900,
      enemyDebuff: 0,
      turnCount: 0,
      party: [],
      log: "バトル準備完了",
      lastActionAt: 0
    };
  }

  window.AppStateLib = {
    getDefaultSystemConfig,
    getDefaultCurrencies,
    getDefaultPlayerState,
    getDefaultHomeConfig,
    getHomeLayoutPreset,
    getHomeCharacterBaseOffset,
    getDefaultPartyFormation,
    normalizeLayoutAssetRecord,
    normalizeFolderSourceRefs,
    normalizeAssetFolderRecord,
    normalizeAssetFoldersConfig,
    getDefaultHomeAssetFolderId,
    createDefaultHomeAssetFolder,
    getHomeAssetFolders,
    resolveSharedAssetFolderAssets,
    resolveHomeAssetFolderAssets,
    upsertHomeLayoutAssetInConfig,
    getDefaultBattleState
  };
})();
