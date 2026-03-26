(function () {
  function createHomeWorkspacePartsController(deps) {
    const {
      getCustomParts,
      setCustomParts,
      getSelectedAssets,
      esc,
      clampNumber,
      text,
      roleOptions,
      renderWorkspace
    } = deps;

    let selectedPartId = "";

    function getSelectedPart() {
      return getCustomParts().find(part => part.id === selectedPartId) || null;
    }

    function setSelectedPartId(value) {
      selectedPartId = value || "";
    }

    function addEmptyPart() {
      const nextPart = {
        id: `home-part-${Date.now()}`,
        name: "新しいパーツ",
        role: "decorative",
        x: 120,
        y: 120,
        w: 120,
        h: 120,
        z: 50,
        visible: true,
        assetId: ""
      };
      setSelectedPartId(nextPart.id);
      setCustomParts([...getCustomParts(), nextPart]);
      renderWorkspace?.();
    }

    function addPartFromAsset(asset) {
      const nextPart = {
        id: `home-part-${Date.now()}`,
        name: asset.name || "素材",
        role: "decorative",
        x: 120,
        y: 120,
        w: clampNumber(asset.width, 32, 160),
        h: clampNumber(asset.height, 32, 96),
        z: 50,
        visible: true,
        assetId: asset.type === "builtin" ? asset.id : `asset:${asset.id}`
      };
      setSelectedPartId(nextPart.id);
      setCustomParts([...getCustomParts(), nextPart]);
      renderWorkspace?.();
    }

    function removePart(partId) {
      if (!partId) return;
      setCustomParts(getCustomParts().filter(part => part.id !== partId));
      if (selectedPartId === partId) setSelectedPartId("");
      renderWorkspace?.();
    }

    function handleAssetGridClick(event) {
      const button = event.target.closest("[data-home-edit-asset]");
      if (!button) return;
      const asset = getSelectedAssets().find(item => item.assetKey === button.dataset.homeEditAsset);
      if (!asset) return;
      addPartFromAsset(asset);
    }

    function handlePartListClick(event) {
      const selectButton = event.target.closest("[data-home-edit-part-select]");
      if (selectButton) {
        setSelectedPartId(selectButton.dataset.homeEditPartSelect || "");
        renderWorkspace?.();
        return;
      }
      const deleteButton = event.target.closest("[data-home-edit-part-delete]");
      if (!deleteButton) return;
      removePart(deleteButton.dataset.homeEditPartDelete || "");
    }

    function handlePropsInput(event) {
      const prop = event.target?.dataset?.homeEditProp;
      const part = getSelectedPart();
      if (!prop || !part) return;
      const nextParts = getCustomParts().map(item => {
        if (item.id !== part.id) return item;
        if (prop === "visible") return { ...item, visible: Boolean(event.target.checked) };
        if (prop === "role") return { ...item, role: String(event.target.value || "decorative") };
        if (prop === "name") return { ...item, name: String(event.target.value || "").slice(0, 80) };
        return { ...item, [prop]: clampNumber(event.target.value, 0, Number(item[prop]) || 0) };
      });
      setCustomParts(nextParts);
      renderWorkspace?.();
    }

    function renderPartList() {
      const host = document.getElementById("home-edit-part-list");
      if (!host) return;
      const parts = getCustomParts();
      if (!parts.length) {
        host.innerHTML = `<p class="home-edit-empty">${esc(text("editor.emptyParts", "まだ配置していません"))}</p>`;
        return;
      }
      host.innerHTML = parts.map(part => `
        <article class="home-edit-part-card${selectedPartId === part.id ? " active" : ""}">
          <button type="button" class="home-edit-part-main" data-home-edit-part-select="${esc(part.id)}">
            <strong>${esc(part.name || part.id)}</strong>
            <span>${esc(roleOptions.find(option => option.value === part.role)?.label || "装飾")} / z:${Number(part.z) || 0}</span>
          </button>
          <button type="button" class="home-edit-part-delete" data-home-edit-part-delete="${esc(part.id)}">削除</button>
        </article>
      `).join("");
    }

    function renderProps() {
      const host = document.getElementById("home-edit-props");
      if (!host) return;
      const part = getSelectedPart();
      if (!part) {
        host.innerHTML = `<p class="home-edit-empty">${esc(text("editor.emptyProperties", "配置済みパーツを選ぶと属性を編集できます"))}</p>`;
        return;
      }
      host.innerHTML = `
        <label class="home-edit-field"><span>名前</span><input type="text" value="${esc(part.name || "")}" data-home-edit-prop="name"></label>
        <label class="home-edit-field">
          <span>役割</span>
          <select data-home-edit-prop="role">
            ${roleOptions.map(option => `<option value="${esc(option.value)}"${part.role === option.value ? " selected" : ""}>${esc(option.label)}</option>`).join("")}
          </select>
        </label>
        <div class="home-edit-grid-2">
          <label class="home-edit-field"><span>X</span><input type="number" value="${Number(part.x) || 0}" data-home-edit-prop="x"></label>
          <label class="home-edit-field"><span>Y</span><input type="number" value="${Number(part.y) || 0}" data-home-edit-prop="y"></label>
          <label class="home-edit-field"><span>W</span><input type="number" value="${Number(part.w) || 0}" data-home-edit-prop="w"></label>
          <label class="home-edit-field"><span>H</span><input type="number" value="${Number(part.h) || 0}" data-home-edit-prop="h"></label>
          <label class="home-edit-field"><span>Z</span><input type="number" value="${Number(part.z) || 0}" data-home-edit-prop="z"></label>
          <label class="home-edit-check"><input type="checkbox" ${part.visible !== false ? "checked" : ""} data-home-edit-prop="visible"><span>表示する</span></label>
        </div>
      `;
    }

    return {
      getSelectedPart,
      setSelectedPartId,
      handleAssetGridClick,
      handlePartListClick,
      addEmptyPart,
      handlePropsInput,
      renderPartList,
      renderProps
    };
  }

  window.HomeWorkspacePartsLib = {
    create: createHomeWorkspacePartsController
  };
})();
