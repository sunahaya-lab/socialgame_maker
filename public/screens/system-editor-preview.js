(function () {
  function createSystemEditorPreviewController(deps) {
    const {
      getHomeLayoutDraft,
      setHomeLayoutDraft,
      buildHomeLayoutDraft,
      getSelectedHomeNodeId,
      setSelectedHomeNodeId,
      getHomeNodeMeta,
      renderFreePartsEditor,
      renderLayoutAssetSelection,
      readFileAsDataUrl,
      upsertHomeLayoutAsset
    } = deps;

    let previewDragState = null;

    function renderLayoutPresetPreview() {
      const preview = document.getElementById("system-home-layout-preview");
      const form = document.getElementById("system-form");
      if (!preview || !form || !window.SociaLayoutBridge || !window.LayoutRendererLib) return;

      const isAdvanced = (form.homeLayoutMode?.value || "preset") === "advanced";
      const currentDraft = getHomeLayoutDraft();
      if (!isAdvanced || !currentDraft) {
        setHomeLayoutDraft(buildHomeLayoutDraft());
      } else {
        setHomeLayoutDraft(window.LayoutSchemaLib.normalizeScreenLayout(currentDraft));
      }

      const runtime = window.SociaLayoutBridge.createRuntime({
        dispatchAction: () => {}
      });
      preview.innerHTML = "";
      window.LayoutRendererLib.renderLayout(preview, getHomeLayoutDraft(), runtime);
      highlightSelectedRole(preview);
      bindInteractivePreview(preview, isAdvanced);
    }

    function getEditableHomeNodes() {
      const meta = getHomeNodeMeta();
      return (getHomeLayoutDraft()?.nodes || []).filter(node => meta[node.id]);
    }

    function ensureHomeRoleSelection() {
      const select = document.getElementById("system-home-node-target");
      if (!select) return;

      const meta = getHomeNodeMeta();
      const editableNodes = getEditableHomeNodes();
      select.innerHTML = editableNodes.map(node =>
        `<option value="${node.id}">${meta[node.id].label}</option>`
      ).join("");

      const selectedHomeNodeId = getSelectedHomeNodeId();
      if (!selectedHomeNodeId || !editableNodes.some(node => node.id === selectedHomeNodeId)) {
        setSelectedHomeNodeId(editableNodes[0]?.id || "");
      }
      select.value = getSelectedHomeNodeId();
    }

    function renderAdvancedLayoutControls() {
      const form = document.getElementById("system-form");
      const panel = document.getElementById("system-home-advanced-panel");
      const kindEl = document.getElementById("system-home-node-kind");
      if (!form || !panel) return;

      const isAdvanced = (form.homeLayoutMode?.value || "preset") === "advanced";
      panel.hidden = !isAdvanced;
      if (!isAdvanced || !getHomeLayoutDraft()) return;

      ensureHomeRoleSelection();
      const selectedNode = getHomeLayoutDraft().nodes.find(node => node.id === getSelectedHomeNodeId());
      if (!selectedNode) return;

      if (kindEl) kindEl.textContent = getHomeNodeMeta()[selectedNode.id]?.kind || "-";
      form.homeNodeX.value = String(Math.round(selectedNode.x || 0));
      form.homeNodeY.value = String(Math.round(selectedNode.y || 0));
      form.homeNodeW.value = String(Math.round(selectedNode.w || 0));
      form.homeNodeH.value = String(Math.round(selectedNode.h || 0));
      form.homeNodeZ.value = String(Math.round(selectedNode.z || 0));
      form.homeNodeVisible.checked = selectedNode.visible !== false;
      if (form.homeNodeShowText) form.homeNodeShowText.checked = selectedNode.showText !== false;
      if (form.homeNodeAsset) form.homeNodeAsset.value = "";
    }

    function handlePresetOptionChange() {
      setHomeLayoutDraft(buildHomeLayoutDraft());
      ensureHomeRoleSelection();
      renderAdvancedLayoutControls();
      renderFreePartsEditor();
      renderLayoutPresetPreview();
    }

    function handleLayoutModeChange() {
      setHomeLayoutDraft(buildHomeLayoutDraft());
      ensureHomeRoleSelection();
      renderAdvancedLayoutControls();
      renderFreePartsEditor();
      renderLayoutPresetPreview();
    }

    function handleHomeNodeSelectionChange(event) {
      setSelectedHomeNodeId(event.target.value || "");
      renderAdvancedLayoutControls();
      renderLayoutAssetSelection?.();
      renderLayoutPresetPreview();
    }

    function bindInteractivePreview(preview, isAdvanced) {
      if (!preview) return;
      const meta = getHomeNodeMeta();
      preview.querySelectorAll(".layout-node").forEach(element => {
        const nodeId = element.dataset.nodeId || "";
        if (!isAdvanced || !meta[nodeId]) return;
        element.classList.add("is-layout-interactive");
        element.onpointerdown = event => beginPreviewNodeDrag(event, nodeId);
        if (!element.querySelector(".layout-node-resize-handle")) {
          const handle = document.createElement("button");
          handle.type = "button";
          handle.className = "layout-node-resize-handle";
          handle.onpointerdown = event => beginPreviewNodeResize(event, nodeId);
          element.appendChild(handle);
        }
      });
    }

    function beginPreviewNodeDrag(event, nodeId) {
      if (event.target.closest(".layout-node-resize-handle")) return;
      const node = getHomeLayoutDraft()?.nodes?.find(item => item.id === nodeId);
      if (!node) return;
      setSelectedHomeNodeId(nodeId);
      previewDragState = {
        mode: "move",
        nodeId,
        startX: event.clientX,
        startY: event.clientY,
        nodeX: Number(node.x) || 0,
        nodeY: Number(node.y) || 0
      };
      renderAdvancedLayoutControls();
      renderLayoutAssetSelection?.();
      window.addEventListener("pointermove", handlePreviewPointerMove);
      window.addEventListener("pointerup", endPreviewPointerInteraction, { once: true });
      event.preventDefault();
    }

    function beginPreviewNodeResize(event, nodeId) {
      const node = getHomeLayoutDraft()?.nodes?.find(item => item.id === nodeId);
      if (!node) return;
      setSelectedHomeNodeId(nodeId);
      previewDragState = {
        mode: "resize",
        nodeId,
        startX: event.clientX,
        startY: event.clientY,
        nodeW: Number(node.w) || 0,
        nodeH: Number(node.h) || 0
      };
      renderAdvancedLayoutControls();
      renderLayoutAssetSelection?.();
      window.addEventListener("pointermove", handlePreviewPointerMove);
      window.addEventListener("pointerup", endPreviewPointerInteraction, { once: true });
      event.preventDefault();
      event.stopPropagation();
    }

    function handlePreviewPointerMove(event) {
      if (!previewDragState || !getHomeLayoutDraft()) return;
      const draft = getHomeLayoutDraft();
      const node = draft.nodes.find(item => item.id === previewDragState.nodeId);
      if (!node) return;
      const deltaX = Math.round((event.clientX - previewDragState.startX) / 0.42);
      const deltaY = Math.round((event.clientY - previewDragState.startY) / 0.42);
      if (previewDragState.mode === "move") {
        node.x = previewDragState.nodeX + deltaX;
        node.y = previewDragState.nodeY + deltaY;
      } else {
        node.w = Math.max(24, previewDragState.nodeW + deltaX);
        node.h = Math.max(24, previewDragState.nodeH + deltaY);
      }
      renderAdvancedLayoutControls();
      renderLayoutPresetPreview();
    }

    function endPreviewPointerInteraction() {
      previewDragState = null;
      window.removeEventListener("pointermove", handlePreviewPointerMove);
    }

    function handleHomeNodeFieldInput() {
      const form = document.getElementById("system-form");
      const draft = getHomeLayoutDraft();
      if (!form || !draft) return;
      const selectedNode = draft.nodes.find(node => node.id === getSelectedHomeNodeId());
      if (!selectedNode) return;

      selectedNode.x = Number(form.homeNodeX?.value || 0);
      selectedNode.y = Number(form.homeNodeY?.value || 0);
      selectedNode.w = Math.max(0, Number(form.homeNodeW?.value || 0));
      selectedNode.h = Math.max(0, Number(form.homeNodeH?.value || 0));
      selectedNode.z = Number(form.homeNodeZ?.value || 0);
      selectedNode.visible = form.homeNodeVisible?.checked !== false;
      selectedNode.showText = form.homeNodeShowText?.checked !== false;

      renderLayoutPresetPreview();
    }

    async function handleHomeNodeAssetChange(event) {
      const file = event.target?.files?.[0];
      const draft = getHomeLayoutDraft();
      const selectedHomeNodeId = getSelectedHomeNodeId();
      if (!file || !draft || !selectedHomeNodeId || typeof readFileAsDataUrl !== "function") return;
      const selectedNode = draft.nodes.find(node => node.id === selectedHomeNodeId);
      if (!selectedNode) return;
      const src = await readFileAsDataUrl(file);
      const assetId = upsertHomeLayoutAsset(selectedHomeNodeId, src);
      selectedNode.assetId = assetId ? `asset:${assetId}` : "";
      renderFreePartsEditor();
      renderLayoutAssetSelection?.();
      renderLayoutPresetPreview();
    }

    function handleHomeNodeAssetClear() {
      const draft = getHomeLayoutDraft();
      const selectedHomeNodeId = getSelectedHomeNodeId();
      if (!draft || !selectedHomeNodeId) return;
      const selectedNode = draft.nodes.find(node => node.id === selectedHomeNodeId);
      if (!selectedNode) return;
      selectedNode.assetId = "";
      renderFreePartsEditor();
      renderLayoutAssetSelection?.();
      renderLayoutPresetPreview();
    }

    function highlightSelectedRole(preview) {
      const selectedHomeNodeId = getSelectedHomeNodeId();
      if (!preview || !selectedHomeNodeId) return;
      preview.querySelectorAll(".layout-node").forEach(node => node.classList.remove("layout-node-selected"));
      preview.querySelector(`.layout-node[data-node-id="${selectedHomeNodeId}"]`)?.classList.add("layout-node-selected");
    }

    return {
      renderLayoutPresetPreview,
      ensureHomeRoleSelection,
      renderAdvancedLayoutControls,
      handlePresetOptionChange,
      handleLayoutModeChange,
      handleHomeNodeSelectionChange,
      handleHomeNodeFieldInput,
      handleHomeNodeAssetChange,
      handleHomeNodeAssetClear
    };
  }

  window.SystemEditorPreviewLib = {
    create: createSystemEditorPreviewController
  };
})();
