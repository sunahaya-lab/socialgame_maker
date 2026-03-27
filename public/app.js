// Active frontend bootstrap entry loaded by public/index.html.
// Keep this file focused on startup, wiring, and minimum global hooks.
window.__SOCIA_ACTIVE_RUNTIME__ = "app.js";

const {
  getDefaultRarityMode,
  getRarityModeConfig: rarityLibGetModeConfig,
  getRarityRank: rarityLibGetRank,
  getRarityValueByRank: rarityLibGetValueByRank,
  normalizeRarityValue: rarityLibNormalizeValue,
  getRarityLabel: rarityLibGetLabel,
  getRarityCssClass: rarityLibGetCssClass,
  getDefaultRates: rarityLibGetDefaultRates,
  normalizeRates: rarityLibNormalizeRates
} = window.RarityLib;
const {
  loadLocal: storageLoadLocal,
  saveLocal: storageSaveLocal,
  getScopedStorageKey: storageGetScopedStorageKey
} = window.StorageLib;
const {
  get: apiGet,
  post: apiPost
} = window.ApiClient;
const {
  readFileAsDataUrl: imageReadFileAsDataUrl,
  uploadStaticImageAsset: imageUploadStaticImageAsset,
  makeBaseCharFallback: imageMakeBaseCharFallback,
  makeFallbackImage: imageMakeFallbackImage,
  escapeHtml
} = window.ImageLib;
const {
  showToast: toastShowToast
} = window.ToastLib;
const {
  MODES: APP_MODES,
  normalizeAppMode
} = window.AppModeLib;
const {
  getDefaultSystemConfig: appStateGetDefaultSystemConfig,
  getDefaultCurrencies: appStateGetDefaultCurrencies,
  getDefaultPlayerState: appStateGetDefaultPlayerState,
  getDefaultHomeConfig: appStateGetDefaultHomeConfig,
  getHomeLayoutPreset: appStateGetHomeLayoutPreset,
  getHomeCharacterBaseOffset: appStateGetHomeCharacterBaseOffset,
  getDefaultPartyFormation: appStateGetDefaultPartyFormation,
  normalizeLayoutAssetRecord: appStateNormalizeLayoutAssetRecord,
  normalizeFolderSourceRefs: appStateNormalizeFolderSourceRefs,
  normalizeAssetFolderRecord: appStateNormalizeAssetFolderRecord,
  normalizeAssetFoldersConfig: appStateNormalizeAssetFoldersConfig,
  getDefaultHomeAssetFolderId: appStateGetDefaultHomeAssetFolderId,
  createDefaultHomeAssetFolder: appStateCreateDefaultHomeAssetFolder,
  getHomeAssetFolders: appStateGetHomeAssetFolders,
  resolveSharedAssetFolderAssets: appStateResolveSharedAssetFolderAssets,
  resolveHomeAssetFolderAssets: appStateResolveHomeAssetFolderAssets,
  upsertHomeLayoutAssetInConfig: appStateUpsertHomeLayoutAssetInConfig,
  getDefaultBattleState: appStateGetDefaultBattleState
} = window.AppStateLib;
const {
  normalizePartyFormation: playerStateNormalizePartyFormation,
  mergeByKey: playerStateMergeByKey,
  mergeInventoryItem: playerStateMergeInventoryItem,
  mergeStoryProgressItem: playerStateMergeStoryProgressItem,
  normalizePlayerCurrencies: playerStateNormalizePlayerCurrencies,
  getRecoveredCurrency: playerStateGetRecoveredCurrency,
  normalizeHomePreferences: playerStateNormalizeHomePreferences,
  mergePlayerState: playerStateMergePlayerState,
  formatCurrencyBalance: playerStateFormatCurrencyBalance
} = window.PlayerStateLib;
const contentStateFactory = window.ContentStateLib;

let baseChars = [];
let characters = [];
let equipmentCards = [];
let stories = [];
let gachas = [];
let projects = [];
let systemConfig = appStateGetDefaultSystemConfig(getDefaultRarityMode());
let playerState = null;
let currentMode = APP_MODES.play;
let currentScreen = "home";
let currentStoryType = "main";
let activeGacha = null;
let storyReaderState = null;
let homeConfigDraft = null;
let activeHomeConfigTarget = 1;
let homeConfigDrag = null;
let homeDialogueState = null;
let homeCurrencyTimer = null;
let collectionScreen = null;
let formationScreen = null;
let gachaScreen = null;
let storyScreen = null;
let eventScreen = null;
let systemEditor = null;
let entryEditor = null;
let equipmentCardEditor = null;
let baseCharEditor = null;
let storyEditor = null;
let editorScreen = null;
let partyFormation = appStateGetDefaultPartyFormation();
let battleState = null;
let battleLoopTimer = null;
let battleScreenModuleApi = null;
let appRuntimeModuleApi = null;
let appDataModuleApi = null;
let appUiModuleApi = null;
let appHomeModuleApi = null;
let appEditorModuleApi = null;
let contentStateModuleApi = null;
let editorRuntimeModuleApi = null;
let layoutBridgeModuleApi = null;
let editorFeatureAccessCache = {
  projectId: "",
  userId: "",
  value: null,
  promise: null
};

const searchParams = new URLSearchParams(location.search);
const roomId = searchParams.get("room") || null;
const collabToken = searchParams.get("collab") || null;
const publicShareToken = searchParams.get("share") || null;
let currentProjectId = searchParams.get("project") || null;
playerState = appStateGetDefaultPlayerState(currentProjectId);

const editState = {
  baseCharId: null,
  characterId: null,
  equipmentCardId: null,
  storyId: null,
  gachaId: null
};

