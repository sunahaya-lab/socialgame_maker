(function () {
  const ROLE_OPTIONS = [
    { value: "decorative", label: "装飾" },
    { value: "battle", label: "バトル" },
    { value: "home-config", label: "ホーム設定" },
    { value: "home-share", label: "共有" },
    { value: "speech", label: "吹き出し" },
    { value: "event-banner", label: "イベントバナー" },
    { value: "currency-stamina", label: "スタミナ" },
    { value: "currency-gems", label: "ジェム" },
    { value: "currency-gold", label: "ゴールド" }
  ];

  function esc(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clampNumber(value, min, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.round(num));
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("read_failed"));
      reader.readAsDataURL(file);
    });
  }

  function makeSvgDataUrl(svg) {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function createBuiltinAssets() {
    return [
      {
        id: "builtin-button",
        name: "ボタン",
        src: makeSvgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160" viewBox="0 0 320 160"><rect x="8" y="8" width="304" height="144" rx="36" fill="#3b82f6" stroke="rgba(255,255,255,0.9)" stroke-width="8"/></svg>'),
        width: 200,
        height: 96,
        type: "builtin"
      },
      {
        id: "builtin-frame",
        name: "フレーム",
        src: makeSvgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200" viewBox="0 0 360 200"><rect x="18" y="18" width="324" height="164" rx="28" fill="rgba(20,20,30,0.55)" stroke="#f4dba2" stroke-width="10"/></svg>'),
        width: 220,
        height: 120,
        type: "builtin"
      }
    ];
  }

  function createHomeEditWorkspaceModule(deps) {
    const {
      getSystemConfig,
      setSystemConfig,
      getCurrentLayoutOwnerId,
      getHomeAssetFolders,
      resolveHomeAssetFolderAssets,
      upsertHomeLayoutAssetInConfig,
      persistSystemConfigState,
      renderHome,
      showToast
    } = deps;

    const builtinAssets = createBuiltinAssets();

    let active = false;
    let saveTimer = null;

    // Active Stage 1 controller boundary:
    // floating window shell behavior lives in home-workspace-windows.js
    const windowController = window.HomeWorkspaceWindowsLib?.create?.({
      renderMenuButtons
    });
    const windowState = windowController?.getWindowState?.() || {};
    // Active Stage 1 controller boundary:
    // asset/folder behavior lives in home-workspace-assets.js
    const assetsController = window.HomeWorkspaceAssetsLib?.create?.({
      getSystemConfig,
      setSystemConfig,
      getCurrentLayoutOwnerId,
      getHomeAssetFolders,
      resolveHomeAssetFolderAssets,
      upsertHomeLayoutAssetInConfig,
      persistSystemConfigState,
      renderHome,
      showToast,
      builtinAssets,
      esc,
      readFileAsDataUrl,
      text,
      renderWorkspace: () => renderWorkspace()
    });
    // Active Stage 1 controller boundary:
    // part list / property editor behavior lives in home-workspace-parts.js
    const partsController = window.HomeWorkspacePartsLib?.create?.({
      getCustomParts,
      setCustomParts,
      getSelectedAssets: () => getSelectedAssets(),
      esc,
      clampNumber,
      text,
      roleOptions: ROLE_OPTIONS,
      renderWorkspace: () => renderWorkspace()
    });

    function text(key, fallback) {
      return window.UiTextLib?.get?.(key, fallback) || fallback;
    }

    function getHomeLayoutConfig() {
      const current = getSystemConfig() || {};
      const layoutPresets = current.layoutPresets || {};
      const home = layoutPresets.home || {};
      return {
        ...home,
        mode: home.mode || "advanced",
        customParts: Array.isArray(home.customParts) ? home.customParts : []
      };
    }

    function getCustomParts() {
      return getHomeLayoutConfig().customParts;
    }

    function getSelectedFolder() {
      return assetsController?.getSelectedFolder?.() || null;
    }

    function getSelectedAssets() {
      return assetsController?.getSelectedAssets?.() || [];
    }

    function ensureSelectedFolder() {
      return assetsController?.ensureSelectedFolder?.();
    }

    function saveLayout() {
      const current = getSystemConfig() || {};
      const layout = getHomeLayoutConfig();
      setSystemConfig({
        ...current,
        layoutPresets: {
          ...(current.layoutPresets || {}),
          home: {
            ...layout,
            mode: "advanced",
            customParts: getCustomParts()
          }
        }
      });
      renderHome?.();
      persistSystemConfigState?.().catch(() => {});
    }

    function schedulePersist() {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(saveLayout, 120);
    }

    function setCustomParts(nextParts) {
      const current = getSystemConfig() || {};
      const layout = getHomeLayoutConfig();
      setSystemConfig({
        ...current,
        layoutPresets: {
          ...(current.layoutPresets || {}),
          home: {
            ...layout,
            mode: "advanced",
            customParts: nextParts
          }
        }
      });
      renderHome?.();
      schedulePersist();
    }

    function ensureWorkspace() {
      const overlay = document.getElementById("home-edit-overlay");
      if (!overlay) return null;
      if (overlay.dataset.ready === "true") return overlay;

      overlay.dataset.ready = "true";
      overlay.innerHTML = `
        <section class="home-edit-window home-edit-menu-window" id="home-edit-menu-window" data-home-edit-window="menu">
          <div class="home-edit-window-head" data-home-edit-drag-handle="menu">
            <div><strong>\u7de8\u96c6</strong><p>\u30a6\u30a3\u30f3\u30c9\u30a6\u3092\u5207\u308a\u66ff\u3048\u307e\u3059</p></div>
            <button type="button" class="home-edit-window-hide" data-home-edit-close>&times;</button>
          </div>
          <div class="home-edit-menu-body" id="home-edit-menu-body"></div>
        </section>

        <section class="home-edit-window home-edit-builder" id="home-edit-builder" data-home-edit-window="builder">
          <div class="home-edit-window-head" data-home-edit-drag-handle="builder">
            <div><strong>UI</strong><p>\u7d20\u6750\u3068\u30d1\u30fc\u30c4\u3092\u7de8\u96c6\u3057\u307e\u3059</p></div>
            <button type="button" class="home-edit-window-hide" data-home-edit-toggle="builder">隠す</button>
          </div>
          <div class="home-edit-builder-body">
            <section class="home-edit-column">
              <div class="home-edit-subhead"><strong>素材</strong></div>
              <div class="home-edit-source-tabs" id="home-edit-source-tabs"></div>
              <label class="home-edit-field">
                <span>フォルダ</span>
                <select id="home-edit-folder-select"></select>
              </label>
              <label class="home-edit-upload" id="home-edit-upload-wrap">
                <span>画像を追加</span>
                <input type="file" id="home-edit-upload-input" accept="image/*">
              </label>
              <div class="home-edit-asset-grid" id="home-edit-asset-grid"></div>
            </section>
            <section class="home-edit-column">
              <div class="home-edit-subhead">
                <strong>配置パーツ</strong>
                <button type="button" class="home-edit-ghost-btn" id="home-edit-add-empty">空パーツを追加</button>
              </div>
              <div class="home-edit-part-list" id="home-edit-part-list"></div>
            </section>
            <section class="home-edit-column">
              <div class="home-edit-subhead"><strong>属性</strong></div>
              <div class="home-edit-props" id="home-edit-props"></div>
            </section>
          </div>
        </section>

        <section class="home-edit-window home-edit-folder-window" id="home-edit-folder-window" data-home-edit-window="folders">
          <div class="home-edit-window-head" data-home-edit-drag-handle="folders">
            <div><strong>フォルダ</strong><p>ユーザー / チーム / デフォルト</p></div>
            <button type="button" class="home-edit-window-hide" data-home-edit-toggle="folders">隠す</button>
          </div>
          <div class="home-edit-window-body home-edit-folder-window-body" id="home-edit-folder-window-body"></div>
        </section>

        <section class="home-edit-window home-edit-base-char-window" id="home-edit-base-char-window" data-home-edit-window="baseChar">
          <div class="home-edit-window-head" data-home-edit-drag-handle="baseChar">
            <div><strong>ベースキャラ</strong><p>登録フォームをここに表示します</p></div>
            <button type="button" class="home-edit-window-hide" data-home-edit-toggle="baseChar">隠す</button>
          </div>
          <div class="home-edit-window-body" id="home-edit-base-char-window-body"></div>
        </section>

        <section class="home-edit-window home-edit-character-card-window" id="home-edit-character-card-window" data-home-edit-window="characterCard">
          <div class="home-edit-window-head" data-home-edit-drag-handle="characterCard">
            <div><strong>\u30ad\u30e3\u30e9\u30ab\u30fc\u30c9</strong><p>\u30ad\u30e3\u30e9\u30ab\u30fc\u30c9\u767b\u9332\u30d5\u30a9\u30fc\u30e0\u3092\u3053\u3053\u306b\u8868\u793a\u3057\u307e\u3059</p></div>
            <button type="button" class="home-edit-window-hide" data-home-edit-toggle="characterCard">隠す</button>
          </div>
          <div class="home-edit-window-body" id="home-edit-character-card-window-body"></div>
        </section>

        <section class="home-edit-window home-edit-equipment-card-window" id="home-edit-equipment-card-window" data-home-edit-window="equipmentCard">
          <div class="home-edit-window-head" data-home-edit-drag-handle="equipmentCard">
            <div><strong>\u88c5\u5099\u30ab\u30fc\u30c9</strong><p>\u88c5\u5099\u30ab\u30fc\u30c9\u7528\u306e\u72ec\u7acb\u30a6\u30a3\u30f3\u30c9\u30a6\u3067\u3059</p></div>
            <button type="button" class="home-edit-window-hide" data-home-edit-toggle="equipmentCard">隠す</button>
          </div>
          <div class="home-edit-window-body" id="home-edit-equipment-card-window-body">
            <p class="home-edit-empty">\u88c5\u5099\u30ab\u30fc\u30c9\u306e\u4fdd\u5b58\u5148\u306f\u307e\u3060\u672a\u5b9f\u88c5\u3067\u3059</p>
            <p class="editor-note">\u5148\u306b\u72ec\u7acb\u30a6\u30a3\u30f3\u30c9\u30a6\u3060\u3051\u7528\u610f\u3057\u3066\u3044\u307e\u3059 \u88c5\u5099\u30c7\u30fc\u30bf\u5c64\u3092\u8ffd\u52a0\u3057\u305f\u3089\u3053\u3053\u3078\u63a5\u7d9a\u3057\u307e\u3059</p>
          </div>
        </section>

        <section class="home-edit-window home-edit-story-window" id="home-edit-story-window" data-home-edit-window="story">
          <div class="home-edit-window-head" data-home-edit-drag-handle="story">
            <div><strong>ストーリー</strong><p>ストーリー追加と編集をここで行います</p></div>
            <button type="button" class="home-edit-window-hide" data-home-edit-toggle="story">隠す</button>
          </div>
          <div class="home-edit-window-body" id="home-edit-story-window-body"></div>
        </section>

        <section class="home-edit-window home-edit-gacha-window" id="home-edit-gacha-window" data-home-edit-window="gacha">
          <div class="home-edit-window-head" data-home-edit-drag-handle="gacha">
            <div><strong>ガチャ編集</strong><p>キャラガチャと装備ガチャを設定します</p></div>
            <button type="button" class="home-edit-window-hide" data-home-edit-toggle="gacha">隠す</button>
          </div>
          <div class="home-edit-window-body" id="home-edit-gacha-window-body"></div>
        </section>

        <section class="home-edit-window home-edit-system-window" id="home-edit-system-window" data-home-edit-window="system">
          <div class="home-edit-window-head" data-home-edit-drag-handle="system">
            <div><strong>ゲームシステム</strong><p>システム設定とゲーム方式を調整します</p></div>
            <button type="button" class="home-edit-window-hide" data-home-edit-toggle="system">隠す</button>
          </div>
          <div class="home-edit-window-body" id="home-edit-system-window-body"></div>
        </section>
      `;

      overlay.querySelector("[data-home-edit-close]")?.addEventListener("click", closeHomeEditMode);
      windowController?.bindOverlay?.(overlay);
      overlay.querySelector("#home-edit-source-tabs")?.addEventListener("click", event => assetsController?.handleSourceTabClick?.(event));
      overlay.querySelector("#home-edit-folder-select")?.addEventListener("change", event => {
        assetsController?.setSelectedFolderId?.(event.target.value || "");
        renderWorkspace();
      });
      overlay.querySelector("#home-edit-asset-grid")?.addEventListener("click", event => partsController?.handleAssetGridClick?.(event));
      overlay.querySelector("#home-edit-part-list")?.addEventListener("click", event => partsController?.handlePartListClick?.(event));
      overlay.querySelector("#home-edit-add-empty")?.addEventListener("click", () => partsController?.addEmptyPart?.());
      overlay.querySelector("#home-edit-props")?.addEventListener("input", event => partsController?.handlePropsInput?.(event));
      overlay.querySelector("#home-edit-props")?.addEventListener("change", event => partsController?.handlePropsInput?.(event));
      overlay.querySelector("#home-edit-upload-input")?.addEventListener("change", event => assetsController?.handleUpload?.(event));
      overlay.querySelector("#home-edit-folder-window-body")?.addEventListener("click", event => assetsController?.handleFolderWindowClick?.(event));

      return overlay;
    }

    function attachEditorPanel(sourceId, targetId) {
      const source = document.getElementById(sourceId);
      const target = document.getElementById(targetId);
      if (!source || !target || target.contains(source)) return;
      source.classList.add("home-edit-window-panel");
      source.classList.add("active");
      source.hidden = false;
      source.style.display = "block";
      target.innerHTML = "";
      target.appendChild(source);
    }

    function attachBaseCharPanel() {
      attachEditorPanel("editor-base-char", "home-edit-base-char-window-body");
    }

    function attachCharacterCardPanel() {
      attachEditorPanel("editor-character", "home-edit-character-card-window-body");
    }

    function attachEquipmentCardPanel() {
      attachEditorPanel("editor-equipment-card", "home-edit-equipment-card-window-body");
    }

    function attachStoryPanel() {
      attachEditorPanel("editor-story", "home-edit-story-window-body");
    }

    function attachGachaPanel() {
      attachEditorPanel("editor-gacha", "home-edit-gacha-window-body");
    }

    function attachSystemPanel() {
      attachEditorPanel("editor-system", "home-edit-system-window-body");
    }

    function openHomeEditMode() {
      const overlay = ensureWorkspace();
      if (!overlay) return null;
      active = true;
      document.body.classList.add("home-edit-mode");
      document.getElementById("screen-home")?.classList.add("home-edit-mode");
      overlay.hidden = false;
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");
      ensureSelectedFolder();
      attachBaseCharPanel();
      attachCharacterCardPanel();
      attachEquipmentCardPanel();
      attachStoryPanel();
      attachGachaPanel();
      attachSystemPanel();
      renderWorkspace();
      return overlay;
    }

    function closeHomeEditMode() {
      const overlay = document.getElementById("home-edit-overlay");
      active = false;
      document.body.classList.remove("home-edit-mode");
      document.getElementById("screen-home")?.classList.remove("home-edit-mode");
      if (!overlay) return null;
      overlay.hidden = true;
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
      return overlay;
    }

    function sync() {
      if (!active) return;
      ensureSelectedFolder();
      attachBaseCharPanel();
      attachCharacterCardPanel();
      attachEquipmentCardPanel();
      attachStoryPanel();
      attachGachaPanel();
      attachSystemPanel();
      renderWorkspace();
    }

    function renderMenuButtons() {
      const host = document.getElementById("home-edit-menu-body");
      if (!host) return;
      host.innerHTML = [
        ["builder", "UI"],
        ["folders", "\u30d5\u30a9\u30eb\u30c0"],
        ["baseChar", "\u30d9\u30fc\u30b9\u30ad\u30e3\u30e9"],
        ["characterCard", "\u30ad\u30e3\u30e9\u30ab\u30fc\u30c9"],
        ["equipmentCard", "\u88c5\u5099\u30ab\u30fc\u30c9"],
        ["story", "\u30b9\u30c8\u30fc\u30ea\u30fc"],
        ["gacha", "\u30ac\u30c1\u30e3\u7de8\u96c6"],
        ["system", "\u30b2\u30fc\u30e0\u30b7\u30b9\u30c6\u30e0"]
      ].map(([key, label]) => {
        const isOpen = windowState[key]?.open;
        return `<button type="button" class="home-edit-menu-btn${isOpen ? " is-active" : ""}" data-home-edit-toggle="${key}">${label}</button>`;
      }).join("");
      host.querySelectorAll("[data-home-edit-toggle]").forEach(button => {
        button.addEventListener("click", () => windowController?.toggleWindow?.(button.dataset.homeEditToggle || ""));
      });
    }

    function renderSourceTabs() {
      return assetsController?.renderSourceTabs?.();
    }

    function renderFolderSelect() {
      return assetsController?.renderFolderSelect?.();
    }

    function renderAssetGrid() {
      return assetsController?.renderAssetGrid?.();
    }

    function renderPartList() {
      return partsController?.renderPartList?.();
    }

    function renderProps() {
      return partsController?.renderProps?.();
    }

    function renderFolderWindow() {
      return assetsController?.renderFolderWindow?.();
    }

    function renderWorkspace() {
      if (!active) return;
      ensureSelectedFolder();
      windowController?.applyAllWindowStates?.();
      renderMenuButtons();
      renderSourceTabs();
      renderFolderSelect();
      renderAssetGrid();
      renderPartList();
      renderProps();
      renderFolderWindow();
    }

    return {
      openHomeEditMode,
      closeHomeEditMode,
      sync
    };
  }

  window.HomeEditWorkspaceModule = {
    create: createHomeEditWorkspaceModule
  };
})();
