// Active frontend bootstrap entry loaded by public/index.html.
// Keep this file focused on startup, wiring, and minimum global hooks.
window.__SOCIA_ACTIVE_RUNTIME__ = "app.js";
const ACTIVE_EDITOR_RUNTIME = "v1";

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
  normalizeTitleCollection: titleSystemNormalizeCollection,
  syncProfileTitles: titleSystemSyncProfileTitles,
  getActiveTitle: titleSystemGetActiveTitle
} = window.TitleSystemLib;
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
let announcements = [];
let stories = [];
let gachas = [];
let projects = [];
let systemConfig = appStateGetDefaultSystemConfig(getDefaultRarityMode());
let playerState = null;
let currentMode = APP_MODES.play;
let currentScreen = "title";
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
let musicEditor = null;
let announcementEditor = null;
let titleEditor = null;
let storyEditor = null;
let editorScreen = null;
let partyFormation = appStateGetDefaultPartyFormation();
let battleState = null;
let battleLoopTimer = null;
let appEditorRuntimeFactoryApi = null;
let appEditorBootstrapFactoryApi = null;
let appFactoryDepsBuilderApi = null;
let appApiRuntimeFactoryApi = null;
let appSingleRuntimeFactoryApi = null;
let appScreenRuntimeFactoryApi = null;
let appCoreRuntimeFactoryApi = null;
let appUiHomeRuntimeFactoryApi = null;
let appAuthProfileRuntimeFactoryApi = null;
let appEditorSectionRuntimeFactoryApi = null;
let appLayoutEditorRuntimeFactoryApi = null;
let appInitContentRuntimeFactoryApi = null;
let appBootstrapHelperFactoryApi = null;

const FONT_PRESET_MAP = {
  "zen-kaku-gothic-new": '"Zen Kaku Gothic New", "Hiragino Sans", sans-serif',
  "noto-sans-jp": '"Noto Sans JP", "Hiragino Sans", sans-serif',
  "m-plus-rounded-1c": '"M PLUS Rounded 1c", "Hiragino Sans", sans-serif',
  "yusei-magic": '"Yusei Magic", "Hiragino Sans", sans-serif',
  "dotgothic16": '"DotGothic16", monospace'
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
  announcementId: null,
  storyId: null,
  gachaId: null
};

function getActiveEditorRuntime() {
  return ACTIVE_EDITOR_RUNTIME;
}

// SECTION 01: runtime factory dependency bundles
function buildAppEditorBootstrapFactoryDeps() {
  return {
    runtimeName: ACTIVE_EDITOR_RUNTIME,
    currentProjectId: () => currentProjectId,
    getProjects: () => projects,
    getCurrentPlayerId,
    getBaseChars: () => baseChars,
    getCharacters: () => characters,
    getAnnouncements: () => announcements,
    getStories: () => stories,
    getGachas: () => gachas,
    getSystemConfig: () => systemConfig,
    setSystemConfig: value => { setSystemConfigState(value); },
    getEditingFeaturedIds: () => ensureAppEditorApi().getEditingFeaturedIds(),
    getRarityCssClass,
    getRarityLabel,
    makeFallbackImage: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity),
    buildStorySummary: story => ensureContentStateApi().buildStorySummary(story),
    buildGachaRateSummary: (rates = {}) => ensureContentStateApi().buildGachaRateSummary(rates),
    esc: str => ensureAppUiApi().esc(str),
    beginGachaEdit: id => ensureAppEditorApi().beginGachaEdit(id),
    navigateTo,
    setActiveGacha: value => { activeGacha = value; },
    populateBaseCharSelects: () => ensureAppEditorApi().populateBaseCharSelects(),
    populateFolderSelects: () => ensureAppEditorApi().populateFolderSelects(),
    updateEditorSubmitLabels: () => ensureAppEditorApi().updateEditorSubmitLabels(),
    handleCreateProject: () => ensureAppRuntimeApi().handleCreateProject(),
    renameProject: (projectId, nextName) => ensureAppRuntimeApi().renameProject(projectId, nextName),
    switchProject: projectId => ensureAppRuntimeApi().switchProject(projectId),
    createContentFolder: kind => ensureAppEditorApi().createContentFolder(kind),
    persistSystemConfigState: () => ensureAppEditorApi().persistSystemConfigState(),
    openShareSettings: () => ensureAppEditorApi().handleShare(),
    getShareManagementSummary: () => ensureAppEditorApi().getShareManagementSummary(currentProjectId),
    rotateCollaborativeShare: () => ensureAppEditorApi().rotateCollaborativeShare(currentProjectId),
    createPublicShare: () => ensureAppEditorApi().createPublicShare(currentProjectId),
    listProjectMembers: () => ensureAppEditorApi().listProjectMembers(currentProjectId),
    inviteProjectMember: (targetUserId, role) => ensureAppEditorApi().inviteProjectMember(currentProjectId, targetUserId, role),
    updateProjectMemberRole: (targetUserId, role) => ensureAppEditorApi().updateProjectMemberRole(currentProjectId, targetUserId, role),
    setEditMode: () => setAppMode(APP_MODES.edit),
    openHomeEditMode: () => ensureAppHomeApi().openHomeEditMode(),
    closeHomeEditMode: () => ensureAppHomeApi().closeHomeEditMode(),
    getCurrentScreen: () => currentScreen,
    setPlayMode: () => setAppMode(APP_MODES.play)
  };
}

function buildAppApiRuntimeFactoryDeps() {
  return {
    getRoomId: () => roomId,
    getCollabToken: () => collabToken,
    getPublicShareToken: () => publicShareToken,
    getCurrentProjectId: () => currentProjectId,
    getCurrentPlayerId,
    postJSON: (url, data) => ensureAppDataApi().postJSON(url, data),
    onFeatureAccessError: error => {
      console.error("Failed to load editor feature access:", error);
    }
  };
}

function buildAppSingleRuntimeFactoryDeps() {
  return {
    getSystemConfig: () => systemConfig,
    getProjectName: () => window.AppRuntimeLib.getCurrentProject(projects, currentProjectId)?.name || projects[0]?.name || "Socia Maker",
    navigateToHome: () => navigateTo("home"),
    saveLocal,
    postJSON,
    getSystemApiUrl: query => apiUrl(API.system, { query }),
    getCurrentPlayerId,
    showToast: message => ensureAppUiApi().showToast(message)
  };
}

