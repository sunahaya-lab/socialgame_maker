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
      getSelectedCustomPartId,
      setSelectedCustomPartId,
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
          folderId: selectedFolder?.kind !== "shared" ? selectedFolder.id : "",
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
        id: `home-team-${Date.now()}`,
        name: `共有フォルダ ${folders.filter(folder => folder.kind === "shared").length + 1}`,
        ownerMemberId: null,
        kind: "team_owned",
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
        const canEditAsset = selectedFolder?.kind === "personal" || selectedFolder?.kind === "team_owned";
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

    function addFreeHomePart() {
      const assets = getAssetsForSelectedHomeFolder();
      const firstAsset = assets[0]?.id ? `asset:${assets[0].id}` : "";
      const scaleX = (Number(window.LayoutSchemaLib?.CANVAS_WIDTH) || 1080) / 480;
      const scaleY = (Number(window.LayoutSchemaLib?.CANVAS_HEIGHT) || 1920) / 853;
      const nextPart = {
        id: `custom-home-part-${Date.now()}`,
        assetId: firstAsset,
        x: Math.round(120 * scaleX),
        y: Math.round(120 * scaleY),
        w: Math.round(120 * scaleX),
        h: Math.round(120 * scaleY),
        z: 60,
        visible: true
      };
      setHomeCustomPartsDraft([...(getHomeCustomPartsDraft() || []), nextPart]);
      setSelectedCustomPartId(nextPart.id);
      renderFreePartsEditor();
      renderLayoutPresetPreview();
    }

    function renderFreePartsEditor() {
      const container = document.getElementById("system-home-free-parts");
      if (!container) return;
      const assets = getAssetsForSelectedHomeFolder();
      const selectedCustomPartId = getSelectedCustomPartId();
      const homeCustomPartsDraft = getHomeCustomPartsDraft();
      const assetOptions = assets.map(asset =>
        `<option value="asset:${asset.id}">${escapeHtml(asset.name || asset.id)}</option>`
      ).join("");

      if (homeCustomPartsDraft.length === 0) {
        container.innerHTML = `<p class="layout-asset-library-empty">${escapeHtml(text("editor.emptyFreeParts", "フリーパーツはまだありません"))}</p>`;
        return;
      }

      container.innerHTML = homeCustomPartsDraft.map(part => `
        <article class="layout-free-part-card${part.id === selectedCustomPartId ? " is-active" : ""}" data-free-part-card="${part.id}">
          <div class="layout-free-part-head">
            <strong>${escapeHtml(part.id)}</strong>
            <button type="button" class="btn-secondary" data-free-part-delete="${part.id}">削除</button>
          </div>
          <label>
            アセット
            <select data-free-part-asset="${part.id}">
              <option value="">アセットを選択</option>
              ${assetOptions}
            </select>
          </label>
          <div class="layout-advanced-grid">
            <label>X <input type="number" value="${Math.round(part.x)}" data-free-part-field="${part.id}" data-field="x"></label>
            <label>Y <input type="number" value="${Math.round(part.y)}" data-free-part-field="${part.id}" data-field="y"></label>
            <label>W <input type="number" value="${Math.round(part.w)}" data-free-part-field="${part.id}" data-field="w"></label>
            <label>H <input type="number" value="${Math.round(part.h)}" data-free-part-field="${part.id}" data-field="h"></label>
            <label>奥行き <input type="number" value="${Math.round(part.z)}" data-free-part-field="${part.id}" data-field="z"></label>
          </div>
          <label class="layout-advanced-visibility">
            <input type="checkbox" data-free-part-visible="${part.id}" ${part.visible !== false ? "checked" : ""}>
            表示
          </label>
        </article>
      `).join("");

      container.querySelectorAll("[data-free-part-card]").forEach(card => {
        card.addEventListener("click", () => {
          setSelectedCustomPartId(card.dataset.freePartCard || "");
          renderFreePartsEditor();
          renderLayoutPresetPreview();
        });
      });
      container.querySelectorAll("[data-free-part-delete]").forEach(button => {
        button.addEventListener("click", event => {
          event.stopPropagation();
          deleteFreeHomePart(button.dataset.freePartDelete);
        });
      });
      container.querySelectorAll("[data-free-part-asset]").forEach(select => {
        const id = select.dataset.freePartAsset;
        const part = homeCustomPartsDraft.find(item => item.id === id);
        if (part) select.value = part.assetId || "";
        select.addEventListener("change", event => updateFreeHomePart(id, { assetId: event.target.value || "" }));
      });
      container.querySelectorAll("[data-free-part-field]").forEach(input => {
        input.addEventListener("input", event => {
          const id = input.dataset.freePartField;
          const field = input.dataset.field;
          updateFreeHomePart(id, { [field]: Number(event.target.value || 0) });
        });
      });
      container.querySelectorAll("[data-free-part-visible]").forEach(input => {
        input.addEventListener("change", () => updateFreeHomePart(input.dataset.freePartVisible, { visible: input.checked }));
      });
    }

    function updateFreeHomePart(id, patch) {
      setHomeCustomPartsDraft((getHomeCustomPartsDraft() || []).map(part => {
        if (part.id !== id) return part;
        return {
          ...part,
          ...patch,
          w: Math.max(0, Number((patch.w ?? part.w) || 0)),
          h: Math.max(0, Number((patch.h ?? part.h) || 0))
        };
      }));
      setSelectedCustomPartId(id || getSelectedCustomPartId());
      renderFreePartsEditor();
      renderLayoutPresetPreview();
    }

    function deleteFreeHomePart(id) {
      const nextParts = (getHomeCustomPartsDraft() || []).filter(part => part.id !== id);
      setHomeCustomPartsDraft(nextParts);
      if (getSelectedCustomPartId() === id) {
        setSelectedCustomPartId(nextParts[0]?.id || "");
      }
      renderFreePartsEditor();
      renderLayoutPresetPreview();
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
      renameLibraryAsset,
      addFreeHomePart,
      renderFreePartsEditor,
      updateFreeHomePart,
      deleteFreeHomePart
    };
  }

  window.SystemEditorAssetsLib = {
    create: createSystemEditorAssetsController
  };
})();