function apiUrl(path, options = {}) {
  const query = new URLSearchParams();
  if (roomId) query.set("room", roomId);
  if (collabToken) query.set("collab", collabToken);
  if (publicShareToken) query.set("share", publicShareToken);
  if (options.includeProject !== false && currentProjectId) query.set("project", currentProjectId);
  Object.entries(options.query || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

const API = {
  projects: "/api/projects",
  baseChars: "/api/base-chars",
  characters: "/api/entries",
  equipmentCards: "/api/equipment-cards",
  assetsUpload: "/api/assets-upload",
  assetsContent: "/api/assets-content",
  stories: "/api/stories",
  gachas: "/api/gachas",
  system: "/api/system",
  playerBootstrap: "/api/player-bootstrap",
  playerProfile: "/api/player-profile",
  playerStoryProgress: "/api/player-story-progress",
  playerGachaPulls: "/api/player-gacha-pulls",
  playerHomePreferences: "/api/player-home-preferences",
  playerEventLoginBonusClaim: "/api/player-event-login-bonus-claim",
  playerEventExchangePurchase: "/api/player-event-exchange-purchase",
  collabShareResolve: "/api/collab-share-resolve",
  shareCollabLink: "/api/share-collab-link",
  sharePublicLink: "/api/share-public-link",
  publicShareResolve: "/api/public-share-resolve",
  projectShareSummary: "/api/project-share-summary"
};

const getDefaultSystemConfig = () => appStateGetDefaultSystemConfig(getDefaultRarityMode());
const getDefaultPlayerState = (projectId = currentProjectId, userId = null) => appStateGetDefaultPlayerState(projectId, userId);
const getDefaultCurrencies = () => appStateGetDefaultCurrencies();
const getDefaultHomeConfig = () => appStateGetDefaultHomeConfig();
const getHomeLayoutPreset = (config = systemConfig) => appStateGetHomeLayoutPreset(config);
const getHomeCharacterBaseOffset = (layoutPreset, config, index) => appStateGetHomeCharacterBaseOffset(layoutPreset, config, index);
const getDefaultPartyFormation = () => appStateGetDefaultPartyFormation();
const getCurrentLayoutOwnerId = () => String(playerState?.profile?.userId || getCurrentPlayerId() || "local-editor").trim();
const normalizeLayoutAssetRecord = (asset, fallbackOwnerId = getCurrentLayoutOwnerId()) => appStateNormalizeLayoutAssetRecord(asset, fallbackOwnerId);
const getHomeAssetFolders = (config = systemConfig) => appStateGetHomeAssetFolders(config, getCurrentLayoutOwnerId());
const resolveSharedAssetFolderAssets = (folder, allFolders = getHomeAssetFolders(), allAssets = (systemConfig?.layoutAssets?.home || [])) => appStateResolveSharedAssetFolderAssets(folder, allFolders, allAssets, getCurrentLayoutOwnerId());
const resolveHomeAssetFolderAssets = (folderOrId, config = systemConfig) => appStateResolveHomeAssetFolderAssets(folderOrId, config, getCurrentLayoutOwnerId());
const upsertHomeLayoutAssetInConfig = (config, assetInput = {}) => appStateUpsertHomeLayoutAssetInConfig(config, assetInput, { ownerMemberId: getCurrentLayoutOwnerId(), defaultSystemConfig: getDefaultSystemConfig });
const getDefaultBattleState = () => appStateGetDefaultBattleState();
const getRarityModeConfig = (mode = systemConfig?.rarityMode) => rarityLibGetModeConfig(mode);
const getRarityRank = value => rarityLibGetRank(value);
const normalizeRarityValue = (value, mode = systemConfig?.rarityMode) => rarityLibNormalizeValue(value, mode);
const getRarityLabel = (value, mode = systemConfig?.rarityMode) => rarityLibGetLabel(value, mode);
const getRarityCssClass = (value, mode = systemConfig?.rarityMode) => rarityLibGetCssClass(value, mode);
const getDefaultRates = (mode = systemConfig?.rarityMode) => rarityLibGetDefaultRates(mode);
const normalizeRates = (rates = {}, mode = systemConfig?.rarityMode) => rarityLibNormalizeRates(rates, mode);

function getCurrentRarityValues() {
  return rarityLibGetModeConfig(systemConfig?.rarityMode).tiers.map(tier => tier.value);
}

function applyAppMode(nextMode) {
  const mode = normalizeAppMode(nextMode);
  document.body.dataset.appMode = mode;
  document.body.classList.toggle("app-mode-play", mode === APP_MODES.play);
  document.body.classList.toggle("app-mode-edit", mode === APP_MODES.edit);
  document.body.classList.toggle("app-mode-admin", mode === APP_MODES.admin);
  return mode;
}

function setAppMode(nextMode) {
  currentMode = applyAppMode(nextMode);
  return currentMode;
}

const baseCharVoiceLineDefs = [
  ["gain", "入手"],
  ["evolve", "進化"],
  ["levelUp1", "レベルアップ1"],
  ["levelUp2", "レベルアップ2"],
  ["levelUp3", "レベルアップ3"],
  ["leaderAssign", "リーダー編成"],
  ["subLeaderAssign", "サブリーダー編成"],
  ["normalAssign", "編成"],
  ["battleStart1", "戦闘開始1"],
  ["battleStart2", "戦闘開始2"],
  ["battleWave1", "Wave開始1"],
  ["battleWave2", "Wave開始2"],
  ["mainSkill1", "メインスキル1"],
  ["mainSkill2", "メインスキル2"],
  ["mainSkill3", "メインスキル3"],
  ["subSkill1", "サブスキル1"],
  ["subSkill2", "サブスキル2"],
  ["subSkill3", "サブスキル3"],
  ["special1", "スペシャル1"],
  ["special2", "スペシャル2"],
  ["special3", "スペシャル3"],
  ["retreat1", "撤退1"],
  ["retreat2", "撤退2"],
  ["retreat3", "撤退3"],
  ["victory1", "勝利1"],
  ["victory2", "勝利2"],
  ["victory3", "勝利3"]
];

const baseCharHomeVoiceDefs = [
  ["talk1", "会話1"],
  ["talk2", "会話2"],
  ["talk3", "会話3"],
  ["evolutionTalk1", "進化会話1"],
  ["evolutionTalk2", "進化会話2"],
  ["evolutionTalk3", "進化会話3"],
  ["bond1", "絆1"],
  ["bond2", "絆2"],
  ["bond3", "絆3"],
  ["bond4", "絆4"],
  ["bond5", "絆5"],
  ["bond6", "絆6"],
  ["bond7", "絆7"],
  ["bond8", "絆8"],
  ["bond9", "絆9"],
  ["bond10", "絆10"],
  ["eventActive", "イベント開催中"],
  ["newYear", "お正月"],
  ["homeEnter", "ホーム遷移"]
];
void init();

async function init() {
  applyAppMode(currentMode);
  ensureAppEditorApi().ensureEditorFolderControls();
  collectionScreen = window.CollectionScreen.setupCollectionScreen({
    getCharacters: () => characters,
    getStories: () => stories,
    getSystemConfig: () => systemConfig,
    getOwnedCount: getOwnedCardCount,
    getCharacterImageForUsage: (char, usage = "default") => ensureContentStateApi().getCharacterImageForUsage(char, usage),
    baseCharVoiceLineDefs,
    getBaseCharById: id => ensureContentStateApi().getBaseCharById(baseChars, id),
    getEffectiveVoiceLines: (card, baseChar) => ensureAppUiApi().getEffectiveVoiceLines(card, baseChar),
    openStoryReader: story => storyScreen.openStoryReader(story),
    getRarityModeConfig,
    normalizeRarityValue,
    getRarityLabel,
    getRarityCssClass,
    makeFallbackImage: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity),
    esc: str => ensureAppUiApi().esc(str)
  });
  formationScreen = window.FormationScreen.setupFormationScreen({
    getCharacters: () => characters,
    getEquipmentCards: () => equipmentCards,
    getOwnedCount: getOwnedCardCount,
    getOwnedEquipmentCount,
    getCardInstances,
    getEquipmentInstances,
    getCardInstance,
    getEquipmentInstance,
    getCardInstanceGrowth,
    getEquipmentInstanceGrowth,
    getPartyFormation: () => partyFormation,
    setPartyFormation: next => {
      partyFormation = normalizePartyFormation(next);
      saveLocal("socia-party-formation", partyFormation);
    },
    getSystemConfig: () => systemConfig,
    getCharacterImageForUsage: (char, usage = "default") => ensureContentStateApi().getCharacterImageForUsage(char, usage),
    getRarityLabel,
    getRarityCssClass,
    makeFallbackImage: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity),
    showCardDetail: char => collectionScreen.showCardDetail(char),
    getCardGrowth,
    getEquipmentGrowth,
    getGrowthResources,
    setCardLockedCopies,
    setEquipmentLockedCopies,
    enhanceCard,
    enhanceCardInstance,
    enhanceEquipment,
    enhanceEquipmentInstance,
    evolveCard,
    evolveCardInstance,
    evolveEquipment,
    evolveEquipmentInstance,
    limitBreakCard,
    limitBreakCardInstance,
    limitBreakEquipment,
    limitBreakEquipmentInstance,
    convertCardDuplicates,
    convertEquipmentDuplicates,
    convertSelectedCharacterCards,
    convertSelectedEquipmentCards,
    convertSelectedCharacterInstances,
    convertSelectedEquipmentInstances,
    convertStaminaToGrowthPoints,
    getPlayerCurrencyAmount: key => ensureAppDataApi().getPlayerCurrencyAmount(key),
    getDefaultBattleState: () => getDefaultBattleState(),
    setBattleState: value => { battleState = value; },
    navigateTo,
    showToast: message => ensureAppUiApi().showToast(message),
    esc: str => ensureAppUiApi().esc(str)
  });
  gachaScreen = window.GachaScreen.setupGachaScreen({
    getCharacters: () => characters,
    getGachas: () => gachas,
    getPlayerState: () => playerState,
    getSystemConfig: () => systemConfig,
    getActiveGacha: () => activeGacha,
    setActiveGacha: value => { activeGacha = value; },
    buildGachaRateSummary: (rates = {}) => ensureContentStateApi().buildGachaRateSummary(rates),
    normalizeRates,
    getDefaultRates,
    getRarityModeConfig,
    getRarityRank,
    getRarityLabel,
    getRarityCssClass,
    normalizeRarityValue,
    makeFallbackImage: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity),
    showCardDetail: char => collectionScreen.showCardDetail(char),
    getPlayerCurrencyAmount: key => ensureAppDataApi().getPlayerCurrencyAmount(key),
    recordGachaPulls: (gachaId, resultsOrCount = []) => ensureAppDataApi().recordGachaPulls(gachaId, resultsOrCount),
    refreshPlayerState: () => ensureAppDataApi().loadPlayerState(),
    showToast: message => ensureAppUiApi().showToast(message),
    esc: str => ensureAppUiApi().esc(str)
  });
  storyScreen = window.StoryScreen.setupStoryScreen({
    getStories: () => stories,
    getCharacters: () => characters,
    getSystemConfig: () => systemConfig,
    getCurrentStoryType: () => currentStoryType,
    setCurrentStoryType: value => { currentStoryType = value; },
    getStoryReaderState: () => storyReaderState,
    setStoryReaderState: value => { storyReaderState = value; },
    getBaseCharById: id => ensureContentStateApi().getBaseCharById(baseChars, id),
    findCharacterImageByName: name => ensureContentStateApi().findCharacterImageByName(characters, name),
    resolveScenePortrait: (story, baseChar, scene) => ensureContentStateApi().resolveScenePortrait(story, baseChar, scene),
    getOwnedCount: getOwnedCardCount,
    getStoryProgress: getPlayerStoryProgress,
    saveStoryProgress: (storyId, values = {}) => ensureAppDataApi().saveStoryProgress(storyId, values),
    showCardDetail: char => collectionScreen?.showCardDetail?.(char),
    showToast: message => ensureAppUiApi().showToast(message),
    esc: str => ensureAppUiApi().esc(str)
  });
  eventScreen = window.EventScreen.setupEventScreen({
    getSystemConfig: () => systemConfig,
    getCharacters: () => characters,
    getStories: () => stories,
    getOwnedCount: cardId => ensureAppDataApi().getOwnedCardCount(cardId),
    showCardDetail: char => collectionScreen?.showCardDetail?.(char),
    getGrowthResources: () => ensureAppDataApi().getGrowthResources(),
    getPlayerCurrencyAmount: key => ensureAppDataApi().getPlayerCurrencyAmount(key),
    getEventItemCounts: () => ensureAppDataApi().getEventItemCounts(),
    setCurrentStoryType: value => { currentStoryType = value; },
    renderStoryScreen: () => storyScreen?.renderStoryScreen?.(),
    openStoryReader: story => storyScreen?.openStoryReader?.(story),
    getEventExchangeStatus: config => ensureAppDataApi().getEventExchangeStatus(config),
    purchaseEventExchangeItem: (config, itemId) => ensureAppDataApi().purchaseEventExchangeItem(config, itemId),
    getEventLoginBonusStatus: config => ensureAppDataApi().getEventLoginBonusStatus(config),
    claimEventLoginBonus: config => ensureAppDataApi().claimEventLoginBonus(config),
    navigateTo,
    showToast: message => ensureAppUiApi().showToast(message)
  });
  systemEditor = window.SystemEditor.setupSystemEditor({
    getSystemConfig: () => systemConfig,
    setSystemConfig: value => { systemConfig = value; },
    getEditState: () => editState,
      getEditStateObject: () => editState,
    getGachas: () => gachas,
    getStories: () => stories,
    getCurrentScreen: () => currentScreen,
    readFileAsDataUrl: file => ensureAppUiApi().readFileAsDataUrl(file),
    saveConfig: async value => {
      saveLocal("socia-system", value);
      try {
        await postJSON(apiUrl(API.system), value);
      } catch (error) {
        console.error("Failed to save system config:", error);
        const code = String(error?.data?.code || "");
        const requiredPack = String(error?.data?.requiredPack || "").trim();
        if (code === "billing_feature_required" && (requiredPack === "battle" || requiredPack === "event")) {
          const label = requiredPack === "battle" ? "Battle Pack" : "Event Pack";
          ensureAppUiApi().showToast(`\u3053\u306e\u8a2d\u5b9a\u3092\u5171\u6709\u4fdd\u5b58\u3059\u308b\u306b\u306f ${label} \u304c\u5fc5\u8981\u3067\u3059\u3002\u30ed\u30fc\u30ab\u30eb\u306b\u306f\u4fdd\u6301\u3055\u308c\u3066\u3044\u307e\u3059\u3002`);
          return;
        }
        if (code === "billing_feature_required" && requiredPack === "battle") {
          ensureAppUiApi().showToast("このシステム設定を保存するには Battle Pack が必要です。");
          return;
        }
        if (code === "billing_feature_required" && requiredPack === "event") {
          ensureAppUiApi().showToast("このイベント設定を保存するには Event Pack が必要です。");
          return;
        }
        ensureAppUiApi().showToast("\u30b7\u30b9\u30c6\u30e0\u8a2d\u5b9a\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
      }
    },
    renderAll: () => ensureAppUiApi().renderAll(),
    applyOrientation: () => ensureAppRuntimeApi().applyOrientation(systemConfig),
    refreshCollection: () => collectionScreen.renderCollectionScreen(),
    refreshGacha: () => gachaScreen.renderGachaScreen(),
    openFolderManager: kind => getEditorLegacyMethod("openFolderManager")?.(kind),
    getFeatureAccess: options => getEditorFeatureAccess(options),
    rarityApi: {
      getRarityModeConfig: (mode = systemConfig?.rarityMode) => rarityLibGetModeConfig(mode),
      getRarityCssClass,
      getRarityLabel: (value, mode = systemConfig?.rarityMode) => rarityLibGetLabel(value, mode),
      normalizeRarityValue,
      getDefaultRates: (mode = systemConfig?.rarityMode) => rarityLibGetDefaultRates(mode),
      normalizeRates: (rates = {}, mode = systemConfig?.rarityMode) => rarityLibNormalizeRates(rates, mode),
      esc: str => ensureAppUiApi().esc(str)
    },
    showToast: message => ensureAppUiApi().showToast(message)
  });
  entryEditor = window.EntryEditor.setupEntryEditor({
    getCharacters: () => characters,
    setCharacters: value => { characters = value; },
    getBaseChars: () => baseChars,
    getCardFolders: () => systemConfig.cardFolders || [],
    getEditState: () => editState,
    getApi: () => ({ characters: apiUrl(API.characters) }),
    getSystemApi: () => ({
      renderCharacterRarityOptions: value => systemEditor.renderCharacterRarityOptions(value),
      getRarityFallback: () => getRarityModeConfig().fallback
    }),
    readFileAsDataUrl: file => ensureAppUiApi().readFileAsDataUrl(file),
    generateCharacterCropAssets: (imageSrc, cropPresets = null) => ensureContentStateApi().generateCharacterCropAssets(imageSrc, cropPresets),
    normalizeCharacterCropImages: cropImages => ensureContentStateApi().normalizeCharacterCropImages(cropImages),
    normalizeCharacterCropPresets: cropPresets => ensureContentStateApi().normalizeCharacterCropPresets(cropPresets),
    normalizeCharacterSdImages: sdImages => ensureContentStateApi().normalizeCharacterSdImages(sdImages),
    normalizeCharacterBattleKit: battleKit => ensureContentStateApi().normalizeCharacterBattleKit(battleKit),
    makeFallbackImage: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity),
    normalizeRarityValue,
    saveLocal,
    postJSON,
    showToast: message => ensureAppUiApi().showToast(message),
    getFeatureAccess: options => getEditorFeatureAccess(options),
    upsertItem: (collection, nextItem) => ensureAppUiApi().upsertItem(collection, nextItem),
    updateEditorSubmitLabels: () => ensureAppEditorApi().updateEditorSubmitLabels(),
    renderHome,
    renderEditorCharacterList: () => ensureAppUiApi().renderEditorCharacterList(),
    renderGachaPoolChars: selectedIds => ensureAppUiApi().renderGachaPoolChars(selectedIds),
    getEditingFeaturedIds: () => ensureAppEditorApi().getEditingFeaturedIds(),
    createContentFolder: kind => ensureAppEditorApi().createContentFolder(kind),
    uploadStaticImageAsset: (file, options = {}) => imageUploadStaticImageAsset(file, {
      uploadUrl: apiUrl(API.assetsUpload, {
        query: { user: getCurrentPlayerId() }
      }),
      projectId: currentProjectId,
      userId: getCurrentPlayerId(),
      ...options
    }),
    renderVoiceLineFields: (containerId, prefix, defs, values = {}) => ensureAppUiApi().renderVoiceLineFields(containerId, prefix, defs, values),
    collectVoiceLineFields: (containerId, prefix, defs) => ensureAppUiApi().collectVoiceLineFields(containerId, prefix, defs),
    baseCharVoiceLineDefs,
    baseCharHomeVoiceDefs,
    esc: str => ensureAppUiApi().esc(str)
  });
  equipmentCardEditor = window.EquipmentCardEditor.setupEquipmentCardEditor({
    getEquipmentCards: () => equipmentCards,
    setEquipmentCards: value => { equipmentCards = value; },
    getEditState: () => editState,
    getApi: () => ({ equipmentCards: apiUrl(API.equipmentCards) }),
    getSystemApi: () => ({
      getRarityModeConfig: () => getRarityModeConfig(),
      getRarityFallback: () => getRarityModeConfig().fallback,
      getRarityLabel: value => getRarityLabel(value)
    }),
    readFileAsDataUrl: file => ensureAppUiApi().readFileAsDataUrl(file),
    saveLocal,
    postJSON,
    showToast: message => ensureAppUiApi().showToast(message),
    esc: str => ensureAppUiApi().esc(str)
  });
  baseCharEditor = window.BaseCharEditor.setupBaseCharEditor({
    getBaseChars: () => baseChars,
    setBaseChars: value => { baseChars = value; },
    getEditState: () => editState,
    getApi: () => ({ baseChars: apiUrl(API.baseChars) }),
    readFileAsDataUrl: file => ensureAppUiApi().readFileAsDataUrl(file),
    uploadStaticImageAsset: (file, options = {}) => imageUploadStaticImageAsset(file, {
      uploadUrl: apiUrl(API.assetsUpload, {
        query: { user: getCurrentPlayerId() }
      }),
      projectId: currentProjectId,
      userId: getCurrentPlayerId(),
      ...options
    }),
    makeBaseCharFallback: (name, color) => ensureAppUiApi().makeBaseCharFallback(name, color),
    normalizeBirthday: value => ensureContentStateApi().normalizeBirthday(value),
    saveLocal,
    postJSON,
    showToast: message => ensureAppUiApi().showToast(message),
    upsertItem: (collection, nextItem) => ensureAppUiApi().upsertItem(collection, nextItem),
    updateEditorSubmitLabels: () => ensureAppEditorApi().updateEditorSubmitLabels(),
    renderBaseCharList: () => ensureAppUiApi().renderBaseCharList(),
    populateBaseCharSelects: () => ensureAppEditorApi().populateBaseCharSelects(),
    renderVoiceLineFields: (containerId, prefix, defs, values = {}) => ensureAppUiApi().renderVoiceLineFields(containerId, prefix, defs, values),
    collectVoiceLineFields: (containerId, prefix, defs) => ensureAppUiApi().collectVoiceLineFields(containerId, prefix, defs),
    baseCharVoiceLineDefs,
    baseCharHomeVoiceDefs,
    esc: str => ensureAppUiApi().esc(str)
  });
  storyEditor = window.StoryEditor.setupStoryEditor({
    getStories: () => stories,
    setStories: value => { stories = value; },
    getBaseChars: () => baseChars,
    getCharacters: () => characters,
    getStoryFolders: () => systemConfig.storyFolders || [],
    getEditState: () => editState,
    getApi: () => ({ stories: apiUrl(API.stories) }),
    readFileAsDataUrl: file => ensureAppUiApi().readFileAsDataUrl(file),
    saveLocal,
    postJSON,
    showToast: message => ensureAppUiApi().showToast(message),
    getFeatureAccess: options => getEditorFeatureAccess(options),
    upsertItem: (collection, nextItem) => ensureAppUiApi().upsertItem(collection, nextItem),
    updateEditorSubmitLabels: () => ensureAppEditorApi().updateEditorSubmitLabels(),
    renderHome,
    renderEditorStoryList: () => ensureAppUiApi().renderEditorStoryList(),
    createContentFolder: kind => ensureAppEditorApi().createContentFolder(kind),
    getBaseCharById: id => ensureContentStateApi().getBaseCharById(baseChars, id),
    esc: str => ensureAppUiApi().esc(str)
  });
  editorScreen = window.EditorScreen.setupEditorScreen({
    getCurrentProjectId: () => currentProjectId,
    getCurrentProjectName: () => projects.find(project => project.id === currentProjectId)?.name || "無題のプロジェクト",
    getCurrentPlayerId,
    getBaseChars: () => baseChars,
    getCharacters: () => characters,
    getStories: () => stories,
    getGachas: () => gachas,
    getSystemConfig: () => systemConfig,
    setSystemConfig: value => { systemConfig = value; },
    getCardFolders: () => systemConfig.cardFolders || [],
    getStoryFolders: () => systemConfig.storyFolders || [],
    getEditingFeaturedIds: () => ensureAppEditorApi().getEditingFeaturedIds(),
    getRarityCssClass,
    getRarityLabel,
    makeFallbackImage: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity),
    buildStorySummary: story => ensureContentStateApi().buildStorySummary(story),
    buildGachaRateSummary: (rates = {}) => ensureContentStateApi().buildGachaRateSummary(rates),
    esc: str => ensureAppUiApi().esc(str),
    baseCharEditor,
    entryEditor,
    storyEditor,
    storyScreen,
    systemEditor,
    beginGachaEdit: id => ensureAppEditorApi().beginGachaEdit(id),
    navigateTo,
    setActiveGacha: value => { activeGacha = value; },
    collectionScreen,
    populateBaseCharSelects: () => ensureAppEditorApi().populateBaseCharSelects(),
    populateFolderSelects: () => ensureAppEditorApi().populateFolderSelects(),
    updateEditorSubmitLabels: () => ensureAppEditorApi().updateEditorSubmitLabels(),
    createContentFolder: kind => ensureAppEditorApi().createContentFolder(kind),
    persistSystemConfigState: () => ensureAppEditorApi().persistSystemConfigState(),
    openShareSettings: () => ensureAppEditorApi().handleShare(),
    getShareManagementSummary: () => ensureAppEditorApi().getShareManagementSummary(currentProjectId),
    rotateCollaborativeShare: () => ensureAppEditorApi().rotateCollaborativeShare(currentProjectId),
    createPublicShare: () => ensureAppEditorApi().createPublicShare(currentProjectId)
  });
  ensureAppRuntimeApi().setupProjectControls();
  ensureAppRuntimeApi().configurePrimaryNavigation({
    openEditorScreen,
    navigateTo
  });
  ensureAppRuntimeApi().ensureBattleEntryButton(navigateTo);
  ensureAppRuntimeApi().setupNavigation();
  ensureEditorRuntimeApi().setupEditorOverlay();
  ensureEditorRuntimeApi().bindEditorOverlayTabs();
  ensureEditorRuntimeApi().disableLegacyEditorUi();
  ensureAppEditorApi().setupForms();
  ensureAppEditorApi().setupPreviews();
  ensureAppHomeApi().setupHomeConfig();
  ensureAppHomeApi().setupHomeInteractions();
  ensureBattleScreenApi().setupBattleControls();

  await ensureAppRuntimeApi().initializeProjects();
  await ensureAppDataApi().loadAllData();
  ensureAppRuntimeApi().applyOrientation(systemConfig);
  ensureAppUiApi().renderAll();
}