function buildAppLegacyBridgeDeps() {
  return {
    openEditorSurface: (tabName = null, screen = currentScreen) => ensureEditorRuntimeApi().openEditorSurface(tabName, screen),
    setEditMode: () => setAppMode(APP_MODES.edit),
    openEditorScreen: (tabName = null) => ensureEditorRuntimeApi().openEditorScreen(tabName),
    setPlayMode: () => setAppMode(APP_MODES.play),
    closeEditorScreen: () => ensureEditorRuntimeApi().closeEditorScreen(),
    fetchJSON: url => ensureAppDataApi().fetchJSON(url),
    postJSON: (url, data) => ensureAppDataApi().postJSON(url, data),
    loadLocal: (key, fallback) => ensureAppDataApi().loadLocal(key, fallback),
    saveLocal: (key, data) => ensureAppDataApi().saveLocal(key, data),
    getCurrentPlayerId: () => ensureAppDataApi().getCurrentPlayerId(),
    getPlayerIdentityScope: () => ensureAppDataApi().getPlayerIdentityScope(),
    getPlayerApiUrl: path => ensureAppDataApi().getPlayerApiUrl(path),
    updateLocalProfileMeta: updater => ensureAppAuthProfileRuntimeFactoryApi().ensureProfileRuntimeApi().persistProfileMeta(updater),
    syncPlayerTitles: (options = {}) => ensureAppAuthProfileRuntimeFactoryApi().ensureProfileRuntimeApi().syncTitles(options),
    getScopedStorageKey: key => ensureAppDataApi().getScopedStorageKey(key),
    getPlayerStoryProgress: storyId => ensureAppDataApi().getPlayerStoryProgress(storyId),
    upsertPlayerStoryProgress: nextItem => ensureAppDataApi().upsertPlayerStoryProgress(nextItem),
    upsertInventoryRecord: nextItem => ensureAppDataApi().upsertInventoryRecord(nextItem),
    getOwnedCardCount: cardId => getOwnedCardCountLocal(cardId),
    getOwnedEquipmentCount: equipmentId => getOwnedEquipmentCountLocal(equipmentId),
    getCardInstances: (cardId = "") => ensureAppDataApi().getCardInstances(cardId),
    getEquipmentInstances: (equipmentId = "") => ensureAppDataApi().getEquipmentInstances(equipmentId),
    getCardInstance: instanceId => ensureAppDataApi().getCardInstance(instanceId),
    getEquipmentInstance: instanceId => ensureAppDataApi().getEquipmentInstance(instanceId),
    getCardInstanceGrowth: instanceId => ensureAppDataApi().getCardInstanceGrowth(instanceId),
    getEquipmentInstanceGrowth: instanceId => ensureAppDataApi().getEquipmentInstanceGrowth(instanceId),
    getCardGrowth: cardId => ensureAppDataApi().getCardGrowth(cardId),
    getEquipmentGrowth: equipmentId => ensureAppDataApi().getEquipmentGrowth(equipmentId),
    getGrowthResources: () => ensureAppDataApi().getGrowthResources(),
    setCardLockedCopies: (cardId, value) => ensureAppDataApi().setCardLockedCopies(cardId, value),
    setEquipmentLockedCopies: (equipmentId, value) => ensureAppDataApi().setEquipmentLockedCopies(equipmentId, value),
    enhanceCard: cardId => ensureAppDataApi().enhanceCard(cardId),
    enhanceEquipment: equipmentId => ensureAppDataApi().enhanceEquipment(equipmentId),
    enhanceCardInstance: instanceId => ensureAppDataApi().enhanceCardInstance(instanceId),
    enhanceEquipmentInstance: instanceId => ensureAppDataApi().enhanceEquipmentInstance(instanceId),
    evolveCard: cardId => ensureAppDataApi().evolveCard(cardId),
    evolveEquipment: equipmentId => ensureAppDataApi().evolveEquipment(equipmentId),
    evolveCardInstance: instanceId => ensureAppDataApi().evolveCardInstance(instanceId),
    evolveEquipmentInstance: instanceId => ensureAppDataApi().evolveEquipmentInstance(instanceId),
    limitBreakCard: cardId => ensureAppDataApi().limitBreakCard(cardId),
    limitBreakEquipment: equipmentId => ensureAppDataApi().limitBreakEquipment(equipmentId),
    limitBreakCardInstance: (instanceId, materialInstanceId) => ensureAppDataApi().limitBreakCardInstance(instanceId, materialInstanceId),
    limitBreakEquipmentInstance: (instanceId, materialInstanceId) => ensureAppDataApi().limitBreakEquipmentInstance(instanceId, materialInstanceId),
    convertCardDuplicates: (cardId, target, amount) => ensureAppDataApi().convertCardDuplicates(cardId, target, amount),
    convertEquipmentDuplicates: (equipmentId, target, amount) => ensureAppDataApi().convertEquipmentDuplicates(equipmentId, target, amount),
    convertSelectedCharacterCards: (selectionCounts, options) => ensureAppDataApi().convertSelectedCharacterCards(selectionCounts, options),
    convertSelectedEquipmentCards: (selectionCounts, options) => ensureAppDataApi().convertSelectedEquipmentCards(selectionCounts, options),
    convertSelectedCharacterInstances: (instanceIds, options) => ensureAppDataApi().convertSelectedCharacterInstances(instanceIds, options),
    convertSelectedEquipmentInstances: (instanceIds, options) => ensureAppDataApi().convertSelectedEquipmentInstances(instanceIds, options),
    convertStaminaToGrowthPoints: (amount, options) => ensureAppDataApi().convertStaminaToGrowthPoints(amount, options)
  };
}

function buildAppSharedFacadeDeps() {
  return {
    renderHome: reason => ensureAppBootstrapHelperFactoryApi().renderHome(reason),
    formatCurrencyBalance: (currency, includeMax = false) => ensureAppBootstrapHelperFactoryApi().formatCurrencyBalance(currency, includeMax),
    renderBattleScreen: () => ensureAppBootstrapHelperFactoryApi().renderBattleScreen(),
    getBattleParty: () => ensureAppBootstrapHelperFactoryApi().getBattleParty(),
    startBattleLoop: () => ensureAppBootstrapHelperFactoryApi().startBattleLoop(),
    stopBattleLoop: () => ensureAppBootstrapHelperFactoryApi().stopBattleLoop(),
    ensureHomeCurrencyTimer: () => ensureAppBootstrapHelperFactoryApi().ensureHomeCurrencyTimer(),
    generateCharacterCropAssets: (imageSrc, cropPresets = null) => ensureAppBootstrapHelperFactoryApi().generateCharacterCropAssets(imageSrc, cropPresets),
    generateCharacterCropImages: (imageSrc, cropPresets = null) => ensureAppBootstrapHelperFactoryApi().generateCharacterCropImages(imageSrc, cropPresets),
    detectPrimaryFaceBox: image => ensureAppBootstrapHelperFactoryApi().detectPrimaryFaceBox(image),
    renderCropDataUrl: (image, rect, outputWidth, outputHeight) => ensureAppBootstrapHelperFactoryApi().renderCropDataUrl(image, rect, outputWidth, outputHeight),
    clamp: (value, min, max) => ensureAppBootstrapHelperFactoryApi().clamp(value, min, max),
    esc: str => ensureAppBootstrapHelperFactoryApi().esc(str),
    showToast: message => ensureAppBootstrapHelperFactoryApi().showToast(message)
  };
}

