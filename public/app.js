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

let baseChars = [];
let characters = [];
let stories = [];
let gachas = [];
let projects = [];
let systemConfig = getDefaultSystemConfig();
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
let partyFormation = getDefaultPartyFormation();

const searchParams = new URLSearchParams(location.search);
const roomId = searchParams.get("room") || null;
let currentProjectId = searchParams.get("project") || null;
playerState = getDefaultPlayerState(currentProjectId);

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

function getDefaultSystemConfig() {
  return {
    rarityMode: getDefaultRarityMode(),
    orientation: "auto",
    cardFolders: [],
    storyFolders: []
  };
}

function getDefaultPlayerState(projectId = currentProjectId, userId = null) {
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
    gachaHistory: [],
    storyProgress: [],
    homePreferences: null,
    currencies: getDefaultCurrencies()
  };
}

function getDefaultCurrencies() {
  return [
    { key: "stamina", amount: 120, maxAmount: 120, updatedAt: null },
    { key: "gems", amount: 9999, maxAmount: null, updatedAt: null },
    { key: "gold", amount: 85000, maxAmount: null, updatedAt: null }
  ];
}

function getDefaultHomeConfig() {
  return { mode: 1, card1: "", card2: "", scale1: 100, x1: -10, y1: 0, scale2: 100, x2: 10, y2: 0, front: 2 };
}

function getDefaultPartyFormation() {
  return ["", "", "", "", ""];
}

function getRarityModeConfig(mode = systemConfig?.rarityMode) {
  return rarityLibGetModeConfig(mode);
}

function getRarityRank(value) {
  return rarityLibGetRank(value);
}

function getRarityValueByRank(rank, mode = systemConfig?.rarityMode) {
  return rarityLibGetValueByRank(rank, mode);
}

function normalizeRarityValue(value, mode = systemConfig?.rarityMode) {
  return rarityLibNormalizeValue(value, mode);
}

function getRarityLabel(value, mode = systemConfig?.rarityMode) {
  return rarityLibGetLabel(value, mode);
}

function getRarityCssClass(value, mode = systemConfig?.rarityMode) {
  return rarityLibGetCssClass(value, mode);
}

function getCurrentRarityValues() {
  return getRarityModeConfig().tiers.map(tier => tier.value);
}

function getDefaultRates(mode = systemConfig?.rarityMode) {
  return rarityLibGetDefaultRates(mode);
}

function normalizeRates(rates = {}, mode = systemConfig?.rarityMode) {
  return rarityLibNormalizeRates(rates, mode);
}

function getScopedKey(key) {
  return getScopedStorageKey(key);
}

const baseCharVoiceLineDefs = [
  ["gain", "獲得"],
  ["evolve", "進化"],
  ["levelUp1", "レベルアップ1"],
  ["levelUp2", "レベルアップ2"],
  ["levelUp3", "レベルアップ3"],
  ["leaderAssign", "リーダー編成"],
  ["subLeaderAssign", "サブリーダー編成"],
  ["normalAssign", "通常編成"],
  ["battleStart1", "バトル開始1"],
  ["battleStart2", "バトル開始2"],
  ["battleWave1", "バトルwave切り替え1"],
  ["battleWave2", "バトルwave切り替え2"],
  ["mainSkill1", "メインスキル1"],
  ["mainSkill2", "メインスキル2"],
  ["mainSkill3", "メインスキル3"],
  ["subSkill1", "サブスキル1"],
  ["subSkill2", "サブスキル2"],
  ["subSkill3", "サブスキル3"],
  ["special1", "必殺技1"],
  ["special2", "必殺技2"],
  ["special3", "必殺技3"],
  ["retreat1", "撤退時1"],
  ["retreat2", "撤退時2"],
  ["retreat3", "撤退時3"],
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
  ["eventActive", "イベント開催時"],
  ["newYear", "年始"],
  ["homeEnter", "ホームに入った時"]
];
void init();

async function init() {
  ensureEditorFolderControls();
  collectionScreen = window.CollectionScreen.setupCollectionScreen({
    getCharacters: () => characters,
    getStories: () => stories,
    getSystemConfig: () => systemConfig,
    getOwnedCount: getOwnedCardCount,
    baseCharVoiceLineDefs,
    getBaseCharById,
    getEffectiveVoiceLines,
    openStoryReader: story => storyScreen.openStoryReader(story),
    getRarityModeConfig,
    normalizeRarityValue,
    getRarityLabel,
    getRarityCssClass,
    makeFallbackImage,
    esc
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
    getRarityLabel,
    getRarityCssClass,
    makeFallbackImage,
    showCardDetail: char => collectionScreen.showCardDetail(char),
    esc
  });
  gachaScreen = window.GachaScreen.setupGachaScreen({
    getCharacters: () => characters,
    getGachas: () => gachas,
    getPlayerState: () => playerState,
    getSystemConfig: () => systemConfig,
    getActiveGacha: () => activeGacha,
    setActiveGacha: value => { activeGacha = value; },
    buildGachaRateSummary,
    normalizeRates,
    getDefaultRates,
    getRarityModeConfig,
    getRarityRank,
    getRarityLabel,
    getRarityCssClass,
    normalizeRarityValue,
    makeFallbackImage,
    showCardDetail: char => collectionScreen.showCardDetail(char),
    getPlayerCurrencyAmount,
    recordGachaPulls,
    refreshPlayerState: loadPlayerState,
    showToast,
    esc
  });
  storyScreen = window.StoryScreen.setupStoryScreen({
    getStories: () => stories,
    getCharacters: () => characters,
    getCurrentStoryType: () => currentStoryType,
    setCurrentStoryType: value => { currentStoryType = value; },
    getStoryReaderState: () => storyReaderState,
    setStoryReaderState: value => { storyReaderState = value; },
    getBaseCharById,
    findCharacterImageByName,
    resolveScenePortrait,
    getOwnedCount: getOwnedCardCount,
    getStoryProgress: getPlayerStoryProgress,
    saveStoryProgress,
    showToast,
    esc
  });
  systemEditor = window.SystemEditor.setupSystemEditor({
    getSystemConfig: () => systemConfig,
    setSystemConfig: value => { systemConfig = value; },
    getEditState: () => editState,
    getGachas: () => gachas,
    getCurrentScreen: () => currentScreen,
    saveConfig: async value => {
      saveLocal("socia-system", value);
      try {
        await postJSON(apiUrl(API.system), value);
      } catch (error) {
        console.error("Failed to save system config:", error);
        showToast("システム設定の保存に失敗しました。ローカルには保持されています。");
      }
    },
    renderAll,
    applyOrientation,
    refreshCollection: () => collectionScreen.renderCollectionScreen(),
    refreshGacha: () => gachaScreen.renderGachaScreen(),
    rarityApi: {
      getRarityModeConfig,
      getRarityCssClass,
      getRarityLabel,
      normalizeRarityValue,
      getDefaultRates,
      normalizeRates,
      esc
    },
    showToast
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
    readFileAsDataUrl,
    makeFallbackImage,
    normalizeRarityValue,
    saveLocal,
    postJSON,
    showToast,
    upsertItem,
    updateEditorSubmitLabels,
    renderHome,
    renderEditorCharacterList,
    renderGachaPoolChars,
    getEditingFeaturedIds,
    createContentFolder,
    renderVoiceLineFields,
    collectVoiceLineFields,
    baseCharVoiceLineDefs,
    baseCharHomeVoiceDefs,
    esc
  });
  baseCharEditor = window.BaseCharEditor.setupBaseCharEditor({
    getBaseChars: () => baseChars,
    setBaseChars: value => { baseChars = value; },
    getEditState: () => editState,
    getApi: () => ({ baseChars: apiUrl(API.baseChars) }),
    readFileAsDataUrl,
    makeBaseCharFallback,
    normalizeBirthday,
    saveLocal,
    postJSON,
    showToast,
    upsertItem,
    updateEditorSubmitLabels,
    renderBaseCharList,
    populateBaseCharSelects,
    renderVoiceLineFields,
    collectVoiceLineFields,
    baseCharVoiceLineDefs,
    baseCharHomeVoiceDefs,
    esc
  });
  storyEditor = window.StoryEditor.setupStoryEditor({
    getStories: () => stories,
    setStories: value => { stories = value; },
    getBaseChars: () => baseChars,
    getCharacters: () => characters,
    getStoryFolders: () => systemConfig.storyFolders || [],
    getEditState: () => editState,
    getApi: () => ({ stories: apiUrl(API.stories) }),
    readFileAsDataUrl,
    saveLocal,
    postJSON,
    showToast,
    upsertItem,
    updateEditorSubmitLabels,
    renderHome,
    renderEditorStoryList,
    createContentFolder,
    getBaseCharById,
    esc
  });
  editorScreen = window.EditorScreen.setupEditorScreen({
    getBaseChars: () => baseChars,
    getCharacters: () => characters,
    getStories: () => stories,
    getGachas: () => gachas,
    getCardFolders: () => systemConfig.cardFolders || [],
    getStoryFolders: () => systemConfig.storyFolders || [],
    getEditingFeaturedIds,
    getRarityCssClass,
    getRarityLabel,
    makeFallbackImage,
    buildStorySummary,
    buildGachaRateSummary,
    esc,
    baseCharEditor,
    entryEditor,
    storyEditor,
    storyScreen,
    systemEditor,
    beginGachaEdit,
    navigateTo,
    setActiveGacha: value => { activeGacha = value; },
    collectionScreen,
    populateBaseCharSelects,
    populateFolderSelects,
    updateEditorSubmitLabels
  });
  setupProjectControls();
  configurePrimaryNavigation();
  setupNavigation();
  setupForms();
  setupPreviews();
  setupHomeConfig();
  setupHomeInteractions();

  await initializeProjects();
  await loadAllData();
  applyOrientation();
  renderAll();
}

