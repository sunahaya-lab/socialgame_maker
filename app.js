let baseChars = [];
let characters = [];
let stories = [];
let gachas = [];
let currentScreen = "home";
let currentStoryType = "main";
let activeGacha = null;
let storyReaderState = null;

const editState = {
  baseCharId: null,
  characterId: null,
  storyId: null,
  gachaId: null
};

const API = {
  baseChars: "/api/base-chars",
  characters: "/api/entries",
  stories: "/api/stories",
  gachas: "/api/gachas"
};

const palettes = {
  UR: ["#2d0a0a", "#ff6b6b", "#ff9999"],
  SSR: ["#2d2200", "#ffd447", "#ffe680"],
  SR: ["#1a1040", "#a29bfe", "#c8c3ff"],
  R: ["#0a1a2d", "#74b9ff", "#a0d8ff"],
  N: ["#1a1a1a", "#b2bec3", "#dfe6e9"]
};

void init();

async function init() {
  setupNavigation();
  setupEditorTabs();
  setupStoryTabs();
  setupCollectionFilters();
  setupGachaButtons();
  setupCardDetail();
  setupStoryReader();
  setupForms();
  setupPreviews();

  await loadAllData();
  renderAll();
}

function setupNavigation() {
  document.querySelectorAll("[data-go]").forEach(btn => {
    btn.addEventListener("click", () => navigateTo(btn.dataset.go));
    btn.addEventListener("mousedown", () => navigateTo(btn.dataset.go));
  });
}

function navigateTo(screen) {
  currentScreen = screen;
  document.querySelectorAll(".screen").forEach(screenEl => screenEl.classList.remove("active"));
  document.getElementById(`screen-${screen}`).classList.add("active");

  document.querySelectorAll(".bottom-nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.go === screen);
  });

  if (screen === "home") renderHome();
  if (screen === "gacha") renderGachaScreen();
  if (screen === "story") renderStoryScreen();
  if (screen === "collection") renderCollectionScreen();
  if (screen === "editor") renderEditorScreen();
}

async function loadAllData() {
  const [loadedBaseChars, loadedCharacters, loadedStories, loadedGachas] = await Promise.all([
    fetchJSON(API.baseChars).then(data => data.baseChars || []).catch(() => loadLocal("socia-base-chars", [])),
    fetchJSON(API.characters).then(data => data.entries || []).catch(() => loadLocal("socia-characters", [])),
    fetchJSON(API.stories).then(data => data.stories || []).catch(() => loadLocal("socia-stories", [])),
    fetchJSON(API.gachas).then(data => data.gachas || []).catch(() => loadLocal("socia-gachas", []))
  ]);

  baseChars = loadedBaseChars;
  characters = loadedCharacters;
  stories = loadedStories;
  gachas = loadedGachas;

  saveLocal("socia-base-chars", baseChars);
  saveLocal("socia-characters", characters);
  saveLocal("socia-stories", stories);
  saveLocal("socia-gachas", gachas);
}

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

function loadLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function renderAll() {
  renderHome();
  renderEditorScreen();
}