function buildAppScreenRuntimeFactoryDeps() {
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

  return ensureAppFactoryDepsBuilderApi().buildAppScreenRuntimeDeps({
    battleControllerLib,
    battleEngineLib,
    battleStateLib,
    battleViewLib
  });
}

function buildAppInitContentRuntimeFactoryDeps() {
  return {
    contentStateFactory,
    clamp: (value, min, max) => ensureAppUiApi().clamp(value, min, max),
    normalizeRates,
    getRarityModeConfig,
    getRarityLabel,
    applyAppMode,
    currentMode,
    ensureAuthUi: () => ensureAppAuthApi().ensureUi(),
    restoreSession: () => ensureAppAuthApi().restoreSession(),
    ensureEditorFolderControls: () => ensureAppEditorApi().ensureEditorFolderControls(),
    setupCollectionScreen: () => ensureAppScreenRuntimeFactoryApi().ensureCollectionScreenRuntimeApi().setup(),
    setupFormationScreen: () => ensureAppScreenRuntimeFactoryApi().ensureFormationScreenRuntimeApi().setup(),
    setupGachaScreen: () => ensureAppScreenRuntimeFactoryApi().ensureGachaScreenRuntimeApi().setup(),
    setupStoryScreen: () => ensureAppScreenRuntimeFactoryApi().ensureStoryScreenRuntimeApi().setup(),
    setupEventScreen: () => ensureAppScreenRuntimeFactoryApi().ensureEventScreenRuntimeApi().setup(),
    setupSystemEditor: () => ensureAppEditorSectionRuntimeFactoryApi().ensureSystemEditorRuntimeApi().setup(),
    setupEntryEditor: () => ensureAppEditorSectionRuntimeFactoryApi().ensureEntryEditorRuntimeApi().setup(),
    setupEquipmentCardEditor: () => ensureAppEditorSectionRuntimeFactoryApi().ensureEquipmentCardEditorRuntimeApi().setup(),
    setupBaseCharEditor: () => ensureAppEditorSectionRuntimeFactoryApi().ensureBaseCharEditorRuntimeApi().setup(),
    setupMusicEditor: () => ensureAppEditorSectionRuntimeFactoryApi().ensureMusicEditorRuntimeApi().setup(),
    setupAnnouncementEditor: () => ensureAppEditorSectionRuntimeFactoryApi().ensureAnnouncementEditorRuntimeApi().setup(),
    setupTitleEditor: () => ensureAppEditorSectionRuntimeFactoryApi().ensureTitleEditorRuntimeApi().setup(),
    setupStoryEditor: () => ensureAppEditorSectionRuntimeFactoryApi().ensureStoryEditorRuntimeApi().setup(),
    createEditorScreen: deps => ensureAppEditorBootstrapFactoryApi().createActiveEditorScreen(deps),
    buildEditorScreenDeps: modules => buildActiveEditorScreenDeps(modules),
    configurePrimaryNavigation: options => ensureAppRuntimeApi().configurePrimaryNavigation(options),
    openEditorScreen,
    ensureBattleEntryButton: go => ensureAppRuntimeApi().ensureBattleEntryButton(go),
    setupNavigation: () => ensureAppRuntimeApi().setupNavigation(),
    setupEditorOverlay: () => ensureEditorRuntimeApi().setupEditorOverlay(),
    bindEditorOverlayTabs: () => ensureEditorRuntimeApi().bindEditorOverlayTabs(),
    disableLegacyEditorUi: () => ensureEditorRuntimeApi().disableLegacyEditorUi(),
    setupEditorForms: () => ensureAppEditorApi().setupForms(),
    setupEditorPreviews: () => ensureAppEditorApi().setupPreviews(),
    setupHomeConfig: () => ensureAppHomeApi().setupHomeConfig(),
    setupHomeInteractions: () => ensureAppHomeApi().setupHomeInteractions(),
    setupBattleControls: () => ensureBattleScreenApi().setupBattleControls(),
    initializeProjects: () => ensureAppRuntimeApi().initializeProjects(),
    loadAllData: () => ensureAppDataApi().loadAllData(),
    syncPlayerTitles: options => syncPlayerTitles(options),
    applyOrientation: () => ensureAppRuntimeApi().applyOrientation(systemConfig),
    renderAll: () => ensureAppUiApi().renderAll(),
    setupTitleScreen: () => ensureTitleScreenApi().setup(),
    syncPlayerProfile: () => ensureAppAuthApi().syncPlayerProfile(),
    getInitialScreen: () => ensureTitleScreenApi().getInitialScreen(),
    navigateTo,
    promptForProfileSetup: () => ensureAppAuthApi().promptForProfileSetup()
  };
}

// SECTION 02: runtime factory ensure helpers
function ensureAppEditorBootstrapFactoryApi() {
  if (!appEditorBootstrapFactoryApi) {
    appEditorBootstrapFactoryApi = window.AppEditorBootstrapFactoryLib.create(buildAppEditorBootstrapFactoryDeps());
  }
  return appEditorBootstrapFactoryApi;
}

function ensureAppApiRuntimeFactoryApi() {
  if (!appApiRuntimeFactoryApi) {
    appApiRuntimeFactoryApi = window.AppApiRuntimeFactoryLib.create(buildAppApiRuntimeFactoryDeps());
  }
  return appApiRuntimeFactoryApi;
}

function ensureAppSingleRuntimeFactoryApi() {
  if (!appSingleRuntimeFactoryApi) {
    appSingleRuntimeFactoryApi = window.AppSingleRuntimeFactoryLib.create(buildAppSingleRuntimeFactoryDeps());
  }
  return appSingleRuntimeFactoryApi;
}