function configurePrimaryNavigation() {
  const bottomNav = document.querySelector(".bottom-nav");
  const homeEditButton = document.querySelector(".home-side-left .home-side-btn:nth-of-type(2)");
  const homeMenuWrap = document.querySelector(".home-side-right");
  const battleButton = homeMenuWrap?.querySelector(".home-menu-quest");
  const homeButton = document.querySelector('.bottom-nav-btn[data-go="home"]');
  const formationButton = document.querySelector('.bottom-nav-btn[data-go="formation"]');
  const storyButton = document.querySelector('.bottom-nav-btn[data-go="story"]');
  const gachaButton = document.querySelector('.bottom-nav-btn[data-go="gacha"]');
  const collectionButton = document.querySelector('.bottom-nav-btn[data-go="collection"]');

  if (homeEditButton) {
    homeEditButton.removeAttribute("data-go");
    homeEditButton.onclick = () => openEditorScreen();
  }

  if (homeMenuWrap && battleButton) {
    const battleLabel = battleButton.querySelector(".home-menu-text");
    if (battleLabel) battleLabel.textContent = "戦闘";
    Array.from(homeMenuWrap.querySelectorAll(".home-menu-btn")).forEach(button => {
      if (button !== battleButton) button.remove();
    });
  }

  if (formationButton) {
    const cleanFormationButton = formationButton.cloneNode(false);
    Array.from(formationButton.attributes).forEach(attribute => {
      cleanFormationButton.setAttribute(attribute.name, attribute.value);
    });
    cleanFormationButton.innerHTML = `
      <span class="bottom-nav-icon">&#x1F464;</span>
      <span class="bottom-nav-label">キャラ・編成</span>
    `;
    formationButton.replaceWith(cleanFormationButton);
  }

  if (bottomNav) {
    const nextFormationButton = document.querySelector('.bottom-nav-btn[data-go="formation"]');
    [homeButton, formationButton, storyButton, gachaButton, collectionButton].filter(Boolean).forEach(button => {
      bottomNav.appendChild(button === formationButton ? nextFormationButton : button);
    });
  }
}

function setupProjectControls() {
  const nameEl = document.getElementById("home-player-name");
  if (!nameEl || document.getElementById("project-select")) return;
  const host = nameEl.parentElement;
  const controls = document.createElement("div");
  controls.className = "project-controls";
  controls.innerHTML = `
    <select id="project-select" aria-label="Select project"></select>
    <button type="button" class="project-create-btn" id="project-create-btn">+</button>
  `;
  host.appendChild(controls);

  document.getElementById("project-select").addEventListener("change", async event => {
    const nextProjectId = event.target.value;
    if (!nextProjectId || nextProjectId === currentProjectId) return;
    await switchProject(nextProjectId);
  });

  document.getElementById("project-create-btn").addEventListener("click", handleCreateProject);
}

function ensureEditorFolderControls() {
  ensureFolderControlRow({
    formId: "character-form",
    anchorSelector: "#card-base-char-select",
    selectId: "card-folder-select",
    createButtonId: "create-card-folder-btn",
    label: "カードフォルダ"
  });
  ensureFolderControlRow({
    formId: "story-form",
    anchorSelector: "#story-character-select-wrap, #story-form select[name='type']",
    selectId: "story-folder-select",
    createButtonId: "create-story-folder-btn",
    label: "ストーリーフォルダ"
  });
}

function ensureFolderControlRow({ formId, anchorSelector, selectId, createButtonId, label }) {
  if (document.getElementById(selectId)) return;
  const form = document.getElementById(formId);
  if (!form) return;
  const anchor = form.querySelector(anchorSelector);
  if (!anchor) return;

  const wrap = document.createElement("div");
  wrap.className = "editor-folder-row";
  wrap.innerHTML = `
    <label>
      ${esc(label)}
      <select name="folderId" id="${esc(selectId)}">
        <option value="">フォルダなし</option>
      </select>
    </label>
    <button type="button" class="btn-secondary editor-folder-create-btn" id="${esc(createButtonId)}">+ フォルダ</button>
  `;
  anchor.closest("label, div")?.after(wrap);
}

async function initializeProjects() {
  const localProjects = loadProjectRegistry("socia-projects", []);
  const localCurrentProjectId = loadProjectRegistry("socia-current-project-id", null);
  const remoteProjects = await fetchJSON(apiUrl(API.projects, { includeProject: false }))
    .then(data => data.projects || [])
    .catch(() => null);

  projects = mergeCollectionState(remoteProjects, localProjects).map(normalizeProjectRecord);

  if (projects.length === 0) {
    const defaultProject = makeProjectRecord("My Project");
    projects = [defaultProject];
    saveProjectRegistry("socia-projects", projects);
    try {
      await postJSON(apiUrl(API.projects, { includeProject: false }), defaultProject);
    } catch (error) {
      console.error("Failed to create default project:", error);
    }
  }

  currentProjectId = selectInitialProjectId(localCurrentProjectId);
  saveProjectRegistry("socia-projects", projects);
  saveProjectRegistry("socia-current-project-id", currentProjectId);
  syncProjectQuery();
  renderProjectControls();
}

function renderProjectControls() {
  const nameEl = document.getElementById("home-player-name");
  const select = document.getElementById("project-select");
  if (nameEl) {
    nameEl.textContent = getCurrentProject()?.name || "Project";
  }
  if (!select) return;
  select.innerHTML = projects.map(project =>
    `<option value="${esc(project.id)}"${project.id === currentProjectId ? " selected" : ""}>${esc(project.name)}</option>`
  ).join("");
}

function selectInitialProjectId(localCurrentProjectId) {
  const candidates = [currentProjectId, localCurrentProjectId, projects[0]?.id];
  const next = candidates.find(projectId => projectId && projects.some(project => project.id === projectId));
  return next || null;
}

function getCurrentProject() {
  return projects.find(project => project.id === currentProjectId) || null;
}

function normalizeProjectRecord(project) {
  return {
    id: String(project?.id || crypto.randomUUID()).trim(),
    name: String(project?.name || "Untitled Project").trim().slice(0, 80) || "Untitled Project",
    createdAt: String(project?.createdAt || new Date().toISOString()),
    updatedAt: String(project?.updatedAt || project?.createdAt || new Date().toISOString())
  };
}

function makeProjectRecord(name) {
  const now = new Date().toISOString();
  return normalizeProjectRecord({
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now
  });
}

async function handleCreateProject() {
  const input = prompt("Project name");
  const name = String(input || "").trim();
  if (!name) return;

  const project = makeProjectRecord(name);
  upsertItem(projects, project);
  saveProjectRegistry("socia-projects", projects);

  try {
    const response = await postJSON(apiUrl(API.projects, { includeProject: false }), project);
    const savedProject = normalizeProjectRecord(response.project || project);
    upsertItem(projects, savedProject);
    currentProjectId = savedProject.id;
  } catch (error) {
    console.error("Failed to create project:", error);
    currentProjectId = project.id;
    showToast("Project was created locally only.");
  }

  saveProjectRegistry("socia-projects", projects);
  saveProjectRegistry("socia-current-project-id", currentProjectId);
  resetEditState();
  syncProjectQuery();
  renderProjectControls();
  await loadAllData();
  resetEditorForms();
  renderAll();
  showToast("Project created.");
}

async function switchProject(projectId) {
  currentProjectId = projectId;
  saveProjectRegistry("socia-current-project-id", currentProjectId);
  resetEditState();
  syncProjectQuery();
  renderProjectControls();
  await loadAllData();
  resetEditorForms();
  renderAll();
  showToast("Project switched.");
}

function resetEditState() {
  editState.baseCharId = null;
  editState.characterId = null;
  editState.storyId = null;
  editState.gachaId = null;
}

function resetEditorForms() {
  baseCharEditor?.resetBaseCharForm?.();
  entryEditor?.resetCharacterForm?.();
  storyEditor?.resetStoryForm?.();
  resetGachaForm();
}

function syncProjectQuery() {
  const url = new URL(location.href);
  if (currentProjectId) url.searchParams.set("project", currentProjectId);
  else url.searchParams.delete("project");
  history.replaceState(null, "", url.toString());
}