function renderHome() {
  document.getElementById("home-char-count").textContent = String(characters.length);
  document.getElementById("home-story-count").textContent = String(stories.length);
  document.getElementById("home-gacha-count").textContent = String(gachas.length);

  const level = Math.max(1, characters.length + stories.length * 2 + gachas.length * 3);
  document.getElementById("home-lv").textContent = String(level);

  const charImg = document.getElementById("home-char-img");
  if (characters.length > 0) {
    const featured = characters[0];
    charImg.src = featured.image || makeFallbackImage(featured.name, featured.rarity);
    charImg.alt = featured.name;
    document.getElementById("home-speech-name").textContent = featured.name;
    document.getElementById("home-speech-text").textContent = featured.catch || "カードを集めて世界を広げよう。";
  } else {
    charImg.src = "";
    charImg.alt = "";
    document.getElementById("home-speech-name").textContent = "";
    document.getElementById("home-speech-text").textContent = "まずは編集画面でカードを登録してください。";
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
}

function setupGachaButtons() {
  document.getElementById("gacha-single").addEventListener("click", () => pullGacha(1));
  document.getElementById("gacha-ten").addEventListener("click", () => pullGacha(10));
  document.getElementById("gacha-results-ok").addEventListener("click", () => {
    document.getElementById("gacha-results").hidden = true;
    document.getElementById("gacha-active-area").hidden = false;
  });
}

function renderGachaScreen() {
  const bannerList = document.getElementById("gacha-banner-list");
  const noBanner = document.getElementById("gacha-no-banner");
  const activeArea = document.getElementById("gacha-active-area");
  const results = document.getElementById("gacha-results");

  bannerList.innerHTML = "";
  results.hidden = true;

  if (characters.length === 0 || gachas.length === 0) {
    noBanner.hidden = false;
    activeArea.hidden = true;
    return;
  }

  noBanner.hidden = true;
  gachas.forEach((gacha, index) => {
    const card = document.createElement("div");
    card.className = "gacha-banner-card";
    card.innerHTML = `
      <h4>${esc(gacha.title)}</h4>
      <p>${esc(gacha.description || buildGachaRateSummary(gacha.rates))}</p>
      <span class="gacha-banner-tag">pickup</span>
    `;
    card.addEventListener("click", () => selectGacha(index));
    bannerList.appendChild(card);
  });

  if (activeGacha === null || !gachas[activeGacha]) activeGacha = 0;
  showActiveGacha();
}

function selectGacha(index) {
  activeGacha = index;
  showActiveGacha();
}

function showActiveGacha() {
  const gacha = gachas[activeGacha];
  if (!gacha) return;

  document.getElementById("gacha-active-area").hidden = false;
  document.getElementById("gacha-active-title").textContent = gacha.title;
  document.getElementById("gacha-active-desc").textContent = gacha.description || "";

  const rates = gacha.rates || { N: 40, R: 30, SR: 20, SSR: 8, UR: 2 };
  document.getElementById("gacha-rates").innerHTML =
    ["N", "R", "SR", "SSR", "UR"].map(rarity => `<span>${rarity}: ${rates[rarity] || 0}%</span>`).join("");
}

function pullGacha(count) {
  if (characters.length === 0) return;

  const gacha = gachas[activeGacha];
  const rates = gacha?.rates || { N: 40, R: 30, SR: 20, SSR: 8, UR: 2 };

  document.getElementById("gacha-overlay").hidden = false;
  document.getElementById("gacha-active-area").hidden = true;

  setTimeout(() => {
    document.getElementById("gacha-overlay").hidden = true;
    const results = [];

    for (let i = 0; i < count; i += 1) {
      const rarity = rollRarity(rates);
      const pool = characters.filter(char => char.rarity === rarity);
      const char = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : characters[Math.floor(Math.random() * characters.length)];
      results.push({ ...char, rolledRarity: rarity });
    }

    showGachaResults(results);
  }, 1500);
}

function rollRarity(rates) {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const rarity of ["UR", "SSR", "SR", "R", "N"]) {
    cumulative += rates[rarity] || 0;
    if (roll < cumulative) return rarity;
  }
  return "N";
}

function showGachaResults(results) {
  const grid = document.getElementById("gacha-results-grid");
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = results.length === 1 ? "1fr" : "repeat(5, 1fr)";

  results.forEach((char, index) => {
    const card = document.createElement("div");
    card.className = `gacha-result-card rarity-${char.rolledRarity || char.rarity}`;
    card.style.animationDelay = `${index * 0.1}s`;
    card.innerHTML = `
      <img src="${char.image || makeFallbackImage(char.name, char.rarity)}" alt="${esc(char.name)}">
      <div class="gacha-result-info">
        <p class="gacha-result-rarity">${esc(char.rolledRarity || char.rarity)}</p>
        <p class="gacha-result-name">${esc(char.name)}</p>
      </div>
    `;
    card.addEventListener("click", () => showCardDetail(char));
    grid.appendChild(card);
  });

  document.getElementById("gacha-results").hidden = false;
}

function setupStoryTabs() {
  document.querySelectorAll(".story-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".story-tab").forEach(item => item.classList.remove("active"));
      tab.classList.add("active");
      currentStoryType = tab.dataset.storyType;
      renderStoryList();
    });
  });
}function renderStoryScreen() {
  renderStoryList();
}