const {
  openEditorSurface,
  openEditorScreen,
  closeEditorScreen,
  fetchJSON,
  postJSON,
  loadLocal,
  saveLocal,
  getCurrentPlayerId,
  getPlayerIdentityScope,
  getPlayerApiUrl,
  updateLocalProfileMeta,
  syncPlayerTitles,
  getScopedStorageKey,
  getPlayerStoryProgress,
  upsertPlayerStoryProgress,
  upsertInventoryRecord,
  getOwnedCardCount,
  getOwnedEquipmentCount,
  getCardInstances,
  getEquipmentInstances,
  getCardInstance,
  getEquipmentInstance,
  getCardInstanceGrowth,
  getEquipmentInstanceGrowth,
  getCardGrowth,
  getEquipmentGrowth,
  getGrowthResources,
  setCardLockedCopies,
  setEquipmentLockedCopies,
  enhanceCard,
  enhanceEquipment,
  enhanceCardInstance,
  enhanceEquipmentInstance,
  evolveCard,
  evolveEquipment,
  evolveCardInstance,
  evolveEquipmentInstance,
  limitBreakCard,
  limitBreakEquipment,
  limitBreakCardInstance,
  limitBreakEquipmentInstance,
  convertCardDuplicates,
  convertEquipmentDuplicates,
  convertSelectedCharacterCards,
  convertSelectedEquipmentCards,
  convertSelectedCharacterInstances,
  convertSelectedEquipmentInstances,
  convertStaminaToGrowthPoints
} = window.AppLegacyBridgeFactoryLib.create(buildAppLegacyBridgeDeps());

const API = ensureAppApiRuntimeFactoryApi().API;
const apiUrl = (...args) => ensureAppApiRuntimeFactoryApi().apiUrl(...args);
const {
  renderHome,
  formatCurrencyBalance,
  renderBattleScreen,
  getBattleParty,
  startBattleLoop,
  stopBattleLoop,
  ensureHomeCurrencyTimer,
  generateCharacterCropAssets,
  generateCharacterCropImages,
  detectPrimaryFaceBox,
  renderCropDataUrl,
  clamp,
  esc,
  showToast
} = window.AppSharedFacadeFactoryLib.create(buildAppSharedFacadeDeps());

const getDefaultSystemConfig = () => appStateGetDefaultSystemConfig(getDefaultRarityMode());
const getDefaultPlayerState = (projectId = currentProjectId, userId = null) => appStateGetDefaultPlayerState(projectId, userId);
const getDefaultCurrencies = () => appStateGetDefaultCurrencies();
const getDefaultHomeConfig = () => appStateGetDefaultHomeConfig();
const getHomeLayoutPreset = (config = systemConfig) => appStateGetHomeLayoutPreset(config);
const getHomeCharacterBaseOffset = (layoutPreset, config, index) => appStateGetHomeCharacterBaseOffset(layoutPreset, config, index);
const getDefaultPartyFormation = () => appStateGetDefaultPartyFormation();
const getAuthenticatedUser = () => ensureAppAuthApi().getCurrentUser?.() || null;
const getAuthenticatedUserId = () => String(getAuthenticatedUser()?.id || "").trim();
const getOwnedCardCountLocal = cardId => {
  const key = String(cardId || "").trim();
  if (!key) return 0;
  const item = (Array.isArray(playerState?.inventory) ? playerState.inventory : [])
    .find(entry => String(entry?.cardId || "").trim() === key);
  return Math.max(0, Number(item?.quantity || 0));
};
const getOwnedEquipmentCountLocal = equipmentId => {
  const key = String(equipmentId || "").trim();
  if (!key) return 0;
  const item = (Array.isArray(playerState?.equipmentInventory) ? playerState.equipmentInventory : [])
    .find(entry => String(entry?.equipmentId || "").trim() === key);
  return Math.max(0, Number(item?.quantity || 0));
};
const getCurrentProjectRecord = () => window.AppRuntimeLib.getCurrentProject(projects, currentProjectId);
const isCurrentProjectOwner = () => {
  const currentProject = getCurrentProjectRecord();
  if (!currentProject) return false;
  const authenticatedUserId = getAuthenticatedUserId();
  const profileUserId = getPlayerProfileUserId();
  const effectiveUserId = authenticatedUserId || profileUserId;
  if (!effectiveUserId) return false;
  const ownerUserId = String(currentProject.ownerUserId || currentProject.owner_user_id || "").trim();
  const memberRole = String(currentProject.memberRole || currentProject.member_role || "").trim();
  if (!ownerUserId && !memberRole) return true;
  return ownerUserId === effectiveUserId || memberRole === "owner";
};
const canOpenEditorSurface = () => isCurrentProjectOwner();
const getEditorAccessDeniedMessage = () => {
  if (!getAuthenticatedUserId()) {
    return "編集画面を開くにはログインが必要です";
  }
  return "このプロジェクトを編集できるのは所有者のみです";
};
const getPlayerProfileUserId = () => String(playerState?.profile?.userId || "").trim();
const getCurrentLayoutOwnerId = () => getPlayerProfileUserId() || getCurrentPlayerId() || "local-editor";
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

function applyGameFontPreset(config = systemConfig) {
  const preset = String(config?.fontPreset || "").trim();
  const family = FONT_PRESET_MAP[preset] || FONT_PRESET_MAP["zen-kaku-gothic-new"];
  document.documentElement.style.setProperty("--app-font-family", family);
}