function setupNavigation() {
  let lastNavAt = 0;
  const triggerNav = (screen, event) => {
    const now = Date.now();
    if (now - lastNavAt < 200) return;
    lastNavAt = now;
    if (event) event.preventDefault();
    navigateTo(screen);
  };

  document.querySelectorAll("[data-go]").forEach(btn => {
    btn.addEventListener("click", event => {
      triggerNav(btn.dataset.go, event);
    });
    btn.addEventListener("pointerup", event => {
      triggerNav(btn.dataset.go, event);
    });
  });

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-go]");
    if (!button) return;
    triggerNav(button.dataset.go, event);
  });

  document.addEventListener("pointerup", event => {
    const button = event.target.closest("[data-go]");
    if (!button) return;
    triggerNav(button.dataset.go, event);
  });
}

function navigateTo(screen) {
  const previousScreen = currentScreen;
  currentScreen = screen;
  document.querySelectorAll(".screen").forEach(screenEl => screenEl.classList.remove("active"));
  const nextScreen = document.getElementById(`screen-${screen}`);
  if (!nextScreen) return;
  nextScreen.classList.add("active");

  document.querySelectorAll(".bottom-nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.go === screen);
  });

  try {
    if (screen === "home") renderHome(previousScreen === "home" ? "refresh" : "enter");
    if (screen === "formation" && formationScreen) formationScreen.renderFormationScreen();
    if (screen === "gacha" && gachaScreen) gachaScreen.renderGachaScreen();
    if (screen === "story" && storyScreen) storyScreen.renderStoryScreen();
    if (screen === "collection" && collectionScreen) collectionScreen.renderCollectionScreen();
    if (screen === "editor" && editorScreen) editorScreen.renderEditorScreen();
  } catch (error) {
    console.error("navigateTo render error:", error);
  }
}

window.navigateTo = navigateTo;
window.openEditorScreen = openEditorScreen;

function openEditorScreen(tabName = null) {
  navigateTo("editor");
  if (tabName) editorScreen?.activateEditorTab?.(tabName);
}

async function loadAllData() {
  const localBaseChars = loadLocal("socia-base-chars", []);
  const localCharacters = loadLocal("socia-characters", []);
  const localStories = loadLocal("socia-stories", []);
  const localGachas = loadLocal("socia-gachas", []);
  const localSystem = loadLocal("socia-system", getDefaultSystemConfig());

  const [remoteBaseChars, remoteCharacters, remoteStories, remoteGachas, remoteSystem] = await Promise.all([
    fetchJSON(apiUrl(API.baseChars)).then(data => data.baseChars || []).catch(() => null),
    fetchJSON(apiUrl(API.characters)).then(data => data.entries || []).catch(() => null),
    fetchJSON(apiUrl(API.stories)).then(data => data.stories || []).catch(() => null),
    fetchJSON(apiUrl(API.gachas)).then(data => data.gachas || []).catch(() => null),
    fetchJSON(apiUrl(API.system)).then(data => data.system || getDefaultSystemConfig()).catch(() => null)
  ]);

  baseChars = mergeCollectionState(remoteBaseChars, localBaseChars);
  characters = mergeCollectionState(remoteCharacters, localCharacters).map(normalizeCharacterRecord);
  stories = mergeCollectionState(remoteStories, localStories).map(normalizeStoryRecord);
  gachas = mergeCollectionState(remoteGachas, localGachas);
  systemConfig = {
    ...getDefaultSystemConfig(),
    ...(remoteSystem || localSystem || {})
  };
  systemConfig.cardFolders = normalizeFolderList(systemConfig.cardFolders);
  systemConfig.storyFolders = normalizeFolderList(systemConfig.storyFolders);

  saveLocal("socia-base-chars", baseChars);
  saveLocal("socia-characters", characters);
  saveLocal("socia-stories", stories);
  saveLocal("socia-gachas", gachas);
  saveLocal("socia-system", systemConfig);
  partyFormation = normalizePartyFormation(loadLocal("socia-party-formation", getDefaultPartyFormation()));
  await loadPlayerState();
  ensureHomeCurrencyTimer();
}

function mergeCollectionState(remoteItems, localItems) {
  const merged = [];
  const seenIds = new Set();

  [...(Array.isArray(remoteItems) ? remoteItems : []), ...(Array.isArray(localItems) ? localItems : [])].forEach(item => {
    if (!item || !item.id || seenIds.has(item.id)) return;
    seenIds.add(item.id);
    merged.push(item);
  });

  return merged;
}

async function fetchJSON(url) {
  return apiGet(url);
}

async function postJSON(url, data) {
  return apiPost(url, data);
}

function loadLocal(key, fallback) {
  return storageLoadLocal(key, fallback, getDataScope());
}

function saveLocal(key, data) {
  storageSaveLocal(key, data, getDataScope());
}

function getCurrentPlayerId() {
  const explicit = searchParams.get("user");
  if (explicit) return explicit;

  const stored = storageLoadLocal("socia-player-id", null, getPlayerIdentityScope());
  if (stored) return stored;

  const next = crypto.randomUUID();
  storageSaveLocal("socia-player-id", next, getPlayerIdentityScope());
  return next;
}

function getPlayerIdentityScope() {
  return roomId ? `room:${roomId}:viewer` : "viewer";
}

function getPlayerApiUrl(path) {
  return apiUrl(path, {
    query: {
      user: getCurrentPlayerId()
    }
  });
}

function getScopedStorageKey(key) {
  return storageGetScopedStorageKey(key, getDataScope());
}

function loadProjectRegistry(key, fallback) {
  return storageLoadLocal(key, fallback, getProjectRegistryScope());
}

function saveProjectRegistry(key, data) {
  storageSaveLocal(key, data, getProjectRegistryScope());
}

function getProjectRegistryScope() {
  return roomId ? `room:${roomId}:projects` : "projects";
}

function getDataScope() {
  const scope = [];
  if (roomId) scope.push(`room:${roomId}`);
  if (currentProjectId) scope.push(`project:${currentProjectId}`);
  return scope.length > 0 ? scope.join("::") : null;
}

async function ensurePlayerProfile() {
  if (!currentProjectId) return null;
  try {
    const response = await postJSON(getPlayerApiUrl(API.playerProfile), {});
    if (response?.profile) {
      playerState.profile = response.profile;
      saveLocal("socia-player-state", playerState);
    }
    return response?.profile || null;
  } catch (error) {
    console.error("Failed to ensure player profile:", error);
    return null;
  }
}

async function loadPlayerState() {
  const localState = loadLocal("socia-player-state", getDefaultPlayerState(currentProjectId, getCurrentPlayerId()));
  if (!currentProjectId) {
    playerState = getDefaultPlayerState(null, getCurrentPlayerId());
    return playerState;
  }

  try {
    await ensurePlayerProfile();
    const response = await fetchJSON(getPlayerApiUrl(API.playerBootstrap));
    playerState = mergePlayerState(
      response?.bootstrap || getDefaultPlayerState(currentProjectId, getCurrentPlayerId()),
      localState || getDefaultPlayerState(currentProjectId, getCurrentPlayerId())
    );
  } catch (error) {
    console.error("Failed to load player state:", error);
    playerState = localState || getDefaultPlayerState(currentProjectId, getCurrentPlayerId());
  }

  saveLocal("socia-player-state", playerState);
  return playerState;
}

function getPlayerStoryProgress(storyId) {
  return playerState.storyProgress.find(item => item.storyId === storyId) || null;
}

async function saveStoryProgress(storyId, values = {}) {
  if (!storyId || !currentProjectId) return null;

  const response = await postJSON(getPlayerApiUrl(API.playerStoryProgress), {
    storyId,
    ...values
  });
  const next = response?.storyProgress;
  if (!next) return null;

  upsertPlayerStoryProgress(next);
  saveLocal("socia-player-state", playerState);
  return next;
}

function upsertPlayerStoryProgress(nextItem) {
  const list = Array.isArray(playerState.storyProgress) ? playerState.storyProgress : [];
  const index = list.findIndex(item => item.storyId === nextItem.storyId);
  if (index >= 0) list[index] = nextItem;
  else list.unshift(nextItem);
  playerState.storyProgress = list;
}

async function recordGachaPulls(gachaId, results = []) {
  if (!gachaId || !currentProjectId || !Array.isArray(results) || results.length === 0) return null;

  const response = await postJSON(getPlayerApiUrl(API.playerGachaPulls), {
    gachaId,
    results: results.map(item => ({
      cardId: item.id,
      rarityAtPull: item.rolledRarity || item.rarity
    }))
  });

  if (response?.results?.length) {
    response.results.forEach(result => {
      upsertInventoryRecord({
        cardId: result.cardId,
        quantity: result.quantity
      });
    });
    if (response?.currencies) {
      playerState.currencies = normalizePlayerCurrencies(response.currencies);
    }
    saveLocal("socia-player-state", playerState);
  }

  return response;
}