function navigateTo(screen) {
  return ensureAppRuntimeApi().navigateTo(screen);
}

function openHomeEditMode() {
  setAppMode(APP_MODES.edit);
  return ensureAppHomeApi().openHomeEditMode();
}

function closeHomeEditMode() {
  const result = ensureAppHomeApi().closeHomeEditMode();
  if (currentScreen === "home") setAppMode(APP_MODES.play);
  return result;
}

// Legacy overlay/editor modules still consume these runtime hooks directly.
window.navigateTo = navigateTo;
window.openEditorScreen = openEditorScreen;
window.closeEditorScreen = closeEditorScreen;

function openEditorSurface(tabName = null, screen = currentScreen) {
  return ensureEditorRuntimeApi().openEditorSurface(tabName, screen);
}

function openEditorScreen(tabName = null) {
  setAppMode(APP_MODES.edit);
  return ensureEditorRuntimeApi().openEditorScreen(tabName);
}

function closeEditorScreen() {
  setAppMode(APP_MODES.play);
  return ensureEditorRuntimeApi().closeEditorScreen();
}

async function fetchJSON(url) {
  return ensureAppDataApi().fetchJSON(url);
}

async function postJSON(url, data) {
  return ensureAppDataApi().postJSON(url, data);
}

async function getEditorFeatureAccess(options = {}) {
  const projectId = String(currentProjectId || "").trim();
  const userId = String(getCurrentPlayerId() || "").trim();
  if (!projectId || !userId) {
    return { battle: false, storyFx: false, event: false };
  }

  const force = options === true || options?.force === true;
  if (
    !force &&
    editorFeatureAccessCache.value &&
    editorFeatureAccessCache.projectId === projectId &&
    editorFeatureAccessCache.userId === userId
  ) {
    return editorFeatureAccessCache.value;
  }

  if (
    !force &&
    editorFeatureAccessCache.promise &&
    editorFeatureAccessCache.projectId === projectId &&
    editorFeatureAccessCache.userId === userId
  ) {
    return editorFeatureAccessCache.promise;
  }

  const request = postJSON(
    apiUrl(API.projectShareSummary, {
      includeProject: false,
      query: { project: projectId, user: userId }
    }),
    { projectId, userId }
  ).then(response => {
    const entitlements = response?.featureAccess || {};
    const value = {
      battle: Boolean(entitlements.battle),
      storyFx: Boolean(entitlements.storyFx),
      event: Boolean(entitlements.event)
    };
    editorFeatureAccessCache = {
      projectId,
      userId,
      value,
      promise: null
    };
    return value;
  }).catch(error => {
    console.error("Failed to load editor feature access:", error);
    const value = { battle: false, storyFx: false, event: false };
    editorFeatureAccessCache = {
      projectId,
      userId,
      value,
      promise: null
    };
    return value;
  });

  editorFeatureAccessCache = {
    projectId,
    userId,
    value: null,
    promise: request
  };
  return request;
}

