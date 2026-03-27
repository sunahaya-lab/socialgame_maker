(function () {
  function setupEditorScreen(deps) {
    const api = createEditorScreen(deps);
    api.ensureEditorWindows();
    api.ensureFolderManagerWindow();
    return api;
  }

  function createEditorScreen(deps) {
    const attributeLib = window.AttributeLib;
    const {
      getCurrentProjectId,
      getCurrentProjectName,
      getCurrentPlayerId,
      getBaseChars,
      getCharacters,
      getStories,
      getGachas,
      getSystemConfig,
      setSystemConfig,
      getCardFolders,
      getStoryFolders,
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
      setActiveGacha,
      collectionScreen,
      populateBaseCharSelects,
      populateFolderSelects,
      updateEditorSubmitLabels,
      createContentFolder,
      persistSystemConfigState,
      openShareSettings,
      getShareManagementSummary,
      rotateCollaborativeShare,
      createPublicShare
    } = deps;

    let activeFolderManagerKind = "card";
    let folderWindowDrag = null;
    let editorWindowDrag = null;
    const editorWindowState = new Map();

    function text(key, fallback) {
      return window.UiTextLib?.get?.(key, fallback) || fallback;
    }
    const editorWindowDefs = [
      { tab: "base-char", title: "ベースキャラ", x: 48, y: 108 },
      { tab: "character", title: "カード", x: 136, y: 132 },
      { tab: "story", title: "ストーリー", x: 224, y: 156 },
      { tab: "gacha", title: "ガチャ", x: 312, y: 180 },
      { tab: "system", title: "システム", x: 400, y: 204 },
      { tab: "event", title: "イベント", x: 488, y: 228 }
    ];

    function renderEditorScreen() {
      ensureEditorWindows();
      renderBaseCharList();
      renderEditorCharacterList();
      renderEditorStoryList();
      renderEditorGachaList();
      systemEditor.renderSystemForm();
      renderGachaPoolChars(getEditingFeaturedIds());
      collectionScreen.renderCollectionFilters("all");
      populateBaseCharSelects();
      populateFolderSelects();
      updateEditorSubmitLabels();
      renderFolderManager();
    }

    function activateEditorTab(tabName) {
      const nextTab = tabName || "base-char";
      ensureEditorWindows();
      document.querySelectorAll(".editor-tab").forEach(item => {
        item.classList.toggle("active", item.dataset.editorTab === nextTab);
      });
      document.querySelectorAll(".editor-window-launcher-btn").forEach(item => {
        item.classList.toggle("active", item.dataset.editorTab === nextTab);
      });
      openEditorWindow(nextTab);
      if (nextTab === "gacha") renderGachaPoolChars(getEditingFeaturedIds());
      if (nextTab === "system") systemEditor.renderSystemForm();
    }

    function ensureEditorWindows() {
      const overlay = document.getElementById("screen-editor");
      const shell = document.querySelector(".editor-overlay-shell");
      if (!overlay || !shell) return;

      overlay.classList.add("editor-window-mode");
      const header = overlay.querySelector(".screen-header");
      const tabs = overlay.querySelector(".editor-tabs");
      if (header) header.hidden = true;
      if (tabs) tabs.hidden = true;

      ensureEditorLauncher(shell);
      editorWindowDefs.forEach(def => ensureEditorWindow(shell, def));
    }

    /* legacy duplicate launcher variants
    /* legacy duplicate launcher
    function ensureEditorLauncher(shell) {
      let launcher = document.getElementById("editor-window-launcher");
      if (!launcher) {
        launcher = document.createElement("div");
        launcher.id = "editor-window-launcher";
        launcher.className = "editor-floating-window editor-window-launcher";
        shell.appendChild(launcher);
        enableEditorWindowDrag(launcher);
        launcher.style.left = "24px";
        launcher.style.top = "24px";
      }
      launcher.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>編集ウィンドウ</h4>
            <p>開きたい編集画面を選んでください。</p>
          </div>
          <button type="button" class="editor-floating-window-close" data-close-editor-overlay>閉じる</button>
        </div>
        <div class="editor-window-launcher-grid">
          ${editorWindowDefs.map(def => `
            <button type="button" class="editor-window-launcher-btn" data-editor-tab="${def.tab}">
              ${def.title}
            </button>
          `).join("")}
        </div>
      `;
      launcher.querySelectorAll(".editor-window-launcher-btn").forEach(button => {
        button.addEventListener("click", () => activateEditorTab(button.dataset.editorTab || "base-char"));
      });
      launcher.querySelector("[data-close-editor-overlay]")?.addEventListener("click", () => {
        window.closeEditorScreen?.();
      });
    }

    function ensureEditorWindow(shell, def) {
      const panel = document.getElementById(`editor-${def.tab}`);
      if (!panel || document.getElementById(`editor-window-${def.tab}`)) return;

      const windowEl = document.createElement("section");
      windowEl.id = `editor-window-${def.tab}`;
      windowEl.className = "editor-floating-window editor-content-window";
      windowEl.dataset.editorTab = def.tab;
      windowEl.hidden = true;
      windowEl.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>${def.title}</h4>
            <p>${def.title}の編集内容です。</p>
          </div>
          <button type="button" class="editor-floating-window-close" data-close-editor-window="${def.tab}">閉じる</button>
        </div>
        <div class="editor-content-window-body"></div>
      `;

      const body = windowEl.querySelector(".editor-content-window-body");
      body.appendChild(panel);
      panel.classList.add("active", "editor-panel-windowed");
      panel.hidden = false;

      shell.appendChild(windowEl);
      windowEl.querySelector("[data-close-editor-window]")?.addEventListener("click", () => {
        closeEditorWindow(def.tab);
      });
      enableEditorWindowDrag(windowEl);

      windowEl.style.left = `${def.x}px`;
      windowEl.style.top = `${def.y}px`;
      editorWindowState.set(def.tab, { left: def.x, top: def.y, open: false, z: 0 });
    }

    function openEditorWindow(tabName) {
      const windowEl = document.getElementById(`editor-window-${tabName}`);
      if (!windowEl) return;
      windowEl.hidden = false;
      bringEditorWindowToFront(windowEl);
      const nextState = editorWindowState.get(tabName) || {};
      editorWindowState.set(tabName, { ...nextState, open: true });
    }

    function closeEditorWindow(tabName) {
      const windowEl = document.getElementById(`editor-window-${tabName}`);
      if (!windowEl) return;
      windowEl.hidden = true;
      document.querySelectorAll(".editor-window-launcher-btn").forEach(item => {
        if (item.dataset.editorTab === tabName) item.classList.remove("active");
      });
      const nextState = editorWindowState.get(tabName) || {};
      editorWindowState.set(tabName, { ...nextState, open: false });
    }

    function bringEditorWindowToFront(windowEl) {
      const currentMax = Math.max(
        0,
        ...Array.from(document.querySelectorAll(".editor-content-window"))
          .map(node => Number(node.style.zIndex) || 0)
      );
      windowEl.style.zIndex = String(currentMax + 1);
    }

    function enableEditorWindowDrag(windowEl) {
      const handle = windowEl.querySelector(".editor-floating-window-head");
      if (!handle) return;
      handle.addEventListener("pointerdown", event => {
        if (event.target.closest("button, input, select, textarea, label")) return;
        const rect = windowEl.getBoundingClientRect();
        editorWindowDrag = {
          windowEl,
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top
        };
        bringEditorWindowToFront(windowEl);
        windowEl.setPointerCapture?.(event.pointerId);
        windowEl.classList.add("is-dragging");
      });
      windowEl.addEventListener("pointerdown", () => bringEditorWindowToFront(windowEl));
      window.addEventListener("pointermove", event => {
        if (!editorWindowDrag || editorWindowDrag.windowEl !== windowEl || windowEl.hidden) return;
        const left = Math.max(8, event.clientX - editorWindowDrag.offsetX);
        const top = Math.max(8, event.clientY - editorWindowDrag.offsetY);
        windowEl.style.left = `${left}px`;
        windowEl.style.top = `${top}px`;
        windowEl.style.right = "auto";
        const tab = windowEl.dataset.editorTab || "";
        if (tab) {
          const nextState = editorWindowState.get(tab) || {};
          editorWindowState.set(tab, { ...nextState, left, top });
        }
      });
      window.addEventListener("pointerup", () => {
        if (!editorWindowDrag || editorWindowDrag.windowEl !== windowEl) return;
        editorWindowDrag = null;
        windowEl.classList.remove("is-dragging");
      });
    }

    function ensureFolderManagerWindow() {
      if (document.getElementById("editor-folder-manager")) return;
      const shell = document.querySelector(".editor-overlay-shell");
      if (!shell) return;

      const modal = document.createElement("div");
      modal.id = "editor-folder-manager";
      modal.className = "editor-floating-window editor-folder-manager-window";
      modal.hidden = true;
      modal.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4 id="editor-folder-manager-title">フォルダ管理</h4>
            <p id="editor-folder-manager-subtitle">フォルダ管理とサムネ確認をここで行います。</p>
          </div>
          <button type="button" class="editor-floating-window-close" id="editor-folder-manager-close">閉じる</button>
        </div>
        <div class="editor-folder-manager-tabs" id="editor-folder-manager-tabs">
          <button type="button" class="editor-folder-manager-tab is-active" data-folder-kind="card">カード</button>
          <button type="button" class="editor-folder-manager-tab" data-folder-kind="story">ストーリー</button>
          <button type="button" class="editor-folder-manager-tab" data-folder-kind="ui">UI</button>
          <button type="button" class="editor-folder-manager-tab" data-folder-kind="music">音楽</button>
        </div>
        <div class="editor-folder-manager-toolbar">
          <button type="button" class="btn-secondary" id="editor-folder-manager-create">新規フォルダ</button>
        </div>
        <div class="editor-folder-manager-grid" id="editor-folder-manager-folders"></div>
        <div class="editor-folder-manager-items">
          <div class="editor-folder-manager-items-head">
            <h5 id="editor-folder-manager-items-title">内容</h5>
          </div>
          <div class="editor-folder-item-grid" id="editor-folder-manager-items"></div>
        </div>
      `;
      shell.appendChild(modal);

      modal.querySelector("#editor-folder-manager-close")?.addEventListener("click", closeFolderManager);
      modal.querySelectorAll("[data-folder-kind]").forEach(button => {
        button.addEventListener("click", () => {
          activeFolderManagerKind = button.dataset.folderKind || "card";
          renderFolderManager();
        });
      });
      modal.querySelector("#editor-folder-manager-create")?.addEventListener("click", async () => {
        if (activeFolderManagerKind === "card" || activeFolderManagerKind === "story") {
          const folder = await createContentFolder(activeFolderManagerKind === "story" ? "story" : "card");
          if (!folder) return;
          renderEditorScreen();
          return;
        }
        if (activeFolderManagerKind === "ui") {
          createUiFolder();
          return;
        }
      });
      enableFolderManagerDrag(modal);
    }

    function openFolderManager(kind = "card") {
      activeFolderManagerKind = kind === "story" ? "story" : "card";
      const modal = document.getElementById("editor-folder-manager");
      if (!modal) return;
      modal.hidden = false;
      renderFolderManager();
    }

    function closeFolderManager() {
      const modal = document.getElementById("editor-folder-manager");
      if (modal) modal.hidden = true;
    }

    function renderFolderManager() {
      const modal = document.getElementById("editor-folder-manager");
      if (!modal || modal.hidden) return;
      const folderWrap = document.getElementById("editor-folder-manager-folders");
      const itemWrap = document.getElementById("editor-folder-manager-items");
      const title = document.getElementById("editor-folder-manager-title");
      const subtitle = document.getElementById("editor-folder-manager-subtitle");
      const itemsTitle = document.getElementById("editor-folder-manager-items-title");
      if (!folderWrap || !itemWrap) return;

      modal.querySelectorAll("[data-folder-kind]").forEach(button => {
        button.classList.toggle("is-active", button.dataset.folderKind === activeFolderManagerKind);
      });

      if (activeFolderManagerKind === "ui") {
        renderUiFolderManager({ folderWrap, itemWrap, title, subtitle, itemsTitle, modal });
        return;
      }

      if (activeFolderManagerKind === "music") {
        if (title) title.textContent = "Music Folders";
        if (subtitle) subtitle.textContent = "Music folder management will live here.";
        if (itemsTitle) itemsTitle.textContent = "Music Assets";
        folderWrap.innerHTML = `<p class="editor-record-empty">${esc(text("editor.emptyMusicFolders", "音楽フォルダはまだ未対応です"))}</p>`;
        itemWrap.innerHTML = `<p class="editor-record-empty">${esc(text("editor.emptyMusicAssets", "音楽アセットはまだありません"))}</p>`;
        modal.querySelector("#editor-folder-manager-create")?.toggleAttribute("hidden", true);
        return;
      }

      modal.querySelector("#editor-folder-manager-create")?.removeAttribute("hidden");
      const isStory = activeFolderManagerKind === "story";
      const folders = isStory ? getStoryFolders() : getCardFolders();
      const items = isStory ? getStories() : getCharacters();
      const groups = buildFolderGroups(items, folders);

      if (title) title.textContent = isStory ? "ストーリーフォルダ" : "カードフォルダ";
      if (subtitle) subtitle.textContent = isStory ? "ストーリーとフォルダを管理します" : "カードとフォルダを管理します";
      if (itemsTitle) itemsTitle.textContent = isStory ? "ストーリー一覧" : "カード一覧";

      folderWrap.innerHTML = groups
        .filter(group => group.id)
        .map(group => renderFolderCard(group, isStory))
        .join("") || `<p class="editor-record-empty">${esc(text("editor.emptyFolders", "まだありません"))}</p>`;
      itemWrap.innerHTML = items.map(item => renderFolderItem(item, folders, isStory)).join("");

      folderWrap.querySelectorAll("[data-folder-rename]").forEach(input => {
        input.addEventListener("change", event => {
          renameFolder(activeFolderManagerKind, input.dataset.folderRename, event.target.value);
        });
      });
      itemWrap.querySelectorAll("[data-folder-assign]").forEach(select => {
        select.addEventListener("change", event => {
          const itemId = select.dataset.folderAssign || "";
          const folderId = event.target.value || null;
          if (isStory) storyEditor.assignStoryFolder(itemId, folderId);
          else entryEditor.assignCharacterFolder(itemId, folderId);
          window.setTimeout(renderEditorScreen, 0);
        });
      });
    }

    function renderUiFolderManager({ folderWrap, itemWrap, title, subtitle, itemsTitle, modal }) {
      const folderData = getUiFolderData();
      if (title) title.textContent = "UIフォルダ";
      if (subtitle) subtitle.textContent = "UIアセットをフォルダに整理して管理できます";
      if (itemsTitle) itemsTitle.textContent = "UIアセット";
      modal.querySelector("#editor-folder-manager-create")?.removeAttribute("hidden");

      folderWrap.innerHTML = folderData.folders.map(folder => renderUiFolderCard(folder, folderData.assetsByFolder)).join("")
        || `<p class="editor-record-empty">${esc(text("editor.emptyUiFolders", "UIフォルダがありません"))}</p>`;
      itemWrap.innerHTML = folderData.assets.map(asset => renderUiAssetCard(asset, folderData.folders)).join("")
        || `<p class="editor-record-empty">${esc(text("editor.emptyUiAssets", "UIアセットがありません"))}</p>`;

      folderWrap.querySelectorAll("[data-folder-rename]").forEach(input => {
        input.addEventListener("change", event => renameUiFolder(input.dataset.folderRename, event.target.value));
      });
    }

    function renderFolderCard(group, isStory) {
      const thumbs = group.items.slice(0, 4).map(item => {
        const image = isStory
          ? getStoryThumbnail(item)
          : (item.image || makeFallbackImage(item.name, item.rarity));
        return `<span class="editor-folder-thumb" style="background-image:url('${image.replace(/'/g, "\\'")}')"></span>`;
      }).join("");

      return `
        <article class="editor-folder-card">
          <div class="editor-folder-card-top">
            <label>
              <span>フォルダ</span>
              <input type="text" value="${esc(group.name)}" data-folder-rename="${group.id}">
            </label>
            <span class="editor-folder-count">${group.items.length}</span>
          </div>
          <div class="editor-folder-thumb-strip">${thumbs || '<span class="editor-folder-thumb is-empty"></span>'}</div>
        </article>
      `;
    }

    function renderFolderItem(item, folders, isStory) {
      const image = isStory ? getStoryThumbnail(item) : (item.image || makeFallbackImage(item.name, item.rarity));
      const title = isStory ? item.title : item.name;
      const sub = isStory ? buildStorySummary(item) : (item.catch || "");

      return `
        <article class="editor-folder-item-card">
          <div class="editor-folder-item-thumb" style="background-image:url('${image.replace(/'/g, "\\'")}')"></div>
          <div class="editor-folder-item-body">
            <strong>${esc(title || "未設定")}</strong>
            <p>${esc(sub || "")}</p>
            <label class="editor-inline-select">
              <span>フォルダ</span>
              <select data-folder-assign="${item.id}">${renderFolderOptions(folders, item.folderId)}</select>
            </label>
          </div>
        </article>
      `;
    }

    function getStoryThumbnail(story) {
      const linkedCard = story?.entryId ? getCharacters().find(char => char.id === story.entryId) : null;
      if (linkedCard?.image) return linkedCard.image;
      return makeFallbackImage(story?.title || "Story", "SR");
    }

    function getUiFolderData() {
      const folders = window.SociaLayoutBridge?.getHomeAssetFolders?.(getSystemConfig()) || [];
      const assets = Array.isArray(getSystemConfig()?.layoutAssets?.home) ? getSystemConfig().layoutAssets.home : [];
      const assetsByFolder = new Map();
      folders.forEach(folder => {
        const resolved = window.SociaLayoutBridge?.resolveHomeAssetFolderAssets?.(folder.id, getSystemConfig()) || [];
        assetsByFolder.set(folder.id, resolved);
      });
      return {
        folders,
        assets,
        assetsByFolder
      };
    }

    function renderUiFolderCard(folder, assetsByFolder) {
      const assets = assetsByFolder.get(folder.id) || [];
      const thumbs = assets.slice(0, 4).map(asset =>
        `<span class="editor-folder-thumb" style="background-image:url('${String(asset.src || "").replace(/'/g, "\\'")}')"></span>`
      ).join("");
      return `
        <article class="editor-folder-card">
          <div class="editor-folder-card-top">
            <label>
              <span>フォルダ</span>
              <input type="text" value="${esc(folder.name)}" data-folder-rename="${folder.id}">
            </label>
            <span class="editor-folder-count">${assets.length}</span>
          </div>
          <p class="editor-record-folder-chip">${esc(folder.kind === "shared" ? "共有" : "個人")}</p>
          <div class="editor-folder-thumb-strip">${thumbs || '<span class="editor-folder-thumb is-empty"></span>'}</div>
        </article>
      `;
    }

    function renderUiAssetCard(asset, folders) {
      const folderNames = folders
        .filter(folder => (folder.assetIds || []).includes(asset.id))
        .map(folder => folder.name)
        .join(", ");
      return `
        <article class="editor-folder-item-card">
          <div class="editor-folder-item-thumb" style="background-image:url('${String(asset.src || "").replace(/'/g, "\\'")}')"></div>
          <div class="editor-folder-item-body">
            <strong>${esc(asset.name || asset.id)}</strong>
            <p>${esc(folderNames || asset.ownerMemberId || "")}</p>
            <p class="editor-record-folder-chip">${esc(asset.ownerMemberId || "共有")}</p>
          </div>
        </article>
      `;
    }

    function createUiFolder() {
      const currentConfig = getSystemConfig();
      const currentFolders = window.SociaLayoutBridge?.getHomeAssetFolders?.(currentConfig) || [];
      const ownerId = window.SociaLayoutBridge?.getCurrentLayoutOwnerId?.() || "local-editor";
      const nextFolder = {
        id: `home-personal-${Date.now()}`,
        name: `UI Folder ${currentFolders.length + 1}`,
        ownerMemberId: ownerId,
        kind: "personal",
        assetIds: [],
        sourceRefs: [],
        sortOrder: currentFolders.length
      };
      setSystemConfig({
        ...currentConfig,
        assetFolders: {
          ...(currentConfig.assetFolders || {}),
          home: [...currentFolders, nextFolder]
        }
      });
      persistSystemConfigState().then(() => renderEditorScreen());
    }

    async function renameUiFolder(folderId, nextName) {
      if (!folderId) return;
      const currentConfig = getSystemConfig();
      const currentFolders = window.SociaLayoutBridge?.getHomeAssetFolders?.(currentConfig) || [];
      setSystemConfig({
        ...currentConfig,
        assetFolders: {
          ...(currentConfig.assetFolders || {}),
          home: currentFolders.map(folder =>
            folder.id === folderId
              ? { ...folder, name: String(nextName || "").trim().slice(0, 80) || folder.name }
              : folder
          )
        }
      });
      await persistSystemConfigState();
      renderEditorScreen();
    }

    function enableFolderManagerDrag(modal) {
      const handle = modal.querySelector(".editor-floating-window-head");
      if (!handle) return;
      handle.addEventListener("pointerdown", event => {
        if (event.target.closest("button, input, select, textarea")) return;
        const rect = modal.getBoundingClientRect();
        folderWindowDrag = {
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top
        };
        modal.setPointerCapture?.(event.pointerId);
        modal.classList.add("is-dragging");
      });
      window.addEventListener("pointermove", event => {
        if (!folderWindowDrag || modal.hidden) return;
        modal.style.left = `${Math.max(8, event.clientX - folderWindowDrag.offsetX)}px`;
        modal.style.top = `${Math.max(8, event.clientY - folderWindowDrag.offsetY)}px`;
        modal.style.right = "auto";
      });
      window.addEventListener("pointerup", () => {
        if (!folderWindowDrag) return;
        folderWindowDrag = null;
        modal.classList.remove("is-dragging");
      });
    }

    async function renameFolder(kind, folderId, nextName) {
      if (!folderId) return;
      const key = kind === "story" ? "storyFolders" : "cardFolders";
      const nextFolders = normalizeFolderList(getSystemConfig()[key]).map(folder =>
        folder.id === folderId
          ? { ...folder, name: String(nextName || "").trim().slice(0, 40) || folder.name }
          : folder
      );
      setSystemConfig({
        ...getSystemConfig(),
        [key]: nextFolders
      });
      populateFolderSelects();
      await persistSystemConfigState();
      renderEditorScreen();
    }

    function renderBaseCharList() {
      const list = document.getElementById("base-char-list");
      list.innerHTML = "";
      const baseChars = getBaseChars();
      if (baseChars.length === 0) {
        list.innerHTML = `<p class="editor-record-empty">${esc(text("editor.emptyBaseChars", "ベースキャラがありません"))}</p>`;
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
            <button class="editor-inline-btn" type="button" data-action="edit">??</button>
            <button class="base-char-delete" type="button" data-action="delete">Delete</button>
          </div>
        `;
        item.querySelector('[data-action="edit"]').addEventListener("click", () => baseCharEditor.beginBaseCharEdit(baseChar.id));
        item.querySelector('[data-action="delete"]').addEventListener("click", () => baseCharEditor.deleteBaseChar(baseChar.id));
        list.appendChild(item);
      });
    }

    function renderEditorCharacterList() {
      const list = document.getElementById("editor-character-list");
      list.innerHTML = "";
      list.insertAdjacentHTML("beforeend", '<div class="editor-list-toolbar"><button type="button" class="btn-secondary" data-open-folder-manager="card">Folders</button></div>');
      const groups = buildFolderGroups(getCharacters(), getCardFolders());
      if (groups.every(group => group.items.length === 0)) {
        list.insertAdjacentHTML("beforeend", `<p class="editor-record-empty">${esc(text("editor.emptyCards", "カードがありません"))}</p>`);
        list.querySelector('[data-open-folder-manager="card"]')?.addEventListener("click", () => openFolderManager("card"));
        return;
      }

      list.insertAdjacentHTML("beforeend", `<p class="editor-list-hint">${esc(text("editor.folderHint", "フォルダ管理は別ウィンドウです Folders から名前変更やサムネイル確認ができます"))}</p>`);

      groups.forEach(group => {
        if (group.items.length === 0) return;
        const section = document.createElement("details");
        section.className = "editor-folder-group";
        section.open = true;
        section.innerHTML = `
          <summary>${esc(group.name)} <span>${group.items.length}</span></summary>
          <div class="editor-folder-group-body"></div>
        `;
        const body = section.querySelector(".editor-folder-group-body");

        group.items.forEach(char => {
          const item = document.createElement("div");
          item.className = `editor-record-card ${getRarityCssClass(char.rarity)}`;
          item.innerHTML = `
            <img src="${char.image || makeFallbackImage(char.name, char.rarity)}" alt="${esc(char.name)}">
            <div class="editor-record-card-body">
              <div class="editor-record-item-top">
                <span class="editor-record-badge ${getRarityCssClass(char.rarity)}">${esc(getRarityLabel(char.rarity))}</span>
                ${attributeLib ? attributeLib.renderAttributeChip(char.attribute, { compact: true, className: "editor-record-attribute" }) : `<span class="editor-record-meta">${esc(char.attribute || "-")}</span>`}
              </div>
              <h5>${esc(char.name)}</h5>
              <p>${esc(char.catch || "")}</p>
              <p class="editor-record-folder-chip">${esc(getFolderName(getCardFolders(), char.folderId))}</p>
              <div class="editor-record-actions">
                <button class="editor-inline-btn" type="button" data-action="edit">Edit</button>
                <button class="editor-inline-btn" type="button" data-action="detail">Detail</button>
                <button class="editor-inline-btn" type="button" data-action="folders">Folders</button>
              </div>
            </div>
          `;
          item.querySelector('[data-action="edit"]').addEventListener("click", () => entryEditor.beginCharacterEdit(char.id));
          item.querySelector('[data-action="detail"]').addEventListener("click", () => collectionScreen.showCardDetail(char));
          item.querySelector('[data-action="folders"]').addEventListener("click", () => openFolderManager("card"));
          body.appendChild(item);
        });

        list.appendChild(section);
      });

      list.querySelector('[data-open-folder-manager="card"]')?.addEventListener("click", () => openFolderManager("card"));
    }

    function renderEditorStoryList() {
      const list = document.getElementById("editor-story-list");
      list.innerHTML = "";
      list.insertAdjacentHTML("beforeend", '<div class="editor-list-toolbar"><button type="button" class="btn-secondary" data-open-folder-manager="story">Folders</button></div>');
      const groups = buildFolderGroups(getStories(), getStoryFolders());
      if (groups.every(group => group.items.length === 0)) {
        list.insertAdjacentHTML("beforeend", `<p class="editor-record-empty">${esc(text("editor.emptyStories", "ストーリーがありません"))}</p>`);
        list.querySelector('[data-open-folder-manager="story"]')?.addEventListener("click", () => openFolderManager("story"));
        return;
      }

      list.insertAdjacentHTML("beforeend", `<p class="editor-list-hint">${esc(text("editor.folderHint", "フォルダ管理は別ウィンドウです Folders から名前変更やサムネイル確認ができます"))}</p>`);

      let draggedStoryId = null;

      groups.forEach(group => {
        if (group.items.length === 0) return;
        const section = document.createElement("details");
        section.className = "editor-folder-group";
        section.open = true;
        section.innerHTML = `
          <summary>${esc(group.name)} <span>${group.items.length}</span></summary>
          <div class="editor-folder-group-body editor-story-group-body"></div>
        `;
        const body = section.querySelector(".editor-folder-group-body");
        body.addEventListener("dragover", event => event.preventDefault());
        body.addEventListener("drop", event => {
          event.preventDefault();
          if (!draggedStoryId) return;
          storyEditor.reorderStoriesInFolder(group.id, draggedStoryId, null);
          draggedStoryId = null;
        });

        group.items.forEach(story => {
          const linkedCard = story.entryId ? getCharacters().find(char => char.id === story.entryId) : null;
          const item = document.createElement("div");
          item.className = "editor-record-item editor-story-record";
          item.draggable = true;
          item.dataset.storyId = story.id;
          item.innerHTML = `
            <div class="editor-record-item-top">
              <span class="editor-record-badge">${story.type === "main" ? "MAIN" : story.type === "event" ? "EVENT" : "CHARA"}</span>
              <span class="editor-record-meta">#${Number(story.sortOrder) || 0} / ${story.scenes?.length || 0} scenes</span>
            </div>
            <h5>${esc(story.title)}</h5>
            <p>${esc(linkedCard ? `${linkedCard.name} / ${buildStorySummary(story)}` : buildStorySummary(story))}</p>
            <p class="editor-record-folder-chip">${esc(getFolderName(getStoryFolders(), story.folderId))}</p>
            <div class="editor-record-actions">
              <button class="editor-inline-btn" type="button" data-action="edit">Edit</button>
              <button class="editor-inline-btn" type="button" data-action="read">Read</button>
              <button class="editor-inline-btn" type="button" data-action="folders">Folders</button>
            </div>
          `;
          item.addEventListener("dragstart", () => {
            draggedStoryId = story.id;
            item.classList.add("is-dragging");
          });
          item.addEventListener("dragend", () => {
            draggedStoryId = null;
            item.classList.remove("is-dragging");
          });
          item.addEventListener("dragover", event => event.preventDefault());
          item.addEventListener("drop", event => {
            event.preventDefault();
            if (!draggedStoryId || draggedStoryId === story.id) return;
            storyEditor.reorderStoriesInFolder(group.id, draggedStoryId, story.id);
            draggedStoryId = null;
          });
          item.querySelector('[data-action="edit"]').addEventListener("click", () => storyEditor.beginStoryEdit(story.id));
          item.querySelector('[data-action="read"]').addEventListener("click", () => storyScreen.openStoryReader(story));
          item.querySelector('[data-action="folders"]').addEventListener("click", () => openFolderManager("story"));
          body.appendChild(item);
        });

        list.appendChild(section);
      });

      list.querySelector('[data-open-folder-manager="story"]')?.addEventListener("click", () => openFolderManager("story"));
    }

    function renderEditorGachaList() {
      const list = document.getElementById("editor-gacha-list");
      list.innerHTML = "";
      const gachas = getGachas();
      if (gachas.length === 0) {
        list.innerHTML = `<p class="editor-record-empty">${esc(text("editor.emptyGachas", "ガチャがありません"))}</p>`;
        return;
      }

      gachas.forEach((gacha, index) => {
        const item = document.createElement("div");
        item.className = "editor-record-item";
        item.innerHTML = `
          <div class="editor-record-item-top">
            <span class="editor-record-badge">${esc(gacha.gachaType === "equipment" ? "\u88c5\u5099\u30ac\u30c1\u30e3" : gacha.gachaType === "mixed" ? "\u6df7\u5408\u30ac\u30c1\u30e3" : "\u30ad\u30e3\u30e9\u30ac\u30c1\u30e3")}</span>
            <span class="editor-record-meta">${gacha.gachaType === "equipment" ? "\u88c5\u5099" : gacha.gachaType === "mixed" ? "\u6df7\u5408" : `pickup ${gacha.featured?.length || 0}`}</span>
          </div>
          <h5>${esc(gacha.title)}</h5>
          <p>${esc(gacha.description || buildGachaRateSummary(gacha.rates))}</p>
          <div class="editor-record-actions">
            <button class="editor-inline-btn" type="button" data-action="edit">\u7de8\u96c6</button>
            <button class="editor-inline-btn" type="button" data-action="open">\u958b\u304f</button>
          </div>
        `;
        item.querySelector('[data-action="edit"]').addEventListener("click", () => beginGachaEdit(gacha.id));
        item.querySelector('[data-action="open"]').addEventListener("click", () => {
          setActiveGacha(index);
          navigateTo("gacha");
        });
        list.appendChild(item);
      });
    }

    function renderGachaPoolChars(selectedIds = []) {
      const container = document.getElementById("gacha-pool-chars");
      container.innerHTML = "";
      getCharacters().forEach(char => {
        const item = document.createElement("div");
        item.className = "gacha-pool-char";
        if (selectedIds.includes(char.id)) item.classList.add("selected");
        item.dataset.charId = char.id;
        item.innerHTML = `
          <img src="${char.image || makeFallbackImage(char.name, char.rarity)}" alt="${esc(char.name)}">
          <span>${esc(getRarityLabel(char.rarity))} ${esc(char.name)}</span>
        `;
        item.addEventListener("click", () => item.classList.toggle("selected"));
        container.appendChild(item);
      });
    }

    function buildFolderGroups(items, folders) {
      const normalizedFolders = (Array.isArray(folders) ? folders : [])
        .slice()
        .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) || a.name.localeCompare(b.name, "ja"));

      const groups = normalizedFolders.map(folder => ({
        id: folder.id,
        name: folder.name,
        items: items
          .filter(item => (item.folderId || "") === folder.id)
          .slice()
          .sort(sortEditorItems)
      }));

      groups.unshift({
        id: "",
        name: "No Folder",
        items: items
          .filter(item => !item.folderId)
          .slice()
          .sort(sortEditorItems)
      });
      return groups;
    }

    function sortEditorItems(a, b) {
      const aOrder = Number(a.sortOrder);
      const bOrder = Number(b.sortOrder);
      if (!Number.isNaN(aOrder) || !Number.isNaN(bOrder)) {
        return (Number.isNaN(aOrder) ? 0 : aOrder) - (Number.isNaN(bOrder) ? 0 : bOrder) ||
          String(a.title || a.name || "").localeCompare(String(b.title || b.name || ""), "ja");
      }
      return String(a.title || a.name || "").localeCompare(String(b.title || b.name || ""), "ja");
    }

    function renderFolderOptions(folders, selectedId) {
      return [`<option value="">No Folder</option>`]
        .concat((Array.isArray(folders) ? folders : []).map(folder =>
          `<option value="${esc(folder.id)}"${folder.id === selectedId ? " selected" : ""}>${esc(folder.name)}</option>`
        ))
        .join("");
    }

    function normalizeFolderList(folders) {
      return (Array.isArray(folders) ? folders : [])
        .map((folder, index) => ({
          id: String(folder?.id || "").trim().slice(0, 80),
          name: String(folder?.name || "").trim().slice(0, 40),
          sortOrder: Math.max(0, Number(folder?.sortOrder ?? index) || 0)
        }))
        .filter(folder => folder.id && folder.name)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
    }

    function getFolderName(folders, folderId) {
      if (!folderId) return "No Folder";
      return folders.find(folder => folder.id === folderId)?.name || "No Folder";
    }

    /* legacy duplicate launcher variants
    function ensureEditorLauncher(shell) {
      let launcher = document.getElementById("editor-window-launcher");
      if (!launcher) {
        launcher = document.createElement("div");
        launcher.id = "editor-window-launcher";
        launcher.className = "editor-floating-window editor-window-launcher";
        shell.appendChild(launcher);
        enableEditorWindowDrag(launcher);
        launcher.style.left = "24px";
        launcher.style.top = "24px";
      }
      launcher.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>編集ダッシュボード</h4>
            <p>開きたい編集画面を選んでください</p>
          </div>
          <button type="button" class="editor-floating-window-close" data-close-editor-overlay>閉じる</button>
        </div>
        <div class="editor-window-launcher-grid">
          ${editorWindowDefs.map(def => `
            <button type="button" class="editor-window-launcher-btn" data-editor-tab="${def.tab}">
              <span class="editor-window-launcher-btn-title">${def.title}</span>
              <span class="editor-window-launcher-btn-sub">この画面を開く</span>
            </button>
          `).join("")}
        </div>
      `;
      launcher.querySelectorAll(".editor-window-launcher-btn").forEach(button => {
        button.addEventListener("click", () => activateEditorTab(button.dataset.editorTab || "base-char"));
      });
      launcher.querySelector("[data-close-editor-overlay]")?.addEventListener("click", () => {
        window.closeEditorScreen?.();
      });
    }

    function ensureEditorLauncher(shell) {
      const dashboardItems = [
        { key: "base-char", title: "ベースキャラ", sub: "プロフィールと音声の編集", action: () => activateEditorTab("base-char") },
        { key: "character", title: "カード", sub: "カード登録と画像の編集", action: () => activateEditorTab("character") },
        { key: "story", title: "ストーリー", sub: "本文とシーン構成の編集", action: () => activateEditorTab("story") },
        { key: "gacha", title: "ガチャ", sub: "排出設定とバナーの編集", action: () => activateEditorTab("gacha") },
        { key: "system", title: "システム", sub: "基本設定と表示の編集", action: () => activateEditorTab("system") },
        { key: "share", title: "共有", sub: "共同編集URLと公開URL", action: () => openShareSettings?.() }
      ];
      let launcher = document.getElementById("editor-window-launcher");
      if (!launcher) {
        launcher = document.createElement("div");
        launcher.id = "editor-window-launcher";
        launcher.className = "editor-floating-window editor-window-launcher";
        shell.appendChild(launcher);
        enableEditorWindowDrag(launcher);
        launcher.style.left = "24px";
        launcher.style.top = "24px";
      }
      launcher.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>編集ダッシュボード</h4>
            <p>開きたい編集画面を選んでください</p>
          </div>
          <button type="button" class="editor-floating-window-close" data-close-editor-overlay>閉じる</button>
        </div>
        <div class="editor-window-launcher-grid">
          ${dashboardItems.map(item => `
            <button type="button" class="editor-window-launcher-btn" data-editor-action="${item.key}">
              <span class="editor-window-launcher-btn-title">${item.title}</span>
              <span class="editor-window-launcher-btn-sub">${item.sub}</span>
            </button>
          `).join("")}
        </div>
      `;
      launcher.querySelectorAll(".editor-window-launcher-btn").forEach(button => {
        button.addEventListener("click", () => {
          launcher.querySelectorAll(".editor-window-launcher-btn").forEach(item => item.classList.remove("active"));
          button.classList.add("active");
          const item = dashboardItems.find(entry => entry.key === button.dataset.editorAction);
          item?.action?.();
        });
      });
      launcher.querySelector("[data-close-editor-overlay]")?.addEventListener("click", () => {
        window.closeEditorScreen?.();
      });
    }

    function ensureEditorLauncher(shell) {
      const dashboardItems = [
        { key: "base-char", title: "ベースキャラ", sub: "プロフィールと音声の編集", action: () => activateEditorTab("base-char") },
        { key: "character", title: "カード", sub: "カード登録と画像の編集", action: () => activateEditorTab("character") },
        { key: "story", title: "ストーリー", sub: "本文とシーン構成の編集", action: () => activateEditorTab("story") },
        { key: "gacha", title: "ガチャ", sub: "排出設定とバナーの編集", action: () => activateEditorTab("gacha") },
        { key: "system", title: "システム", sub: "基本設定と表示の編集", action: () => activateEditorTab("system") },
        { key: "share", title: "共有", sub: "共同編集URLと公開URL", action: () => openShareSettings?.() }
      ];
      const projectName = String(getCurrentProjectName?.() || "無題のプロジェクト").trim() || "無題のプロジェクト";
      const projectId = String(getCurrentProjectId?.() || "").trim();
      const summaryCards = [
        { label: "ベースキャラ", value: Array.isArray(getBaseChars()) ? getBaseChars().length : 0 },
        { label: "カード", value: Array.isArray(getCharacters()) ? getCharacters().length : 0 },
        { label: "ストーリー", value: Array.isArray(getStories()) ? getStories().length : 0 },
        { label: "ガチャ", value: Array.isArray(getGachas()) ? getGachas().length : 0 }
      ];
      let launcher = document.getElementById("editor-window-launcher");
      if (!launcher) {
        launcher = document.createElement("div");
        launcher.id = "editor-window-launcher";
        launcher.className = "editor-floating-window editor-window-launcher";
        shell.appendChild(launcher);
        enableEditorWindowDrag(launcher);
        launcher.style.left = "24px";
        launcher.style.top = "24px";
      }
      launcher.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>編集ダッシュボード</h4>
            <p>開きたい編集画面を選んでください</p>
          </div>
          <button type="button" class="editor-floating-window-close" data-close-editor-overlay>閉じる</button>
        </div>
        <section class="editor-dashboard-summary">
          <div class="editor-dashboard-summary-head">
            <p class="editor-dashboard-summary-label">Project</p>
            <h5 class="editor-dashboard-summary-name">${esc(projectName)}</h5>
            <p class="editor-dashboard-summary-id">${projectId ? `ID: ${esc(projectId)}` : ""}</p>
          </div>
          <div class="editor-dashboard-summary-stats">
            ${summaryCards.map(item => `
              <div class="editor-dashboard-stat">
                <span class="editor-dashboard-stat-label">${item.label}</span>
                <strong class="editor-dashboard-stat-value">${item.value}</strong>
              </div>
            `).join("")}
          </div>
        </section>
        <div class="editor-window-launcher-grid">
          ${dashboardItems.map(item => `
            <button type="button" class="editor-window-launcher-btn" data-editor-action="${item.key}">
              <span class="editor-window-launcher-btn-title">${item.title}</span>
              <span class="editor-window-launcher-btn-sub">${item.sub}</span>
            </button>
          `).join("")}
        </div>
      `;
      launcher.querySelectorAll(".editor-window-launcher-btn").forEach(button => {
        button.addEventListener("click", () => {
          launcher.querySelectorAll(".editor-window-launcher-btn").forEach(item => item.classList.remove("active"));
          button.classList.add("active");
          const item = dashboardItems.find(entry => entry.key === button.dataset.editorAction);
          item?.action?.();
        });
      });
      launcher.querySelector("[data-close-editor-overlay]")?.addEventListener("click", () => {
        window.closeEditorScreen?.();
      });
    }

    function ensureEditorLauncher(shell) {
      const dashboardItems = [
        { key: "base-char", title: "ベースキャラ", sub: "プロフィールと音声の編集", action: () => activateEditorTab("base-char") },
        { key: "character", title: "カード", sub: "カード登録と画像の編集", action: () => activateEditorTab("character") },
        { key: "story", title: "ストーリー", sub: "本文とシーン構成の編集", action: () => activateEditorTab("story") },
        { key: "gacha", title: "ガチャ", sub: "排出設定とバナーの編集", action: () => activateEditorTab("gacha") },
        { key: "system", title: "システム", sub: "基本設定と表示の編集", action: () => activateEditorTab("system") },
        { key: "publish-share", title: "公開/共有", sub: "共同編集URLと公開URL", action: () => openShareSettings?.() },
        { key: "members", title: "メンバー", sub: "参加者と権限の管理", action: () => openMemberManagement?.() }
      ];
      const projectName = String(getCurrentProjectName?.() || "無題のプロジェクト").trim() || "無題のプロジェクト";
      const projectId = String(getCurrentProjectId?.() || "").trim();
      const summaryCards = [
        { label: "ベースキャラ", value: Array.isArray(getBaseChars()) ? getBaseChars().length : 0 },
        { label: "カード", value: Array.isArray(getCharacters()) ? getCharacters().length : 0 },
        { label: "ストーリー", value: Array.isArray(getStories()) ? getStories().length : 0 },
        { label: "ガチャ", value: Array.isArray(getGachas()) ? getGachas().length : 0 }
      ];
      let launcher = document.getElementById("editor-window-launcher");
      if (!launcher) {
        launcher = document.createElement("div");
        launcher.id = "editor-window-launcher";
        launcher.className = "editor-floating-window editor-window-launcher";
        shell.appendChild(launcher);
        enableEditorWindowDrag(launcher);
        launcher.style.left = "24px";
        launcher.style.top = "24px";
      }
      launcher.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>編集ダッシュボード</h4>
            <p>開きたい編集画面を選んでください</p>
          </div>
          <button type="button" class="editor-floating-window-close" data-close-editor-overlay>閉じる</button>
        </div>
        <section class="editor-dashboard-summary">
          <div class="editor-dashboard-summary-head">
            <p class="editor-dashboard-summary-label">Project</p>
            <h5 class="editor-dashboard-summary-name">${esc(projectName)}</h5>
            <p class="editor-dashboard-summary-id">${projectId ? `ID: ${esc(projectId)}` : ""}</p>
          </div>
          <div class="editor-dashboard-summary-stats">
            ${summaryCards.map(item => `
              <div class="editor-dashboard-stat">
                <span class="editor-dashboard-stat-label">${item.label}</span>
                <strong class="editor-dashboard-stat-value">${item.value}</strong>
              </div>
            `).join("")}
          </div>
        </section>
        <div class="editor-window-launcher-grid">
          ${dashboardItems.map(item => `
            <button type="button" class="editor-window-launcher-btn" data-editor-action="${item.key}">
              <span class="editor-window-launcher-btn-title">${item.title}</span>
              <span class="editor-window-launcher-btn-sub">${item.sub}</span>
            </button>
          `).join("")}
        </div>
      `;
      launcher.querySelectorAll(".editor-window-launcher-btn").forEach(button => {
        button.addEventListener("click", () => {
          launcher.querySelectorAll(".editor-window-launcher-btn").forEach(item => item.classList.remove("active"));
          button.classList.add("active");
          const item = dashboardItems.find(entry => entry.key === button.dataset.editorAction);
          item?.action?.();
        });
      });
      launcher.querySelector("[data-close-editor-overlay]")?.addEventListener("click", () => {
        window.closeEditorScreen?.();
      });
    }

    */
    function ensureShareManagementWindow() {
      const shell = document.querySelector(".editor-overlay-shell");
      if (!shell) return null;
      let windowEl = document.getElementById("editor-share-window");
      if (!windowEl) {
        windowEl = document.createElement("section");
        windowEl.id = "editor-share-window";
        windowEl.className = "editor-floating-window editor-content-window editor-share-window";
        windowEl.hidden = true;
        windowEl.innerHTML = `
          <div class="editor-floating-window-head">
            <div>
              <h4>公開/共有</h4>
              <p>共同編集URLと公開URLを管理します</p>
            </div>
            <button type="button" class="editor-floating-window-close" data-close-share-window>閉じる</button>
          </div>
          <div class="editor-content-window-body editor-share-window-body"></div>
        `;
        shell.appendChild(windowEl);
        enableEditorWindowDrag(windowEl);
        windowEl.style.left = "52px";
        windowEl.style.top = "118px";
        windowEl.querySelector("[data-close-share-window]")?.addEventListener("click", closeShareManagement);
      }
      return windowEl;
    }

    async function renderShareManagement() {
      const windowEl = ensureShareManagementWindow();
      const body = windowEl?.querySelector(".editor-share-window-body");
      if (!body) return;
      const projectName = String(getCurrentProjectName?.() || "無題のプロジェクト").trim() || "無題のプロジェクト";
      const projectId = String(getCurrentProjectId?.() || "").trim();
      body.innerHTML = `
        <div class="editor-dashboard-summary">
          <div class="editor-dashboard-summary-head">
            <p class="editor-dashboard-summary-label">Project</p>
            <h5 class="editor-dashboard-summary-name">${esc(projectName)}</h5>
            <p class="editor-dashboard-summary-id">${projectId ? `ID: ${esc(projectId)}` : ""}</p>
          </div>
        </div>
        <p class="editor-share-copy">共同編集URLまたは公開プレイURLをここから発行できます</p>
        <div class="editor-share-actions">
          <button type="button" class="btn-primary" data-editor-share-action="collab">共同編集URL</button>
          <button type="button" class="btn-secondary" data-editor-share-action="public">公開URL</button>
        </div>
        <p class="editor-share-plan" id="editor-share-plan">プラン情報を確認しています...</p>
        <p class="editor-share-note">共同編集URL: 無料版で利用可能です。再発行すると以前のURLは失効します</p>
        <p class="editor-share-note">公開URL: 有料版限定です。プレイ専用で編集はできません</p>
        <p class="editor-share-status" id="editor-share-status"></p>
      `;
      const collabButton = body.querySelector('[data-editor-share-action="collab"]');
      const publicButton = body.querySelector('[data-editor-share-action="public"]');
      const planEl = body.querySelector("#editor-share-plan");
      const statusEl = body.querySelector("#editor-share-status");

      collabButton?.addEventListener("click", async () => {
        if (statusEl) statusEl.textContent = "";
        const result = await rotateCollaborativeShare?.();
        if (!statusEl || !result || result.cancelled) return;
        statusEl.textContent = result.message || "";
        statusEl.classList.toggle("is-error", result.ok === false);
      });

      publicButton?.addEventListener("click", async () => {
        if (statusEl) statusEl.textContent = "";
        const result = await createPublicShare?.();
        if (!statusEl || !result) return;
        statusEl.textContent = result.message || "";
        statusEl.classList.toggle("is-error", result.ok === false);
      });

      try {
        const summary = await getShareManagementSummary?.();
        const isPaid = Boolean(summary?.isPaid);
        if (planEl) {
          planEl.textContent = String(summary?.message || "");
          planEl.classList.toggle("is-paid", isPaid);
          planEl.classList.toggle("is-free", !isPaid);
        }
        if (publicButton) publicButton.disabled = !isPaid;
      } catch (error) {
        const message = String(error?.data?.error || error?.message || "共有設定の取得に失敗しました").trim();
        if (planEl) {
          planEl.textContent = message;
          planEl.classList.remove("is-paid");
          planEl.classList.add("is-free");
        }
        if (statusEl) {
          statusEl.textContent = message;
          statusEl.classList.add("is-error");
        }
        if (publicButton) publicButton.disabled = true;
      }
    }

    function openShareManagement() {
      closeAllEditorWindows();
      const windowEl = ensureShareManagementWindow();
      if (!windowEl) return;
      windowEl.hidden = false;
      bringEditorWindowToFront(windowEl);
      renderShareManagement();
      document.querySelectorAll(".editor-window-launcher-btn").forEach(item => {
        item.classList.toggle("active", item.dataset.editorAction === "publish-share");
      });
    }

    function closeShareManagement() {
      const windowEl = document.getElementById("editor-share-window");
      if (!windowEl) return;
      windowEl.hidden = true;
      document.querySelectorAll(".editor-window-launcher-btn").forEach(item => {
        if (item.dataset.editorAction === "publish-share") item.classList.remove("active");
      });
    }

    function ensureMemberManagementWindow() {
      const shell = document.querySelector(".editor-overlay-shell");
      if (!shell) return null;
      let windowEl = document.getElementById("editor-member-window");
      if (!windowEl) {
        windowEl = document.createElement("section");
        windowEl.id = "editor-member-window";
        windowEl.className = "editor-floating-window editor-content-window editor-member-window";
        windowEl.hidden = true;
        windowEl.innerHTML = `
          <div class="editor-floating-window-head">
            <div>
              <h4>メンバー</h4>
              <p>このプロジェクトに参加するメンバーを確認します</p>
            </div>
            <button type="button" class="editor-floating-window-close" data-close-member-window>閉じる</button>
          </div>
          <div class="editor-content-window-body editor-member-window-body"></div>
        `;
        shell.appendChild(windowEl);
        enableEditorWindowDrag(windowEl);
        windowEl.style.left = "40px";
        windowEl.style.top = "96px";
        windowEl.querySelector("[data-close-member-window]")?.addEventListener("click", closeMemberManagement);
      }
      return windowEl;
    }

    function renderMemberManagement() {
      const windowEl = ensureMemberManagementWindow();
      const body = windowEl?.querySelector(".editor-member-window-body");
      if (!body) return;
      const projectName = String(getCurrentProjectName?.() || "無題のプロジェクト").trim() || "無題のプロジェクト";
      const projectId = String(getCurrentProjectId?.() || "").trim();
      const playerId = String(getCurrentPlayerId?.() || "").trim() || "local-player";
      body.innerHTML = `
        <div class="editor-dashboard-summary">
          <div class="editor-dashboard-summary-head">
            <p class="editor-dashboard-summary-label">Project</p>
            <h5 class="editor-dashboard-summary-name">${esc(projectName)}</h5>
            <p class="editor-dashboard-summary-id">${projectId ? `ID: ${esc(projectId)}` : ""}</p>
          </div>
        </div>
        <div class="editor-member-list">
          <div class="editor-member-row editor-member-row-head">
            <span>ユーザー</span>
            <span>ロール</span>
            <span>状態</span>
          </div>
          <div class="editor-member-row">
            <span class="editor-member-user">${esc(playerId)}</span>
            <span class="editor-member-role">owner</span>
            <span class="editor-member-status">active</span>
          </div>
        </div>
        <p class="editor-member-note">メンバー招待と権限変更は次の段階で追加します。いまは Project Dashboard 配下に独立させています</p>
      `;
    }

    function openMemberManagement() {
      closeAllEditorWindows();
      const windowEl = ensureMemberManagementWindow();
      if (!windowEl) return;
      renderMemberManagement();
      windowEl.hidden = false;
      bringEditorWindowToFront(windowEl);
      document.querySelectorAll(".editor-window-launcher-btn").forEach(item => {
        item.classList.toggle("active", item.dataset.editorAction === "members");
      });
    }

    function closeMemberManagement() {
      const windowEl = document.getElementById("editor-member-window");
      if (!windowEl) return;
      windowEl.hidden = true;
      document.querySelectorAll(".editor-window-launcher-btn").forEach(item => {
        if (item.dataset.editorAction === "members") item.classList.remove("active");
      });
    }

    /* legacy duplicate launcher variants
    function ensureEditorLauncher(shell) {
      const dashboardItems = [
        { key: "base-char", title: "ベースキャラ", sub: "プロフィールと音声の編集", action: () => activateEditorTab("base-char") },
        { key: "character", title: "カード", sub: "カード登録と画像の編集", action: () => activateEditorTab("character") },
        { key: "story", title: "ストーリー", sub: "本文とシーン構成の編集", action: () => activateEditorTab("story") },
        { key: "gacha", title: "ガチャ", sub: "排出設定とバナーの編集", action: () => activateEditorTab("gacha") },
        { key: "system", title: "システム", sub: "基本設定と表示の編集", action: () => activateEditorTab("system") },
        { key: "publish-share", title: "公開/共有", sub: "共同編集URLと公開URL", action: () => openShareManagement() },
        { key: "members", title: "メンバー", sub: "参加者と権限の管理", action: () => openMemberManagement() }
      ];
      const projectName = String(getCurrentProjectName?.() || "無題のプロジェクト").trim() || "無題のプロジェクト";
      const projectId = String(getCurrentProjectId?.() || "").trim();
      const summaryCards = [
        { label: "ベースキャラ", value: Array.isArray(getBaseChars()) ? getBaseChars().length : 0 },
        { label: "カード", value: Array.isArray(getCharacters()) ? getCharacters().length : 0 },
        { label: "ストーリー", value: Array.isArray(getStories()) ? getStories().length : 0 },
        { label: "ガチャ", value: Array.isArray(getGachas()) ? getGachas().length : 0 }
      ];
      let launcher = document.getElementById("editor-window-launcher");
      if (!launcher) {
        launcher = document.createElement("div");
        launcher.id = "editor-window-launcher";
        launcher.className = "editor-floating-window editor-window-launcher";
        shell.appendChild(launcher);
        enableEditorWindowDrag(launcher);
        launcher.style.left = "24px";
        launcher.style.top = "24px";
      }
      launcher.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>編集ダッシュボード</h4>
            <p>開きたい編集画面を選んでください</p>
          </div>
          <button type="button" class="editor-floating-window-close" data-close-editor-overlay>閉じる</button>
        </div>
        <section class="editor-dashboard-summary">
          <div class="editor-dashboard-summary-head">
            <p class="editor-dashboard-summary-label">Project</p>
            <h5 class="editor-dashboard-summary-name">${esc(projectName)}</h5>
            <p class="editor-dashboard-summary-id">${projectId ? `ID: ${esc(projectId)}` : ""}</p>
          </div>
          <div class="editor-dashboard-summary-stats">
            ${summaryCards.map(item => `
              <div class="editor-dashboard-stat">
                <span class="editor-dashboard-stat-label">${item.label}</span>
                <strong class="editor-dashboard-stat-value">${item.value}</strong>
              </div>
            `).join("")}
          </div>
        </section>
        <div class="editor-window-launcher-grid">
          ${dashboardItems.map(item => `
            <button type="button" class="editor-window-launcher-btn" data-editor-action="${item.key}">
              <span class="editor-window-launcher-btn-title">${item.title}</span>
              <span class="editor-window-launcher-btn-sub">${item.sub}</span>
            </button>
          `).join("")}
        </div>
      `;
      launcher.querySelectorAll(".editor-window-launcher-btn").forEach(button => {
        button.addEventListener("click", () => {
          launcher.querySelectorAll(".editor-window-launcher-btn").forEach(item => item.classList.remove("active"));
          button.classList.add("active");
          const item = dashboardItems.find(entry => entry.key === button.dataset.editorAction);
          item?.action?.();
        });
      });
      launcher.querySelector("[data-close-editor-overlay]")?.addEventListener("click", () => {
        window.closeEditorScreen?.();
      });
    }

    function ensureEditorLauncher(shell) {
      const dashboardItems = [
        { key: "base-char", title: "ベースキャラ", sub: "プロフィールと音声の編集", action: () => activateEditorTab("base-char") },
        { key: "character", title: "カード", sub: "カード登録と画像の編集", action: () => activateEditorTab("character") },
        { key: "story", title: "ストーリー", sub: "本文とシーン構成の編集", action: () => activateEditorTab("story") },
        { key: "gacha", title: "ガチャ", sub: "排出設定とバナーの編集", action: () => activateEditorTab("gacha") },
        { key: "system", title: "システム", sub: "基本設定と表示の編集", action: () => activateEditorTab("system") },
        { key: "publish-share", title: "公開/共有", sub: "共同編集URLと公開URL", action: () => openShareManagement() },
        { key: "members", title: "メンバー", sub: "参加者と権限の管理", action: () => openMemberManagement() }
      ];
      const projectName = String(getCurrentProjectName?.() || "無題のプロジェクト").trim() || "無題のプロジェクト";
      const projectId = String(getCurrentProjectId?.() || "").trim();
      const summaryCards = [
        { label: "ベースキャラ", value: Array.isArray(getBaseChars()) ? getBaseChars().length : 0 },
        { label: "カード", value: Array.isArray(getCharacters()) ? getCharacters().length : 0 },
        { label: "ストーリー", value: Array.isArray(getStories()) ? getStories().length : 0 },
        { label: "ガチャ", value: Array.isArray(getGachas()) ? getGachas().length : 0 }
      ];
      let launcher = document.getElementById("editor-window-launcher");
      if (!launcher) {
        launcher = document.createElement("div");
        launcher.id = "editor-window-launcher";
        launcher.className = "editor-floating-window editor-window-launcher";
        shell.appendChild(launcher);
        enableEditorWindowDrag(launcher);
        launcher.style.left = "24px";
        launcher.style.top = "24px";
      }
      launcher.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>編集ダッシュボード</h4>
          </div>
          <button type="button" class="editor-floating-window-close" data-close-editor-overlay>閉じる</button>
        </div>
        <section class="editor-dashboard-summary">
          <div class="editor-dashboard-summary-head">
            <p class="editor-dashboard-summary-label">Project</p>
            <h5 class="editor-dashboard-summary-name">${esc(projectName)}</h5>
            <p class="editor-dashboard-summary-id">${projectId ? `ID: ${esc(projectId)}` : ""}</p>
          </div>
          <div class="editor-dashboard-summary-stats">
            ${summaryCards.map(item => `
              <div class="editor-dashboard-stat">
                <span class="editor-dashboard-stat-label">${item.label}</span>
                <strong class="editor-dashboard-stat-value">${item.value}</strong>
              </div>
            `).join("")}
          </div>
        </section>
        <div class="editor-window-launcher-grid">
          ${dashboardItems.map(item => `
            <button type="button" class="editor-window-launcher-btn" data-editor-action="${item.key}">
              <span class="editor-window-launcher-btn-title">${item.title}</span>
              <span class="editor-window-launcher-btn-sub">${item.sub}</span>
            </button>
          `).join("")}
        </div>
      `;
      launcher.querySelectorAll(".editor-window-launcher-btn").forEach(button => {
        button.addEventListener("click", () => {
          launcher.querySelectorAll(".editor-window-launcher-btn").forEach(item => item.classList.remove("active"));
          button.classList.add("active");
          const item = dashboardItems.find(entry => entry.key === button.dataset.editorAction);
          item?.action?.();
        });
      });
      launcher.querySelector("[data-close-editor-overlay]")?.addEventListener("click", () => {
        window.closeEditorScreen?.();
      });
    }

    */
    // Active legacy source of truth begins here. V1 wrappers depend on the
    // definitions below; older variants above are retained only as staged cleanup.
    editorWindowDefs.length = 0;
    editorWindowDefs.push(
      { tab: "base-char", title: "ベースキャラ", x: 48, y: 108 },
      { tab: "character", title: "カード", x: 136, y: 132 },
      { tab: "story", title: "ストーリー", x: 224, y: 156 },
      { tab: "gacha", title: "ガチャ", x: 312, y: 180 },
      { tab: "system", title: "システム", x: 400, y: 204 }
    );

    function getEditorSummaryCards() {
      return [
        { label: "ベースキャラ", value: Array.isArray(getBaseChars()) ? getBaseChars().length : 0 },
        { label: "カード", value: Array.isArray(getCharacters()) ? getCharacters().length : 0 },
        { label: "ストーリー", value: Array.isArray(getStories()) ? getStories().length : 0 },
        { label: "ガチャ", value: Array.isArray(getGachas()) ? getGachas().length : 0 }
      ];
    }

    function getDashboardItems() {
      return [
        { key: "base-char", title: "ベースキャラ", sub: "プロフィールと音声の編集", action: () => activateEditorTab("base-char") },
        { key: "character", title: "カード", sub: "カード登録と画像の編集", action: () => activateEditorTab("character") },
        { key: "story", title: "ストーリー", sub: "本文とシーン構成の編集", action: () => activateEditorTab("story") },
        { key: "gacha", title: "ガチャ", sub: "排出設定とバナーの編集", action: () => activateEditorTab("gacha") },
        { key: "system", title: "システム", sub: "基本設定と表示の編集", action: () => activateEditorTab("system") },
        { key: "publish-share", title: "公開/共有", sub: "共同編集URLと公開URL", action: () => openShareManagement() },
        { key: "members", title: "メンバー", sub: "参加者と権限の管理", action: () => openMemberManagement() }
      ];
    }

    function updateLauncherActiveState(activeKey) {
      document.querySelectorAll(".editor-window-launcher-btn").forEach(item => {
        item.classList.toggle("active", item.dataset.editorAction === activeKey);
      });
    }

    function closeAllEditorWindows() {
      editorWindowDefs.forEach(def => closeEditorWindow(def.tab));
      closeShareManagement();
      closeMemberManagement();
      updateLauncherActiveState("");
    }

    function activateEditorTab(tabName) {
      const nextTab = tabName || "base-char";
      ensureEditorWindows();
      closeAllEditorWindows();
      openEditorWindow(nextTab);
      updateLauncherActiveState(nextTab);
      if (nextTab === "gacha") renderGachaPoolChars(getEditingFeaturedIds());
      if (nextTab === "system") systemEditor.renderSystemForm();
    }

    function ensureEditorWindows() {
      const overlay = document.getElementById("screen-editor");
      const shell = document.querySelector(".editor-overlay-shell");
      if (!overlay || !shell) return;
      overlay.classList.add("editor-window-mode");
      overlay.querySelector(".screen-header")?.remove();
      overlay.querySelector(".editor-tabs")?.remove();
      ensureEditorLauncher(shell);
      editorWindowDefs.forEach(def => ensureEditorWindow(shell, def));
    }

    function ensureEditorLauncher(shell) {
      const dashboardItems = getDashboardItems();
      const projectName = String(getCurrentProjectName?.() || "無題のプロジェクト").trim() || "無題のプロジェクト";
      const projectId = String(getCurrentProjectId?.() || "").trim();
      const summaryCards = getEditorSummaryCards();
      let launcher = document.getElementById("editor-window-launcher");
      if (!launcher) {
        launcher = document.createElement("div");
        launcher.id = "editor-window-launcher";
        launcher.className = "editor-floating-window editor-window-launcher";
        shell.appendChild(launcher);
        enableEditorWindowDrag(launcher);
        launcher.style.left = "24px";
        launcher.style.top = "24px";
      }
      launcher.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>編集ダッシュボード</h4>
          </div>
          <button type="button" class="editor-floating-window-close" data-close-editor-overlay>閉じる</button>
        </div>
        <section class="editor-dashboard-summary">
          <div class="editor-dashboard-summary-head">
            <p class="editor-dashboard-summary-label">Project</p>
            <h5 class="editor-dashboard-summary-name">${esc(projectName)}</h5>
            <p class="editor-dashboard-summary-id">${projectId ? `ID: ${esc(projectId)}` : ""}</p>
          </div>
          <div class="editor-dashboard-summary-stats">
            ${summaryCards.map(item => `
              <div class="editor-dashboard-stat">
                <span class="editor-dashboard-stat-label">${item.label}</span>
                <strong class="editor-dashboard-stat-value">${item.value}</strong>
              </div>
            `).join("")}
          </div>
        </section>
        <div class="editor-window-launcher-grid">
          ${dashboardItems.map(item => `
            <button type="button" class="editor-window-launcher-btn" data-editor-action="${item.key}">
              <span class="editor-window-launcher-btn-title">${item.title}</span>
              <span class="editor-window-launcher-btn-sub">${item.sub}</span>
            </button>
          `).join("")}
        </div>
      `;
      launcher.querySelectorAll(".editor-window-launcher-btn").forEach(button => {
        button.addEventListener("click", () => {
          const item = dashboardItems.find(entry => entry.key === button.dataset.editorAction);
          item?.action?.();
        });
      });
      launcher.querySelector("[data-close-editor-overlay]")?.addEventListener("click", () => {
        window.closeEditorScreen?.();
      });
    }

    editorWindowDefs.length = 0;
    editorWindowDefs.push(
      { tab: "base-char", title: "ベースキャラ", x: 48, y: 108 },
      { tab: "character", title: "カード", x: 136, y: 132 },
      { tab: "story", title: "ストーリー", x: 224, y: 156 },
      { tab: "gacha", title: "ガチャ", x: 312, y: 180 },
      { tab: "system", title: "システム", x: 400, y: 204 }
    );

    return {
      activateEditorTab,
      closeAllEditorWindows,
      ensureEditorWindows,
      ensureFolderManagerWindow,
      openFolderManager,
      closeFolderManager,
      renderFolderManager,
      renderEditorScreen,
      renderBaseCharList,
      renderEditorCharacterList,
      renderEditorStoryList,
      renderEditorGachaList,
      renderGachaPoolChars
    };
  }

  window.EditorScreen = {
    setupEditorScreen,
    createEditorScreen
  };
})();