function upsertInventoryRecord(nextItem) {
  const list = Array.isArray(playerState.inventory) ? playerState.inventory : [];
  const index = list.findIndex(item => item.cardId === nextItem.cardId);
  if (index >= 0) {
    list[index] = { ...list[index], ...nextItem };
  } else {
    list.unshift({
      id: null,
      firstAcquiredAt: null,
      lastAcquiredAt: null,
      createdAt: null,
      updatedAt: null,
      ...nextItem
    });
  }
  playerState.inventory = list;
}

function getOwnedCardCount(cardId) {
  const item = playerState.inventory.find(entry => entry.cardId === cardId);
  return Math.max(0, Number(item?.quantity || 0));
}

function normalizePartyFormation(formation) {
  const list = Array.isArray(formation) ? formation.slice(0, 5) : [];
  while (list.length < 5) list.push("");
  return list.map(item => String(item || ""));
}

function mergePlayerState(remoteState, localState) {
  const merged = {
    ...getDefaultPlayerState(currentProjectId, getCurrentPlayerId()),
    ...(localState || {}),
    ...(remoteState || {})
  };

  merged.profile = remoteState?.profile?.id
    ? remoteState.profile
    : (localState?.profile || merged.profile);
  merged.inventory = mergeByKey(remoteState?.inventory, localState?.inventory, "cardId", mergeInventoryItem);
  merged.storyProgress = mergeByKey(remoteState?.storyProgress, localState?.storyProgress, "storyId", mergeStoryProgressItem);
  merged.gachaHistory = mergeByKey(remoteState?.gachaHistory, localState?.gachaHistory, "id");
  merged.currencies = normalizePlayerCurrencies(
    Array.isArray(remoteState?.currencies) && remoteState.currencies.length > 0
      ? remoteState.currencies
      : (localState?.currencies || [])
  );
  merged.homePreferences = remoteState?.homePreferences || localState?.homePreferences || null;
  return merged;
}

function normalizePlayerCurrencies(currencies) {
  const map = new Map();

  getDefaultCurrencies().forEach(currency => {
    map.set(currency.key, { ...currency });
  });

  (Array.isArray(currencies) ? currencies : []).forEach(currency => {
    const key = String(currency?.key || "").trim();
    if (!key) return;
    map.set(key, {
      ...(map.get(key) || {}),
      key,
      amount: Math.max(0, Number(currency?.amount || 0)),
      maxAmount: currency?.maxAmount === null || currency?.maxAmount === undefined
        ? null
        : Math.max(0, Number(currency.maxAmount || 0)),
      updatedAt: currency?.updatedAt || map.get(key)?.updatedAt || null
    });
  });

  return Array.from(map.values());
}

function getPlayerCurrencyAmount(key) {
  return Math.max(0, Number(getEffectivePlayerCurrency(key)?.amount || 0));
}

function getEffectivePlayerCurrency(key, nowMs = Date.now()) {
  const currencies = syncRecoveredCurrenciesInMemory(nowMs);
  return currencies.find(currency => currency.key === key) || null;
}

function syncRecoveredCurrenciesInMemory(nowMs = Date.now()) {
  const current = normalizePlayerCurrencies(playerState?.currencies || []);
  let changed = false;
  const next = current.map(currency => {
    const recovered = getRecoveredCurrency(currency, nowMs);
    if (recovered.amount !== currency.amount || recovered.updatedAt !== currency.updatedAt) {
      changed = true;
    }
    return recovered;
  });

  if (changed && playerState) {
    playerState.currencies = next;
    saveLocal("socia-player-state", playerState);
  }

  return next;
}

function getRecoveredCurrency(currency, nowMs = Date.now()) {
  if (currency?.key !== "stamina") return currency;

  const maxAmount = currency?.maxAmount === null || currency?.maxAmount === undefined
    ? null
    : Math.max(0, Number(currency.maxAmount || 0));
  const amount = Math.max(0, Number(currency?.amount || 0));
  if (maxAmount === null || amount >= maxAmount) return currency;

  const updatedAtMs = Date.parse(currency?.updatedAt || "");
  if (!Number.isFinite(updatedAtMs) || nowMs <= updatedAtMs) return currency;

  const recoveredUnits = Math.floor((nowMs - updatedAtMs) / 60000);
  if (recoveredUnits <= 0) return currency;

  const nextAmount = Math.min(maxAmount, amount + recoveredUnits);
  const nextUpdatedAt = nextAmount >= maxAmount
    ? new Date(nowMs).toISOString()
    : new Date(updatedAtMs + recoveredUnits * 60000).toISOString();

  return {
    ...currency,
    amount: nextAmount,
    updatedAt: nextUpdatedAt
  };
}

function normalizeHomePreferences(config) {
  const toNumber = (value, fallback) => {
    const next = Number(value);
    return Number.isNaN(next) ? fallback : next;
  };
  return {
    ...getDefaultHomeConfig(),
    ...(config || {}),
    mode: Number(config?.mode) === 2 ? 2 : 1,
    front: Number(config?.front) === 1 ? 1 : 2,
    scale1: Math.round(clamp(toNumber(config?.scale1, 100), 50, 200)),
    x1: clamp(toNumber(config?.x1, -10), -60, 60),
    y1: clamp(toNumber(config?.y1, 0), -30, 50),
    scale2: Math.round(clamp(toNumber(config?.scale2, 100), 50, 200)),
    x2: clamp(toNumber(config?.x2, 10), -60, 60),
    y2: clamp(toNumber(config?.y2, 0), -30, 50)
  };
}

function mergeByKey(primary, secondary, key, resolver) {
  const map = new Map();
  [...(Array.isArray(secondary) ? secondary : []), ...(Array.isArray(primary) ? primary : [])].forEach(item => {
    if (!item || item[key] === undefined || item[key] === null) return;
    const id = item[key];
    if (!map.has(id)) {
      map.set(id, item);
      return;
    }
    map.set(id, resolver ? resolver(map.get(id), item) : item);
  });
  return [...map.values()];
}

function mergeInventoryItem(a, b) {
  return {
    ...(a || {}),
    ...(b || {}),
    quantity: Math.max(Number(a?.quantity || 0), Number(b?.quantity || 0))
  };
}

function mergeStoryProgressItem(a, b) {
  const rank = {
    locked: 0,
    unlocked: 1,
    in_progress: 2,
    completed: 3
  };
  const aRank = rank[a?.status] ?? 0;
  const bRank = rank[b?.status] ?? 0;
  return aRank >= bRank ? a : b;
}

function renderAll() {
  collectionScreen.renderCollectionFilters("all");
  formationScreen?.renderFormationScreen?.();
  populateFolderSelects();
  renderHome("refresh");
  editorScreen.renderEditorScreen();
}

function renderBaseCharList() {
  editorScreen?.renderBaseCharList();
}

function renderEditorCharacterList() {
  editorScreen?.renderEditorCharacterList();
}

function renderEditorStoryList() {
  editorScreen?.renderEditorStoryList();
}

function renderEditorGachaList() {
  editorScreen?.renderEditorGachaList();
}

function renderGachaPoolChars(selectedIds) {
  editorScreen?.renderGachaPoolChars(selectedIds);
}

function applyOrientation() {
  const mode = systemConfig.orientation || "auto";
  document.body.classList.remove("landscape-mode", "fullscreen-mode", "portrait-mode");
  if (mode === "landscape") {
    document.body.classList.add("landscape-mode");
  } else if (mode === "fullscreen") {
    document.body.classList.add("fullscreen-mode");
  } else if (mode === "portrait") {
    document.body.classList.add("portrait-mode");
  }
  // "auto" = no forced class, CSS media query handles it
}

function renderHome(reason = "refresh") {
  document.getElementById("home-char-count").textContent = String(characters.length);
  document.getElementById("home-story-count").textContent = String(stories.length);
  document.getElementById("home-gacha-count").textContent = String(gachas.length);

  const level = Math.max(1, characters.length + stories.length * 2 + gachas.length * 3);
  document.getElementById("home-lv").textContent = String(level);
  renderHomeCurrencies();

  const config = loadHomeConfig();
  const card1 = characters.find(c => c.id === config.card1) || characters[0] || null;
  const card2 = config.mode === 2 ? (characters.find(c => c.id === config.card2) || null) : null;

  const el1 = document.getElementById("home-char-1");
  const el2 = document.getElementById("home-char-2");
  const speech1 = document.getElementById("home-speech");
  const speech2 = document.getElementById("home-speech-2");
  const front = config.front === 1 ? 1 : 2;
  const back = front === 1 ? 2 : 1;
  el1.classList.toggle("is-front", front === 1);
  el1.classList.toggle("is-back", back === 1);
  el2.classList.toggle("is-front", front === 2);
  el2.classList.toggle("is-back", back === 2);

  if (card1) {
    el1.innerHTML = `<img src="${card1.image || makeFallbackImage(card1.name, card1.rarity)}" alt="${esc(card1.name)}">`;
    el1.style.transform = `translateX(${config.x1}%) scale(${config.scale1 / 100})`;
    el1.style.bottom = `${60 + config.y1 * 3}px`;
  } else {
    el1.innerHTML = "";
  }

  if (card2) {
    el2.innerHTML = `<img src="${card2.image || makeFallbackImage(card2.name, card2.rarity)}" alt="${esc(card2.name)}">`;
    el2.style.transform = `translateX(${config.x2}%) scale(${config.scale2 / 100})`;
    el2.style.bottom = `${60 + config.y2 * 3}px`;
    el2.style.display = "";
  } else {
    el2.innerHTML = "";
    el2.style.display = "none";
  }

  const eventBanner = document.getElementById("home-event-banner");
  if (gachas.length > 0) {
    document.getElementById("home-event-title").textContent = gachas[0].title;
    document.getElementById("home-event-sub").textContent = gachas[0].description || buildGachaRateSummary(gachas[0].rates);
    eventBanner.style.display = "";
  } else if (stories.length > 0) {
    document.getElementById("home-event-title").textContent = "最新ストーリー";
    document.getElementById("home-event-sub").textContent = stories[0].title;
    eventBanner.style.display = "";
  } else {
    eventBanner.style.display = "none";
  }

  syncHomeDialogue(card1, card2, reason);
  speech1.hidden = !card1;
  speech2.hidden = !card2 || !homeDialogueState?.secondaryText;
}