function loadLocal(key, fallback) {
  return ensureAppDataApi().loadLocal(key, fallback);
}

function saveLocal(key, data) {
  return ensureAppDataApi().saveLocal(key, data);
}

function getCurrentPlayerId() {
  return ensureAppDataApi().getCurrentPlayerId();
}

function getPlayerIdentityScope() {
  return ensureAppDataApi().getPlayerIdentityScope();
}

function getPlayerApiUrl(path) {
  return ensureAppDataApi().getPlayerApiUrl(path);
}

function getScopedStorageKey(key) {
  return ensureAppDataApi().getScopedStorageKey(key);
}

function getPlayerStoryProgress(storyId) {
  return ensureAppDataApi().getPlayerStoryProgress(storyId);
}

function upsertPlayerStoryProgress(nextItem) {
  return ensureAppDataApi().upsertPlayerStoryProgress(nextItem);
}


function upsertInventoryRecord(nextItem) {
  return ensureAppDataApi().upsertInventoryRecord(nextItem);
}

function getOwnedCardCount(cardId) {
  return ensureAppDataApi().getOwnedCardCount(cardId);
}

function getOwnedEquipmentCount(equipmentId) {
  return ensureAppDataApi().getOwnedEquipmentCount(equipmentId);
}

function getCardInstances(cardId = "") {
  return ensureAppDataApi().getCardInstances(cardId);
}

