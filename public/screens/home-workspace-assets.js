(function () {
  function createHomeWorkspaceAssetsController(deps) {
    const {
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
      renderWorkspace
    } = deps;

    let selectedSource = "user";
    let selectedFolderId = "";

    function getAllFolders() {
      return getHomeAssetFolders?.(getSystemConfig()) || [];
    }

    function getUserFolders() {
      const ownerId = getCurrentLayoutOwnerId?.() || "local-editor";
      return getAllFolders().filter(folder => folder.kind === "personal" && String(folder.ownerMemberId || "") === String(ownerId));
    }

    function getTeamFolders() {
      return getAllFolders().filter(folder => folder.kind === "shared");
    }

    function getDefaultFolders() {
      return [
        { id: "builtin-default", name: "標準", kind: "builtin", type: "builtin", assets: builtinAssets }
      ];
    }

    function getSourceFolders() {
      if (selectedSource === "team") return getTeamFolders();
      if (selectedSource === "default") return getDefaultFolders();
      return getUserFolders();
    }

    function getSelectedFolder() {
      const folders = getSourceFolders();
      return folders.find(folder => folder.id === selectedFolderId) || folders[0] || null;
    }

    function getSelectedAssets() {
      const folder = getSelectedFolder();
      if (!folder) return [];
      if (folder.kind === "builtin") {
        return folder.assets.map(asset => ({ ...asset, assetKey: asset.id }));
      }
      return (resolveHomeAssetFolderAssets?.(folder.id, getSystemConfig()) || []).map(asset => ({
        ...asset,
        assetKey: asset.id
      }));
    }

    function ensureSelectedFolder() {
      const folder = getSelectedFolder();
      if (folder) {
        selectedFolderId = folder.id;
        return;
      }
      selectedFolderId = getSourceFolders()[0]?.id || "";
    }

    function schedulePersist() {
      renderHome?.();
      persistSystemConfigState?.().catch(() => {});
    }

    function createFolder(group) {
      if (group !== "user" && group !== "team") return;
      const current = getSystemConfig() || {};
      const folders = getAllFolders();
      const next = {
        id: `home-folder-${Date.now()}`,
        name: group === "team" ? `チーム ${getTeamFolders().length + 1}` : `ユーザー ${getUserFolders().length + 1}`,
        kind: group === "team" ? "shared" : "personal",
        ownerMemberId: group === "team" ? null : (getCurrentLayoutOwnerId?.() || "local-editor"),
        assetIds: [],
        sourceRefs: [],
        sortOrder: folders.length
      };
      setSystemConfig({
        ...current,
        assetFolders: {
          ...(current.assetFolders || {}),
          home: [...folders, next]
        }
      });
      selectedSource = group === "team" ? "team" : "user";
      selectedFolderId = next.id;
      schedulePersist();
      renderWorkspace?.();
    }

    function renameFolder(folderId) {
      if (!folderId) return;
      const nextName = window.prompt("フォルダ名", "") || "";
      if (!nextName.trim()) return;
      const current = getSystemConfig() || {};
      const folders = getAllFolders();
      setSystemConfig({
        ...current,
        assetFolders: {
          ...(current.assetFolders || {}),
          home: folders.map(folder =>
            folder.id === folderId ? { ...folder, name: nextName.trim().slice(0, 80) } : folder
          )
        }
      });
      schedulePersist();
      renderWorkspace?.();
    }

    function deleteFolder(folderId) {
      if (!folderId) return;
      const folders = getAllFolders();
      const nextFolders = folders.filter(folder => folder.id !== folderId);
      const current = getSystemConfig() || {};
      setSystemConfig({
        ...current,
        assetFolders: {
          ...(current.assetFolders || {}),
          home: nextFolders
        }
      });
      if (selectedFolderId === folderId) selectedFolderId = "";
      ensureSelectedFolder();
      schedulePersist();
      renderWorkspace?.();
    }

    function selectFolderFromWindow(group, folderId) {
      selectedSource = group === "default" ? "default" : group;
      selectedFolderId = folderId;
      renderWorkspace?.();
    }

    function handleSourceTabClick(event) {
      const button = event.target.closest("[data-home-edit-source]");
      if (!button) return;
      selectedSource = button.dataset.homeEditSource || "user";
      ensureSelectedFolder();
      renderWorkspace?.();
    }

    function handleFolderWindowClick(event) {
      const createButton = event.target.closest("[data-folder-group-create]");
      if (createButton) {
        createFolder(createButton.dataset.folderGroupCreate || "");
        return;
      }
      const renameButton = event.target.closest("[data-folder-rename]");
      if (renameButton) {
        renameFolder(renameButton.dataset.folderRename || "");
        return;
      }
      const deleteButton = event.target.closest("[data-folder-delete]");
      if (deleteButton) {
        deleteFolder(deleteButton.dataset.folderDelete || "");
        return;
      }
      const selectButton = event.target.closest("[data-folder-select]");
      if (selectButton) {
        selectFolderFromWindow(selectButton.dataset.folderGroup || "user", selectButton.dataset.folderSelect || "");
      }
    }

    async function handleUpload(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      const folder = getSelectedFolder();
      if (!folder || folder.kind !== "personal") {
        showToast?.("ユーザーフォルダを選ぶと画像を追加できます");
        event.target.value = "";
        return;
      }
      const src = await readFileAsDataUrl(file);
      upsertHomeLayoutAssetInConfig?.({
        id: `home-asset-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, ""),
        src,
        ownerMemberId: getCurrentLayoutOwnerId?.() || "local-editor",
        width: 160,
        height: 160,
        folderId: folder.id
      });
      schedulePersist();
      renderWorkspace?.();
      event.target.value = "";
    }

    function renderSourceTabs() {
      const host = document.getElementById("home-edit-source-tabs");
      if (!host) return;
      host.innerHTML = [
        ["user", "個人素材"],
        ["team", "チーム素材"],
        ["default", "デフォルト素材"]
      ].map(([key, label]) => `<button type="button" class="home-edit-source-tab${selectedSource === key ? " active" : ""}" data-home-edit-source="${key}">${label}</button>`).join("");
    }

    function renderFolderSelect() {
      const select = document.getElementById("home-edit-folder-select");
      const uploadWrap = document.getElementById("home-edit-upload-wrap");
      if (!select) return;
      const folders = getSourceFolders();
      ensureSelectedFolder();
      select.innerHTML = folders.length
        ? folders.map(folder => `<option value="${esc(folder.id)}">${esc(folder.name)}</option>`).join("")
        : `<option value="">フォルダがありません</option>`;
      select.value = selectedFolderId || "";
      if (uploadWrap) uploadWrap.hidden = !(selectedSource === "user" && getSelectedFolder()?.kind === "personal");
    }

    function renderAssetGrid() {
      const host = document.getElementById("home-edit-asset-grid");
      if (!host) return;
      const assets = getSelectedAssets();
      if (!assets.length) {
        host.innerHTML = `<p class="home-edit-empty">${esc(text("editor.emptyAssets", "素材がありません"))}</p>`;
        return;
      }
      host.innerHTML = assets.map(asset => `
        <button type="button" class="home-edit-asset-card" data-home-edit-asset="${esc(asset.assetKey)}">
          <span class="home-edit-asset-thumb"><img src="${esc(asset.src)}" alt="${esc(asset.name)}"></span>
          <span class="home-edit-asset-name">${esc(asset.name)}</span>
        </button>
      `).join("");
    }

    function renderFolderCards(group, folders, options) {
      if (!folders.length) return `<p class="home-edit-empty">${esc(text("editor.emptyFolders", "まだありません"))}</p>`;
      return folders.map(folder => {
        const assets = folder.kind === "builtin" ? (folder.assets || []) : (resolveHomeAssetFolderAssets?.(folder.id, getSystemConfig()) || []);
        const thumbs = assets.slice(0, 4).map(asset => `<span class="home-edit-folder-thumb" style="background-image:url('${String(asset.src || "").replace(/'/g, "\\'")}')"></span>`).join("");
        const activeClass = selectedFolderId === folder.id ? " active" : "";
        return `
          <article class="home-edit-folder-card${activeClass}">
            <button type="button" class="home-edit-folder-main" data-folder-select="${esc(folder.id)}" data-folder-group="${esc(group)}">
              <div class="home-edit-folder-main-top">
                <strong>${esc(folder.name)}</strong>
                <span>${group === "default" ? "標準" : group === "team" ? "共有" : "個人"}</span>
              </div>
              <div class="home-edit-folder-thumb-strip">${thumbs || '<span class="home-edit-folder-thumb is-empty"></span>'}</div>
            </button>
            <div class="home-edit-folder-actions">
              ${options.allowDelete ? `<button type="button" class="home-edit-icon-btn" data-folder-rename="${esc(folder.id)}" title="名前変更" aria-label="名前変更">✎</button>` : ""}
              ${options.allowDelete ? `<button type="button" class="home-edit-icon-btn danger" data-folder-delete="${esc(folder.id)}" title="削除" aria-label="削除">×</button>` : ""}
            </div>
          </article>
        `;
      }).join("");
    }

    function renderFolderSection(title, groupKey, folders, options) {
      return `
        <section class="home-edit-folder-section">
          <div class="home-edit-folder-section-head">
            <strong>${esc(title)}</strong>
            ${options.allowCreate ? `<button type="button" class="home-edit-icon-btn" data-folder-group-create="${esc(groupKey)}" title="追加" aria-label="追加">+</button>` : ""}
          </div>
          <div class="home-edit-folder-list">${renderFolderCards(groupKey, folders, options)}</div>
        </section>
      `;
    }

    function renderFolderWindow() {
      const host = document.getElementById("home-edit-folder-window-body");
      if (!host) return;
      host.innerHTML = [
        renderFolderSection("ユーザー", "user", getUserFolders(), { allowCreate: true, allowDelete: true }),
        renderFolderSection("チーム", "team", getTeamFolders(), { allowCreate: true, allowDelete: true }),
        renderFolderSection("デフォルト", "default", getDefaultFolders(), { allowCreate: false, allowDelete: false })
      ].join("");
    }

    return {
      getSelectedFolder,
      getSelectedAssets,
      ensureSelectedFolder,
      handleSourceTabClick,
      handleFolderWindowClick,
      handleUpload,
      renderSourceTabs,
      renderFolderSelect,
      renderAssetGrid,
      renderFolderWindow,
      setSelectedFolderId: value => { selectedFolderId = value; },
      getSelectedFolderId: () => selectedFolderId
    };
  }

  window.HomeWorkspaceAssetsLib = {
    create: createHomeWorkspaceAssetsController
  };
})();