function renderHomeCurrencies() {
  const currencies = syncRecoveredCurrenciesInMemory();
  const stamina = currencies.find(item => item.key === "stamina");
  const gems = currencies.find(item => item.key === "gems");
  const gold = currencies.find(item => item.key === "gold");

  document.getElementById("home-stamina").textContent = formatCurrencyBalance(stamina, true);
  document.getElementById("home-gems").textContent = formatCurrencyBalance(gems);
  document.getElementById("home-gold").textContent = formatCurrencyBalance(gold);
}

function formatCurrencyBalance(currency, includeMax = false) {
  const amount = Math.max(0, Number(currency?.amount || 0));
  const maxAmount = currency?.maxAmount === null || currency?.maxAmount === undefined
    ? null
    : Math.max(0, Number(currency.maxAmount || 0));

  if (includeMax && maxAmount !== null) {
    return `${amount.toLocaleString()}/${maxAmount.toLocaleString()}`;
  }

  return amount.toLocaleString();
}

function ensureHomeCurrencyTimer() {
  if (homeCurrencyTimer) return;
  homeCurrencyTimer = window.setInterval(() => {
    const before = getPlayerCurrencyAmount("stamina");
    syncRecoveredCurrenciesInMemory();
    const after = getPlayerCurrencyAmount("stamina");
    if (before !== after && currentScreen === "home") {
      renderHomeCurrencies();
    }
  }, 1000);
}

function pickLine(card) {
  if (card.lines?.length) return card.lines[Math.floor(Math.random() * card.lines.length)];
  return card.catch || "セリフ未設定";
}

function getEffectiveVoiceLines(card, baseChar) {
  const voiceLines = {};
  baseCharVoiceLineDefs.forEach(([key]) => {
    voiceLines[key] = card?.voiceLines?.[key] || baseChar?.voiceLines?.[key] || "";
  });
  return voiceLines;
}

function getEffectiveHomeVoices(card, baseChar) {
  const homeVoices = {};
  baseCharHomeVoiceDefs.forEach(([key]) => {
    homeVoices[key] = card?.homeVoices?.[key] || baseChar?.homeVoices?.[key] || "";
  });
  return homeVoices;
}

function getEffectiveHomeOpinions(card, baseChar) {
  return (card?.homeOpinions || []).length > 0 ? (card.homeOpinions || []) : (baseChar?.homeOpinions || []);
}

function getEffectiveHomeConversations(card, baseChar) {
  return (card?.homeConversations || []).length > 0 ? (card.homeConversations || []) : (baseChar?.homeConversations || []);
}

function getEffectiveHomeBirthdays(card, baseChar) {
  return (card?.homeBirthdays || []).length > 0 ? (card.homeBirthdays || []) : (baseChar?.homeBirthdays || []);
}

function setupHomeInteractions() {
  ["home-char-1", "home-speech"].forEach(id => {
    document.getElementById(id).addEventListener("click", () => triggerHomeDialogue(1));
  });
  ["home-char-2", "home-speech-2"].forEach(id => {
    document.getElementById(id).addEventListener("click", () => triggerHomeDialogue(2));
  });
}

function triggerHomeDialogue(index) {
  if (currentScreen !== "home") return;
  const config = loadHomeConfig();
  const { card1, card2 } = resolveHomeCards(config);
  chooseHomeDialogue(card1, card2, "tap", index);
  applyHomeDialogue();
}

function resolveHomeCards(config) {
  return {
    card1: characters.find(c => c.id === config.card1) || characters[0] || null,
    card2: config.mode === 2 ? (characters.find(c => c.id === config.card2) || null) : null
  };
}

function syncHomeDialogue(card1, card2, reason) {
  const cardIdsMatch = homeDialogueState && homeDialogueState.card1Id === (card1?.id || null) && homeDialogueState.card2Id === (card2?.id || null);
  if (!card1) {
    homeDialogueState = {
      card1Id: null,
      card2Id: null,
      primaryName: "",
      primaryText: "ホームにキャラを配置するとセリフが表示されます",
      secondaryName: "",
      secondaryText: ""
    };
    applyHomeDialogue();
    return;
  }

  if (!cardIdsMatch || reason === "enter" || !homeDialogueState) {
    chooseHomeDialogue(card1, card2, reason);
  }
  applyHomeDialogue();
}

function chooseHomeDialogue(card1, card2, reason = "refresh", tappedIndex = 1) {
  const baseChar1 = card1?.baseCharId ? getBaseCharById(card1.baseCharId) : null;
  const baseChar2 = card2?.baseCharId ? getBaseCharById(card2.baseCharId) : null;
  const eventActive = isHomeEventActive();

  let primaryName = card1?.name || "";
  let primaryText = pickHomeVoice(baseChar1, card1, reason, eventActive);
  let secondaryName = card2?.name || "";
  let secondaryText = card2 ? pickHomeVoice(baseChar2, card2, reason, eventActive) : "";

  if (reason === "tap" && card1 && tappedIndex) {
    const actorCard = tappedIndex === 1 ? card1 : card2;
    const actorBaseChar = tappedIndex === 1 ? baseChar1 : baseChar2;
    const partnerCard = tappedIndex === 1 ? card2 : card1;
    const partnerBaseChar = tappedIndex === 1 ? baseChar2 : baseChar1;
    const relationResult = pickHomeRelationDialogue(actorCard, actorBaseChar, partnerCard, partnerBaseChar);
    if (relationResult) {
      if (tappedIndex === 1) {
        primaryName = relationResult.primaryName;
        primaryText = relationResult.primaryText;
        secondaryName = relationResult.secondaryName;
        secondaryText = relationResult.secondaryText;
      } else {
        primaryName = relationResult.secondaryName || primaryName;
        primaryText = relationResult.secondaryText || primaryText;
        secondaryName = relationResult.primaryName;
        secondaryText = relationResult.primaryText;
      }
    } else if (tappedIndex === 2 && actorCard) {
      primaryName = actorCard.name;
      primaryText = pickHomeVoice(actorBaseChar, actorCard, "tap", eventActive);
      secondaryName = card1?.name || "";
      secondaryText = card1 ? pickHomeVoice(baseChar1, card1, "refresh", eventActive) : "";
    }
  }

  homeDialogueState = {
    card1Id: card1?.id || null,
    card2Id: card2?.id || null,
    primaryName,
    primaryText,
    secondaryName,
    secondaryText
  };
}

function pickHomeVoice(baseChar, card, reason, eventActive) {
  const homeVoices = getEffectiveHomeVoices(card, baseChar);
  if (reason === "enter" && eventActive && homeVoices.eventActive) return homeVoices.eventActive;
  if (baseChar && isBaseCharBirthdayToday(baseChar)) {
    const birthdayLines = getEffectiveHomeBirthdays(card, baseChar)
      .filter(item => item.targetBaseCharId === baseChar.id)
      .map(item => item.text)
      .filter(Boolean);
    if (birthdayLines.length > 0) return birthdayLines[Math.floor(Math.random() * birthdayLines.length)];
  }
  if (reason === "enter" && homeVoices.homeEnter) return homeVoices.homeEnter;

  const pool = Object.values(homeVoices).filter(Boolean);
  if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  return pickLine(card);
}