function getEquipmentInstances(equipmentId = "") {
  return ensureAppDataApi().getEquipmentInstances(equipmentId);
}

function getCardInstance(instanceId) {
  return ensureAppDataApi().getCardInstance(instanceId);
}

function getEquipmentInstance(instanceId) {
  return ensureAppDataApi().getEquipmentInstance(instanceId);
}

function getCardInstanceGrowth(instanceId) {
  return ensureAppDataApi().getCardInstanceGrowth(instanceId);
}

function getEquipmentInstanceGrowth(instanceId) {
  return ensureAppDataApi().getEquipmentInstanceGrowth(instanceId);
}

function getCardGrowth(cardId) {
  return ensureAppDataApi().getCardGrowth(cardId);
}

function getEquipmentGrowth(equipmentId) {
  return ensureAppDataApi().getEquipmentGrowth(equipmentId);
}

function getGrowthResources() {
  return ensureAppDataApi().getGrowthResources();
}

function setCardLockedCopies(cardId, value) {
  return ensureAppDataApi().setCardLockedCopies(cardId, value);
}

function setEquipmentLockedCopies(equipmentId, value) {
  return ensureAppDataApi().setEquipmentLockedCopies(equipmentId, value);
}

function enhanceCard(cardId) {
  return ensureAppDataApi().enhanceCard(cardId);
}

function enhanceEquipment(equipmentId) {
  return ensureAppDataApi().enhanceEquipment(equipmentId);
}