function setSystemConfigState(value) {
  systemConfig = value;
  applyGameFontPreset(systemConfig);
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
// ---------------------------------------------------------------------------
// Bootstrap / init
// ---------------------------------------------------------------------------
void init();

async function init() {
  const modules = await ensureAppInitRuntimeApi().init();
  collectionScreen = modules?.collectionScreen || null;
  formationScreen = modules?.formationScreen || null;
  gachaScreen = modules?.gachaScreen || null;
  storyScreen = modules?.storyScreen || null;
  eventScreen = modules?.eventScreen || null;
  systemEditor = modules?.systemEditor || null;
  entryEditor = modules?.entryEditor || null;
  equipmentCardEditor = modules?.equipmentCardEditor || null;
  baseCharEditor = modules?.baseCharEditor || null;
  musicEditor = modules?.musicEditor || null;
  announcementEditor = modules?.announcementEditor || null;
  titleEditor = modules?.titleEditor || null;
  storyEditor = modules?.storyEditor || null;
  editorScreen = modules?.editorScreen || null;
}

// ---------------------------------------------------------------------------
// Navigation / mode bridges
// ---------------------------------------------------------------------------
function navigateTo(screen) {
  return ensureAppRuntimeApi().navigateTo(screen);
}

// ---------------------------------------------------------------------------
// Editor bootstrap wiring
// ---------------------------------------------------------------------------
function buildActiveEditorScreenDeps(modules = {}) {
  return ensureAppEditorBootstrapFactoryApi().buildActiveEditorScreenDeps(modules);
}

function openHomeEditMode() {
  return ensureAppEditorBootstrapFactoryApi().openHomeEditMode();
}

function closeHomeEditMode() {
  return ensureAppEditorBootstrapFactoryApi().closeHomeEditMode();
}

// ---------------------------------------------------------------------------
// Legacy global bridges
// ---------------------------------------------------------------------------
// Legacy overlay/editor modules still consume these runtime hooks directly.
window.navigateTo = navigateTo;
window.openEditorScreen = openEditorScreen;
window.closeEditorScreen = closeEditorScreen;
window.__SOCIA_ACTIVE_EDITOR_RUNTIME__ = getActiveEditorRuntime();

async function getEditorFeatureAccess(options = {}) {
  return ensureAppApiRuntimeFactoryApi().getEditorFeatureAccess(options);
}

// ---------------------------------------------------------------------------
// Shared runtime facades
// ---------------------------------------------------------------------------
function ensureAppInitRuntimeApi() {
  return ensureAppInitContentRuntimeFactoryApi().ensureAppInitRuntimeApi();
}

function getEffectivePlayerCurrency(key, nowMs = Date.now()) {
  return ensureAppDataApi().getEffectivePlayerCurrency(key, nowMs);
}

function syncRecoveredCurrenciesInMemory(nowMs = Date.now()) {
  return ensureAppDataApi().syncRecoveredCurrenciesInMemory(nowMs);
}

// ---------------------------------------------------------------------------
// Runtime factories / ensure*Api
// ---------------------------------------------------------------------------
function ensureBattleScreenApi() {
  return ensureAppScreenRuntimeFactoryApi().ensureBattleScreenApi();
}

function ensureAppScreenRuntimeFactoryApi() {
  if (!appScreenRuntimeFactoryApi) {
    appScreenRuntimeFactoryApi = window.AppScreenRuntimeFactoryLib.create(
      buildAppScreenRuntimeFactoryDeps()
    );
  }
  return appScreenRuntimeFactoryApi;
}

function ensureAppRuntimeApi() {
  return ensureAppCoreRuntimeFactoryApi().ensureAppRuntimeApi();
}

function getEditorLegacyMethod(name) {
  const direct = editorScreen?.[name];
  if (typeof direct === "function") {
    return direct.bind(editorScreen);
  }
  return null;
}

function ensureAppDataApi() {
  return ensureAppCoreRuntimeFactoryApi().ensureAppDataApi();
}

// SECTION 03: thin runtime-factory cluster
// These wrappers intentionally stay in app.js because they are orchestration entrypoints,
// but their dependency bundles now live in named builder helpers above.
function ensureAppUiHomeRuntimeFactoryApi() {
  if (!appUiHomeRuntimeFactoryApi) {
    appUiHomeRuntimeFactoryApi = window.AppUiHomeRuntimeFactoryLib.create(
      ensureAppFactoryDepsBuilderApi().buildAppUiHomeRuntimeDeps()
    );
  }
  return appUiHomeRuntimeFactoryApi;
}

function ensureAppEditorRuntimeFactoryApi() {
  if (!appEditorRuntimeFactoryApi) {
    appEditorRuntimeFactoryApi = window.AppEditorRuntimeFactoryLib.create(
      ensureAppFactoryDepsBuilderApi().buildAppEditorRuntimeDeps()
    );
  }
  return appEditorRuntimeFactoryApi;
}

function ensureAppAuthProfileRuntimeFactoryApi() {
  if (!appAuthProfileRuntimeFactoryApi) {
    appAuthProfileRuntimeFactoryApi = window.AppAuthProfileRuntimeFactoryLib.create(
      ensureAppFactoryDepsBuilderApi().buildAppAuthProfileRuntimeDeps()
    );
  }
  return appAuthProfileRuntimeFactoryApi;
}

function ensureAppEditorSectionRuntimeFactoryApi() {
  if (!appEditorSectionRuntimeFactoryApi) {
    appEditorSectionRuntimeFactoryApi = window.AppEditorSectionRuntimeFactoryLib.create(
      ensureAppFactoryDepsBuilderApi().buildAppEditorSectionRuntimeDeps()
    );
  }
  return appEditorSectionRuntimeFactoryApi;
}

function ensureAppLayoutEditorRuntimeFactoryApi() {
  if (!appLayoutEditorRuntimeFactoryApi) {
    appLayoutEditorRuntimeFactoryApi = window.AppLayoutEditorRuntimeFactoryLib.create(
      ensureAppFactoryDepsBuilderApi().buildAppLayoutEditorRuntimeDeps()
    );
  }
  return appLayoutEditorRuntimeFactoryApi;
}

function ensureAppInitContentRuntimeFactoryApi() {
  if (!appInitContentRuntimeFactoryApi) {
    appInitContentRuntimeFactoryApi = window.AppInitContentRuntimeFactoryLib.create(
      buildAppInitContentRuntimeFactoryDeps()
    );
  }
  return appInitContentRuntimeFactoryApi;
}

function buildAppFactoryDepsBuilderDeps() {
  return {
      searchParams,
      roomId,
      getAuthenticatedUserId,
      getCurrentProjectId: () => currentProjectId,
      getProjects: () => projects,
      setProjects: value => { projects = value; },
      getCurrentPlayerId,
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
      getPlayerState: () => playerState,
      setPlayerState: value => { playerState = value; },
      getBaseChars: () => baseChars,
      setBaseChars: value => { baseChars = value; },
      getCharacters: () => characters,
      setCharacters: value => { characters = value; },
      getEquipmentCards: () => equipmentCards,
      setEquipmentCards: value => { equipmentCards = value; },
      getAnnouncements: () => announcements,
      setAnnouncements: value => { announcements = value; },
      getStories: () => stories,
      setStories: value => { stories = value; },
      getGachas: () => gachas,
      setGachas: value => { gachas = value; },
      getSystemConfig: () => systemConfig,
      setSystemConfig: value => { setSystemConfigState(value); },
      getPartyFormation: () => partyFormation,
      setPartyFormation: value => { partyFormation = value; },
      getBattleState: () => battleState,
      setBattleState: value => { battleState = value; },
      setCurrentProjectId: value => { currentProjectId = value; },
      apiUrl,
      API,
      apiGet,
      apiPost,
      fetchJSON,
      postJSON,
      createProfileActions: deps => window.ProfileActionsLib?.create?.(deps) || null,
      createAuthSessionRuntime: deps => window.AuthSessionRuntimeLib?.create?.(deps) || null,
      createAuthPanelUi: () => window.AuthPanelUiLib?.create?.() || null,
      storageLoadLocal,
      storageSaveLocal,
      storageGetScopedStorageKey,
      getDefaultRarityMode,
      getDefaultSystemConfig: mode => appStateGetDefaultSystemConfig(mode),
      getDefaultPlayerState: (projectId = currentProjectId, userId = null) => appStateGetDefaultPlayerState(projectId, userId),
      getDefaultPartyFormation: () => appStateGetDefaultPartyFormation(),
      getDefaultBattleState: () => appStateGetDefaultBattleState(),
      normalizeCharacterRecord: char => ensureContentStateApi().normalizeCharacterRecord(char),
      normalizeStoryRecord: story => ensureContentStateApi().normalizeStoryRecord(story),
      normalizeFolderList: list => ensureAppEditorApi().normalizeFolderList(list),
      normalizeLayoutAssetRecord: (asset, fallbackOwnerId = getCurrentLayoutOwnerId()) => appStateNormalizeLayoutAssetRecord(asset, fallbackOwnerId),
      normalizeAssetFoldersConfig: config => appStateNormalizeAssetFoldersConfig(config, getCurrentLayoutOwnerId()),
      createDefaultHomeAssetFolder: (ownerMemberId = getCurrentLayoutOwnerId()) => appStateCreateDefaultHomeAssetFolder(ownerMemberId),
      normalizeProjectRecord: project => window.AppRuntimeLib.normalizeProjectRecord(project),
      makeProjectRecord: name => window.AppRuntimeLib.makeProjectRecord(name),
      getCurrentProject: () => window.AppRuntimeLib.getCurrentProject(projects, currentProjectId),
      resetEditState: () => window.AppRuntimeLib.resetEditState(editState),
      syncProjectQuery: () => window.AppRuntimeLib.syncProjectQuery(currentProjectId),
      normalizePartyFormation: formation => ensureAppBootstrapHelperFactoryApi().normalizePartyFormation(formation),
      mergePlayerState: (remoteState, localState) => ensureAppBootstrapHelperFactoryApi().mergePlayerState(remoteState, localState),
      normalizePlayerCurrencies: currencies => ensureAppBootstrapHelperFactoryApi().normalizePlayerCurrencies(currencies),
      getRecoveredCurrency: (currency, nowMs = Date.now()) => ensureAppBootstrapHelperFactoryApi().getRecoveredCurrency(currency, nowMs),
      mergeCollectionState: (remoteItems, localItems) => ensureAppDataApi().mergeCollectionState(remoteItems, localItems),
      loadProjectRegistry: (key, fallback) => ensureAppDataApi().loadProjectRegistry(key, fallback),
      saveProjectRegistry: (key, data) => ensureAppDataApi().saveProjectRegistry(key, data),
      loadAllData: () => ensureAppDataApi().loadAllData(),
      resetEditorForms: () => ensureAppEditorApi().resetEditorForms(),
      renderAll: () => ensureAppUiApi().renderAll(),
      renderHome: reason => ensureAppBootstrapHelperFactoryApi().renderHome(reason),
      renderBattleScreen: () => ensureAppBootstrapHelperFactoryApi().renderBattleScreen(),
      startBattleLoop: () => ensureAppBootstrapHelperFactoryApi().startBattleLoop(),
      stopBattleLoop: () => ensureAppBootstrapHelperFactoryApi().stopBattleLoop(),
      closeHomeEditMode,
      showToast: message => toastShowToast(message),
      esc: value => escapeHtml(value),
      renderHomeCurrencies: () => ensureAppHomeApi().renderHomeCurrencies(),
      getCurrentLayoutOwnerId,
      getCharactersForScreen: () => characters,
      getEquipmentCardsForScreen: () => equipmentCards,
      getGachasForScreen: () => gachas,
      getStoriesForScreen: () => stories,
      getPlayerStateForScreen: () => playerState,
      getPartyFormationForScreen: () => partyFormation,
      setPartyFormationForScreen: next => {
        partyFormation = ensureAppBootstrapHelperFactoryApi().normalizePartyFormation(next);
        saveLocal("socia-party-formation", partyFormation);
        syncPlayerTitles({ showToast: true, render: false });
      },
      getCurrentStoryType: () => currentStoryType,
      setCurrentStoryType: value => { currentStoryType = value; },
      getStoryReaderState: () => storyReaderState,
      setStoryReaderState: value => { storyReaderState = value; },
      getActiveGacha: () => activeGacha,
      setActiveGacha: value => { activeGacha = value; },
      getBattleStateForScreen: () => battleState,
      setBattleStateForScreen: value => { battleState = value; },
      getBattleLoopTimer: () => battleLoopTimer,
      setBattleLoopTimer: value => { battleLoopTimer = value; },
      getPlayerCurrencyAmount: key => ensureAppDataApi().getPlayerCurrencyAmount(key),
      getOwnedCount: getOwnedCardCount,
      getOwnedEquipmentCount,
      getCardInstances,
      getEquipmentInstances,
      getCardInstance,
      getEquipmentInstance,
      getCardInstanceGrowth,
      getEquipmentInstanceGrowth,
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
      getBaseCharById: id => ensureContentStateApi().getBaseCharById(baseChars, id),
      findCharacterImageByName: name => ensureContentStateApi().findCharacterImageByName(characters, name),
      resolveScenePortrait: (story, baseChar, scene) => ensureContentStateApi().resolveScenePortrait(story, baseChar, scene),
      getStoryProgress: getPlayerStoryProgress,
      saveStoryProgress: (storyId, values = {}) => ensureAppDataApi().saveStoryProgress(storyId, values),
      getCharacterBattleVisual: (char, state = "idle", config = systemConfig) => ensureContentStateApi().getCharacterBattleVisual(char, state, config),
      getEditState: () => editState,
      normalizeCharacterCropImages: cropImages => ensureContentStateApi().normalizeCharacterCropImages(cropImages),
      normalizeCharacterCropPresets: cropPresets => ensureContentStateApi().normalizeCharacterCropPresets(cropPresets),
      normalizeCharacterSdImages: sdImages => ensureContentStateApi().normalizeCharacterSdImages(sdImages),
      normalizeCharacterBattleKit: battleKit => ensureContentStateApi().normalizeCharacterBattleKit(battleKit),
      getCharacterImageForUsage: (char, usage = "default") => ensureContentStateApi().getCharacterImageForUsage(char, usage),
      getEffectiveVoiceLines: (card, baseChar) => ensureAppUiApi().getEffectiveVoiceLines(card, baseChar),
      showCardDetail: char => collectionScreen?.showCardDetail?.(char),
      openStoryReader: story => storyScreen?.openStoryReader?.(story),
      renderStoryScreen: () => storyScreen?.renderStoryScreen?.(),
      getEventItemCounts: () => ensureAppDataApi().getEventItemCounts(),
      getEventExchangeStatus: config => ensureAppDataApi().getEventExchangeStatus(config),
      purchaseEventExchangeItem: (config, itemId) => ensureAppDataApi().purchaseEventExchangeItem(config, itemId),
      getEventLoginBonusStatus: config => ensureAppDataApi().getEventLoginBonusStatus(config),
      claimEventLoginBonus: config => ensureAppDataApi().claimEventLoginBonus(config),
      recordGachaPulls: (gachaId, resultsOrCount = []) => ensureAppDataApi().recordGachaPulls(gachaId, resultsOrCount),
      refreshPlayerState: () => ensureAppDataApi().loadPlayerState(),
      buildGachaRateSummary: (rates = {}) => ensureContentStateApi().buildGachaRateSummary(rates),
      getDefaultRates,
      normalizeRates,
      getRarityModeConfig,
      getRarityRank,
      getRarityLabel,
      getRarityCssClass,
      normalizeRarityValue,
      rarityApi: {
        getDefaultRates,
        normalizeRates,
        getRarityModeConfig,
        getRarityRank,
        getRarityLabel,
        getRarityCssClass,
        normalizeRarityValue,
        esc: value => ensureAppUiApi().esc(value)
      },
      navigateTo,
      makeFallbackImage: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity),
      showToastForScreen: message => ensureAppUiApi().showToast(message),
      escForScreen: str => ensureAppUiApi().esc(str),
      baseCharVoiceLineDefs,
      getBaseCharEditor: () => baseCharEditor,
      getEntryEditor: () => entryEditor,
      getStoryEditor: () => storyEditor,
      getSystemEditor: () => systemEditor,
      getEditorScreen: () => editorScreen,
      populateFolderSelects: () => ensureAppEditorApi().populateFolderSelects(),
      refreshTitleScreen: () => ensureTitleScreenApi().setup(),
      renderHomeFacade: reason => ensureAppBootstrapHelperFactoryApi().renderHome(reason),
      renderBattleScreenFacade: () => ensureAppBootstrapHelperFactoryApi().renderBattleScreen(),
      readFileAsDataUrl: imageReadFileAsDataUrl,
      makeBaseCharFallback: imageMakeBaseCharFallback,
      normalizeBirthday: value => ensureContentStateApi().normalizeBirthday(value),
      makeFallbackImageUi: imageMakeFallbackImage,
      renderBaseCharList: () => ensureAppUiApi().renderBaseCharList(),
      renderVoiceLineFields: (containerId, prefix, defs, values = {}) => ensureAppUiApi().renderVoiceLineFields(containerId, prefix, defs, values),
      collectVoiceLineFields: (containerId, prefix, defs) => ensureAppUiApi().collectVoiceLineFields(containerId, prefix, defs),
      upsertItem: (collection, nextItem) => ensureAppUiApi().upsertItem(collection, nextItem),
      escUi: escapeHtml,
      showToastUi: toastShowToast,
      baseCharHomeVoiceDefs,
      getCurrentScreenForHome: () => currentScreen,
      getCharactersForHome: () => characters,
      getStoriesForHome: () => stories,
      getGachasForHome: () => gachas,
      getAnnouncementsForHome: () => announcements,
      getBaseCharsApiUrl: () => apiUrl(API.baseChars),
      getCharactersApiUrl: () => apiUrl(API.characters),
      getStoriesApiUrl: () => apiUrl(API.stories),
      getAnnouncementsApiUrl: () => apiUrl(API.announcements),
      getEquipmentCardsApiUrl: () => apiUrl(API.equipmentCards),
      generateCharacterCropAssets: (imageSrc, cropPresets = null) => ensureContentStateApi().generateCharacterCropAssets(imageSrc, cropPresets),
      renderEditorCharacterList: () => ensureAppUiApi().renderEditorCharacterList(),
      renderGachaPoolChars: selectedIds => ensureAppUiApi().renderGachaPoolChars(selectedIds),
      getEditingFeaturedIds: () => ensureAppEditorApi().getEditingFeaturedIds(),
      populateBaseCharSelects: () => ensureAppEditorApi().populateBaseCharSelects(),
      getEffectiveHomeVoices: (card, baseChar) => ensureAppUiApi().getEffectiveHomeVoices(card, baseChar),
      getEffectiveHomeBirthdays: (card, baseChar) => ensureAppUiApi().getEffectiveHomeBirthdays(card, baseChar),
      getEffectiveHomeOpinions: (card, baseChar) => ensureAppUiApi().getEffectiveHomeOpinions(card, baseChar),
      getEffectiveHomeConversations: (card, baseChar) => ensureAppUiApi().getEffectiveHomeConversations(card, baseChar),
      isBaseCharBirthdayToday: (baseChar, now = new Date()) => ensureAppBootstrapHelperFactoryApi().isBaseCharBirthdayToday(baseChar, now),
      isHomeEventActive: (now = new Date()) => ensureAppBootstrapHelperFactoryApi().isHomeEventActive(now),
      getHomeConfigDraft: () => homeConfigDraft,
      setHomeConfigDraft: value => { homeConfigDraft = value; },
      getActiveHomeConfigTarget: () => activeHomeConfigTarget,
      setActiveHomeConfigTarget: value => { activeHomeConfigTarget = value; },
      getHomeConfigDrag: () => homeConfigDrag,
      setHomeConfigDrag: value => { homeConfigDrag = value; },
      getHomeDialogueState: () => homeDialogueState,
      setHomeDialogueState: value => { homeDialogueState = value; },
      getDefaultHomeConfig: () => appStateGetDefaultHomeConfig(),
      normalizeHomePreferences: config => ensureAppBootstrapHelperFactoryApi().normalizeHomePreferences(config),
      loadLocal,
      saveLocal,
      getPlayerApiUrl,
      getHomeLayoutPreset: (config = systemConfig) => appStateGetHomeLayoutPreset(config),
      getHomeCharacterBaseOffset: (layoutPreset, config, index) => appStateGetHomeCharacterBaseOffset(layoutPreset, config, index),
      syncRecoveredCurrenciesInMemory,
      formatCurrencyBalance: (currency, includeMax = false) => ensureAppBootstrapHelperFactoryApi().formatCurrencyBalance(currency, includeMax),
      makeFallbackImageForHome: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity),
      getBattleParty: () => ensureAppBootstrapHelperFactoryApi().getBattleParty(),
      getGachaHeroImages: gacha => ensureLayoutBridgeApi().getGachaHeroImages(gacha),
      getHomeAssetFolders: (config = systemConfig) => appStateGetHomeAssetFolders(config, getCurrentLayoutOwnerId()),
      resolveHomeAssetFolderAssets: (folderOrId, config = systemConfig) => appStateResolveHomeAssetFolderAssets(folderOrId, config, getCurrentLayoutOwnerId()),
      upsertHomeLayoutAssetInConfig: (config, assetInput = {}) => appStateUpsertHomeLayoutAssetInConfig(config, assetInput, { ownerMemberId: getCurrentLayoutOwnerId(), defaultSystemConfig: () => appStateGetDefaultSystemConfig(getDefaultRarityMode()) }),
      saveConfig: value => ensureSystemSaveRuntimeApi().saveSharedConfig(value),
      updateEditorSubmitLabels: () => ensureAppEditorApi().updateEditorSubmitLabels(),
      renderEditorStoryList: () => ensureAppUiApi().renderEditorStoryList(),
      createContentFolder: kind => ensureAppEditorApi().createContentFolder(kind),
      persistSystemConfigState: () => ensureAppEditorApi().persistSystemConfigState(),
      syncProfileUi: () => {
        ensureAppAuthApi().renderAuthState?.();
        ensureAppAuthApi().syncPlayerProfile?.();
      },
      showToastForProfile: message => ensureAppUiApi().showToast(message),
      canOpenEditorSurface,
      getEditorAccessDeniedMessage,
      getEntrySystemApi: () => ({
        renderCharacterRarityOptions: value => systemEditor.renderCharacterRarityOptions(value),
        getRarityFallback: () => getRarityModeConfig().fallback
      }),
      getEquipmentSystemApi: () => ({
        getRarityModeConfig: () => getRarityModeConfig(),
        getRarityFallback: () => getRarityModeConfig().fallback,
        getRarityLabel: value => getRarityLabel(value)
      }),
      showToastForHome: message => ensureAppUiApi().showToast(message),
      escForHome: str => ensureAppUiApi().esc(str),
      clamp: (value, min, max) => ensureAppUiApi().clamp(value, min, max)
  };
}