function pickHomeRelationDialogue(actorCard, actorBaseChar, partnerCard, partnerBaseChar) {
  if (!actorCard || !actorBaseChar || !partnerCard || !partnerBaseChar) return null;
  const targetId = partnerBaseChar.id;
  const birthdays = isBaseCharBirthdayToday(partnerBaseChar)
    ? getEffectiveHomeBirthdays(actorCard, actorBaseChar)
      .filter(item => item.targetBaseCharId === targetId)
      .map(item => ({
        primaryName: actorCard.name,
        primaryText: item.text,
        secondaryName: partnerCard.name,
        secondaryText: ""
      }))
    : [];
  const opinions = getEffectiveHomeOpinions(actorCard, actorBaseChar)
    .filter(item => item.targetBaseCharId === targetId)
    .map(item => ({
      primaryName: actorCard.name,
      primaryText: item.text,
      secondaryName: partnerCard.name,
      secondaryText: ""
    }));
  const conversations = getEffectiveHomeConversations(actorCard, actorBaseChar)
    .filter(item => item.targetBaseCharId === targetId)
    .map(item => ({
      primaryName: actorCard.name,
      primaryText: item.selfText || "",
      secondaryName: partnerCard.name,
      secondaryText: item.partnerText || ""
    }));
  const pool = [...birthdays, ...opinions, ...conversations].filter(item => item.primaryText || item.secondaryText);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function applyHomeDialogue() {
  document.getElementById("home-speech-name").textContent = homeDialogueState?.primaryName || "";
  document.getElementById("home-speech-text").textContent = homeDialogueState?.primaryText || "";
  document.getElementById("home-speech-name-2").textContent = homeDialogueState?.secondaryName || "";
  document.getElementById("home-speech-text-2").textContent = homeDialogueState?.secondaryText || "";
  document.getElementById("home-speech").hidden = !homeDialogueState?.primaryText;
  document.getElementById("home-speech-2").hidden = !homeDialogueState?.secondaryText;
}

function isHomeEventActive() {
  return gachas.length > 0 || stories.some(story => story.type === "event");
}

function isBaseCharBirthdayToday(baseChar) {
  if (!baseChar?.birthday) return false;
  const today = new Date();
  const key = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return baseChar.birthday === key;
}

function normalizeBirthday(value) {
  const raw = String(value || "").trim().replace(/\//g, "-");
  if (!raw) return "";
  const match = raw.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

function loadHomeConfig() {
  if (playerState?.homePreferences) {
    return normalizeHomePreferences(playerState.homePreferences);
  }

  const localConfig = loadLocal("socia-home-config", null);
  if (localConfig) return normalizeHomePreferences(localConfig);

  try {
    const raw = localStorage.getItem("socia-home-config");
    if (raw) {
      const parsed = normalizeHomePreferences(JSON.parse(raw));
      saveLocal("socia-home-config", parsed);
      return parsed;
    }
  } catch {}

  return getDefaultHomeConfig();
}

async function saveHomeConfig(config) {
  const normalized = normalizeHomePreferences(config);
  playerState.homePreferences = normalized;
  saveLocal("socia-player-state", playerState);
  saveLocal("socia-home-config", normalized);
  try {
    localStorage.setItem("socia-home-config", JSON.stringify(normalized));
  } catch {}

  if (!currentProjectId) return normalized;

  try {
    const response = await postJSON(getPlayerApiUrl(API.playerHomePreferences), normalized);
    if (response?.homePreferences) {
      playerState.homePreferences = normalizeHomePreferences(response.homePreferences);
      saveLocal("socia-player-state", playerState);
    }
  } catch (error) {
    console.error("Failed to save home config:", error);
    showToast("ホーム設定の保存に失敗しました。ローカルには保持されています。");
  }

  return normalized;
}

function setupHomeConfig() {
  const btn = document.getElementById("home-config-btn");
  const panel = document.getElementById("home-config-panel");
  const closeBtn = document.getElementById("home-config-close");
  const saveBtn = document.getElementById("home-config-save");
  const modeSelect = document.getElementById("home-mode-select");
  const char2Settings = document.getElementById("home-char-2-settings");
  const scaleInput = document.getElementById("home-active-scale");
  const resetBtn = document.getElementById("home-config-reset-char");
  const swapDepthBtn = document.getElementById("home-config-swap-depth");
  const stage = document.getElementById("home-config-stage");

  btn.addEventListener("click", () => {
    populateHomeCardSelects();
    homeConfigDraft = { ...loadHomeConfig() };
    activeHomeConfigTarget = 1;
    syncHomeConfigForm();
    panel.hidden = false;
  });

  closeBtn.addEventListener("click", () => { panel.hidden = true; });

  modeSelect.addEventListener("change", () => {
    homeConfigDraft.mode = Number(modeSelect.value);
    if (homeConfigDraft.mode !== 2) activeHomeConfigTarget = 1;
    syncHomeConfigForm();
  });

  document.getElementById("home-card-1").addEventListener("change", event => {
    if (!homeConfigDraft) return;
    homeConfigDraft.card1 = event.target.value;
    renderHomeConfigStage();
  });

  document.getElementById("home-card-2").addEventListener("change", event => {
    if (!homeConfigDraft) return;
    homeConfigDraft.card2 = event.target.value;
    renderHomeConfigStage();
  });

  document.getElementById("home-config-target-1").addEventListener("click", () => {
    activeHomeConfigTarget = 1;
    syncHomeConfigForm();
  });
  document.getElementById("home-config-target-2").addEventListener("click", () => {
    if (!homeConfigDraft || homeConfigDraft.mode !== 2) return;
    activeHomeConfigTarget = 2;
    syncHomeConfigForm();
  });

  scaleInput.addEventListener("input", event => {
    if (!homeConfigDraft) return;
    homeConfigDraft[`scale${activeHomeConfigTarget}`] = Number(event.target.value);
    syncHomeConfigScale();
    renderHomeConfigStage();
  });

  resetBtn.addEventListener("click", () => {
    if (!homeConfigDraft) return;
    const target = activeHomeConfigTarget;
    homeConfigDraft[`scale${target}`] = 100;
    homeConfigDraft[`x${target}`] = target === 1 ? -10 : 10;
    homeConfigDraft[`y${target}`] = 0;
    syncHomeConfigForm();
  });

  swapDepthBtn.addEventListener("click", () => {
    if (!homeConfigDraft || homeConfigDraft.mode !== 2) return;
    homeConfigDraft.front = homeConfigDraft.front === 1 ? 2 : 1;
    renderHomeConfigStage();
  });

  stage.addEventListener("pointermove", event => updateHomeConfigDrag(event));
  stage.addEventListener("pointerup", endHomeConfigDrag);
  stage.addEventListener("pointercancel", endHomeConfigDrag);
  stage.addEventListener("pointerleave", endHomeConfigDrag);

  saveBtn.addEventListener("click", async () => {
    if (!homeConfigDraft) return;
    await saveHomeConfig(homeConfigDraft);
    panel.hidden = true;
    renderHome();
    showToast("ホーム設定を保存しました");
  });
}

function syncHomeConfigForm() {
  if (!homeConfigDraft) return;
  document.getElementById("home-mode-select").value = String(homeConfigDraft.mode);
  document.getElementById("home-card-1").value = homeConfigDraft.card1;
  document.getElementById("home-card-2").value = homeConfigDraft.card2;
  document.getElementById("home-char-2-settings").hidden = homeConfigDraft.mode !== 2;
  document.getElementById("home-config-target-1").classList.toggle("active", activeHomeConfigTarget === 1);
  document.getElementById("home-config-target-2").classList.toggle("active", activeHomeConfigTarget === 2);
  document.getElementById("home-config-target-2").disabled = homeConfigDraft.mode !== 2;
  document.getElementById("home-config-swap-depth").disabled = homeConfigDraft.mode !== 2;
  syncHomeConfigScale();
  renderHomeConfigStage();
}

function syncHomeConfigScale() {
  if (!homeConfigDraft) return;
  const scaleInput = document.getElementById("home-active-scale");
  const value = homeConfigDraft[`scale${activeHomeConfigTarget}`];
  scaleInput.value = value;
  document.getElementById("home-active-scale-val").textContent = `${value}%`;
}

function populateHomeCardSelects() {
  ["home-card-1", "home-card-2"].forEach(id => {
    const select = document.getElementById(id);
    const current = select.value;
    select.innerHTML = '<option value="">未設定（先頭カード）</option>' +
      characters.map(c => `<option value="${esc(c.id)}">${esc(c.rarity)} ${esc(c.name)}</option>`).join("");
    select.value = current;
  });
}

function renderHomeConfigStage() {
  if (!homeConfigDraft) return;
  renderHomeConfigStageChar(1);
  renderHomeConfigStageChar(2);
}

function renderHomeConfigStageChar(index) {
  const stageChar = document.getElementById(`home-config-stage-char-${index}`);
  const isVisible = index === 1 || homeConfigDraft.mode === 2;
  if (!isVisible) {
    stageChar.innerHTML = "";
    stageChar.classList.add("is-hidden");
    return;
  }

  const cardId = homeConfigDraft[`card${index}`];
  const card = characters.find(item => item.id === cardId) || (index === 1 ? characters[0] : null);
  if (!card) {
    stageChar.innerHTML = `<div class="home-config-stage-empty">カードを選択</div>`;
  } else {
    stageChar.innerHTML = `<img src="${card.image || makeFallbackImage(card.name, card.rarity)}" alt="${esc(card.name)}">`;
  }

  stageChar.classList.remove("is-hidden");
  stageChar.classList.toggle("is-active", activeHomeConfigTarget === index);
  stageChar.classList.toggle("is-front", homeConfigDraft.front === index);
  stageChar.classList.toggle("is-back", homeConfigDraft.front !== index);
  stageChar.dataset.label = `キャラ${index}`;
  stageChar.style.transform = `translateX(${homeConfigDraft[`x${index}`]}%) scale(${homeConfigDraft[`scale${index}`] / 100})`;
  stageChar.style.bottom = `${32 + homeConfigDraft[`y${index}`] * 2.2}px`;

  stageChar.onpointerdown = event => beginHomeConfigDrag(event, index);
}

function beginHomeConfigDrag(event, index) {
  if (!homeConfigDraft) return;
  activeHomeConfigTarget = index;
  syncHomeConfigForm();
  const stage = document.getElementById("home-config-stage");
  homeConfigDrag = {
    index,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    initialX: homeConfigDraft[`x${index}`],
    initialY: homeConfigDraft[`y${index}`],
    initialScale: homeConfigDraft[`scale${index}`],
    width: stage.clientWidth,
    height: stage.clientHeight,
    pointers: new Map([[event.pointerId, { x: event.clientX, y: event.clientY }]]),
    pinchDistance: null
  };
  event.currentTarget.classList.add("is-dragging");
  event.currentTarget.setPointerCapture(event.pointerId);
}

function updateHomeConfigDrag(event) {
  if (!homeConfigDrag || !homeConfigDraft) return;
  homeConfigDrag.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (homeConfigDrag.pointers.size >= 2) {
    const [a, b] = [...homeConfigDrag.pointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (!homeConfigDrag.pinchDistance) {
      homeConfigDrag.pinchDistance = distance;
      homeConfigDrag.initialScale = homeConfigDraft[`scale${homeConfigDrag.index}`];
      return;
    }
    const nextScale = homeConfigDrag.initialScale * (distance / homeConfigDrag.pinchDistance);
    homeConfigDraft[`scale${homeConfigDrag.index}`] = Math.round(clamp(nextScale, 50, 200));
    syncHomeConfigScale();
    renderHomeConfigStage();
    return;
  }
  if (homeConfigDrag.pointerId !== event.pointerId) return;
  const dx = event.clientX - homeConfigDrag.startX;
  const dy = event.clientY - homeConfigDrag.startY;
  const nextX = homeConfigDrag.initialX + (dx / homeConfigDrag.width) * 100;
  const nextY = homeConfigDrag.initialY - (dy / homeConfigDrag.height) * 90;
  homeConfigDraft[`x${homeConfigDrag.index}`] = clamp(nextX, -60, 60);
  homeConfigDraft[`y${homeConfigDrag.index}`] = clamp(nextY, -30, 50);
  renderHomeConfigStage();
}

function endHomeConfigDrag(event) {
  if (!homeConfigDrag) return;
  if (event) {
    homeConfigDrag.pointers.delete(event.pointerId);
    if (homeConfigDrag.pointers.size > 0 && event.pointerId !== homeConfigDrag.pointerId) return;
    if (homeConfigDrag.pointers.size > 0 && event.pointerId === homeConfigDrag.pointerId) {
      const [remaining] = homeConfigDrag.pointers.values();
      homeConfigDrag.startX = remaining.x;
      homeConfigDrag.startY = remaining.y;
      homeConfigDrag.initialX = homeConfigDraft[`x${homeConfigDrag.index}`];
      homeConfigDrag.initialY = homeConfigDraft[`y${homeConfigDrag.index}`];
      homeConfigDrag.initialScale = homeConfigDraft[`scale${homeConfigDrag.index}`];
      homeConfigDrag.pinchDistance = null;
      return;
    }
  }
  const el = document.getElementById(`home-config-stage-char-${homeConfigDrag.index}`);
  el.classList.remove("is-dragging");
  homeConfigDrag = null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveScenePortrait(story, baseChar, scene) {
  if (!baseChar) return "";
  if (scene.variantName && baseChar.variants?.length) {
    const variant = baseChar.variants.find(item => item.name === scene.variantName);
    if (variant?.image) return variant.image;
  }
  const defaultVariantName = getStoryVariantName(story, baseChar.id);
  if (defaultVariantName && baseChar.variants?.length) {
    const variant = baseChar.variants.find(item => item.name === defaultVariantName);
    if (variant?.image) return variant.image;
  }
  return baseChar.portrait || "";
}

function getStoryVariantName(story, characterId) {
  if (!story?.variantAssignments?.length || !characterId) return "";
  return story.variantAssignments.find(item => item.characterId === characterId)?.variantName || "";
}

function setupForms() {
  document.getElementById("gacha-form").addEventListener("submit", handleGachaSubmit);

  baseCharEditor.renderBaseCharVoiceLineFields();
  baseCharEditor.renderBaseCharHomeVoiceLineFields();
  entryEditor.renderCardVoiceLineFields();
  entryEditor.renderCardHomeVoiceLineFields();
  storyEditor.renderStoryVariantDefaults();
  systemEditor.renderSystemForm();
  const sceneList = document.getElementById("scene-list");
  sceneList.innerHTML = "";
  storyEditor.addSceneInput();

  document.getElementById("share-btn").addEventListener("click", handleShare);
}

function handleShare() {
  const id = roomId || crypto.randomUUID().slice(0, 8);
  const url = new URL(location.href);
  url.searchParams.set("room", id);
  if (currentProjectId) url.searchParams.set("project", currentProjectId);
  navigator.clipboard.writeText(url.toString()).then(() => {
    showToast("共有URLをコピーしました");
  }).catch(() => {
    prompt("共有URL:", url.toString());
  });
  if (!roomId) {
    location.href = url.toString();
  }
}

async function handleGachaSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const existing = editState.gachaId ? gachas.find(item => item.id === editState.gachaId) : null;
  const bannerFile = form.bannerImage.files[0];
  const heroImage2File = form.heroImage2?.files?.[0];
  const heroImage3File = form.heroImage3?.files?.[0];
  const bannerImage = bannerFile ? await readFileAsDataUrl(bannerFile) : (existing?.bannerImage || existing?.heroImages?.[0] || "");
  const heroImage2 = heroImage2File ? await readFileAsDataUrl(heroImage2File) : (existing?.heroImages?.[1] || "");
  const heroImage3 = heroImage3File ? await readFileAsDataUrl(heroImage3File) : (existing?.heroImages?.[2] || "");
  const featured = Array.from(document.querySelectorAll(".gacha-pool-char.selected")).map(el => el.dataset.charId);
  const gacha = {
    id: editState.gachaId || crypto.randomUUID(),
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    bannerImage,
    displayMode: form.displayMode?.value === "manualImages" ? "manualImages" : "featuredCards",
    heroImages: [bannerImage, heroImage2, heroImage3].filter(Boolean),
    featured,
    rates: getRarityModeConfig().tiers.reduce((acc, tier) => {
      acc[tier.value] = Number(form.querySelector(`[name="rate-${tier.value}"]`)?.value) || 0;
      return acc;
    }, {})
  };
  upsertItem(gachas, gacha);
  saveLocal("socia-gachas", gachas);
  try {
    await postJSON(apiUrl(API.gachas), gacha);
  } catch (error) {
    console.error("Failed to save gacha:", error);
    showToast("ガチャの保存に失敗しました。ローカルには保持されています。");
  }
  resetGachaForm();
  renderHome();
  editorScreen.renderEditorGachaList();
  showToast(`${gacha.title} を${existing ? "更新" : "登録"}しました。`);
}

function updateSceneExpressions(sceneItem) {
  updateSceneCharacterOptions(sceneItem);
}

function updateSceneCharacterOptions(sceneItem) {
  const charId = sceneItem.querySelector("[name='scene-character-id']").value;
  const variantSelect = sceneItem.querySelector("[name='scene-variant']");
  const exprSelect = sceneItem.querySelector("[name='scene-expression']");
  const baseChar = charId ? getBaseCharById(charId) : null;
  variantSelect.innerHTML = '<option value="">騾壼ｸｸ遶九■邨ｵ</option>';
  exprSelect.innerHTML = '<option value="">デフォルト</option>';
  if (baseChar?.variants?.length) {
    baseChar.variants.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.name;
      opt.textContent = v.name;
      variantSelect.appendChild(opt);
    });
  }
  if (baseChar?.expressions?.length) {
    baseChar.expressions.forEach(e => {
      const opt = document.createElement("option");
      opt.value = e.name;
      opt.textContent = e.name;
      exprSelect.appendChild(opt);
    });
  }
}

function setupPreviews() {
  const portraitInput = document.querySelector("#base-char-form input[name='portrait']");
  portraitInput.addEventListener("change", () => previewImage(portraitInput, "base-char-preview", "base-char-preview-img"));
  const imageInput = document.querySelector("#character-form input[name='image']");
  imageInput.addEventListener("change", () => previewImage(imageInput, "char-preview", "char-preview-img"));
}

function previewImage(input, previewId, imgId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById(previewId).hidden = false;
    document.getElementById(imgId).src = reader.result;
  };
  reader.readAsDataURL(file);
}

function beginGachaEdit(id) {
  const gacha = gachas.find(item => item.id === id);
  if (!gacha) return;
  editState.gachaId = id;
  const form = document.getElementById("gacha-form");
  form.title.value = gacha.title || "";
  form.description.value = gacha.description || "";
  if (form.displayMode) {
    form.displayMode.value = gacha.displayMode === "manualImages" ? "manualImages" : "featuredCards";
  }
  systemEditor.renderGachaRateInputs(gacha.rates);
  renderGachaPoolChars(gacha.featured || []);
  updateEditorSubmitLabels();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetGachaForm() {
  editState.gachaId = null;
  const form = document.getElementById("gacha-form");
  form.reset();
  if (form.displayMode) form.displayMode.value = "featuredCards";
  systemEditor.renderGachaRateInputs(getDefaultRates());
  renderGachaPoolChars();
  updateEditorSubmitLabels();
}

function updateEditorSubmitLabels() {
  setSubmitLabel("base-char-form", editState.baseCharId ? "ベースキャラを更新" : "ベースキャラを登録");
  setSubmitLabel("character-form", editState.characterId ? "カードを更新" : "カードを登録");
  setSubmitLabel("story-form", editState.storyId ? "ストーリーを更新" : "ストーリーを登録");
  setSubmitLabel("gacha-form", editState.gachaId ? "ガチャを更新" : "ガチャを登録");
}

function setSubmitLabel(formId, label) {
  const button = document.querySelector(`#${formId} button[type="submit"]`);
  if (button) button.textContent = label;
}

function getEditingFeaturedIds() {
  if (!editState.gachaId) return [];
  return gachas.find(gacha => gacha.id === editState.gachaId)?.featured || [];
}

function populateBaseCharSelects() {
  const cardSelect = document.getElementById("card-base-char-select");
  if (cardSelect) {
    const currentValue = cardSelect.value;
    cardSelect.innerHTML = '<option value="">-- 選択なし --</option>' +
      baseChars.map(baseChar => `<option value="${esc(baseChar.id)}">${esc(baseChar.name)}</option>`).join("");
    cardSelect.value = currentValue;
  }

  document.querySelectorAll("select[name='scene-character-id']").forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">キャラなし</option>' +
      baseChars.map(baseChar => `<option value="${esc(baseChar.id)}">${esc(baseChar.name)}</option>`).join("");
    select.value = currentValue;
  });

  const storyCardSelect = document.getElementById("story-character-select");
  if (storyCardSelect) {
    const currentValue = storyCardSelect.value;
    storyCardSelect.innerHTML = '<option value="">カードを選択</option>' +
      characters.map(char => `<option value="${esc(char.id)}">${esc(getRarityLabel(char.rarity))} ${esc(char.name)}</option>`).join("");
    storyCardSelect.value = currentValue;
  }

  const currentAssignments = editState.storyId
    ? (stories.find(story => story.id === editState.storyId)?.variantAssignments || [])
    : storyEditor.collectStoryVariantAssignments();
  storyEditor.renderStoryVariantDefaults(currentAssignments);

  document.querySelectorAll("#home-opinion-list select[name='home-opinion-target'], #home-conversation-list select[name='home-conversation-target'], #home-birthday-list select[name='home-birthday-target'], #card-home-opinion-list select[name='card-home-opinion-target'], #card-home-conversation-list select[name='card-home-conversation-target'], #card-home-birthday-list select[name='card-home-birthday-target']").forEach(select => {
    const currentValue = select.value;
    const placeholder = select.name.endsWith("birthday-target") ? "誕生日対象キャラを選択" : "相手キャラを選択";
    select.innerHTML = `<option value="">${placeholder}</option>` +
      baseChars.map(baseChar => `<option value="${esc(baseChar.id)}">${esc(baseChar.name)}</option>`).join("");
    select.value = currentValue;
  });
}

