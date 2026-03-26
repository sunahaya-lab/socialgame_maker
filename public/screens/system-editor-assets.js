(function () {
  function createSystemEditorAssetsController(deps) {
    const {
      getSystemConfig,
      setSystemConfig,
      getHomeLayoutDraft,
      getSelectedHomeNodeId,
      getSelectedHomeFolderId,
      setSelectedHomeFolderId,
      getHomeCustomPartsDraft,
      setHomeCustomPartsDraft,
      renderFreePartsEditor,
      renderLayoutPresetPreview,
      escapeHtml,
      text
    } = deps;

    function upsertHomeLayoutAsset(roleId, src) {
      const current = getSystemConfig();
      const helper = window.SociaLayoutBridge?.upsertHomeLayoutAssetInConfig;
      const selectedFolder = getSelectedHomeFolder();
      if (typeof helper === "function") {
        const result = helper(current, {
          id: `home-${roleId}`,
          name: `${roleId} part`,
          src,
          folderId: selectedFolder?.kind === "personal" ? selectedFolder.id : "",
          ownerMemberId: selectedFolder?.kind === "personal" ? selectedFolder.ownerMemberId : undefined
        });
        if (result?.config) setSystemConfig(result.config);
        if (result?.folderId) setSelectedHomeFolderId(result.folderId);
        renderHomeFolderManager();
        return result?.asset?.id || "";
      }
      return "";
    }

    function getHomeFolders() {
      const helper = window.SociaLayoutBridge?.getHomeAssetFolders;
      return typeof helper === "function" ? helper(getSystemConfig()) : [];
    }

    function ensureHomeFolderSelection() {
      const folders = getHomeFolders();
      const selectedHomeFolderId = getSelectedHomeFolderId();
      if (!selectedHomeFolderId || !folders.some(folder => folder.id === selectedHomeFolderId)) {
        setSelectedHomeFolderId(folders[0]?.id || "");
      }
    }

    function getSelectedHomeFolder() {
      ensureHomeFolderSelection();
      const selectedHomeFolderId = getSelectedHomeFolderId();
      return getHomeFolders().find(folder => folder.id === selectedHomeFolderId) || null;
    }

    function getAssetsForSelectedHomeFolder() {
      const helper = window.SociaLayoutBridge?.resolveHomeAssetFolderAssets;
      const folder = getSelectedHomeFolder();
      return folder && typeof helper === "function" ? helper(folder.id, getSystemConfig()) : [];
    }

    function handleHomeFolderSelectionChange(event) {
      setSelectedHomeFolderId(event.target.value || "");
      renderHomeFolderManager();
      renderHomeAssetLibrary();
    }

    function renderHomeFolderManager() {
      const select = document.getElementById("system-home-folder-select");
      const editor = document.getElementById("system-home-folder-editor");
      if (!select || !editor) return;

      const folders = getHomeFolders();
      ensureHomeFolderSelection();
      const selectedFolder = getSelectedHomeFolder();
      select.innerHTML = folders.map(folder => `
        <option value="${folder.id}">${escapeHtml(folder.name)} (${folder.kind === "shared" ? "共有" : "個人"})</option>
      `).join("");
      select.value = getSelectedHomeFolderId();

      if (!selectedFolder) {
        editor.innerHTML = `<p class="layout-asset-library-empty">${escapeHtml(text("editor.emptySelectedFolder", "フォルダが選択されていません"))}</p>`;
        return;
      }

      editor.innerHTML = `
        <label class="layout-folder-name">
          フォルダ名
          <input type="text" id="system-home-folder-name" value="${escapeHtml(selectedFolder.name)}">
        </label>
        <p class="layout-folder-meta">
          ${selectedFolder.kind === "shared"
            ? "このフォルダには選択したメンバーのフォルダ内アセットが表示されます"
            : `このフォルダ内のアセット数: ${selectedFolder.assetIds?.length || 0}`}
        </p>
        ${selectedFolder.kind === "shared"
          ? `<div class="layout-folder-source-list" id="system-home-folder-sources"></div>`
          : ""}
        <div class="layout-folder-actions-inline">
          <button type="button" class="btn-secondary" id="system-home-delete-folder">フォルダを削除</button>
        </div>
      `;

      document.getElementById("system-home-folder-name")?.addEventListener("change", event => {
        renameHomeFolder(selectedFolder.id, event.target.value);
      });
      document.getElementById("system-home-delete-folder")?.addEventListener("click", () => {
        deleteHomeFolder(selectedFolder.id);
      });

      if (selectedFolder.kind === "shared") {
        renderSharedHomeFolderSources(selectedFolder);
      }
    }

    function renderSharedHomeFolderSources(folder) {
      const container = document.getElementById("system-home-folder-sources");
      if (!container) return;
      const personalFolders = getHomeFolders().filter(item => item.kind === "personal");
      if (personalFolders.length === 0) {
        container.innerHTML = `<p class="layout-asset-library-empty">${escapeHtml(text("editor.emptyPersonalFolders", "個人フォルダはまだありません"))}</p>`;
        return;
      }
      container.innerHTML = personalFolders.map(sourceFolder => {
        const checked = (folder.sourceRefs || []).some(ref =>
          ref.memberId === sourceFolder.ownerMemberId && ref.folderId === sourceFolder.id
        );
        return `
          <label class="layout-folder-source-item">
            <input
              type="checkbox"
              data-home-shared-source="${sourceFolder.id}"
              data-home-shared-member="${sourceFolder.ownerMemberId || ""}"
              ${checked ? "checked" : ""}
            >
            <span>${escapeHtml(sourceFolder.name)}</span>
            <small>${escapeHtml(sourceFolder.ownerMemberId || "")}</small>
          </label>
        `;
      }).join("");
      container.querySelectorAll("[data-home-shared-source]").forEach(input => {
        input.addEventListener("change", () => {
          toggleSharedHomeFolderSource(
            folder.id,
            input.dataset.homeSharedMember || "",
            input.dataset.homeSharedSource || "",
            input.checked
          );
        });
      });
    }

    function createPersonalHomeFolder() {
      const current = getSystemConfig();
      const folders = getHomeFolders();
      const ownerId = window.SociaLayoutBridge?.getCurrentLayoutOwnerId?.() || "local-editor";
      const nextFolder = {
        id: `home-personal-${Date.now()}`,
        name: `マイフォルダ ${folders.filter(folder => folder.kind === "personal").length + 1}`,
        ownerMemberId: ownerId,
        kind: "personal",
        assetIds: [],
        sourceRefs: [],
        sortOrder: folders.length
      };
      setSystemConfig({
        ...current,
        assetFolders: {
          ...(current?.assetFolders || {}),
          home: [...folders, nextFolder]
        }
      });
      setSelectedHomeFolderId(nextFolder.id);
      renderHomeFolderManager();
      renderHomeAssetLibrary();
    }

    function createSharedHomeFolder() {
      const current = getSystemConfig();
      const folders = getHomeFolders();
      const nextFolder = {
        id: `home-shared-${Date.now()}`,
        name: `共有フォルダ ${folders.filter(folder => folder.kind === "shared").length + 1}`,
        ownerMemberId: null,
        kind: "shared",
        assetIds: [],
        sourceRefs: [],
        sortOrder: folders.length
      };
      setSystemConfig({
        ...current,
        assetFolders: {
          ...(current?.assetFolders || {}),
          home: [...folders, nextFolder]
        }
      });
      setSelectedHomeFolderId(nextFolder.id);
      renderHomeFolderManager();
      renderHomeAssetLibrary();
    }

    function renameHomeFolder(folderId, nextName) {
      if (!folderId) return;
      const current = getSystemConfig();
      setSystemConfig({
        ...current,
        assetFolders: {
          ...(current?.assetFolders || {}),
          home: getHomeFolders().map(folder =>
            folder.id === folderId
              ? { ...folder, name: String(nextName || "").trim().slice(0, 80) || folder.name }
              : folder
          )
        }
      });
      renderHomeFolderManager();
      renderHomeAssetLibrary();
    }

    function deleteHomeFolder(folderId) {
      if (!folderId) return;
      const current = getSystemConfig();
      const currentFolders = getHomeFolders();
      const nextFolders = currentFolders.filter(folder => folder.id !== folderId);
      if (nextFolders.length === 0) return;
      setSystemConfig({
        ...current,
        assetFolders: {
          ...(current?.assetFolders || {}),
          home: nextFolders
        }
      });
      setSelectedHomeFolderId(nextFolders[0]?.id || "");
      renderHomeFolderManager();
      renderHomeAssetLibrary();
    }

    function toggleSharedHomeFolderSource(folderId, memberId, sourceFolderId, checked) {
      if (!folderId || !memberId || !sourceFolderId) return;
      const current = getSystemConfig();
      const nextFolders = getHomeFolders().map(folder => {
        if (folder.id !== folderId || folder.kind !== "shared") return folder;
        const sourceKey = `${memberId}:${sourceFolderId}`;
        const nextSourceMap = new Map((folder.sourceRefs || []).map(ref => [`${ref.memberId}:${ref.folderId}`, ref]));
        if (checked) nextSourceMap.set(sourceKey, { memberId, folderId: sourceFolderId });
        else nextSourceMap.delete(sourceKey);
        return {
          ...folder,
          sourceRefs: Array.from(nextSourceMap.values())
        };
      });
      setSystemConfig({
        ...current,
        assetFolders: {
          ...(current?.assetFolders || {}),
          home: nextFolders
        }
      });
      renderHomeFolderManager();
      renderHomeAssetLibrary();
    }

    function renderHomeAssetLibrary() {
      const container = document.getElementById("system-home-asset-library");
      if (!container) return;
      const selectedFolder = getSelectedHomeFolder();
      const homeAssets = getAssetsForSelectedHomeFolder();
      if (homeAssets.length === 0) {
        container.innerHTML = `<p class="layout-asset-library-empty">${escapeHtml(text("editor.emptyUploadedAssets", "アップロード済みアセットはまだありません"))}</p>`;
        return;
      }

      const selectedNode = getHomeLayoutDraft()?.nodes?.find(node => node.id === getSelectedHomeNodeId());
      container.innerHTML = homeAssets.map(asset => {
        const safeName = escapeHtml(asset.name || asset.id);
        const isActive = selectedNode?.assetId === `asset:${asset.id}`;
        const canEditAsset = selectedFolder?.kind === "personal";
        return `
          <article class="layout-asset-card${isActive ? " is-active" : ""}">
            <div class="layout-asset-thumb" style="background-image:url('${String(asset.src || "").replace(/'/g, "\\'")}')"></div>
            <div class="layout-asset-meta">
              <span>${escapeHtml(asset.ownerMemberId || "共有")}</span>
              <span>${escapeHtml(selectedFolder?.kind === "shared" ? "共有" : "個人")}</span>
            </div>
            <label class="layout-asset-name">
              <span>名前</span>
              <input type="text" value="${safeName}" data-asset-rename="${asset.id}" ${canEditAsset ? "" : "disabled"}>
            </label>
            <div class="layout-asset-actions">
              <button type="button" class="btn-secondary" data-asset-apply="${asset.id}">役割に適用</button>
              ${canEditAsset ? `<button type="button" class="btn-secondary" data-asset-delete="${asset.id}">削除</button>` : ""}
            </div>
          </article>
        `;
      }).join("");

      container.querySelectorAll("[data-asset-apply]").forEach(button => {
        button.addEventListener("click", () => applyLibraryAssetToRole(button.dataset.assetApply));
      });
      container.querySelectorAll("[data-asset-delete]").forEach(button => {
        button.addEventListener("click", () => deleteLibraryAsset(button.dataset.assetDelete));
      });
      container.querySelectorAll("[data-asset-rename]").forEach(input => {
        input.addEventListener("change", () => renameLibraryAsset(input.dataset.assetRename, input.value));
      });
    }

    function applyLibraryAssetToRole(assetId) {
      if (!assetId) return;
      const draft = getHomeLayoutDraft();
      const selectedHomeNodeId = getSelectedHomeNodeId();
      if (!draft || !selectedHomeNodeId) return;
      const selectedNode = draft.nodes.find(node => node.id === selectedHomeNodeId);
      if (!selectedNode) return;
      selectedNode.assetId = `asset:${assetId}`;
      renderHomeAssetLibrary();
      renderLayoutPresetPreview();
    }

    function deleteLibraryAsset(assetId) {
      if (!assetId) return;
      const current = getSystemConfig();
      const nextAssets = (Array.isArray(current?.layoutAssets?.home) ? current.layoutAssets.home : []).filter(asset => asset.id !== assetId);
      const nextFolders = (Array.isArray(current?.assetFolders?.home) ? current.assetFolders.home : []).map(folder => ({
        ...folder,
        assetIds: Array.isArray(folder?.assetIds) ? folder.assetIds.filter(id => id !== assetId) : []
      }));
      setSystemConfig({
        ...current,
        layoutAssets: {
          ...(current?.layoutAssets || {}),
          home: nextAssets
        },
        assetFolders: {
          ...(current?.assetFolders || {}),
          home: nextFolders
        }
      });
      const draft = getHomeLayoutDraft();
      if (draft?.nodes?.length) {
        draft.nodes.forEach(node => {
          if (node.assetId === `asset:${assetId}`) node.assetId = "";
        });
      }
      setHomeCustomPartsDraft(
        getHomeCustomPartsDraft().map(part =>
          part.assetId === `asset:${assetId}` ? { ...part, assetId: "" } : part
        )
      );
      renderHomeAssetLibrary();
      renderFreePartsEditor();
      renderLayoutPresetPreview();
    }

    function renameLibraryAsset(assetId, nextName) {
      if (!assetId) return;
      const current = getSystemConfig();
      const nextAssets = (Array.isArray(current?.layoutAssets?.home) ? current.layoutAssets.home : []).map(asset =>
        asset.id === assetId
          ? { ...asset, name: String(nextName || "").trim().slice(0, 80) || asset.id }
          : asset
      );
      setSystemConfig({
        ...current,
        layoutAssets: {
          ...(current?.layoutAssets || {}),
          home: nextAssets
        }
      });
      renderHomeAssetLibrary();
      renderFreePartsEditor();
    }

    return {
      upsertHomeLayoutAsset,
      getHomeFolders,
      ensureHomeFolderSelection,
      getSelectedHomeFolder,
      getAssetsForSelectedHomeFolder,
      handleHomeFolderSelectionChange,
      renderHomeFolderManager,
      createPersonalHomeFolder,
      createSharedHomeFolder,
      renameHomeFolder,
      deleteHomeFolder,
      renderHomeAssetLibrary,
      applyLibraryAssetToRole,
      deleteLibraryAsset,
      renameLibraryAsset
    };
  }

  window.SystemEditorAssetsLib = {
    create: createSystemEditorAssetsController
  };
})();