function buildAppBootstrapHelperFactoryDeps() {
  return {
    playerStateNormalizePartyFormation,
    playerStateMergePlayerState,
    getDefaultPlayerState: () => getDefaultPlayerState(currentProjectId, getCurrentPlayerId()),
    playerStateNormalizePlayerCurrencies,
    getDefaultCurrencies: () => appStateGetDefaultCurrencies(),
    playerStateGetRecoveredCurrency,
    playerStateNormalizeHomePreferences,
    getDefaultHomeConfig: () => appStateGetDefaultHomeConfig(),
    getStories: () => stories,
    renderHome: reason => ensureAppHomeApi().renderHome(reason),
    playerStateFormatCurrencyBalance,
    renderBattleScreen: () => ensureAppScreenRuntimeFactoryApi().renderBattleScreen(),
    getBattleParty: () => ensureAppScreenRuntimeFactoryApi().getBattleParty(),
    startBattleLoop: () => ensureAppScreenRuntimeFactoryApi().startBattleLoop(),
    stopBattleLoop: () => ensureAppScreenRuntimeFactoryApi().stopBattleLoop(),
    ensureHomeCurrencyTimer: () => ensureAppDataApi().ensureHomeCurrencyTimer(),
    generateCharacterCropAssets: (imageSrc, cropPresets = null) => ensureContentStateApi().generateCharacterCropAssets(imageSrc, cropPresets),
    generateCharacterCropImages: (imageSrc, cropPresets = null) => ensureContentStateApi().generateCharacterCropImages(imageSrc, cropPresets),
    detectPrimaryFaceBox: image => ensureContentStateApi().detectPrimaryFaceBox ? ensureContentStateApi().detectPrimaryFaceBox(image) : null,
    renderCropDataUrl: (image, rect, outputWidth, outputHeight) => ensureContentStateApi().renderCropDataUrl ? ensureContentStateApi().renderCropDataUrl(image, rect, outputWidth, outputHeight) : Promise.reject(new Error("Crop render helper unavailable.")),
    clamp: (value, min, max) => ensureAppUiApi().clamp(value, min, max),
    esc: str => ensureAppUiApi().esc(str),
    showToast: message => ensureAppUiApi().showToast(message)
  };
}