function normalizeFolderList(list) {
  return (Array.isArray(list) ? list : [])
    .map((folder, index) => normalizeFolderRecord(folder, index))
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
}

function normalizeFolderRecord(folder, index = 0) {
  const id = String(folder?.id || "").trim().slice(0, 80);
  const name = String(folder?.name || "").trim().slice(0, 40);
  if (!id || !name) return null;
  return {
    id,
    name,
    sortOrder: Math.max(0, Number(folder?.sortOrder ?? index) || 0)
  };
}

function normalizeCharacterRecord(char) {
  return {
    ...(char || {}),
    folderId: char?.folderId ? String(char.folderId).trim().slice(0, 80) : null
  };
}

function normalizeStoryRecord(story) {
  return {
    ...(story || {}),
    folderId: story?.folderId ? String(story.folderId).trim().slice(0, 80) : null,
    sortOrder: Math.max(0, Number(story?.sortOrder) || 0)
  };
}

function populateFolderSelects() {
  populateFolderSelect("card-folder-select", systemConfig.cardFolders, "フォルダなし");
  populateFolderSelect("story-folder-select", systemConfig.storyFolders, "フォルダなし");
}

function populateFolderSelect(elementId, folders, placeholder) {
  const select = document.getElementById(elementId);
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = `<option value="">${esc(placeholder)}</option>` +
    normalizeFolderList(folders).map(folder => `<option value="${esc(folder.id)}">${esc(folder.name)}</option>`).join("");
  select.value = currentValue;
}

