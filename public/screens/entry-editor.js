(function () {
  function setupEntryEditor(deps) {
    const api = createEntryEditor(deps);
    api.ensureCharacterCropEditor();
    api.ensureCharacterSdEditor();
    api.ensureCharacterBattleEditor();

    document.getElementById("character-form").addEventListener("submit", api.handleCharacterSubmit);
    document.querySelector("#character-form input[name='image']")?.addEventListener("change", api.handleCharacterImageChange);
    document.getElementById("character-form-clear-btn")?.addEventListener("click", () => api.resetCharacterForm());
    document.getElementById("character-image-clear-btn")?.addEventListener("click", () => api.clearCharacterImage());
    document.getElementById("add-card-home-opinion-btn").addEventListener("click", () => api.addCardHomeOpinionInput());
    document.getElementById("add-card-home-conversation-btn").addEventListener("click", () => api.addCardHomeConversationInput());
    document.getElementById("add-card-home-birthday-btn").addEventListener("click", () => api.addCardHomeBirthdayInput());
    document.getElementById("create-card-folder-btn")?.addEventListener("click", () => api.handleCreateCardFolder());

    return api;
  }

  function createEntryEditor(deps) {
    const {
      getCharacters,
      setCharacters,
      getBaseChars,
      getCardFolders,
      getEditState,
      getApi,
      getSystemApi,
      readFileAsDataUrl,
      generateCharacterCropAssets,
      normalizeCharacterCropImages,
      normalizeCharacterCropPresets,
      normalizeCharacterSdImages,
      normalizeCharacterBattleKit,
      makeFallbackImage,
      normalizeRarityValue,
      saveLocal,
      postJSON,
      showToast,
      upsertItem,
      updateEditorSubmitLabels,
      renderHome,
      renderEditorCharacterList,
      renderGachaPoolChars,
      getEditingFeaturedIds,
      createContentFolder,
      getFeatureAccess,
      renderVoiceLineFields,
      collectVoiceLineFields,
      baseCharVoiceLineDefs,
      baseCharHomeVoiceDefs,
      esc
    } = deps;

    const cropPresetDefs = [
      { key: "icon", label: "Icon" },
      { key: "formationPortrait", label: "Party Portrait" },
      { key: "formationWide", label: "Party Wide" },
      { key: "cutin", label: "Cut-in" }
    ];
    const ATTRIBUTE_OPTIONS = ["炎", "雷", "風", "水", "地", "光", "闇", "無"];
    const ATTRIBUTE_FALLBACK = ATTRIBUTE_OPTIONS[ATTRIBUTE_OPTIONS.length - 1];
    let activeCropPresetKey = cropPresetDefs[0].key;
    let cropEditorRenderTimer = null;
    let cropEditorState = {
      imageSrc: "",
      cropImages: normalizeCharacterCropImages(null),
      cropPresets: normalizeCharacterCropPresets(null)
    };

    function getCharacterForm() {
      return document.getElementById("character-form");
    }

    function getCharacterImageInput(form = getCharacterForm()) {
      return form?.querySelector?.("input[name='image']") || null;
    }

    function setCharacterImageCleared(form, isCleared) {
      if (!form) return;
      form.dataset.imageCleared = isCleared ? "true" : "false";
    }

    function isCharacterImageCleared(form) {
      return form?.dataset?.imageCleared === "true";
    }

    function getCharacterFolderSelect(form) {
      return form?.querySelector?.("select[name='folderId']") || null;
    }

    function normalizeAttributeValue(value) {
      return ATTRIBUTE_OPTIONS.includes(value) ? value : ATTRIBUTE_FALLBACK;
    }

    function clearCharacterRelationLists() {
      document.getElementById("card-home-opinion-list").innerHTML = "";
      document.getElementById("card-home-conversation-list").innerHTML = "";
      document.getElementById("card-home-birthday-list").innerHTML = "";
    }

    function populateCharacterRelationFields(char) {
      clearCharacterRelationLists();
      (char?.homeOpinions || []).forEach(item => addCardHomeOpinionInput(item));
      (char?.homeConversations || []).forEach(item => addCardHomeConversationInput(item));
      (char?.homeBirthdays || []).forEach(item => addCardHomeBirthdayInput(item));
    }

    async function buildCharacterPayload(form, existing) {
      const imageCleared = isCharacterImageCleared(form);
      const imageFile = getCharacterImageInput(form)?.files?.[0] || null;
      const image = imageCleared ? "" : imageFile ? await readFileAsDataUrl(imageFile) : (existing?.image || "");
      const cropAssets = image
        ? await resolveCharacterCropAssets(image, imageFile ? null : existing)
        : { cropImages: normalizeCharacterCropImages(null), cropPresets: normalizeCharacterCropPresets(null) };
      const sdImages = await collectCharacterSdImages(existing?.sdImages);
      const battleKit = collectCharacterBattleKit();
      const editingId = getEditState().characterId || null;

      return {
        id: editingId || crypto.randomUUID(),
        name: form.name.value.trim(),
        baseCharId: form.baseCharId.value || null,
        folderId: getCharacterFolderSelect(form)?.value || null,
        catch: form.catch.value.trim(),
        rarity: normalizeRarityValue(form.rarity.value),
        attribute: normalizeAttributeValue(form.attribute.value),
        image,
        cropImages: cropAssets.cropImages,
        cropPresets: cropAssets.cropPresets,
        sdImages,
        battleKit,
        lines: existing?.lines || [],
        voiceLines: collectCardVoiceLines(),
        homeVoices: collectCardHomeVoiceLines(),
        homeOpinions: collectCardHomeOpinions(),
        homeConversations: collectCardHomeConversations(),
        homeBirthdays: collectCardHomeBirthdays()
      };
    }

    function saveCharacterCollection(nextCharacter) {
      const currentCharacters = Array.isArray(getCharacters()) ? getCharacters() : [];
      const nextCharacters = currentCharacters.slice();
      upsertItem(nextCharacters, nextCharacter);
      setCharacters(nextCharacters);
      saveLocal("socia-characters", nextCharacters);
      return nextCharacters;
    }

    async function refreshAfterCharacterSave() {
      try {
        renderEditorCharacterList();
      } catch (error) {
        console.error("Failed to refresh character editor list:", error);
      }
      try {
        renderGachaPoolChars(getEditingFeaturedIds());
      } catch (error) {
        console.error("Failed to refresh gacha pool characters:", error);
      }
      try {
        renderHome();
      } catch (error) {
        console.error("Failed to refresh home after character save:", error);
      }
    }

    function applyCharacterToForm(char) {
      const form = getCharacterForm();
      if (!form || !char) return;
      const folderSelect = getCharacterFolderSelect(form);
      getEditState().characterId = char.id;
      form.baseCharId.value = char.baseCharId || "";
      if (folderSelect) folderSelect.value = char.folderId || "";
      form.name.value = char.name || "";
      form.catch.value = char.catch || "";
      getSystemApi().renderCharacterRarityOptions(char.rarity || getSystemApi().getRarityFallback());
      form.attribute.value = normalizeAttributeValue(char.attribute);
      renderCardVoiceLineFields(char.voiceLines || {});
      renderCardHomeVoiceLineFields(char.homeVoices || {});
      populateCharacterRelationFields(char);
      document.getElementById("char-preview").hidden = false;
      document.getElementById("char-preview-img").src = char.image || makeFallbackImage(char.name, char.rarity);
      setCharacterCropEditorState(
        char.image || "",
        normalizeCharacterCropPresets(char.cropPresets),
        normalizeCharacterCropImages(char.cropImages)
      );
      populateCharacterSdEditor(normalizeCharacterSdImages(char.sdImages));
      populateCharacterBattleEditor(normalizeCharacterBattleKit(char.battleKit));
      updateEditorSubmitLabels();
      setCharacterImageCleared(form, false);
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function handleCharacterSubmit(e) {
      return handleCharacterSubmitClean(e);
    }

    function resetCharacterForm() {
      return resetCharacterFormClean();
    }

    function ensureCharacterCropEditor() {
      if (document.getElementById("character-crop-editor")) return;
      const preview = document.getElementById("char-preview");
      if (!preview) return;
      const section = document.createElement("section");
      section.id = "character-crop-editor";
      section.className = "character-crop-editor";
      section.hidden = true;
      section.innerHTML = `
        <details class="editor-collapsible character-collapsible">
          <summary>自動クロップ</summary>
          <div class="character-crop-body">
            <div class="character-crop-header">
              <div>
                <p class="character-crop-help">画像から4種のクロップを自動生成します。必要なら X、Y、ズームを調整してください。</p>
              </div>
              <div class="character-crop-tabs" id="character-crop-tabs">
                ${cropPresetDefs.map((preset, index) => `
                  <button type="button" class="character-crop-tab${index === 0 ? " active" : ""}" data-crop-preset="${preset.key}">${preset.label}</button>
                `).join("")}
              </div>
            </div>
            <div class="character-crop-grid" id="character-crop-grid">
              ${cropPresetDefs.map(preset => `
                <figure class="character-crop-card${preset.key === activeCropPresetKey ? " active" : ""}" data-crop-card="${preset.key}">
                  <div class="character-crop-frame character-crop-frame-${preset.key}">
                    <img id="character-crop-preview-${preset.key}" alt="${preset.label}">
                  </div>
                  <figcaption>${preset.label}</figcaption>
                </figure>
              `).join("")}
            </div>
            <div class="character-crop-controls">
              <label>
                X
                <input type="range" id="character-crop-offset-x" min="-100" max="100" step="1" value="0">
                <span id="character-crop-offset-x-value">0</span>
              </label>
              <label>
                Y
                <input type="range" id="character-crop-offset-y" min="-100" max="100" step="1" value="0">
                <span id="character-crop-offset-y-value">0</span>
              </label>
              <label>
                Zoom
                <input type="range" id="character-crop-zoom" min="70" max="250" step="1" value="100">
                <span id="character-crop-zoom-value">1.00x</span>
              </label>
            </div>
          </div>
        </details>
      `;
      preview.after(section);

      section.querySelectorAll("[data-crop-preset]").forEach(button => {
        button.addEventListener("click", () => {
          activeCropPresetKey = button.dataset.cropPreset;
          renderCharacterCropEditor();
        });
      });

      section.querySelectorAll(".character-crop-card").forEach(card => {
        card.addEventListener("click", () => {
          activeCropPresetKey = card.dataset.cropCard;
          renderCharacterCropEditor();
        });
      });

      section.querySelector("#character-crop-offset-x")?.addEventListener("input", event => {
        updateActiveCropPreset({ offsetX: (Number(event.target.value) || 0) / 100 });
      });
      section.querySelector("#character-crop-offset-y")?.addEventListener("input", event => {
        updateActiveCropPreset({ offsetY: (Number(event.target.value) || 0) / 100 });
      });
      section.querySelector("#character-crop-zoom")?.addEventListener("input", event => {
        updateActiveCropPreset({ zoom: (Number(event.target.value) || 100) / 100 });
      });
    }

    async function handleCharacterImageChange(event) {
      const file = event.target.files?.[0];
      if (!file) {
        if (!getEditState().characterId) clearCharacterCropEditorState();
        return;
      }
      setCharacterImageCleared(getCharacterForm(), false);
      const image = await readFileAsDataUrl(file);
      document.getElementById("char-preview").hidden = false;
      document.getElementById("char-preview-img").src = image;
      await setCharacterCropEditorState(image);
    }

    function clearCharacterImage() {
      const form = getCharacterForm();
      const imageInput = getCharacterImageInput(form);
      if (imageInput) imageInput.value = "";
      setCharacterImageCleared(form, true);
      document.getElementById("char-preview").hidden = true;
      document.getElementById("char-preview-img").removeAttribute("src");
      clearCharacterCropEditorState();
    }

    async function setCharacterCropEditorState(imageSrc, cropPresets = null, cropImages = null) {
      ensureCharacterCropEditor();
      const section = document.getElementById("character-crop-editor");
      if (!section) return;
      if (!imageSrc) {
        clearCharacterCropEditorState();
        return;
      }
      cropEditorState = {
        imageSrc,
        cropPresets: normalizeCharacterCropPresets(cropPresets),
        cropImages: normalizeCharacterCropImages(cropImages)
      };
      if (!hasAnyCropImage(cropEditorState.cropImages)) {
        await rerenderCharacterCropImages();
      }
      section.hidden = false;
      renderCharacterCropEditor();
    }

    function clearCharacterCropEditorState() {
      cropEditorState = {
        imageSrc: "",
        cropImages: normalizeCharacterCropImages(null),
        cropPresets: normalizeCharacterCropPresets(null)
      };
      const section = document.getElementById("character-crop-editor");
      if (section) section.hidden = true;
    }

    function ensureCharacterSdEditor() {
      if (document.getElementById("character-sd-editor")) return;
      const anchor = document.getElementById("character-crop-editor") || document.getElementById("char-preview");
      if (!anchor) return;
      const section = document.createElement("section");
      section.id = "character-sd-editor";
      section.className = "character-sd-editor";
      section.innerHTML = `
        <details class="editor-collapsible character-collapsible">
          <summary>バトルSD</summary>
          <div class="character-sd-body">
            <div class="character-sd-header">
              <div>
                <p class="character-sd-help">戦闘用の SD 画像を任意で登録できます。Idle が基本姿勢で、Attack と Damaged は登録されている場合に上書きします。</p>
              </div>
            </div>
            <div class="character-sd-grid">
              ${[
                ["idle", "待機"],
                ["attack", "攻撃"],
                ["damaged", "被ダメージ"]
              ].map(([key, label]) => `
                <label class="character-sd-card">
                  <span class="character-sd-label">${label}</span>
                  <span class="character-sd-preview"><img id="character-sd-preview-${key}" alt="${label}"></span>
                  <input type="file" accept="image/*" data-sd-slot="${key}">
                </label>
              `).join("")}
            </div>
          </div>
        </details>
      `;
      anchor.after(section);
      section.querySelector(".character-battle-header > div")?.insertAdjacentHTML(
        "beforeend",
        '<p class="editor-pack-note" id="character-battle-pack-note" hidden>Battle Pack が必要です。未所持の場合、この項目はローカル保存のみです。</p>'
      );
      void refreshBattlePackUi();

      section.querySelectorAll("[data-sd-slot]").forEach(input => {
        input.addEventListener("change", event => handleCharacterSdImageChange(event));
      });
    }

    async function handleCharacterSdImageChange(event) {
      const input = event.target;
      const slot = input.dataset.sdSlot;
      const file = input.files?.[0];
      const preview = document.getElementById(`character-sd-preview-${slot}`);
      if (!preview) return;
      if (!file) {
        preview.removeAttribute("src");
        return;
      }
      preview.src = await readFileAsDataUrl(file);
    }

    async function collectCharacterSdImages(existingSdImages) {
      const next = normalizeCharacterSdImages(existingSdImages);
      const inputs = document.querySelectorAll("#character-sd-editor [data-sd-slot]");
      for (const input of inputs) {
        const slot = input.dataset.sdSlot;
        const file = input.files?.[0];
        if (file) {
          next[slot] = await readFileAsDataUrl(file);
        }
      }
      return next;
    }

    function populateCharacterSdEditor(sdImages) {
      ensureCharacterSdEditor();
      const normalized = normalizeCharacterSdImages(sdImages);
      Object.entries(normalized).forEach(([key, value]) => {
        const preview = document.getElementById(`character-sd-preview-${key}`);
        if (preview) {
          if (value) preview.src = value;
          else preview.removeAttribute("src");
        }
      });
    }

    function resetCharacterSdEditor() {
      document.querySelectorAll("#character-sd-editor [data-sd-slot]").forEach(input => {
        input.value = "";
      });
      populateCharacterSdEditor(null);
    }

    function updateActiveCropPreset(patch) {
      cropEditorState = {
        ...cropEditorState,
        cropPresets: {
          ...cropEditorState.cropPresets,
          [activeCropPresetKey]: {
            ...cropEditorState.cropPresets[activeCropPresetKey],
            ...patch
          }
        }
      };
      renderCharacterCropEditor();
      scheduleCharacterCropRender();
    }

    function scheduleCharacterCropRender() {
      window.clearTimeout(cropEditorRenderTimer);
      cropEditorRenderTimer = window.setTimeout(() => {
        rerenderCharacterCropImages();
      }, 80);
    }

    async function rerenderCharacterCropImages() {
      if (!cropEditorState.imageSrc) return;
      const assets = await generateCharacterCropAssets(cropEditorState.imageSrc, cropEditorState.cropPresets);
      cropEditorState = {
        imageSrc: cropEditorState.imageSrc,
        cropImages: normalizeCharacterCropImages(assets.cropImages),
        cropPresets: normalizeCharacterCropPresets(assets.cropPresets)
      };
      renderCharacterCropEditor();
    }

    function renderCharacterCropEditor() {
      const section = document.getElementById("character-crop-editor");
      if (!section) return;

      const activePreset = cropEditorState.cropPresets[activeCropPresetKey] || normalizeCharacterCropPresets(null)[activeCropPresetKey];
      section.hidden = !cropEditorState.imageSrc;
      section.querySelectorAll("[data-crop-preset]").forEach(button => {
        button.classList.toggle("active", button.dataset.cropPreset === activeCropPresetKey);
      });
      section.querySelectorAll("[data-crop-card]").forEach(card => {
        card.classList.toggle("active", card.dataset.cropCard === activeCropPresetKey);
      });

      cropPresetDefs.forEach(preset => {
        const image = section.querySelector(`#character-crop-preview-${preset.key}`);
        if (image) image.src = cropEditorState.cropImages[preset.key] || cropEditorState.imageSrc;
      });

      const offsetXInput = section.querySelector("#character-crop-offset-x");
      const offsetYInput = section.querySelector("#character-crop-offset-y");
      const zoomInput = section.querySelector("#character-crop-zoom");
      if (offsetXInput) offsetXInput.value = String(Math.round((activePreset.offsetX || 0) * 100));
      if (offsetYInput) offsetYInput.value = String(Math.round((activePreset.offsetY || 0) * 100));
      if (zoomInput) zoomInput.value = String(Math.round((activePreset.zoom || 1) * 100));

      const offsetXValue = section.querySelector("#character-crop-offset-x-value");
      const offsetYValue = section.querySelector("#character-crop-offset-y-value");
      const zoomValue = section.querySelector("#character-crop-zoom-value");
      if (offsetXValue) offsetXValue.textContent = `${Math.round((activePreset.offsetX || 0) * 100)}`;
      if (offsetYValue) offsetYValue.textContent = `${Math.round((activePreset.offsetY || 0) * 100)}`;
      if (zoomValue) zoomValue.textContent = `${(activePreset.zoom || 1).toFixed(2)}x`;
    }

    async function resolveCharacterCropAssets(image, existing) {
      if (cropEditorState.imageSrc === image) {
        if (!hasAnyCropImage(cropEditorState.cropImages)) {
          await rerenderCharacterCropImages();
        }
        return {
          cropImages: normalizeCharacterCropImages(cropEditorState.cropImages),
          cropPresets: normalizeCharacterCropPresets(cropEditorState.cropPresets)
        };
      }
      return generateCharacterCropAssets(image, existing?.cropPresets || null);
    }

    function hasAnyCropImage(cropImages) {
      const normalized = normalizeCharacterCropImages(cropImages);
      return Object.values(normalized).some(Boolean);
    }

    function ensureCharacterBattleEditor() {
      if (document.getElementById("character-battle-editor")) return;
      const anchor = document.getElementById("character-sd-editor") || document.getElementById("character-crop-editor") || document.getElementById("char-preview");
      if (!anchor) return;

      const section = document.createElement("section");
      section.id = "character-battle-editor";
      section.className = "character-battle-editor";
      section.innerHTML = `
        <details class="editor-collapsible character-collapsible">
          <summary>バトル設定</summary>
          <div class="character-battle-body">
            <div class="character-battle-header">
              <div>
                <p class="character-battle-help">戦闘の基礎データを編集します。スキル説明は小さい選択パーツの組み合わせなので、後から項目を増やしやすい構造です。</p>
              </div>
            </div>
            <div class="character-battle-stats">
              <label>HP<input type="number" min="0" step="1" id="character-battle-hp" value="1000"></label>
              <label>ATK<input type="number" min="0" step="1" id="character-battle-atk" value="100"></label>
            </div>
            <div class="character-battle-skills" id="character-battle-skills"></div>
          </div>
        </details>
      `;
      anchor.after(section);

      const skillsWrap = section.querySelector("#character-battle-skills");
      [
        ["normalSkill", "通常スキル"],
        ["activeSkill", "アクティブスキル"],
        ["passiveSkill", "パッシブスキル"],
        ["linkSkill", "リンクスキル"],
        ["specialSkill", "必殺技"]
      ].forEach(([key, label]) => {
        const block = document.createElement("div");
        block.className = "character-skill-block";
        block.innerHTML = `
          <div class="character-skill-head">
            <h5>${label}</h5>
            <button type="button" class="btn-secondary character-skill-add" data-skill-add="${key}">+ パーツ</button>
          </div>
          <label class="character-skill-name">
            名前
            <input type="text" maxlength="60" data-skill-name="${key}">
          </label>
          <label class="character-skill-recast">
            リキャスト
            <input type="number" min="0" step="1" data-skill-recast="${key}" value="0">
          </label>
          <div class="character-skill-part-list" data-skill-parts="${key}"></div>
        `;
        skillsWrap.appendChild(block);
      });

      section.querySelectorAll("[data-skill-add]").forEach(button => {
        button.addEventListener("click", () => addCharacterSkillPartRow(button.dataset.skillAdd));
      });
    }

    function addCharacterSkillPartRow(skillKey, part = null) {
      const list = document.querySelector(`#character-battle-editor [data-skill-parts="${skillKey}"]`);
      if (!list) return;
      const row = document.createElement("div");
      row.className = "character-skill-part-row";
      row.innerHTML = `
        <select data-part-type>
          ${[
            ["", "-- type --"],
            ["physical", "Physical"],
            ["magic", "Magic"],
            ["heal", "Heal"],
            ["shield", "Shield"],
            ["buff", "Buff"],
            ["debuff", "Debuff"]
          ].map(([value, label]) => `<option value="${value}"${part?.type === value ? " selected" : ""}>${label}</option>`).join("")}
        </select>
        <select data-part-magnitude>
          ${[
            ["", "-- size --"],
            ["small", "Small"],
            ["medium", "Medium"],
            ["large", "Large"],
            ["xl", "XL"]
          ].map(([value, label]) => `<option value="${value}"${part?.magnitude === value ? " selected" : ""}>${label}</option>`).join("")}
        </select>
        <input type="text" maxlength="60" data-part-detail placeholder="Detail" value="${esc(part?.detail || "")}">
        <button type="button" class="expression-remove">Remove</button>
      `;
      row.querySelector(".expression-remove")?.addEventListener("click", () => row.remove());
      list.appendChild(row);
    }

    function collectCharacterBattleKit() {
      const hpInput = document.getElementById("character-battle-hp");
      const atkInput = document.getElementById("character-battle-atk");
      const getSkill = skillKey => ({
        name: document.querySelector(`#character-battle-editor [data-skill-name="${skillKey}"]`)?.value.trim() || "",
        recast: Number(document.querySelector(`#character-battle-editor [data-skill-recast="${skillKey}"]`)?.value || 0),
        parts: Array.from(document.querySelectorAll(`#character-battle-editor [data-skill-parts="${skillKey}"] .character-skill-part-row`)).map(row => ({
          type: row.querySelector("[data-part-type]")?.value || "",
          magnitude: row.querySelector("[data-part-magnitude]")?.value || "",
          detail: row.querySelector("[data-part-detail]")?.value.trim() || ""
        })).filter(part => part.type || part.magnitude || part.detail)
      });

      return normalizeCharacterBattleKit({
        hp: hpInput?.value,
        atk: atkInput?.value,
        normalSkill: getSkill("normalSkill"),
        activeSkill: getSkill("activeSkill"),
        passiveSkill: getSkill("passiveSkill"),
        linkSkill: getSkill("linkSkill"),
        specialSkill: getSkill("specialSkill")
      });
    }

    function populateCharacterBattleEditor(battleKit) {
      ensureCharacterBattleEditor();
      const normalized = normalizeCharacterBattleKit(battleKit);
      const hpInput = document.getElementById("character-battle-hp");
      const atkInput = document.getElementById("character-battle-atk");
      if (hpInput) hpInput.value = String(normalized.hp);
      if (atkInput) atkInput.value = String(normalized.atk);

      ["normalSkill", "activeSkill", "passiveSkill", "linkSkill", "specialSkill"].forEach(skillKey => {
        const skill = normalized[skillKey];
        const nameInput = document.querySelector(`#character-battle-editor [data-skill-name="${skillKey}"]`);
        const recastInput = document.querySelector(`#character-battle-editor [data-skill-recast="${skillKey}"]`);
        const list = document.querySelector(`#character-battle-editor [data-skill-parts="${skillKey}"]`);
        if (nameInput) nameInput.value = skill.name || "";
        if (recastInput) recastInput.value = String(skill.recast || 0);
        if (list) list.innerHTML = "";
        (skill.parts || []).forEach(part => addCharacterSkillPartRow(skillKey, part));
      });
    }

    function resetCharacterBattleEditor() {
      populateCharacterBattleEditor(null);
    }

    async function refreshBattlePackUi() {
      const section = document.getElementById("character-battle-editor");
      const note = document.getElementById("character-battle-pack-note");
      if (!section || !note || typeof getFeatureAccess !== "function") return;
      const access = await getFeatureAccess();
      const hasBattlePack = Boolean(access?.battle);
      note.hidden = hasBattlePack;
      section.classList.toggle("is-pack-locked", !hasBattlePack);
      section.querySelectorAll(".character-battle-body input, .character-battle-body select, .character-battle-body textarea, .character-battle-body button").forEach(control => {
        control.disabled = !hasBattlePack;
      });
    }

    function renderCardVoiceLineFields(values = {}) {
      renderVoiceLineFields("card-voice-line-fields", "card-voice", baseCharVoiceLineDefs, values);
    }

    function collectCardVoiceLines() {
      return collectVoiceLineFields("card-voice-line-fields", "card-voice", baseCharVoiceLineDefs);
    }

    function renderCardHomeVoiceLineFields(values = {}) {
      renderVoiceLineFields("card-home-voice-line-fields", "card-home-voice", baseCharHomeVoiceDefs, values);
    }

    function collectCardHomeVoiceLines() {
      return collectVoiceLineFields("card-home-voice-line-fields", "card-home-voice", baseCharHomeVoiceDefs);
    }

    function addCardHomeOpinionInput(item = null) {
      const list = document.getElementById("card-home-opinion-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="card-home-opinion-target">
          <option value="">相手キャラを選択</option>
          ${getBaseChars().map(baseChar => `<option value="${esc(baseChar.id)}"${item?.targetBaseCharId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`).join("")}
        </select>
        <textarea name="card-home-opinion-text" rows="2" maxlength="200" placeholder="そのキャラについてのセリフ">${esc(item?.text || "")}</textarea>
        <button type="button" class="expression-remove">削除</button>
      `;
      row.querySelector(".expression-remove").addEventListener("click", () => row.remove());
      list.appendChild(row);
    }

    function addCardHomeConversationInput(item = null) {
      const list = document.getElementById("card-home-conversation-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="card-home-conversation-target">
          <option value="">相手キャラを選択</option>
          ${getBaseChars().map(baseChar => `<option value="${esc(baseChar.id)}"${item?.targetBaseCharId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`).join("")}
        </select>
        <textarea name="card-home-conversation-self" rows="2" maxlength="200" placeholder="自分のセリフ">${esc(item?.selfText || "")}</textarea>
        <textarea name="card-home-conversation-partner" rows="2" maxlength="200" placeholder="相手のセリフ">${esc(item?.partnerText || "")}</textarea>
        <button type="button" class="expression-remove">削除</button>
      `;
      row.querySelector(".expression-remove").addEventListener("click", () => row.remove());
      list.appendChild(row);
    }

    function addCardHomeBirthdayInput(item = null) {
      const list = document.getElementById("card-home-birthday-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="card-home-birthday-target">
          <option value="">対象キャラを選択</option>
          ${getBaseChars().map(baseChar => `<option value="${esc(baseChar.id)}"${item?.targetBaseCharId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`).join("")}
        </select>
        <textarea name="card-home-birthday-text" rows="2" maxlength="200" placeholder="誕生日用のセリフ">${esc(item?.text || "")}</textarea>
        <button type="button" class="expression-remove">削除</button>
      `;
      row.querySelector(".expression-remove").addEventListener("click", () => row.remove());
      list.appendChild(row);
    }

    function collectCardHomeOpinions() {
      return Array.from(document.querySelectorAll("#card-home-opinion-list .relation-line-item")).map(row => ({
        targetBaseCharId: row.querySelector("[name='card-home-opinion-target']").value || null,
        text: row.querySelector("[name='card-home-opinion-text']").value.trim()
      })).filter(item => item.targetBaseCharId && item.text);
    }

    function collectCardHomeConversations() {
      return Array.from(document.querySelectorAll("#card-home-conversation-list .relation-line-item")).map(row => ({
        targetBaseCharId: row.querySelector("[name='card-home-conversation-target']").value || null,
        selfText: row.querySelector("[name='card-home-conversation-self']").value.trim(),
        partnerText: row.querySelector("[name='card-home-conversation-partner']").value.trim()
      })).filter(item => item.targetBaseCharId && (item.selfText || item.partnerText));
    }

    function collectCardHomeBirthdays() {
      return Array.from(document.querySelectorAll("#card-home-birthday-list .relation-line-item")).map(row => ({
        targetBaseCharId: row.querySelector("[name='card-home-birthday-target']").value || null,
        text: row.querySelector("[name='card-home-birthday-text']").value.trim()
      })).filter(item => item.targetBaseCharId && item.text);
    }

    function getBillingSaveErrorMessage(error, fallback) {
      const code = String(error?.data?.code || "");
      const requiredPack = String(error?.data?.requiredPack || "").trim();
      if (code !== "billing_feature_required" || !requiredPack) return fallback;
      if (requiredPack === "battle") {
        return "このカードのバトル設定を保存するには Battle Pack が必要です。ローカルには保持されています。";
      }
      return `${requiredPack} が必要なため保存できませんでした。ローカルには保持されています。`;
    }

    async function handleCreateCardFolder() {
      const folder = await createContentFolder("card");
      if (!folder) return;
      const select = document.querySelector("#character-form select[name='folderId']");
      if (select) select.value = folder.id;
    }

    async function assignCharacterFolder(characterId, folderId) {
      const list = getCharacters().slice();
      const char = list.find(item => item.id === characterId);
      if (!char) return;
      char.folderId = folderId || null;
      setCharacters(list);
      saveLocal("socia-characters", list);
      renderEditorCharacterList();
      renderGachaPoolChars(getEditingFeaturedIds());
      try {
        await postJSON(getApi().characters, char);
      } catch (error) {
        console.error("Failed to move character folder:", error);
        showToast("カードのフォルダ移動保存に失敗しました。");
      }
    }

    async function handleCharacterSubmitClean(e) {
      e.preventDefault();
      const form = e.target;
      const currentCharacters = Array.isArray(getCharacters()) ? getCharacters() : [];
      const editingId = getEditState().characterId || null;
      const existing = editingId ? currentCharacters.find(item => item.id === editingId) : null;
      const nextChar = await buildCharacterPayload(form, existing);
      saveCharacterCollection(nextChar);
      try {
        await postJSON(getApi().characters, nextChar);
      } catch (error) {
        console.error("Failed to save character:", error);
        showToast(getBillingSaveErrorMessage(
          error,
          "\u30ab\u30fc\u30c9\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3000\u30ed\u30fc\u30ab\u30eb\u306b\u306f\u4fdd\u6301\u3055\u308c\u3066\u3044\u307e\u3059"
        ));
      }
      await refreshAfterCharacterSave();
      resetCharacterFormClean();
      showToast(`${nextChar.name}\u3092${existing ? "\u66f4\u65b0" : "\u767b\u9332"}\u3057\u307e\u3057\u305f`);
    }

    function beginCharacterEditClean(id) {
      const char = getCharacters().find(item => item.id === id);
      if (!char) return;
      applyCharacterToForm(char);
    }

    function resetCharacterFormClean() {
      getEditState().characterId = null;
      window.clearTimeout(cropEditorRenderTimer);
      const nextForm = getCharacterForm();
      const nextFolderSelect = getCharacterFolderSelect(nextForm);
      nextForm.reset();
      getSystemApi().renderCharacterRarityOptions(getSystemApi().getRarityFallback());
      if (nextFolderSelect) nextFolderSelect.value = "";
      nextForm.attribute.value = normalizeAttributeValue(ATTRIBUTE_FALLBACK);
      renderCardVoiceLineFields();
      renderCardHomeVoiceLineFields();
      clearCharacterRelationLists();
      document.getElementById("char-preview").hidden = true;
      clearCharacterCropEditorState();
      resetCharacterSdEditor();
      resetCharacterBattleEditor();
      updateEditorSubmitLabels();
      setCharacterImageCleared(nextForm, false);
    }

    return {
      ensureCharacterCropEditor,
      ensureCharacterSdEditor,
      ensureCharacterBattleEditor,
      refreshBattlePackUi,
      handleCharacterSubmit: handleCharacterSubmitClean,
      handleCharacterImageChange,
      clearCharacterImage,
      beginCharacterEdit: beginCharacterEditClean,
      resetCharacterForm: resetCharacterFormClean,
      handleCreateCardFolder,
      assignCharacterFolder,
      renderCardVoiceLineFields,
      collectCardVoiceLines,
      renderCardHomeVoiceLineFields,
      collectCardHomeVoiceLines,
      collectCardHomeOpinions,
      collectCardHomeConversations,
      collectCardHomeBirthdays,
      addCardHomeOpinionInput,
      addCardHomeConversationInput,
      addCardHomeBirthdayInput
    };
  }

  window.EntryEditor = {
    setupEntryEditor,
    createEntryEditor
  };
})();