function renderStoryList() {
  const list = document.getElementById("story-list");
  const empty = document.getElementById("story-empty");
  const filtered = stories.filter(story => story.type === currentStoryType);

  list.innerHTML = "";
  if (filtered.length === 0) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  filtered.forEach(story => {
    const item = document.createElement("div");
    item.className = "story-item";
    item.innerHTML = `
      <p class="story-item-type">${story.type === "main" ? "MAIN STORY" : "EVENT STORY"}</p>
      <h4>${esc(story.title)}</h4>
      <p>${story.scenes?.length || 0} scenes</p>
    `;
    item.addEventListener("click", () => openStoryReader(story));
    list.appendChild(item);
  });
}

function setupStoryReader() {
  document.querySelector(".story-reader-textbox").addEventListener("click", () => advanceStory());
  document.getElementById("story-reader-close").addEventListener("click", () => closeStoryReader());
}

function openStoryReader(story) {
  if (!story.scenes || story.scenes.length === 0) {
    showToast("シーンがありません。");
    return;
  }

  storyReaderState = { story, index: 0 };
  document.getElementById("story-reader").hidden = false;
  renderStoryScene();
}

function renderStoryScene() {
  if (!storyReaderState) return;

  const { story, index } = storyReaderState;
  const scene = story.scenes[index];
  const baseChar = scene.characterId ? getBaseCharById(scene.characterId) : null;
  const charName = baseChar ? baseChar.name : (scene.character || "Narration");
  const portrait = baseChar?.portrait || scene.image || findCharacterImageByName(scene.character);

  const nameEl = document.getElementById("story-reader-name");
  nameEl.textContent = charName;
  nameEl.style.color = baseChar?.color || "var(--accent-light)";
  document.getElementById("story-reader-text").textContent = scene.text || "";

  const charEl = document.getElementById("story-reader-character");
  charEl.innerHTML = "";
  if (portrait) {
    const img = document.createElement("img");
    img.src = portrait;
    img.alt = charName;
    charEl.appendChild(img);
  }

  document.getElementById("story-reader-bg").style.background = baseChar
    ? `linear-gradient(180deg, ${baseChar.color}22 0%, #0a0a12 60%)`
    : "linear-gradient(180deg, #1a1040 0%, #0a0a12 100%)";

  const progress = ((index + 1) / story.scenes.length) * 100;
  const progressEl = document.getElementById("story-reader-progress");
  progressEl.style.width = `${progress}%`;
  progressEl.style.background = baseChar?.color || "var(--accent-light)";
}

function advanceStory() {
  if (!storyReaderState) return;
  storyReaderState.index += 1;

  if (storyReaderState.index >= storyReaderState.story.scenes.length) {
    closeStoryReader();
    showToast("ストーリーを読み終えました。");
    return;
  }

  renderStoryScene();
}

function closeStoryReader() {
  storyReaderState = null;
  document.getElementById("story-reader").hidden = true;
}

function setupCollectionFilters() {
  document.querySelectorAll(".collection-filter").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".collection-filter").forEach(item => item.classList.remove("active"));
      btn.classList.add("active");
      renderCollectionScreen(btn.dataset.rarity);
    });
  });
}

function renderCollectionScreen(filterRarity) {
  const grid = document.getElementById("collection-grid");
  const empty = document.getElementById("collection-empty");
  const activeFilter = filterRarity || document.querySelector(".collection-filter.active")?.dataset.rarity || "all";
  const filtered = activeFilter === "all" ? characters : characters.filter(char => char.rarity === activeFilter);

  grid.innerHTML = "";
  if (characters.length === 0) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  filtered.forEach(char => {
    const card = document.createElement("div");
    card.className = `collection-card rarity-${char.rarity}`;
    card.innerHTML = `
      <img src="${char.image || makeFallbackImage(char.name, char.rarity)}" alt="${esc(char.name)}">
      <div class="collection-card-info">
        <span class="collection-card-rarity ${char.rarity}">${esc(char.rarity)}</span>
        <p class="collection-card-name">${esc(char.name)}</p>
      </div>
    `;
    card.addEventListener("click", () => showCardDetail(char));
    grid.appendChild(card);
  });
}

function setupCardDetail() {
  document.getElementById("card-detail-close").addEventListener("click", () => {
    document.getElementById("card-detail").hidden = true;
  });
  document.getElementById("card-detail").addEventListener("click", e => {
    if (e.target === document.getElementById("card-detail")) {
      document.getElementById("card-detail").hidden = true;
    }
  });
}

