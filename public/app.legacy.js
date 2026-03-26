// Reference/backup runtime only.
// This file is kept for recovery and comparison and is not loaded by public/index.html.
// The active frontend bootstrap path is public/app.js.

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
  makeBaseCharFallback: imageMakeBaseCharFallback,
  makeFallbackImage: imageMakeFallbackImage,
  escapeHtml
} = window.ImageLib;
const {
  showToast: toastShowToast
} = window.ToastLib;
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
let stories = [];
let gachas = [];
let projects = [];
let systemConfig = appStateGetDefaultSystemConfig(getDefaultRarityMode());
let playerState = null;
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
let systemEditor = null;
let entryEditor = null;
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

const searchParams = new URLSearchParams(location.search);
const roomId = searchParams.get("room") || null;
let currentProjectId = searchParams.get("project") || null;
playerState = appStateGetDefaultPlayerState(currentProjectId);

const editState = {
  baseCharId: null,
  characterId: null,
  storyId: null,
  gachaId: null
};

function apiUrl(path, options = {}) {
  const query = new URLSearchParams();
  if (roomId) query.set("room", roomId);
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
  stories: "/api/stories",
  gachas: "/api/gachas",
  system: "/api/system",
  playerBootstrap: "/api/player-bootstrap",
  playerProfile: "/api/player-profile",
  playerStoryProgress: "/api/player-story-progress",
  playerGachaPulls: "/api/player-gacha-pulls",
  playerHomePreferences: "/api/player-home-preferences"
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

const baseCharVoiceLineDefs = [
  ["gain", "Obtained"],
  ["evolve", "Evolved"],
  ["levelUp1", "Level Up 1"],
  ["levelUp2", "Level Up 2"],
  ["levelUp3", "Level Up 3"],
  ["leaderAssign", "Leader Assigned"],
  ["subLeaderAssign", "Sub Leader Assigned"],
  ["normalAssign", "Party Assigned"],
  ["battleStart1", "Battle Start 1"],
  ["battleStart2", "Battle Start 2"],
  ["battleWave1", "Wave Start 1"],
  ["battleWave2", "Wave Start 2"],
  ["mainSkill1", "Main Skill 1"],
  ["mainSkill2", "Main Skill 2"],
  ["mainSkill3", "Main Skill 3"],
  ["subSkill1", "Sub Skill 1"],
  ["subSkill2", "Sub Skill 2"],
  ["subSkill3", "Sub Skill 3"],
  ["special1", "Special 1"],
  ["special2", "Special 2"],
  ["special3", "Special 3"],
  ["retreat1", "Retreat 1"],
  ["retreat2", "Retreat 2"],
  ["retreat3", "Retreat 3"],
  ["victory1", "Victory 1"],
  ["victory2", "Victory 2"],
  ["victory3", "Victory 3"]
];

const baseCharHomeVoiceDefs = [
  ["talk1", "Talk 1"],
  ["talk2", "Talk 2"],
  ["talk3", "Talk 3"],
  ["evolutionTalk1", "Evolution Talk 1"],
  ["evolutionTalk2", "Evolution Talk 2"],
  ["evolutionTalk3", "Evolution Talk 3"],
  ["bond1", "Bond 1"],
  ["bond2", "Bond 2"],
  ["bond3", "Bond 3"],
  ["bond4", "Bond 4"],
  ["bond5", "Bond 5"],
  ["bond6", "Bond 6"],
  ["bond7", "Bond 7"],
  ["bond8", "Bond 8"],
  ["bond9", "Bond 9"],
  ["bond10", "Bond 10"],
  ["eventActive", "Event Active"],
  ["newYear", "New Year"],
  ["homeEnter", "Home Enter"]
];
void init();

async function init() {
  ensureEditorFolderControls();
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
    getOwnedCount: getOwnedCardCount,
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
    getPlayerCurrencyAmount,
    recordGachaPulls,
    refreshPlayerState: loadPlayerState,
    showToast: message => ensureAppUiApi().showToast(message),
    esc: str => ensureAppUiApi().esc(str)
  });
  storyScreen = window.StoryScreen.setupStoryScreen({
    getStories: () => stories,
    getCharacters: () => characters,
    getCurrentStoryType: () => currentStoryType,
    setCurrentStoryType: value => { currentStoryType = value; },
    getStoryReaderState: () => storyReaderState,
    setStoryReaderState: value => { storyReaderState = value; },
    getBaseCharById: id => ensureContentStateApi().getBaseCharById(baseChars, id),
    findCharacterImageByName: name => ensureContentStateApi().findCharacterImageByName(characters, name),
    resolveScenePortrait: (story, baseChar, scene) => ensureContentStateApi().resolveScenePortrait(story, baseChar, scene),
    getOwnedCount: getOwnedCardCount,
    getStoryProgress: getPlayerStoryProgress,
    saveStoryProgress,
    showToast: message => ensureAppUiApi().showToast(message),
    esc: str => ensureAppUiApi().esc(str)
  });
  systemEditor = window.SystemEditor.setupSystemEditor({
    getSystemConfig: () => systemConfig,
    setSystemConfig: value => { systemConfig = value; },
    getEditState: () => editState,
      getEditStateObject: () => editState,
    getGachas: () => gachas,
    getCurrentScreen: () => currentScreen,
    readFileAsDataUrl: file => ensureAppUiApi().readFileAsDataUrl(file),
    saveConfig: async value => {
      saveLocal("socia-system", value);
      try {
        await postJSON(apiUrl(API.system), value);
      } catch (error) {
        console.error("Failed to save system config:", error);
        ensureAppUiApi().showToast("システム設定の保存に失敗しました");
      }
    },
    renderAll,
    applyOrientation,
    refreshCollection: () => collectionScreen.renderCollectionScreen(),
    refreshGacha: () => gachaScreen.renderGachaScreen(),
    openFolderManager: kind => editorScreen?.openFolderManager?.(kind),
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
    generateCharacterCropAssets,
    normalizeCharacterCropImages: cropImages => ensureContentStateApi().normalizeCharacterCropImages(cropImages),
    normalizeCharacterCropPresets: cropPresets => ensureContentStateApi().normalizeCharacterCropPresets(cropPresets),
    makeFallbackImage: (name, rarity) => ensureAppUiApi().makeFallbackImage(name, rarity),
    normalizeRarityValue,
    saveLocal,
    postJSON,
    showToast: message => ensureAppUiApi().showToast(message),
    upsertItem: (collection, nextItem) => ensureAppUiApi().upsertItem(collection, nextItem),
    updateEditorSubmitLabels: () => ensureAppEditorApi().updateEditorSubmitLabels(),
    renderHome,
    renderEditorCharacterList: () => ensureAppUiApi().renderEditorCharacterList(),
    renderGachaPoolChars: selectedIds => ensureAppUiApi().renderGachaPoolChars(selectedIds),
    getEditingFeaturedIds: () => ensureAppEditorApi().getEditingFeaturedIds(),
    createContentFolder,
    renderVoiceLineFields: (containerId, prefix, defs, values = {}) => ensureAppUiApi().renderVoiceLineFields(containerId, prefix, defs, values),
    collectVoiceLineFields: (containerId, prefix, defs) => ensureAppUiApi().collectVoiceLineFields(containerId, prefix, defs),
    baseCharVoiceLineDefs,
    baseCharHomeVoiceDefs,
    esc: str => ensureAppUiApi().esc(str)
  });
  baseCharEditor = window.BaseCharEditor.setupBaseCharEditor({
    getBaseChars: () => baseChars,
    setBaseChars: value => { baseChars = value; },
    getEditState: () => editState,
    getApi: () => ({ baseChars: apiUrl(API.baseChars) }),
    readFileAsDataUrl: file => ensureAppUiApi().readFileAsDataUrl(file),
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
    upsertItem: (collection, nextItem) => ensureAppUiApi().upsertItem(collection, nextItem),
    updateEditorSubmitLabels: () => ensureAppEditorApi().updateEditorSubmitLabels(),
    renderHome,
    renderEditorStoryList: () => ensureAppUiApi().renderEditorStoryList(),
    createContentFolder,
    getBaseCharById: id => ensureContentStateApi().getBaseCharById(baseChars, id),
    esc: str => ensureAppUiApi().esc(str)
  });
  editorScreen = window.EditorScreen.setupEditorScreen({
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
    createContentFolder,
    persistSystemConfigState
  });
  ensureAppRuntimeApi().setupProjectControls();
  ensureAppRuntimeApi().configurePrimaryNavigation({
    openHomeEditMode: () => ensureAppHomeApi().openHomeEditMode(),
    navigateTo
  });
  ensureAppRuntimeApi().ensureBattleEntryButton(navigateTo);
  ensureAppRuntimeApi().setupNavigation();
  ensureEditorRuntimeApi().disableLegacyEditorUi();
  ensureAppEditorApi().setupForms();
  ensureAppEditorApi().setupPreviews();
  ensureAppHomeApi().setupHomeConfig();
  ensureAppHomeApi().setupHomeInteractions();
  ensureBattleScreenApi().setupBattleControls();

  await initializeProjects();
  await loadAllData();
  applyOrientation();
  renderAll();
}