function enhanceCardInstance(instanceId) {
  return ensureAppDataApi().enhanceCardInstance(instanceId);
}

function enhanceEquipmentInstance(instanceId) {
  return ensureAppDataApi().enhanceEquipmentInstance(instanceId);
}

function evolveCard(cardId) {
  return ensureAppDataApi().evolveCard(cardId);
}

function evolveEquipment(equipmentId) {
  return ensureAppDataApi().evolveEquipment(equipmentId);
}

function evolveCardInstance(instanceId) {
  return ensureAppDataApi().evolveCardInstance(instanceId);
}

function evolveEquipmentInstance(instanceId) {
  return ensureAppDataApi().evolveEquipmentInstance(instanceId);
}

function limitBreakCard(cardId) {
  return ensureAppDataApi().limitBreakCard(cardId);
}

function limitBreakEquipment(equipmentId) {
  return ensureAppDataApi().limitBreakEquipment(equipmentId);
}

function limitBreakCardInstance(instanceId, materialInstanceId) {
  return ensureAppDataApi().limitBreakCardInstance(instanceId, materialInstanceId);
}

function limitBreakEquipmentInstance(instanceId, materialInstanceId) {
  return ensureAppDataApi().limitBreakEquipmentInstance(instanceId, materialInstanceId);
}

function convertCardDuplicates(cardId, target, amount) {
  return ensureAppDataApi().convertCardDuplicates(cardId, target, amount);
}

function convertEquipmentDuplicates(equipmentId, target, amount) {
  return ensureAppDataApi().convertEquipmentDuplicates(equipmentId, target, amount);
}

function convertSelectedCharacterCards(selectionCounts, options) {
  return ensureAppDataApi().convertSelectedCharacterCards(selectionCounts, options);
}

function convertSelectedEquipmentCards(selectionCounts, options) {
  return ensureAppDataApi().convertSelectedEquipmentCards(selectionCounts, options);
}

function convertSelectedCharacterInstances(instanceIds, options) {
  return ensureAppDataApi().convertSelectedCharacterInstances(instanceIds, options);
}

function convertSelectedEquipmentInstances(instanceIds, options) {
  return ensureAppDataApi().convertSelectedEquipmentInstances(instanceIds, options);
}

function convertStaminaToGrowthPoints(amount, options) {
  return ensureAppDataApi().convertStaminaToGrowthPoints(amount, options);
}

function normalizePartyFormation(formation) {
  return playerStateNormalizePartyFormation(formation);
}

function mergePlayerState(remoteState, localState) {
  return playerStateMergePlayerState(
    remoteState,
    localState,
    getDefaultPlayerState(currentProjectId, getCurrentPlayerId())
  );
}

function normalizePlayerCurrencies(currencies) {
  return playerStateNormalizePlayerCurrencies(currencies, appStateGetDefaultCurrencies());
}

function getEffectivePlayerCurrency(key, nowMs = Date.now()) {
  return ensureAppDataApi().getEffectivePlayerCurrency(key, nowMs);
}

function syncRecoveredCurrenciesInMemory(nowMs = Date.now()) {
  return ensureAppDataApi().syncRecoveredCurrenciesInMemory(nowMs);
}

function getRecoveredCurrency(currency, nowMs = Date.now()) {
  return playerStateGetRecoveredCurrency(currency, nowMs);
}

function normalizeHomePreferences(config) {
  return playerStateNormalizeHomePreferences(config, appStateGetDefaultHomeConfig(), clamp);
}

function isBaseCharBirthdayToday(baseChar, now = new Date()) {
  const birthday = String(baseChar?.birthday || "").trim();
  const match = birthday.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return false;
  return Number(match[1]) === (now.getMonth() + 1) && Number(match[2]) === now.getDate();
}

function isHomeEventActive(now = new Date()) {
  const month = now.getMonth() + 1;
  return Array.isArray(stories) && stories.some(story => {
    if (story?.type !== "event") return false;
    const text = `${story?.title || ""} ${story?.description || ""}`;
    if (/birthday|anniversary|event|limited/i.test(text)) return true;
    const monthMatch = text.match(/\b(1[0-2]|0?[1-9])月\b/);
    return monthMatch ? Number(monthMatch[1]) === month : false;
  });
}

function ensureBattleScreenApi() {
  if (!battleScreenModuleApi) {
    const battleControllerLib = window.BattleControllerLib.create();
    const battleEngineLib = window.BattleEngineLib.create();
    const battleStateLib = window.BattleStateLib.create({
      getCharacters: () => characters
    });
    const battleViewLib = window.BattleViewLib.create({
      getCharacterBattleVisual: (char, state = "idle", config = systemConfig) => ensureContentStateApi().getCharacterBattleVisual(char, state, config),
      normalizeCharacterSdImages: sdImages => ensureContentStateApi().normalizeCharacterSdImages(sdImages),
      makeFallbackImage: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity),
      esc: str => ensureAppUiApi().esc(str)
    });
    battleScreenModuleApi = window.BattleScreenModule.create({
      getCharacters: () => characters,
      getPartyFormation: () => partyFormation,
      getCurrentScreen: () => currentScreen,
      getSystemConfig: () => systemConfig,
      getBattleState: () => battleState,
      setBattleState: value => { battleState = value; },
      getBattleLoopTimer: () => battleLoopTimer,
      setBattleLoopTimer: value => { battleLoopTimer = value; },
      getDefaultBattleState: () => appStateGetDefaultBattleState(),
      normalizePartyFormation,
      battleControllerLib,
      battleEngineLib,
      battleStateLib,
      battleViewLib,
      getCharacterBattleVisual: (char, state = "idle", config = systemConfig) => ensureContentStateApi().getCharacterBattleVisual(char, state, config),
      normalizeCharacterSdImages: sdImages => ensureContentStateApi().normalizeCharacterSdImages(sdImages),
      makeFallbackImage: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity),
      esc: str => ensureAppUiApi().esc(str),
      renderBattleScreenExternal: () => renderBattleScreen()
    });
  }
  return battleScreenModuleApi;
}

function ensureAppRuntimeApi() {
  if (!appRuntimeModuleApi) {
    appRuntimeModuleApi = window.AppRuntimeLib.create({
      getProjects: () => projects,
      setProjects: value => { projects = value; },
      getCurrentProjectId: () => currentProjectId,
      setCurrentProjectId: value => { currentProjectId = value; },
      getCurrentMode: () => currentMode,
      setCurrentMode: value => { currentMode = normalizeAppMode(value); },
      applyAppMode,
      getCurrentScreen: () => currentScreen,
      setCurrentScreen: value => { currentScreen = value; },
      getFormationScreen: () => formationScreen,
      getGachaScreen: () => gachaScreen,
      getStoryScreen: () => storyScreen,
      getEventScreen: () => eventScreen,
      getCollectionScreen: () => collectionScreen,
      apiUrl,
      API,
      fetchJSON,
      postJSON,
      mergeCollectionState: (remoteItems, localItems) => ensureAppDataApi().mergeCollectionState(remoteItems, localItems),
      loadProjectRegistry: (key, fallback) => ensureAppDataApi().loadProjectRegistry(key, fallback),
      saveProjectRegistry: (key, data) => ensureAppDataApi().saveProjectRegistry(key, data),
      normalizeProjectRecord: project => window.AppRuntimeLib.normalizeProjectRecord(project),
      makeProjectRecord: name => window.AppRuntimeLib.makeProjectRecord(name),
      getCurrentProject: () => window.AppRuntimeLib.getCurrentProject(projects, currentProjectId),
      resetEditState: () => window.AppRuntimeLib.resetEditState(editState),
      syncProjectQuery: () => window.AppRuntimeLib.syncProjectQuery(currentProjectId),
      loadAllData: () => ensureAppDataApi().loadAllData(),
      resetEditorForms: () => ensureAppEditorApi().resetEditorForms(),
      renderAll: () => ensureAppUiApi().renderAll(),
      renderHome,
      renderBattleScreen,
      renderGachaScreen: () => gachaScreen?.renderGachaScreen?.(),
      renderStoryScreen: () => storyScreen?.renderStoryScreen?.(),
      renderEventScreen: () => eventScreen?.renderEventScreen?.(),
      renderCollectionScreen: () => collectionScreen?.renderCollectionScreen?.(),
      renderFormationScreen: () => formationScreen?.renderFormationScreen?.(),
      startBattleLoop,
      stopBattleLoop,
      closeHomeEditMode,
      showToast: message => toastShowToast(message),
      esc: value => escapeHtml(value)
    });
  }
  return appRuntimeModuleApi;
}

