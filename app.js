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
let systemConfig = getDefaultSystemConfig();
let currentScreen = "home";
let currentStoryType = "main";
let activeGacha = null;
let storyReaderState = null;
let homeConfigDraft = null;
let activeHomeConfigTarget = 1;
let homeConfigDrag = null;
let homeDialogueState = null;
let collectionScreen = null;
let gachaScreen = null;
let storyScreen = null;
let systemEditor = null;
let entryEditor = null;
let baseCharEditor = null;
let storyEditor = null;
let editorScreen = null;

const editState = {
  baseCharId: null,
  characterId: null,
  storyId: null,
  gachaId: null
};

const roomId = new URLSearchParams(location.search).get("room") || null;
function apiUrl(path) {
  return roomId ? `${path}?room=${encodeURIComponent(roomId)}` : path;
}

const API = {
  baseChars: "/api/base-chars",
  characters: "/api/entries",
  stories: "/api/stories",
  gachas: "/api/gachas",
  system: "/api/system"
};

function getDefaultSystemConfig() {
  return { rarityMode: getDefaultRarityMode(), orientation: "auto" };
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
  collectionScreen = window.CollectionScreen.setupCollectionScreen({
    getCharacters: () => characters,
    getStories: () => stories,
    getSystemConfig: () => systemConfig,
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
  gachaScreen = window.GachaScreen.setupGachaScreen({
    getCharacters: () => characters,
    getGachas: () => gachas,
    getSystemConfig: () => systemConfig,
    getActiveGacha: () => activeGacha,
    setActiveGacha: value => { activeGacha = value; },
    buildGachaRateSummary,
    normalizeRates,
    getDefaultRates,
    getRarityModeConfig,
    getRarityLabel,
    getRarityCssClass,
    normalizeRarityValue,
    makeFallbackImage,
    showCardDetail: char => collectionScreen.showCardDetail(char),
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
      try { await postJSON(apiUrl(API.system), value); } catch {}
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
    getBaseCharById,
    esc
  });
  editorScreen = window.EditorScreen.setupEditorScreen({
    getBaseChars: () => baseChars,
    getCharacters: () => characters,
    getStories: () => stories,
    getGachas: () => gachas,
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
    updateEditorSubmitLabels
  });
  setupNavigation();
  setupForms();
  setupPreviews();
  setupHomeConfig();
  setupHomeInteractions();

  await loadAllData();
  applyOrientation();
  renderAll();
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
    if (screen === "gacha" && gachaScreen) gachaScreen.renderGachaScreen();
    if (screen === "story" && storyScreen) storyScreen.renderStoryScreen();
    if (screen === "collection" && collectionScreen) collectionScreen.renderCollectionScreen();
    if (screen === "editor" && editorScreen) editorScreen.renderEditorScreen();
  } catch (error) {
    console.error("navigateTo render error:", error);
  }
}

window.navigateTo = navigateTo;

async function loadAllData() {
  const [loadedBaseChars, loadedCharacters, loadedStories, loadedGachas, loadedSystem] = await Promise.all([
    fetchJSON(apiUrl(API.baseChars)).then(data => data.baseChars || []).catch(() => loadLocal("socia-base-chars", [])),
    fetchJSON(apiUrl(API.characters)).then(data => data.entries || []).catch(() => loadLocal("socia-characters", [])),
    fetchJSON(apiUrl(API.stories)).then(data => data.stories || []).catch(() => loadLocal("socia-stories", [])),
    fetchJSON(apiUrl(API.gachas)).then(data => data.gachas || []).catch(() => loadLocal("socia-gachas", [])),
    fetchJSON(apiUrl(API.system)).then(data => data.system || getDefaultSystemConfig()).catch(() => loadLocal("socia-system", getDefaultSystemConfig()))
  ]);

  baseChars = loadedBaseChars;
  characters = loadedCharacters;
  stories = loadedStories;
  gachas = loadedGachas;
  systemConfig = {
    ...getDefaultSystemConfig(),
    ...(loadedSystem || {})
  };

  saveLocal("socia-base-chars", baseChars);
  saveLocal("socia-characters", characters);
  saveLocal("socia-stories", stories);
  saveLocal("socia-gachas", gachas);
  saveLocal("socia-system", systemConfig);
}

async function fetchJSON(url) {
  return apiGet(url);
}

async function postJSON(url, data) {
  return apiPost(url, data);
}

function loadLocal(key, fallback) {
  return storageLoadLocal(key, fallback, roomId);
}

function saveLocal(key, data) {
  storageSaveLocal(key, data, roomId);
}

function getScopedStorageKey(key) {
  return storageGetScopedStorageKey(key, roomId);
}

function renderAll() {
  collectionScreen.renderCollectionFilters("all");
  renderHome("refresh");
  editorScreen.renderEditorScreen();
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
  try {
    const raw = localStorage.getItem("socia-home-config");
    if (raw) return { mode: 1, card1: "", card2: "", scale1: 100, x1: -10, y1: 0, scale2: 100, x2: 10, y2: 0, front: 2, ...JSON.parse(raw) };
  } catch {}
  return { mode: 1, card1: "", card2: "", scale1: 100, x1: -10, y1: 0, scale2: 100, x2: 10, y2: 0, front: 2 };
}

function saveHomeConfig(config) {
  localStorage.setItem("socia-home-config", JSON.stringify(config));
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

  saveBtn.addEventListener("click", () => {
    if (!homeConfigDraft) return;
    saveHomeConfig(homeConfigDraft);
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
    select.innerHTML = '<option value="">閾ｪ蜍包ｼ域怙譁ｰ繧ｫ繝ｼ繝会ｼ・/option>' +
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
    stageChar.innerHTML = `<div class="home-config-stage-empty">繧ｫ繝ｼ繝画悴驕ｸ謚・/div>`;
  } else {
    stageChar.innerHTML = `<img src="${card.image || makeFallbackImage(card.name, card.rarity)}" alt="${esc(card.name)}">`;
  }

  stageChar.classList.remove("is-hidden");
  stageChar.classList.toggle("is-active", activeHomeConfigTarget === index);
  stageChar.classList.toggle("is-front", homeConfigDraft.front === index);
  stageChar.classList.toggle("is-back", homeConfigDraft.front !== index);
  stageChar.dataset.label = `繧ｭ繝｣繝ｩ${index}`;
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
  const bannerImage = bannerFile ? await readFileAsDataUrl(bannerFile) : (existing?.bannerImage || "");
  const featured = Array.from(document.querySelectorAll(".gacha-pool-char.selected")).map(el => el.dataset.charId);
  const gacha = {
    id: editState.gachaId || crypto.randomUUID(),
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    bannerImage,
    featured,
    rates: getRarityModeConfig().tiers.reduce((acc, tier) => {
      acc[tier.value] = Number(form.querySelector(`[name="rate-${tier.value}"]`)?.value) || 0;
      return acc;
    }, {})
  };
  upsertItem(gachas, gacha);
  saveLocal("socia-gachas", gachas);
  try { await postJSON(apiUrl(API.gachas), gacha); } catch {}
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
  exprSelect.innerHTML = '<option value="">繝・ヵ繧ｩ繝ｫ繝・/option>';
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
  systemEditor.renderGachaRateInputs(gacha.rates);
  renderGachaPoolChars(gacha.featured || []);
  updateEditorSubmitLabels();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetGachaForm() {
  editState.gachaId = null;
  const form = document.getElementById("gacha-form");
  form.reset();
  systemEditor.renderGachaRateInputs(getDefaultRates());
  renderGachaPoolChars();
  updateEditorSubmitLabels();
}

function updateEditorSubmitLabels() {
  setSubmitLabel("base-char-form", editState.baseCharId ? "繝吶・繧ｹ繧ｭ繝｣繝ｩ繧呈峩譁ｰ" : "繝吶・繧ｹ繧ｭ繝｣繝ｩ繧堤匳骭ｲ");
  setSubmitLabel("character-form", editState.characterId ? "繧ｫ繝ｼ繝峨ｒ譖ｴ譁ｰ" : "繧ｫ繝ｼ繝峨ｒ逋ｻ骭ｲ");
  setSubmitLabel("story-form", editState.storyId ? "繧ｹ繝医・繝ｪ繝ｼ繧呈峩譁ｰ" : "繧ｹ繝医・繝ｪ繝ｼ繧堤匳骭ｲ");
  setSubmitLabel("gacha-form", editState.gachaId ? "繧ｬ繝√Ε繧呈峩譁ｰ" : "繧ｬ繝√Ε繧堤匳骭ｲ");
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
    cardSelect.innerHTML = '<option value="">-- 譛ｪ驕ｸ謚・--</option>' +
      baseChars.map(baseChar => `<option value="${esc(baseChar.id)}">${esc(baseChar.name)}</option>`).join("");
    cardSelect.value = currentValue;
  }

  document.querySelectorAll("select[name='scene-character-id']").forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">譛ｪ驕ｸ謚・/option>' +
      baseChars.map(baseChar => `<option value="${esc(baseChar.id)}">${esc(baseChar.name)}</option>`).join("");
    select.value = currentValue;
  });

  const storyCardSelect = document.getElementById("story-character-select");
  if (storyCardSelect) {
    const currentValue = storyCardSelect.value;
    storyCardSelect.innerHTML = '<option value="">繧ｫ繝ｼ繝峨ｒ驕ｸ謚・/option>' +
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