function ensureEditorFolderControls() {
  return ensureAppEditorApi().ensureEditorFolderControls();
}

async function initializeProjects() {
  return ensureAppRuntimeApi().initializeProjects();
}

function getCurrentProject() {
  return window.AppRuntimeLib.getCurrentProject(projects, currentProjectId);
}

async function handleCreateProject() {
  return ensureAppRuntimeApi().handleCreateProject();
}

async function switchProject(projectId) {
  return ensureAppRuntimeApi().switchProject(projectId);
}

function navigateTo(screen) {
  return ensureAppRuntimeApi().navigateTo(screen);
}

function setupEditorOverlay() {
  return ensureEditorRuntimeApi().setupEditorOverlay();
}

function bindEditorOverlayTabs() {
  return ensureEditorRuntimeApi().bindEditorOverlayTabs();
}

window.navigateTo = navigateTo;
window.openEditorScreen = openEditorScreen;
window.closeEditorScreen = closeEditorScreen;
window.openHomeEditMode = () => ensureAppHomeApi().openHomeEditMode();
window.closeHomeEditMode = () => ensureAppHomeApi().closeHomeEditMode();

function openEditorSurface(tabName = null, screen = currentScreen) {
  return ensureEditorRuntimeApi().openEditorSurface(tabName, screen);
}