function showCardDetail(char) {
  document.getElementById("card-detail-image").innerHTML =
    `<img src="${char.image || makeFallbackImage(char.name, char.rarity)}" alt="${esc(char.name)}">`;
  document.getElementById("card-detail-rarity").textContent = char.rarity;
  document.getElementById("card-detail-name").textContent = char.name;
  document.getElementById("card-detail-catch").textContent = char.catch || "";
  document.getElementById("card-detail-attr").textContent = char.attribute || "";
  document.getElementById("card-detail").hidden = false;
}

function setupEditorTabs() {
  document.querySelectorAll(".editor-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".editor-tab").forEach(item => item.classList.remove("active"));
      document.querySelectorAll(".editor-panel").forEach(panel => panel.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`editor-${tab.dataset.editorTab}`).classList.add("active");
      if (tab.dataset.editorTab === "gacha") renderGachaPoolChars(getEditingFeaturedIds());
    });
  });
}

function renderEditorScreen() {
  renderBaseCharList();
  renderEditorCharacterList();
  renderEditorStoryList();
  renderEditorGachaList();
  renderGachaPoolChars(getEditingFeaturedIds());
  populateBaseCharSelects();
  updateEditorSubmitLabels();
}

function renderBaseCharList() {
  const list = document.getElementById("base-char-list");
  list.innerHTML = "";
  if (baseChars.length === 0) {
    list.innerHTML = '<p class="editor-record-empty">まだベースキャラが登録されていません。</p>';
    return;
  }

  baseChars.forEach(baseChar => {
    const item = document.createElement("div");
    item.className = "base-char-item";
    item.innerHTML = `
      <img class="base-char-portrait" src="${baseChar.portrait}" alt="${esc(baseChar.name)}">
      <div class="base-char-info">
        <p class="base-char-info-name" style="color:${baseChar.color}">${esc(baseChar.name)}</p>
        <p class="base-char-info-desc">${esc(baseChar.description || "")}</p>
      </div>
      <span class="base-char-color-dot" style="background:${baseChar.color}"></span>
      <div class="editor-record-actions">
        <button class="editor-inline-btn" type="button" data-action="edit">編集</button>
        <button class="base-char-delete" type="button" data-action="delete">削除</button>
      </div>
    `;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => beginBaseCharEdit(baseChar.id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteBaseChar(baseChar.id));
    list.appendChild(item);
  });
}

function renderEditorCharacterList() {
  const list = document.getElementById("editor-character-list");
  list.innerHTML = "";
  if (characters.length === 0) {
    list.innerHTML = '<p class="editor-record-empty">まだカードが登録されていません。</p>';
    return;
  }

  characters.forEach(char => {
    const item = document.createElement("div");
    item.className = `editor-record-card rarity-${char.rarity}`;
    item.innerHTML = `
      <img src="${char.image || makeFallbackImage(char.name, char.rarity)}" alt="${esc(char.name)}">
      <div class="editor-record-card-body">
        <div class="editor-record-item-top">
          <span class="editor-record-badge ${char.rarity}">${esc(char.rarity)}</span>
          <span class="editor-record-meta">${esc(char.attribute || "-")}</span>
        </div>
        <h5>${esc(char.name)}</h5>
        <p>${esc(char.catch || "")}</p>
        <div class="editor-record-actions">
          <button class="editor-inline-btn" type="button" data-action="edit">編集</button>
          <button class="editor-inline-btn" type="button" data-action="detail">詳細</button>
        </div>
      </div>
    `;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => beginCharacterEdit(char.id));
    item.querySelector('[data-action="detail"]').addEventListener("click", () => showCardDetail(char));
    list.appendChild(item);
  });
}

function renderEditorStoryList() {
  const list = document.getElementById("editor-story-list");
  list.innerHTML = "";
  if (stories.length === 0) {
    list.innerHTML = '<p class="editor-record-empty">まだストーリーが登録されていません。</p>';
    return;
  }

  stories.forEach(story => {
    const item = document.createElement("div");
    item.className = "editor-record-item";
    item.innerHTML = `
      <div class="editor-record-item-top">
        <span class="editor-record-badge">${story.type === "main" ? "MAIN" : "EVENT"}</span>
        <span class="editor-record-meta">${story.scenes?.length || 0} scenes</span>
      </div>
      <h5>${esc(story.title)}</h5>
      <p>${esc(buildStorySummary(story))}</p>
      <div class="editor-record-actions">
        <button class="editor-inline-btn" type="button" data-action="edit">編集</button>
        <button class="editor-inline-btn" type="button" data-action="read">閲覧</button>
      </div>
    `;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => beginStoryEdit(story.id));
    item.querySelector('[data-action="read"]').addEventListener("click", () => openStoryReader(story));
    list.appendChild(item);
  });
}

