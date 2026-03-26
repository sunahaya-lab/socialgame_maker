(function () {
  function setupEquipmentCardEditor(deps) {
    const api = createEquipmentCardEditor(deps);
    api.ensureEquipmentCardPanel();
    return api;
  }

  function createEquipmentCardEditor(deps) {
    const {
      getEquipmentCards,
      setEquipmentCards,
      getEditState,
      getApi,
      getSystemApi,
      readFileAsDataUrl,
      saveLocal,
      postJSON,
      showToast,
      esc
    } = deps;

    function ensureEquipmentCardPanel() {
      const panel = document.getElementById("editor-equipment-card");
      if (!panel || document.getElementById("equipment-card-form")) return;
      panel.innerHTML = `
        <p class="editor-desc">\u88c5\u5099\u30ab\u30fc\u30c9\u3092\u767b\u9332\u3057\u307e\u3059 \u30ad\u30e3\u30e9\u30ab\u30fc\u30c9\u3068\u306f\u5225\u4fdd\u5b58\u3067\u3059</p>

        <form id="equipment-card-form" class="editor-form">
          <label>
            \u88c5\u5099\u540d
            <input name="name" type="text" maxlength="40" placeholder="\u84bc\u5149\u306e\u5263" required>
          </label>
          <label>
            \u8aac\u660e
            <input name="description" type="text" maxlength="120" placeholder="\u30a4\u30d9\u30f3\u30c8\u914d\u5e03\u306eSSR\u88c5\u5099">
          </label>
          <label>
            \u30ec\u30a2\u30ea\u30c6\u30a3
            <select name="rarity" id="equipment-card-rarity-select"></select>
          </label>
          <label>
            \u88c5\u5099\u7a2e\u5225
            <select name="slotType">
              <option value="weapon">\u6b66\u5668</option>
              <option value="armor">\u9632\u5177</option>
              <option value="accessory">\u30a2\u30af\u30bb\u30b5\u30ea</option>
              <option value="other">\u305d\u306e\u4ed6</option>
            </select>
          </label>
          <label>
            \u30ad\u30e3\u30c3\u30c1
            <input name="catch" type="text" maxlength="120" placeholder="\u4f1a\u5fc3\u7387\u30a2\u30c3\u30d7">
          </label>
          <label class="upload-field">
            \u88c5\u5099\u753b\u50cf
            <input name="image" type="file" accept="image/*">
          </label>
          <div class="editor-preview" id="equipment-card-preview" hidden>
            <img id="equipment-card-preview-img" alt="\u88c5\u5099\u30ab\u30fc\u30c9\u30d7\u30ec\u30d3\u30e5\u30fc">
          </div>
          <label>
            \u30d1\u30c3\u30b7\u30d6\u52b9\u679c
            <textarea name="passiveText" rows="2" maxlength="200" placeholder="\u88c5\u5099\u4e2d \u653b\u6483\u529b\u3092\u4e0a\u3052\u308b"></textarea>
          </label>
          <label>
            \u30a2\u30af\u30c6\u30a3\u30d6\u540d
            <input name="activeSkillName" type="text" maxlength="60" placeholder="\u30d6\u30ec\u30a4\u30d6\u30b9\u30e9\u30c3\u30b7\u30e5">
          </label>
          <label>
            \u30a2\u30af\u30c6\u30a3\u30d6\u52b9\u679c
            <textarea name="activeSkillText" rows="2" maxlength="200" placeholder="\u6575\u5358\u4f53\u306b\u5927\u30c0\u30e1\u30fc\u30b8"></textarea>
          </label>
          <button type="submit" class="btn-primary">\u88c5\u5099\u30ab\u30fc\u30c9\u3092\u4fdd\u5b58</button>
        </form>

        <div class="editor-list-section">
          <h4>\u767b\u9332\u6e08\u307f\u88c5\u5099\u30ab\u30fc\u30c9</h4>
          <div id="equipment-card-list" class="editor-record-list"></div>
        </div>
      `;

      panel.querySelector("#equipment-card-form")?.addEventListener("submit", handleEquipmentCardSubmit);
      panel.querySelector("#equipment-card-form input[name='image']")?.addEventListener("change", handleEquipmentImageChange);
      renderEquipmentRarityOptions();
      renderEquipmentCardList();
    }

    async function handleEquipmentCardSubmit(event) {
      event.preventDefault();
      const form = event.target;
      const equipmentCards = getEquipmentCards();
      const existing = getEditState().equipmentCardId
        ? equipmentCards.find(item => item.id === getEditState().equipmentCardId)
        : null;
      const imageFile = form.image.files?.[0];
      const image = imageFile ? await readFileAsDataUrl(imageFile) : (existing?.image || "");
      const equipmentCard = {
        id: getEditState().equipmentCardId || crypto.randomUUID(),
        name: form.name.value.trim(),
        description: form.description.value.trim(),
        rarity: form.rarity.value || "SR",
        slotType: form.slotType.value || "other",
        image,
        catch: form.catch.value.trim(),
        passiveText: form.passiveText.value.trim(),
        activeSkillName: form.activeSkillName.value.trim(),
        activeSkillText: form.activeSkillText.value.trim(),
        sortOrder: existing?.sortOrder || equipmentCards.length
      };
      const next = existing
        ? equipmentCards.map(item => item.id === equipmentCard.id ? equipmentCard : item)
        : [...equipmentCards, equipmentCard];
      setEquipmentCards(next);
      saveLocal("socia-equipment-cards", next);
      try {
        await postJSON(getApi().equipmentCards, equipmentCard);
      } catch (error) {
        console.error("Failed to save equipment card:", error);
        showToast("\u88c5\u5099\u30ab\u30fc\u30c9\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
      }
      resetEquipmentCardForm();
      renderEquipmentCardList();
      showToast(`${equipmentCard.name}\u3092${existing ? "\u66f4\u65b0" : "\u767b\u9332"}\u3057\u307e\u3057\u305f`);
    }

    async function handleEquipmentImageChange(event) {
      const file = event.target.files?.[0];
      const preview = document.getElementById("equipment-card-preview");
      const image = document.getElementById("equipment-card-preview-img");
      if (!preview || !image) return;
      if (!file) {
        preview.hidden = true;
        image.removeAttribute("src");
        return;
      }
      image.src = await readFileAsDataUrl(file);
      preview.hidden = false;
    }

    function beginEquipmentCardEdit(id) {
      const equipmentCard = getEquipmentCards().find(item => item.id === id);
      if (!equipmentCard) return;
      const form = document.getElementById("equipment-card-form");
      if (!form) return;
      getEditState().equipmentCardId = id;
      form.name.value = equipmentCard.name || "";
      form.description.value = equipmentCard.description || "";
      form.rarity.value = equipmentCard.rarity || "SR";
      form.slotType.value = equipmentCard.slotType || "other";
      form.catch.value = equipmentCard.catch || "";
      form.passiveText.value = equipmentCard.passiveText || "";
      form.activeSkillName.value = equipmentCard.activeSkillName || "";
      form.activeSkillText.value = equipmentCard.activeSkillText || "";
      const preview = document.getElementById("equipment-card-preview");
      const image = document.getElementById("equipment-card-preview-img");
      if (preview && image && equipmentCard.image) {
        image.src = equipmentCard.image;
        preview.hidden = false;
      }
      updateSubmitLabel(true);
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function resetEquipmentCardForm() {
      const form = document.getElementById("equipment-card-form");
      if (!form) return;
      getEditState().equipmentCardId = null;
      form.reset();
      renderEquipmentRarityOptions("SR");
      form.slotType.value = "weapon";
      const preview = document.getElementById("equipment-card-preview");
      const image = document.getElementById("equipment-card-preview-img");
      if (preview) preview.hidden = true;
      if (image) image.removeAttribute("src");
      updateSubmitLabel(false);
    }

    function updateSubmitLabel(isEditing) {
      const button = document.querySelector("#equipment-card-form button[type='submit']");
      if (button) button.textContent = isEditing ? "\u88c5\u5099\u30ab\u30fc\u30c9\u3092\u66f4\u65b0" : "\u88c5\u5099\u30ab\u30fc\u30c9\u3092\u4fdd\u5b58";
    }

    function renderEquipmentRarityOptions(selectedValue = "SR") {
      const select = document.getElementById("equipment-card-rarity-select");
      if (!select) return;
      const modeConfig = getSystemApi().getRarityModeConfig();
      const fallback = getSystemApi().getRarityFallback();
      const current = selectedValue || fallback;
      select.innerHTML = modeConfig.tiers.map(tier =>
        `<option value="${esc(tier.value)}"${tier.value === current ? " selected" : ""}>${esc(getSystemApi().getRarityLabel(tier.value))}</option>`
      ).join("");
    }

    function renderEquipmentCardList() {
      const list = document.getElementById("equipment-card-list");
      if (!list) return;
      const equipmentCards = getEquipmentCards();
      if (!equipmentCards.length) {
        list.innerHTML = `<p class="editor-record-empty">\u88c5\u5099\u30ab\u30fc\u30c9\u304c\u3042\u308a\u307e\u305b\u3093</p>`;
        return;
      }
      list.innerHTML = equipmentCards.map(card => `
        <article class="editor-record-item">
          <div class="editor-record-item-top">
            <span class="editor-record-badge">\u88c5\u5099\u30ab\u30fc\u30c9</span>
            <span class="editor-record-meta">${esc(card.slotType || "other")}</span>
          </div>
          <h5>${esc(card.name)}</h5>
          <p>${esc(card.description || card.catch || "")}</p>
          <div class="editor-record-actions">
            <button class="editor-inline-btn" type="button" data-edit-equipment-card="${esc(card.id)}">\u7de8\u96c6</button>
          </div>
        </article>
      `).join("");
      list.querySelectorAll("[data-edit-equipment-card]").forEach(button => {
        button.addEventListener("click", () => beginEquipmentCardEdit(button.dataset.editEquipmentCard || ""));
      });
    }

    return {
      ensureEquipmentCardPanel,
      beginEquipmentCardEdit,
      resetEquipmentCardForm,
      renderEquipmentCardList
    };
  }

  window.EquipmentCardEditor = {
    setupEquipmentCardEditor,
    createEquipmentCardEditor
  };
})();