async function persistSystemConfigState() {
  saveLocal("socia-system", systemConfig);
  try {
    const response = await postJSON(apiUrl(API.system), systemConfig);
    if (response?.system) {
      systemConfig = {
        ...getDefaultSystemConfig(),
        ...response.system,
        cardFolders: normalizeFolderList(response.system.cardFolders),
        storyFolders: normalizeFolderList(response.system.storyFolders)
      };
      saveLocal("socia-system", systemConfig);
    }
  } catch (error) {
    console.error("Failed to save system config:", error);
    showToast("フォルダ設定の保存に失敗しました。ローカルには保持されています。");
  }
}

async function createContentFolder(kind) {
  const name = window.prompt(kind === "story" ? "ストーリーフォルダ名" : "カードフォルダ名");
  const trimmed = String(name || "").trim().slice(0, 40);
  if (!trimmed) return null;

  const key = kind === "story" ? "storyFolders" : "cardFolders";
  const current = normalizeFolderList(systemConfig[key]);
  const folder = {
    id: crypto.randomUUID(),
    name: trimmed,
    sortOrder: current.length
  };

  systemConfig = {
    ...systemConfig,
    [key]: [...current, folder]
  };

  await persistSystemConfigState();
  populateFolderSelects();
  renderEditorScreen();
  showToast(`${trimmed} を追加しました。`);
  return folder;
}

function getBaseCharById(id) {
  return baseChars.find(baseChar => baseChar.id === id) || null;
}

function findCharacterImageByName(name) {
  return characters.find(char => char.name === name)?.image || "";
}

function buildStorySummary(story) {
  const firstScene = story.scenes?.find(scene => scene.text)?.text || "";
  return firstScene ? firstScene.slice(0, 60) : "シーン未登録";
}

function buildGachaRateSummary(rates = {}) {
  const normalized = normalizeRates(rates);
  return getRarityModeConfig().tiers
    .map(tier => `${getRarityLabel(tier.value)} ${normalized[tier.value] || 0}%`)
    .join(" / ");
}

function renderVoiceLineFields(containerId, prefix, defs, values = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = defs.map(([key, label]) => `
    <label>
      ${label}
      <textarea name="${prefix}-${key}" rows="2" maxlength="200" placeholder="${label}を入力">${esc(values[key] || "")}</textarea>
    </label>
  `).join("");
}

function collectVoiceLineFields(containerId, prefix, defs) {
  const voiceLines = {};
  defs.forEach(([key]) => {
    const input = document.querySelector(`#${containerId} [name="${prefix}-${key}"]`);
    voiceLines[key] = input ? input.value.trim() : "";
  });
  return voiceLines;
}

function collectRelationLines(listSelector, fieldMap) {
  return Array.from(document.querySelectorAll(`${listSelector} .relation-line-item`)).map(item => {
    const entry = {};
    Object.entries(fieldMap).forEach(([key, selector]) => {
      entry[key] = item.querySelector(selector).value.trim();
    });
    return entry;
  });
}

function upsertItem(collection, nextItem) {
  const index = collection.findIndex(item => item.id === nextItem.id);
  if (index >= 0) collection[index] = nextItem;
  else collection.unshift(nextItem);
}

function readFileAsDataUrl(file) {
  return imageReadFileAsDataUrl(file);
}

function makeBaseCharFallback(name, color) {
  return imageMakeBaseCharFallback(name, color);
}

function makeFallbackImage(name, rarity) {
  return imageMakeFallbackImage(name, rarity, systemConfig?.rarityMode);
}

function esc(str) {
  return escapeHtml(str);
}

function showToast(message) {
  toastShowToast(message);
}