function getEditorLegacyMethod(name) {
  const legacyApi = editorScreen?.__legacyApi;
  if (legacyApi && typeof legacyApi[name] === "function") {
    return legacyApi[name];
  }
  const direct = editorScreen?.[name];
  if (typeof direct === "function") {
    return direct.bind(editorScreen);
  }
  return null;
}

function ensureAppDataApi() {
  if (!appDataModuleApi) {
    appDataModuleApi = window.AppDataLib.create({
      searchParams,
      roomId,
      getCurrentProjectId: () => currentProjectId,
      getPlayerState: () => playerState,
      setPlayerState: value => { playerState = value; },
      getBaseChars: () => baseChars,
      setBaseChars: value => { baseChars = value; },
      getCharacters: () => characters,
      setCharacters: value => { characters = value; },
      getEquipmentCards: () => equipmentCards,
      setEquipmentCards: value => { equipmentCards = value; },
      getStories: () => stories,
      setStories: value => { stories = value; },
      getGachas: () => gachas,
      setGachas: value => { gachas = value; },
      getSystemConfig: () => systemConfig,
      setSystemConfig: value => { systemConfig = value; },
      getPartyFormation: () => partyFormation,
      setPartyFormation: value => { partyFormation = value; },
      setBattleState: value => { battleState = value; },
      apiUrl,
      API,
      apiGet,
      apiPost,
      storageLoadLocal,
      storageSaveLocal,
      storageGetScopedStorageKey,
      getDefaultSystemConfig: () => appStateGetDefaultSystemConfig(getDefaultRarityMode()),
      getDefaultPlayerState: (projectId = currentProjectId, userId = null) => appStateGetDefaultPlayerState(projectId, userId),
      getDefaultPartyFormation: () => appStateGetDefaultPartyFormation(),
      getDefaultBattleState: () => appStateGetDefaultBattleState(),
      normalizeCharacterRecord: char => ensureContentStateApi().normalizeCharacterRecord(char),
      normalizeStoryRecord: story => ensureContentStateApi().normalizeStoryRecord(story),
      normalizeFolderList: list => ensureAppEditorApi().normalizeFolderList(list),
      normalizeLayoutAssetRecord: (asset, fallbackOwnerId = getCurrentLayoutOwnerId()) => appStateNormalizeLayoutAssetRecord(asset, fallbackOwnerId),
      normalizeAssetFoldersConfig: config => appStateNormalizeAssetFoldersConfig(config, getCurrentLayoutOwnerId()),
      createDefaultHomeAssetFolder: (ownerMemberId = getCurrentLayoutOwnerId()) => appStateCreateDefaultHomeAssetFolder(ownerMemberId),
      normalizePartyFormation,
      mergePlayerState,
      normalizePlayerCurrencies,
      getRecoveredCurrency,
      getCurrentScreen: () => currentScreen,
      renderHomeCurrencies: () => ensureAppHomeApi().renderHomeCurrencies()
    });
  }
  return appDataModuleApi;
}

function ensureAppUiApi() {
  if (!appUiModuleApi) {
    appUiModuleApi = window.AppUiLib.create({
      getCollectionScreen: () => collectionScreen,
      getFormationScreen: () => formationScreen,
      getEditorScreen: () => editorScreen,
      populateFolderSelects: () => ensureAppEditorApi().populateFolderSelects(),
      renderHome,
      renderBattleScreen,
      readFileAsDataUrl: imageReadFileAsDataUrl,
      makeBaseCharFallback: imageMakeBaseCharFallback,
      makeFallbackImage: imageMakeFallbackImage,
      esc: escapeHtml,
      showToast: toastShowToast,
      getSystemConfig: () => systemConfig,
      baseCharVoiceLineDefs,
      baseCharHomeVoiceDefs
    });
  }
  return appUiModuleApi;
}

function ensureAppHomeApi() {
  if (!appHomeModuleApi) {
    appHomeModuleApi = window.AppHomeLib.create({
      getCurrentScreen: () => currentScreen,
      getCharacters: () => characters,
      getStories: () => stories,
      getGachas: () => gachas,
      getBaseCharById: id => ensureContentStateApi().getBaseCharById(baseChars, id),
      getEffectiveHomeVoices: (card, baseChar) => ensureAppUiApi().getEffectiveHomeVoices(card, baseChar),
      getEffectiveHomeBirthdays: (card, baseChar) => ensureAppUiApi().getEffectiveHomeBirthdays(card, baseChar),
      getEffectiveHomeOpinions: (card, baseChar) => ensureAppUiApi().getEffectiveHomeOpinions(card, baseChar),
      getEffectiveHomeConversations: (card, baseChar) => ensureAppUiApi().getEffectiveHomeConversations(card, baseChar),
      isBaseCharBirthdayToday,
      isHomeEventActive,
      getSystemConfig: () => systemConfig,
      setSystemConfig: value => { systemConfig = value; },
      getPlayerState: () => playerState,
      setPlayerState: value => { playerState = value; },
      getCurrentProjectId: () => currentProjectId,
      getHomeConfigDraft: () => homeConfigDraft,
      setHomeConfigDraft: value => { homeConfigDraft = value; },
      getActiveHomeConfigTarget: () => activeHomeConfigTarget,
      setActiveHomeConfigTarget: value => { activeHomeConfigTarget = value; },
      getHomeConfigDrag: () => homeConfigDrag,
      setHomeConfigDrag: value => { homeConfigDrag = value; },
      getBattleState: () => battleState,
      getHomeDialogueState: () => homeDialogueState,
      setHomeDialogueState: value => { homeDialogueState = value; },
      getActiveGacha: () => activeGacha,
      getDefaultHomeConfig: () => appStateGetDefaultHomeConfig(),
      normalizeHomePreferences,
      loadLocal,
      saveLocal,
      postJSON,
      getPlayerApiUrl,
      API,
      getHomeLayoutPreset: (config = systemConfig) => appStateGetHomeLayoutPreset(config),
      getHomeCharacterBaseOffset: (layoutPreset, config, index) => appStateGetHomeCharacterBaseOffset(layoutPreset, config, index),
      syncRecoveredCurrenciesInMemory,
      formatCurrencyBalance,
      getCharacterImageForUsage: (char, usage = "default") => ensureContentStateApi().getCharacterImageForUsage(char, usage),
      makeFallbackImage: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity),
      buildGachaRateSummary: (rates = {}) => ensureContentStateApi().buildGachaRateSummary(rates),
      getBattleParty,
      getGachaHeroImages: gacha => ensureLayoutBridgeApi().getGachaHeroImages(gacha),
      normalizeLayoutAssetRecord: (asset, fallbackOwnerId = getCurrentLayoutOwnerId()) => appStateNormalizeLayoutAssetRecord(asset, fallbackOwnerId),
      getCurrentLayoutOwnerId: () => String(playerState?.profile?.userId || getCurrentPlayerId() || "local-editor").trim(),
      getHomeAssetFolders: (config = systemConfig) => appStateGetHomeAssetFolders(config, getCurrentLayoutOwnerId()),
      resolveHomeAssetFolderAssets: (folderOrId, config = systemConfig) => appStateResolveHomeAssetFolderAssets(folderOrId, config, getCurrentLayoutOwnerId()),
      upsertHomeLayoutAssetInConfig: (config, assetInput = {}) => appStateUpsertHomeLayoutAssetInConfig(config, assetInput, { ownerMemberId: getCurrentLayoutOwnerId(), defaultSystemConfig: () => appStateGetDefaultSystemConfig(getDefaultRarityMode()) }),
      persistSystemConfigState: () => ensureAppEditorApi().persistSystemConfigState(),
      renderHome,
      showToast: message => ensureAppUiApi().showToast(message),
      esc: str => ensureAppUiApi().esc(str),
      clamp: (value, min, max) => ensureAppUiApi().clamp(value, min, max)
    });
  }
  return appHomeModuleApi;
}

