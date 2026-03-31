/* Shared editor folder/runtime helper.
 * Role: owns shared folder normalization, folder select rendering, and shared
 * system-config persistence used by multiple editor sections.
 */
(() => {
  function create(deps = {}) {
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

    function normalizeFolderList(list) {
      return (Array.isArray(list) ? list : [])
        .map((folder, index) => normalizeFolderRecord(folder, index))
        .filter(Boolean)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja"));
    }

    function populateFolderSelect(elementId, folders, placeholder) {
      const select = document.getElementById(elementId);
      if (!select) return;
      const currentValue = select.value;
      select.innerHTML = `<option value="">${deps.esc?.(placeholder)}</option>` +
        normalizeFolderList(folders).map(folder => `<option value="${deps.esc?.(folder.id)}">${deps.esc?.(folder.name)}</option>`).join("");
      select.value = currentValue;
    }

    function populateFolderSelects() {
      populateFolderSelect("card-folder-select", deps.getSystemConfig?.().cardFolders, "フォルダなし");
      populateFolderSelect("story-folder-select", deps.getSystemConfig?.().storyFolders, "フォルダなし");
    }

    async function persistSystemConfigState() {
      deps.saveLocal?.("socia-system", deps.getSystemConfig?.());
      try {
        const response = await deps.postJSON?.(deps.apiUrl?.(deps.API.system), deps.getSystemConfig?.());
        if (response?.system) {
          const currentConfig = deps.getSystemConfig?.();
          deps.setSystemConfig?.({
            ...deps.getDefaultSystemConfig?.(),
            ...currentConfig,
            ...response.system,
            cardFolders: normalizeFolderList(response.system.cardFolders),
            storyFolders: normalizeFolderList(response.system.storyFolders),
            musicAssets: Array.isArray(response.system.musicAssets) ? response.system.musicAssets : currentConfig.musicAssets,
            homeBgmAssetId: String(response.system.homeBgmAssetId || currentConfig.homeBgmAssetId || "").trim(),
            battleBgmAssetId: String(response.system.battleBgmAssetId || currentConfig.battleBgmAssetId || "").trim(),
            titleMasters: Array.isArray(response.system.titleMasters) ? response.system.titleMasters : currentConfig.titleMasters
          });
          deps.saveLocal?.("socia-system", deps.getSystemConfig?.());
        }
        return {
          ok: true,
          localSaved: true,
          sharedSaved: true,
          response: response || null
        };
      } catch (error) {
        console.error("Failed to save system config:", error);
        const code = String(error?.data?.code || "");
        const requiredPack = String(error?.data?.requiredPack || "").trim();
        if (code === "auth_required" || code === "owner_required" || code === "owner_unresolved") {
          deps.showToast?.("システム設定はローカルに保存しました。共有保存はプロジェクト所有者のみ実行できます。");
          return {
            ok: false,
            localSaved: true,
            sharedSaved: false,
            code,
            error
          };
        }
        if (code === "billing_feature_required" && requiredPack === "battle") {
          deps.showToast?.("このシステム設定を保存するには Battle Pack が必要です。");
          return {
            ok: false,
            localSaved: true,
            sharedSaved: false,
            code,
            error
          };
        }
        if (code === "billing_feature_required" && requiredPack === "event") {
          deps.showToast?.("このイベント設定を保存するには Event Pack が必要です。");
          return {
            ok: false,
            localSaved: true,
            sharedSaved: false,
            code,
            error
          };
        }
        if (code === "billing_feature_required" && requiredPack) {
          deps.showToast?.(`${requiredPack} が必要なため保存できませんでした。`);
          return {
            ok: false,
            localSaved: true,
            sharedSaved: false,
            code,
            error
          };
        }
        deps.showToast?.("システム設定の保存に失敗しました。");
        return {
          ok: false,
          localSaved: true,
          sharedSaved: false,
          code: code || "shared_save_failed",
          error
        };
      }
    }

    async function createContentFolder(kind) {
      const name = window.prompt(kind === "story" ? "ストーリーフォルダ名" : "カードフォルダ名");
      const trimmed = String(name || "").trim().slice(0, 40);
      if (!trimmed) return null;

      const key = kind === "story" ? "storyFolders" : "cardFolders";
      const current = normalizeFolderList(deps.getSystemConfig?.()[key]);
      const folder = {
        id: crypto.randomUUID(),
        name: trimmed,
        sortOrder: current.length
      };

      deps.setSystemConfig?.({
        ...deps.getSystemConfig?.(),
        [key]: [...current, folder]
      });

      await persistSystemConfigState();
      populateFolderSelects();
      deps.renderEditorScreen?.();
      deps.showToast?.(`${trimmed}を作成しました。`);
      return folder;
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
          ${deps.esc?.(label)}
          <select name="folderId" id="${deps.esc?.(selectId)}">
            <option value="">フォルダなし</option>
          </select>
        </label>
        <button type="button" class="btn-secondary editor-folder-create-btn" id="${deps.esc?.(createButtonId)}">+ 新規フォルダ</button>
      `;
      anchor.closest("label, div")?.after(wrap);
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

    return {
      normalizeFolderRecord,
      normalizeFolderList,
      populateFolderSelects,
      populateFolderSelect,
      persistSystemConfigState,
      createContentFolder,
      ensureEditorFolderControls,
      ensureFolderControlRow
    };
  }

  window.SociaEditorFolderRuntime = {
    create
  };
})();