function renderEditorGachaList() {
  const list = document.getElementById("editor-gacha-list");
  list.innerHTML = "";
  if (gachas.length === 0) {
    list.innerHTML = '<p class="editor-record-empty">まだガチャが登録されていません。</p>';
    return;
  }

  gachas.forEach((gacha, index) => {
    const item = document.createElement("div");
    item.className = "editor-record-item";
    item.innerHTML = `
      <div class="editor-record-item-top">
        <span class="editor-record-badge">GACHA</span>
        <span class="editor-record-meta">pickup ${gacha.featured?.length || 0}</span>
      </div>
      <h5>${esc(gacha.title)}</h5>
      <p>${esc(gacha.description || buildGachaRateSummary(gacha.rates))}</p>
      <div class="editor-record-actions">
        <button class="editor-inline-btn" type="button" data-action="edit">編集</button>
        <button class="editor-inline-btn" type="button" data-action="open">開く</button>
      </div>
    `;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => beginGachaEdit(gacha.id));
    item.querySelector('[data-action="open"]').addEventListener("click", () => {
      activeGacha = index;
      navigateTo("gacha");
    });
    list.appendChild(item);
  });
}

function renderGachaPoolChars(selectedIds = []) {
  const container = document.getElementById("gacha-pool-chars");
  container.innerHTML = "";
  characters.forEach(char => {
    const item = document.createElement("div");
    item.className = "gacha-pool-char";
    if (selectedIds.includes(char.id)) item.classList.add("selected");
    item.dataset.charId = char.id;
    item.innerHTML = `
      <img src="${char.image || makeFallbackImage(char.name, char.rarity)}" alt="${esc(char.name)}">
      <span>${esc(char.rarity)} ${esc(char.name)}</span>
    `;
    item.addEventListener("click", () => item.classList.toggle("selected"));
    container.appendChild(item);
  });
}

function setupForms() {
  document.getElementById("base-char-form").addEventListener("submit", handleBaseCharSubmit);
  document.getElementById("character-form").addEventListener("submit", handleCharacterSubmit);
  document.getElementById("story-form").addEventListener("submit", handleStorySubmit);
  document.getElementById("gacha-form").addEventListener("submit", handleGachaSubmit);
  document.getElementById("add-scene-btn").addEventListener("click", () => addSceneInput());

  const sceneList = document.getElementById("scene-list");
  sceneList.innerHTML = "";
  addSceneInput();
}

async function handleBaseCharSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const existing = editState.baseCharId ? baseChars.find(item => item.id === editState.baseCharId) : null;
  const portraitFile = form.portrait.files[0];
  const portrait = portraitFile ? await readFileAsDataUrl(portraitFile) : (existing?.portrait || "");
  const baseChar = {
    id: editState.baseCharId || crypto.randomUUID(),
    name: form.name.value.trim(),
    description: form.description.value.trim(),
    color: form.color.value || "#a29bfe",
    portrait: portrait || makeBaseCharFallback(form.name.value.trim(), form.color.value)
  };
  upsertItem(baseChars, baseChar);
  saveLocal("socia-base-chars", baseChars);
  try { await postJSON(API.baseChars, baseChar); } catch {}
  resetBaseCharForm();
  renderBaseCharList();
  populateBaseCharSelects();
  showToast(`${baseChar.name} を${existing ? "更新" : "登録"}しました。`);
}

async function handleCharacterSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const existing = editState.characterId ? characters.find(item => item.id === editState.characterId) : null;
  const imageFile = form.image.files[0];
  const image = imageFile ? await readFileAsDataUrl(imageFile) : (existing?.image || "");
  const char = {
    id: editState.characterId || crypto.randomUUID(),
    name: form.name.value.trim(),
    catch: form.catch.value.trim(),
    rarity: form.rarity.value,
    attribute: form.attribute.value.trim() || "未設定",
    image: image || makeFallbackImage(form.name.value.trim(), form.rarity.value)
  };
  upsertItem(characters, char);
  saveLocal("socia-characters", characters);
  try { await postJSON(API.characters, char); } catch {}
  resetCharacterForm();
  renderHome();
  renderEditorCharacterList();
  renderGachaPoolChars(getEditingFeaturedIds());
  showToast(`${char.name} を${existing ? "更新" : "登録"}しました。`);
}

