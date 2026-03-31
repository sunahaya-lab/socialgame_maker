/* Active compatibility implementation.
 * Role: legacy editor window/body manager still used by the current editor runtime bridge.
 * Removal condition: only after mainline editor no longer depends on window.EditorScreen.
 * Future mainline direction: public/editor/ + public/editor/shared/.
 */
(function () {
  function setupEditorScreen(deps) {
    const api = createEditorScreen(deps);
    api.ensureEditorWindows();
    return api;
  }

  function createEditorScreen(deps) {
    // SECTION 01: dependency intake
    const {
      getCurrentProjectId,
      getCurrentProjectName,
      getProjects,
      getCurrentPlayerId,
      getBaseChars,
      getCharacters,
      getAnnouncements,
      getStories,
      getGachas,
      getSystemConfig,
      getEditingFeaturedIds,
      getRarityCssClass,
      getRarityLabel,
      makeFallbackImage,
      buildStorySummary,
      buildGachaRateSummary,
      esc,
      baseCharEditor,
      entryEditor,
      announcementEditor,
      titleEditor,
      musicEditor,
      storyEditor,
      systemEditor,
      collectionScreen,
      beginGachaEdit,
      populateBaseCharSelects,
      populateFolderSelects,
      updateEditorSubmitLabels,
      handleCreateProject,
      renameProject,
      switchProject
    } = deps;

    // SECTION 02: compatibility state
    let editorWindowDrag = null;
    const editorWindowDefs = [];

    // SECTION 03: top-level render / tab activation entrypoints
    function renderEditorScreen() {
      ensureEditorWindows();
      renderBaseCharList();
      renderEditorCharacterList();
      announcementEditor?.renderAnnouncementEditor?.();
      renderEditorStoryList();
      renderEditorGachaList();
      musicEditor?.renderMusicEditor?.();
      systemEditor.renderSystemForm();
      renderGachaPoolChars(getEditingFeaturedIds());
      collectionScreen.renderCollectionFilters("all");
      populateBaseCharSelects();
      populateFolderSelects();
      updateEditorSubmitLabels();
    }

    function closeAllEditorWindows() {
      editorWindowDefs.forEach(def => closeEditorWindow(def.tab));
    }

    function ensureEditorWindowSet() {
      ensureEditorWindows();
      return true;
    }

    function activateEditorTab(tabName) {
      const requestedTab = tabName || "base-char";
      const nextTab = requestedTab === "title" ? "base-char" : requestedTab;
      ensureEditorWindows();
      closeAllEditorWindows();
      openEditorWindow(nextTab);
      if (nextTab === "gacha") renderGachaPoolChars(getEditingFeaturedIds());
      if (nextTab === "system") systemEditor.renderSystemForm();
      if (nextTab === "music") musicEditor?.setupMusicEditor?.();
    }

    // SECTION 04: legacy floating window manager
    // 04A: window lifecycle
    function getEditorOverlay() {
      return document.getElementById("screen-editor");
    }

    function prepareEditorWindowMode(overlay) {
      if (!overlay) return false;
      overlay.classList.add("editor-window-mode");
      overlay.querySelector(".screen-header")?.remove();
      overlay.querySelector(".editor-tabs")?.remove();
      return true;
    }

    function ensureEditorWindows() {
      const overlay = getEditorOverlay();
      const shell = document.querySelector(".editor-overlay-shell");
      if (!prepareEditorWindowMode(overlay) || !shell) return;
      editorWindowDefs.forEach(def => ensureEditorWindow(shell, def));
    }

    function getEditorShell() {
      return document.querySelector(".editor-overlay-shell");
    }

    function getEditorWindowEl(tabName) {
      return document.getElementById(`editor-window-${tabName}`);
    }

    function createEditorWindowEl(def) {
      const windowEl = document.createElement("section");
      windowEl.id = `editor-window-${def.tab}`;
      windowEl.className = "editor-floating-window editor-content-window";
      windowEl.dataset.editorTab = def.tab;
      windowEl.hidden = true;
      windowEl.innerHTML = `
        <div class="editor-floating-window-head">
          <div>
            <h4>${def.title}</h4>
          </div>
          <button type="button" class="editor-floating-window-close" data-close-editor-window="${def.tab}">閉じる</button>
        </div>
        <div class="editor-content-window-body"></div>
      `;
      return windowEl;
    }

    function ensureEditorWindow(shell, def) {
      const panel = document.getElementById(`editor-${def.tab}`);
      if (!panel) return null;
      let windowEl = getEditorWindowEl(def.tab);
      if (windowEl) return windowEl;

      windowEl = createEditorWindowEl(def);

      const body = windowEl.querySelector(".editor-content-window-body");
      body?.appendChild(panel);
      panel.hidden = false;
      panel.classList.add("active", "editor-panel-windowed");
      shell.appendChild(windowEl);
      windowEl.querySelector("[data-close-editor-window]")?.addEventListener("click", () => {
        closeEditorWindow(def.tab);
        window.dispatchEvent(new CustomEvent("socia:editor-window-closed", {
          detail: { tab: def.tab }
        }));
      });
      enableEditorWindowDrag(windowEl);
      windowEl.style.left = `${def.x}px`;
      windowEl.style.top = `${def.y}px`;
      return windowEl;
    }

    function bringEditorWindowToFront(windowEl) {
      if (!windowEl) return;
      const currentMax = Math.max(
        0,
        ...Array.from(document.querySelectorAll(".editor-content-window"))
          .map(node => Number(node.style.zIndex) || 0)
      );
      windowEl.style.zIndex = String(currentMax + 1);
    }

    function openEditorWindow(tabName) {
      const windowEl = getEditorWindowEl(tabName);
      if (!windowEl) return;
      windowEl.hidden = false;
      bringEditorWindowToFront(windowEl);
    }

    function closeEditorWindow(tabName) {
      const windowEl = getEditorWindowEl(tabName);
      if (!windowEl) return;
      windowEl.hidden = true;
    }

    function openEditorWindowByTab(tabName) {
      ensureEditorWindows();
      openEditorWindow(tabName);
      return true;
    }

    function closeEditorWindowByTab(tabName) {
      closeEditorWindow(tabName);
      return true;
    }

    // 04B: drag state and pointer bindings
    function enableEditorWindowDrag(windowEl) {
      const handle = windowEl?.querySelector?.(".editor-floating-window-head");
      if (!handle || !windowEl) return;
      handle.addEventListener("pointerdown", event => {
        if (event.target.closest("button, input, select, textarea, label")) return;
        const rect = windowEl.getBoundingClientRect();
        editorWindowDrag = {
          windowEl,
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top
        };
        bringEditorWindowToFront(windowEl);
        windowEl.classList.add("is-dragging");
      });
      windowEl.addEventListener("pointerdown", () => bringEditorWindowToFront(windowEl));
    }

    window.addEventListener("pointermove", event => {
      if (!editorWindowDrag?.windowEl) return;
      const windowEl = editorWindowDrag.windowEl;
      if (windowEl.hidden) return;
      windowEl.style.left = `${event.clientX - editorWindowDrag.offsetX}px`;
      windowEl.style.top = `${event.clientY - editorWindowDrag.offsetY}px`;
      windowEl.style.right = "auto";
    });

    window.addEventListener("pointerup", () => {
      if (!editorWindowDrag?.windowEl) return;
      editorWindowDrag.windowEl.classList.remove("is-dragging");
      editorWindowDrag = null;
    });

    // SECTION 05: legacy list / picker renderers
    function renderEditorEmptyState(listEl, message) {
      if (listEl) {
        listEl.innerHTML = `<p class="editor-record-empty">${message}</p>`;
      }
    }

    function bindEditorListActions(rootEl, selector, handler) {
      rootEl?.querySelectorAll(selector).forEach(button => {
        button.addEventListener("click", () => handler(button));
      });
    }

    function toggleEditorSelectionClass(rootEl, selector, className) {
      bindEditorListActions(rootEl, selector, button => {
        button.classList.toggle(className);
      });
    }

    // 05A: base character list
    function renderBaseCharList() {
      const list = document.getElementById("base-char-list");
      if (!list) return;
      const items = Array.isArray(getBaseChars()) ? getBaseChars() : [];
      if (!items.length) {
        renderEditorEmptyState(list, "登録済みベースキャラがありません");
        return;
      }
      list.innerHTML = items.map(baseChar => `
        <article class="editor-record-card">
          <img src="${esc(baseChar.portrait || makeFallbackImage(baseChar.name, ""))}" alt="${esc(baseChar.name || "ベースキャラ")}">
          <div class="editor-record-card-body">
            <div class="editor-record-item-top">
              <h5>${esc(baseChar.name || "名称未設定")}</h5>
              <span class="editor-record-meta">${esc(baseChar.birthday || "")}</span>
            </div>
            <p>${esc(baseChar.description || "説明はまだありません")}</p>
            <div class="editor-record-actions">
              <button type="button" class="editor-inline-btn" data-base-char-edit="${baseChar.id}">編集</button>
              <button type="button" class="editor-inline-btn" data-base-char-delete="${baseChar.id}">削除</button>
            </div>
          </div>
        </article>
      `).join("");
      bindEditorListActions(list, "[data-base-char-edit]", button => {
        baseCharEditor?.beginBaseCharEdit?.(button.dataset.baseCharEdit);
        activateEditorTab("base-char");
      });
      bindEditorListActions(list, "[data-base-char-delete]", button => {
        baseCharEditor?.deleteBaseChar?.(button.dataset.baseCharDelete);
      });
    }

    // 05B: card list
    function renderEditorCharacterList() {
      const list = document.getElementById("editor-character-list");
      if (!list) return;
      const items = Array.isArray(getCharacters()) ? getCharacters() : [];
      if (!items.length) {
        renderEditorEmptyState(list, "登録済みカードがありません");
        return;
      }
      list.innerHTML = items.map(char => `
        <article class="editor-record-card">
          <img src="${esc(char.image || makeFallbackImage(char.name, char.rarity))}" alt="${esc(char.name || "カード")}">
          <div class="editor-record-card-body">
            <div class="editor-record-item-top">
              <h5>${esc(char.name || "名称未設定")}</h5>
              <span class="editor-record-badge ${esc(getRarityCssClass?.(char.rarity) || "")}">${esc(getRarityLabel?.(char.rarity) || String(char.rarity || ""))}</span>
            </div>
            <p>${esc(char.catch || "キャッチコピーはまだありません")}</p>
            <div class="editor-record-actions">
              <button type="button" class="editor-inline-btn" data-character-edit="${char.id}">編集</button>
            </div>
          </div>
        </article>
      `).join("");
      bindEditorListActions(list, "[data-character-edit]", button => {
        entryEditor?.beginCharacterEdit?.(button.dataset.characterEdit);
        activateEditorTab("character");
      });
    }

    // 05C: story list
    function renderEditorStoryList() {
      const list = document.getElementById("editor-story-list");
      if (!list) return;
      const items = Array.isArray(getStories()) ? getStories() : [];
      if (!items.length) {
        renderEditorEmptyState(list, "登録済みストーリーがありません");
        return;
      }
      list.innerHTML = items.map(story => `
        <article class="editor-record-item">
          <div class="editor-record-item-top">
            <h5>${esc(story.title || "名称未設定")}</h5>
            <span class="editor-record-badge">${esc(story.type || "story")}</span>
          </div>
          <p>${esc(buildStorySummary?.(story) || "シーン未設定")}</p>
          <div class="editor-record-actions">
            <button type="button" class="editor-inline-btn" data-story-edit="${story.id}">編集</button>
          </div>
        </article>
      `).join("");
      bindEditorListActions(list, "[data-story-edit]", button => {
        storyEditor?.beginStoryEdit?.(button.dataset.storyEdit);
        activateEditorTab("story");
      });
    }

    // 05D: announcement pass-through
    function renderAnnouncementList() {
      announcementEditor?.renderAnnouncementEditor?.();
    }

    // 05E: gacha list
    function renderEditorGachaList() {
      const list = document.getElementById("editor-gacha-list");
      if (!list) return;
      const items = Array.isArray(getGachas()) ? getGachas() : [];
      if (!items.length) {
        renderEditorEmptyState(list, "登録済みガチャがありません");
        return;
      }
      list.innerHTML = items.map(gacha => `
        <article class="editor-record-item">
          <div class="editor-record-item-top">
            <h5>${esc(gacha.title || "名称未設定")}</h5>
            <span class="editor-record-badge">${esc(gacha.gachaType || "character")}</span>
          </div>
          <p>${esc(buildGachaRateSummary?.(gacha.rates || {}) || "排出率未設定")}</p>
          <div class="editor-record-actions">
            <button type="button" class="editor-inline-btn" data-gacha-edit="${gacha.id}">編集</button>
          </div>
        </article>
      `).join("");
      bindEditorListActions(list, "[data-gacha-edit]", button => {
        beginGachaEdit?.(button.dataset.gachaEdit);
        activateEditorTab("gacha");
      });
    }

    // 05F: gacha featured pool picker
    function renderGachaPoolChars(selectedIds = []) {
      const list = document.getElementById("gacha-pool-chars");
      if (!list) return;
      const selectedSet = new Set(Array.isArray(selectedIds) ? selectedIds : []);
      const items = Array.isArray(getCharacters()) ? getCharacters() : [];
      if (!items.length) {
        renderEditorEmptyState(list, "ピックアップ候補のカードがありません");
        return;
      }
      list.innerHTML = items.map(char => `
        <button type="button" class="gacha-pool-char${selectedSet.has(char.id) ? " selected" : ""}" data-char-id="${char.id}">
          <img src="${esc(char.image || makeFallbackImage(char.name, char.rarity))}" alt="${esc(char.name || "カード")}">
          <span>${esc(char.name || "名称未設定")}</span>
        </button>
      `).join("");
      toggleEditorSelectionClass(list, ".gacha-pool-char", "selected");
    }

    // SECTION 06: window definitions + public API
    function buildEditorWindowDefs() {
      return [
        { tab: "base-char", title: "\u30d9\u30fc\u30b9\u30ad\u30e3\u30e9", x: 48, y: 108 },
        { tab: "character", title: "\u30ab\u30fc\u30c9", x: 136, y: 132 },
        { tab: "equipment-card", title: "\u88c5\u5099\u30ab\u30fc\u30c9", x: 180, y: 144 },
        { tab: "story", title: "\u30b9\u30c8\u30fc\u30ea\u30fc", x: 224, y: 156 },
        { tab: "gacha", title: "\u30ac\u30c1\u30e3", x: 312, y: 180 },
        { tab: "music", title: "BGM", x: 400, y: 204 },
        { tab: "announcement", title: "\u304a\u77e5\u3089\u305b", x: 444, y: 216 },
        { tab: "title", title: "\u79f0\u53f7", x: 468, y: 220 },
        { tab: "system", title: "\u30b7\u30b9\u30c6\u30e0", x: 488, y: 228 }
      ];
    }

    // Compatibility note:
    // - These window defs still drive the active legacy editor workspace.
    // - `music`, `announcement`, `title`, and `system` already hand off most behavior
    //   to newer mainline runtimes after the tab is opened.
    // - `base-char`, `character`, `story`, and `gacha` still depend on this file for
    //   list rendering and legacy window lifecycle.
    editorWindowDefs.length = 0;
    editorWindowDefs.push(...buildEditorWindowDefs());

    return {
      activateEditorTab,
      closeAllEditorWindows,
      ensureEditorWindowSet,
      ensureEditorWindows,
      openEditorWindowByTab,
      closeEditorWindowByTab,
      renderEditorScreen,
      renderBaseCharList,
      renderEditorCharacterList,
      renderAnnouncementList,
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