function openEditorScreen(tabName = null) {
  return ensureEditorRuntimeApi().openEditorScreen(tabName);
}

function closeEditorScreen() {
  return ensureEditorRuntimeApi().closeEditorScreen();
}

async function loadAllData() {
  return ensureAppDataApi().loadAllData();
}

async function fetchJSON(url) {
  return ensureAppDataApi().fetchJSON(url);
}

async function postJSON(url, data) {
  return ensureAppDataApi().postJSON(url, data);
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

async function ensurePlayerProfile() {
  return ensureAppDataApi().ensurePlayerProfile();
}

async function loadPlayerState() {
  return ensureAppDataApi().loadPlayerState();
}

function getPlayerStoryProgress(storyId) {
  return ensureAppDataApi().getPlayerStoryProgress(storyId);
}

async function saveStoryProgress(storyId, values = {}) {
  return ensureAppDataApi().saveStoryProgress(storyId, values);
}

function upsertPlayerStoryProgress(nextItem) {
  return ensureAppDataApi().upsertPlayerStoryProgress(nextItem);
}

async function recordGachaPulls(gachaId, results = []) {
  return ensureAppDataApi().recordGachaPulls(gachaId, results);
}

function upsertInventoryRecord(nextItem) {
  return ensureAppDataApi().upsertInventoryRecord(nextItem);
}

function getOwnedCardCount(cardId) {
  return ensureAppDataApi().getOwnedCardCount(cardId);
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

function getPlayerCurrencyAmount(key) {
  return ensureAppDataApi().getPlayerCurrencyAmount(key);
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

function renderAll() {
  return ensureAppUiApi().renderAll();
}

function applyOrientation() {
  return ensureAppRuntimeApi().applyOrientation(systemConfig);
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
      getCurrentScreen: () => currentScreen,
      setCurrentScreen: value => { currentScreen = value; },
      getFormationScreen: () => formationScreen,
      getGachaScreen: () => gachaScreen,
      getStoryScreen: () => storyScreen,
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
      getCurrentProject,
      resetEditState: () => window.AppRuntimeLib.resetEditState(editState),
      syncProjectQuery: () => window.AppRuntimeLib.syncProjectQuery(currentProjectId),
      loadAllData,
      resetEditorForms: () => ensureAppEditorApi().resetEditorForms(),
      renderAll,
      renderHome,
      renderBattleScreen,
      renderGachaScreen: () => gachaScreen?.renderGachaScreen?.(),
      renderStoryScreen: () => storyScreen?.renderStoryScreen?.(),
      renderCollectionScreen: () => collectionScreen?.renderCollectionScreen?.(),
      renderFormationScreen: () => formationScreen?.renderFormationScreen?.(),
      startBattleLoop,
      stopBattleLoop,
      closeHomeEditMode: () => ensureAppHomeApi().closeHomeEditMode(),
      showToast: message => toastShowToast(message),
      esc: value => escapeHtml(value)
    });
  }
  return appRuntimeModuleApi;
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
      persistSystemConfigState,
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
      renderEditorScreen: () => editorScreen?.renderEditorScreen?.(),
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
      getEditorScreen: () => editorScreen,
      closeHomeEditMode: () => ensureAppHomeApi().closeHomeEditMode(),
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

async function persistSystemConfigState() {
  return ensureAppEditorApi().persistSystemConfigState();
}

async function createContentFolder(kind) {
  return ensureAppEditorApi().createContentFolder(kind);
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