async function handleStorySubmit(e) {
  e.preventDefault();
  const form = e.target;
  const existing = editState.storyId ? stories.find(item => item.id === editState.storyId) : null;
  const scenes = collectStoryScenes();
  if (scenes.length === 0) {
    showToast("少なくとも1つシーンを入力してください。");
    return;
  }
  const story = {
    id: editState.storyId || crypto.randomUUID(),
    title: form.title.value.trim(),
    type: form.type.value,
    scenes
  };
  upsertItem(stories, story);
  saveLocal("socia-stories", stories);
  try { await postJSON(API.stories, story); } catch {}
  resetStoryForm();
  renderHome();
  renderEditorStoryList();
  showToast(`${story.title} を${existing ? "更新" : "登録"}しました。`);
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
    rates: {
      N: Number(form.rateN.value) || 0,
      R: Number(form.rateR.value) || 0,
      SR: Number(form.rateSR.value) || 0,
      SSR: Number(form.rateSSR.value) || 0,
      UR: Number(form.rateUR.value) || 0
    }
  };
  upsertItem(gachas, gacha);
  saveLocal("socia-gachas", gachas);
  try { await postJSON(API.gachas, gacha); } catch {}
  resetGachaForm();
  renderHome();
  renderEditorGachaList();
  showToast(`${gacha.title} を${existing ? "更新" : "登録"}しました。`);
}

function collectStoryScenes() {
  const scenes = [];
  document.querySelectorAll(".scene-item").forEach(item => {
    const charId = item.querySelector("[name='scene-character-id']").value;
    const text = item.querySelector("[name='scene-text']").value.trim();
    if (!text) return;
    const baseChar = charId ? getBaseCharById(charId) : null;
    scenes.push({ characterId: charId || null, character: baseChar ? baseChar.name : null, text });
  });
  return scenes;
}