function ensureAppFactoryDepsBuilderApi() {
  if (!appFactoryDepsBuilderApi) {
    appFactoryDepsBuilderApi = window.AppFactoryDepsBuilderLib.create(
      buildAppFactoryDepsBuilderDeps()
    );
  }
  return appFactoryDepsBuilderApi;
}

function ensureAppBootstrapHelperFactoryApi() {
  if (!appBootstrapHelperFactoryApi) {
    appBootstrapHelperFactoryApi = window.AppBootstrapHelperFactoryLib.create(
      buildAppBootstrapHelperFactoryDeps()
    );
  }
  return appBootstrapHelperFactoryApi;
}

function ensureAppCoreRuntimeFactoryApi() {
  if (!appCoreRuntimeFactoryApi) {
    appCoreRuntimeFactoryApi = window.AppCoreRuntimeFactoryLib.create(
      ensureAppFactoryDepsBuilderApi().buildAppCoreRuntimeDeps()
    );
  }
  return appCoreRuntimeFactoryApi;
}

// SECTION 04: public ensure* bridge aliases
const ensureTitleScreenApi = () => ensureAppSingleRuntimeFactoryApi().ensureTitleScreenApi();

function ensureAppAuthApi() {
  return ensureAppAuthProfileRuntimeFactoryApi().ensureAppAuthApi();
}

const ensureSystemSaveRuntimeApi = () => ensureAppSingleRuntimeFactoryApi().ensureSystemSaveRuntimeApi();

function ensureAppUiApi() {
  return ensureAppUiHomeRuntimeFactoryApi().ensureAppUiApi();
}

function ensureAppHomeApi() {
  return ensureAppUiHomeRuntimeFactoryApi().ensureAppHomeApi();
}

function ensureAppEditorApi() {
  return ensureAppEditorRuntimeFactoryApi().ensureAppEditorApi();
}

function ensureContentStateApi() {
  return ensureAppInitContentRuntimeFactoryApi().ensureContentStateApi();
}

function ensureEditorRuntimeApi() {
  return ensureAppLayoutEditorRuntimeFactoryApi().ensureEditorRuntimeApi();
}

function ensureLayoutBridgeApi() {
  return ensureAppLayoutEditorRuntimeFactoryApi().ensureLayoutBridgeApi();
}
window.SociaLayoutBridge = ensureLayoutBridgeApi();