function ensureAppEditorApi() {
  if (!appEditorModuleApi) {
    appEditorModuleApi = window.AppEditorLib.create({
      getRoomId: () => roomId,
      getCurrentPlayerId,
      getCurrentProjectId: () => currentProjectId,
      getEditState: () => editState,
      getGachas: () => gachas,
      setGachas: value => { gachas = value; },
      getStories: () => stories,
      getCharacters: () => characters,
      getBaseChars: () => baseChars,
      getSystemConfig: () => systemConfig,
      setSystemConfig: value => { systemConfig = value; },
      getBaseCharEditor: () => baseCharEditor,
      getEntryEditor: () => entryEditor,
      getStoryEditor: () => storyEditor,
      getSystemEditor: () => systemEditor,
      getEditorScreen: () => editorScreen,
      readFileAsDataUrl: file => ensureAppUiApi().readFileAsDataUrl(file),
      getDefaultRates,
      getRarityModeConfig: (mode = systemConfig?.rarityMode) => rarityLibGetModeConfig(mode),
      getRarityLabel,
      getBaseCharById: id => ensureContentStateApi().getBaseCharById(baseChars, id),
      apiUrl,
      API,
      postJSON,
      saveLocal,
      renderHome,
      renderEditorScreen: () => getEditorLegacyMethod("renderEditorScreen")?.(),
      renderGachaPoolChars: selectedIds => ensureAppUiApi().renderGachaPoolChars(selectedIds),
      showToast: message => ensureAppUiApi().showToast(message),
      esc: str => ensureAppUiApi().esc(str),
      getDefaultSystemConfig
    });
  }
  return appEditorModuleApi;
}

function ensureContentStateApi() {
  if (!contentStateModuleApi) {
    contentStateModuleApi = contentStateFactory.create({
      clamp: (value, min, max) => ensureAppUiApi().clamp(value, min, max),
      normalizeRates,
      getRarityModeConfig,
      getRarityLabel
    });
  }
  return contentStateModuleApi;
}

function ensureEditorRuntimeApi() {
  if (!editorRuntimeModuleApi) {
    editorRuntimeModuleApi = window.EditorRuntimeLib.create({
      getCurrentScreen: () => currentScreen,
      setCurrentScreen: value => { currentScreen = value; },
      getEditorScreen: () => editorScreen,
      closeHomeEditMode,
      renderHome,
      showToast: message => ensureAppUiApi().showToast(message)
    });
  }
  return editorRuntimeModuleApi;
}

function ensureLayoutBridgeApi() {
  if (!layoutBridgeModuleApi) {
    layoutBridgeModuleApi = window.LayoutBridgeLib.create({
      getCharacters: () => characters,
      getCurrentLayoutOwnerId,
      getHomeAssetFolders: (config = systemConfig) => appStateGetHomeAssetFolders(config, String(playerState?.profile?.userId || getCurrentPlayerId() || "local-editor").trim()),
      resolveHomeAssetFolderAssets,
      resolveSharedAssetFolderAssets: (folder, allFolders = appStateGetHomeAssetFolders(systemConfig, String(playerState?.profile?.userId || getCurrentPlayerId() || "local-editor").trim()), allAssets = (systemConfig?.layoutAssets?.home || [])) => appStateResolveSharedAssetFolderAssets(folder, allFolders, allAssets, String(playerState?.profile?.userId || getCurrentPlayerId() || "local-editor").trim()),
      upsertHomeLayoutAssetInConfig: (config, assetInput = {}) => appStateUpsertHomeLayoutAssetInConfig(config, assetInput, { ownerMemberId: String(playerState?.profile?.userId || getCurrentPlayerId() || "local-editor").trim(), defaultSystemConfig: () => appStateGetDefaultSystemConfig(getDefaultRarityMode()) }),
      getHomeLayoutPreset,
      buildLayoutRuntimeState: () => ensureAppHomeApi().buildLayoutRuntimeState(),
      buildLayoutAssetMap: () => ensureAppHomeApi().buildLayoutAssetMap(),
      navigateTo,
      openEditorSurface,
      openHomeConfigPanel: () => window.openHomeConfigPanel?.(),
      getCharacterImageForUsage: (char, usage = "default") => ensureContentStateApi().getCharacterImageForUsage(char, usage),
      makeFallbackImage: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity)
    });
  }
  return layoutBridgeModuleApi;
}

function renderHome(reason = "refresh") {
  return ensureAppHomeApi().renderHome(reason);
}

function formatCurrencyBalance(currency, includeMax = false) {
  return playerStateFormatCurrencyBalance(currency, includeMax);
}

function renderBattleScreen() {
  return ensureBattleScreenApi().renderBattleScreen();
}

function getBattleParty() {
  return ensureBattleScreenApi().getBattleParty();
}

function startBattleLoop() {
  return ensureBattleScreenApi().startBattleLoop();
}

function stopBattleLoop() {
  return ensureBattleScreenApi().stopBattleLoop();
}

function ensureHomeCurrencyTimer() {
  return ensureAppDataApi().ensureHomeCurrencyTimer();
}

async function generateCharacterCropAssets(imageSrc, cropPresets = null) {
  return ensureContentStateApi().generateCharacterCropAssets(imageSrc, cropPresets);
}

async function generateCharacterCropImages(imageSrc, cropPresets = null) {
  return ensureContentStateApi().generateCharacterCropImages(imageSrc, cropPresets);
}

async function detectPrimaryFaceBox(image) {
  return ensureContentStateApi().detectPrimaryFaceBox ? ensureContentStateApi().detectPrimaryFaceBox(image) : null;
}

async function renderCropDataUrl(image, rect, outputWidth, outputHeight) {
  return ensureContentStateApi().renderCropDataUrl ? ensureContentStateApi().renderCropDataUrl(image, rect, outputWidth, outputHeight) : Promise.reject(new Error("Crop render helper unavailable."));
}

function clamp(value, min, max) {
  return ensureAppUiApi().clamp(value, min, max);
}

function esc(str) {
  return ensureAppUiApi().esc(str);
}

function showToast(message) {
  return ensureAppUiApi().showToast(message);
}
window.SociaLayoutBridge = ensureLayoutBridgeApi();