function addSceneInput(scene = null) {
  const list = document.getElementById("scene-list");
  const item = document.createElement("div");
  item.className = "scene-item";
  const options = baseChars.map(baseChar =>
    `<option value="${esc(baseChar.id)}"${scene?.characterId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`
  ).join("");
  item.innerHTML = `
    <label>
      キャラクター
      <select name="scene-character-id">
        <option value="">未選択</option>
        ${options}
      </select>
    </label>
    <label>
      セリフ・地の文
      <textarea name="scene-text" maxlength="300" rows="2" placeholder="テキストを入力">${esc(scene?.text || "")}</textarea>
    </label>
    <button type="button" class="scene-remove">削除</button>
  `;
  item.querySelector(".scene-remove").addEventListener("click", () => item.remove());
  list.appendChild(item);
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

function beginBaseCharEdit(id) {
  const baseChar = baseChars.find(item => item.id === id);
  if (!baseChar) return;
  editState.baseCharId = id;
  const form = document.getElementById("base-char-form");
  form.name.value = baseChar.name || "";
  form.description.value = baseChar.description || "";
  form.color.value = baseChar.color || "#a29bfe";
  document.getElementById("base-char-preview").hidden = false;
  document.getElementById("base-char-preview-img").src = baseChar.portrait;
  updateEditorSubmitLabels();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function beginCharacterEdit(id) {
  const char = characters.find(item => item.id === id);
  if (!char) return;
  editState.characterId = id;
  const form = document.getElementById("character-form");
  form.name.value = char.name || "";
  form.catch.value = char.catch || "";
  form.rarity.value = char.rarity || "SR";
  form.attribute.value = char.attribute || "";
  document.getElementById("char-preview").hidden = false;
  document.getElementById("char-preview-img").src = char.image || makeFallbackImage(char.name, char.rarity);
  updateEditorSubmitLabels();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function beginStoryEdit(id) {
  const story = stories.find(item => item.id === id);
  if (!story) return;
  editState.storyId = id;
  const form = document.getElementById("story-form");
  form.title.value = story.title || "";
  form.type.value = story.type || "main";
  const sceneList = document.getElementById("scene-list");
  sceneList.innerHTML = "";
  if (story.scenes?.length) story.scenes.forEach(scene => addSceneInput(scene));
  else addSceneInput();
  updateEditorSubmitLabels();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function beginGachaEdit(id) {
  const gacha = gachas.find(item => item.id === id);
  if (!gacha) return;
  editState.gachaId = id;
  const form = document.getElementById("gacha-form");
  form.title.value = gacha.title || "";
  form.description.value = gacha.description || "";
  form.rateN.value = gacha.rates?.N ?? 40;
  form.rateR.value = gacha.rates?.R ?? 30;
  form.rateSR.value = gacha.rates?.SR ?? 20;
  form.rateSSR.value = gacha.rates?.SSR ?? 8;
  form.rateUR.value = gacha.rates?.UR ?? 2;
  renderGachaPoolChars(gacha.featured || []);
  updateEditorSubmitLabels();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteBaseChar(id) {
  baseChars = baseChars.filter(item => item.id !== id);
  saveLocal("socia-base-chars", baseChars);
  if (editState.baseCharId === id) resetBaseCharForm();
  renderBaseCharList();
  populateBaseCharSelects();
}

function resetBaseCharForm() {
  editState.baseCharId = null;
  const form = document.getElementById("base-char-form");
  form.reset();
  form.color.value = "#a29bfe";
  document.getElementById("base-char-preview").hidden = true;
  updateEditorSubmitLabels();
}

function resetCharacterForm() {
  editState.characterId = null;
  const form = document.getElementById("character-form");
  form.reset();
  form.rarity.value = "SR";
  document.getElementById("char-preview").hidden = true;
  updateEditorSubmitLabels();
}

function resetStoryForm() {
  editState.storyId = null;
  const form = document.getElementById("story-form");
  form.reset();
  const sceneList = document.getElementById("scene-list");
  sceneList.innerHTML = "";
  addSceneInput();
  updateEditorSubmitLabels();
}

function resetGachaForm() {
  editState.gachaId = null;
  const form = document.getElementById("gacha-form");
  form.reset();
  form.rateN.value = 40;
  form.rateR.value = 30;
  form.rateSR.value = 20;
  form.rateSSR.value = 8;
  form.rateUR.value = 2;
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
    cardSelect.innerHTML = '<option value="">-- 未選択 --</option>' +
      baseChars.map(baseChar => `<option value="${esc(baseChar.id)}">${esc(baseChar.name)}</option>`).join("");
    cardSelect.value = currentValue;
  }

  document.querySelectorAll("select[name='scene-character-id']").forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">未選択</option>' +
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
  return firstScene ? firstScene.slice(0, 60) : "シーンが未登録です。";
}

function buildGachaRateSummary(rates = {}) {
  return ["N", "R", "SR", "SSR", "UR"].map(rarity => `${rarity} ${rates[rarity] || 0}%`).join(" / ");
}

function upsertItem(collection, nextItem) {
  const index = collection.findIndex(item => item.id === nextItem.id);
  if (index >= 0) collection[index] = nextItem;
  else collection.unshift(nextItem);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function makeBaseCharFallback(name, color) {
  const safeName = esc(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="${color || "#a29bfe"}"/>
      <circle cx="100" cy="80" r="40" fill="rgba(255,255,255,0.2)"/>
      <rect x="60" y="130" width="80" height="50" rx="10" fill="rgba(255,255,255,0.15)"/>
      <text x="100" y="190" fill="white" font-size="16" font-family="Arial" text-anchor="middle">${safeName}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeFallbackImage(name, rarity) {
  const colors = palettes[rarity] || palettes.N;
  const safeName = esc(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${colors[0]}"/>
          <stop offset="50%" stop-color="${colors[1]}"/>
          <stop offset="100%" stop-color="${colors[2]}"/>
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#g)"/>
      <circle cx="240" cy="60" r="60" fill="rgba(255,255,255,0.1)"/>
      <circle cx="60" cy="340" r="80" fill="rgba(255,255,255,0.06)"/>
      <text x="20" y="50" fill="white" font-size="24" font-weight="bold" font-family="Arial">${rarity}</text>
      <text x="20" y="360" fill="white" font-size="22" font-family="Arial">${safeName}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}
