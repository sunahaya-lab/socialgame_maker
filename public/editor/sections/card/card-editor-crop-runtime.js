(function () {
  function createCardEditorCropRuntime(deps) {
    const {
      text,
      esc,
      cropPresetDefs,
      getActiveCropPresetKey,
      setActiveCropPresetKey,
      getCropEditorState,
      setCropEditorState,
      getCharacterForm,
      getCharacterImageInput,
      getEditState,
      setCharacterImageCleared,
      readFileAsDataUrl,
      generateCharacterCropAssets,
      normalizeCharacterCropImages,
      normalizeCharacterCropPresets,
      clearCropEditorRenderTimer,
      setCropEditorRenderTimer,
    } = deps;

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
                <p class="character-crop-help">${esc(text("cropHelp", "画像から4種のクロップを自動生成します。必要なら X、Y、ズームを調整してください。"))}</p>
              </div>
              <div class="character-crop-tabs" id="character-crop-tabs">
                ${cropPresetDefs.map((preset, index) => `
                  <button type="button" class="character-crop-tab${index === 0 ? " active" : ""}" data-crop-preset="${preset.key}">${preset.label}</button>
                `).join("")}
              </div>
            </div>
            <div class="character-crop-grid" id="character-crop-grid">
              ${cropPresetDefs.map(preset => `
                <figure class="character-crop-card${preset.key === getActiveCropPresetKey() ? " active" : ""}" data-crop-card="${preset.key}">
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
          setActiveCropPresetKey(button.dataset.cropPreset);
          renderCharacterCropEditor();
        });
      });

      section.querySelectorAll(".character-crop-card").forEach(card => {
        card.addEventListener("click", () => {
          setActiveCropPresetKey(card.dataset.cropCard);
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
      setCropEditorState({
        imageSrc,
        cropPresets: normalizeCharacterCropPresets(cropPresets),
        cropImages: normalizeCharacterCropImages(cropImages)
      });
      if (!hasAnyCropImage(getCropEditorState().cropImages)) {
        await rerenderCharacterCropImages();
      }
      section.hidden = false;
      renderCharacterCropEditor();
    }

    function clearCharacterCropEditorState() {
      setCropEditorState({
        imageSrc: "",
        cropImages: normalizeCharacterCropImages(null),
        cropPresets: normalizeCharacterCropPresets(null)
      });
      const section = document.getElementById("character-crop-editor");
      if (section) section.hidden = true;
    }

    function updateActiveCropPreset(patch) {
      const state = getCropEditorState();
      const activeKey = getActiveCropPresetKey();
      setCropEditorState({
        ...state,
        cropPresets: {
          ...state.cropPresets,
          [activeKey]: {
            ...state.cropPresets[activeKey],
            ...patch
          }
        }
      });
      renderCharacterCropEditor();
      scheduleCharacterCropRender();
    }

    function scheduleCharacterCropRender() {
      clearCropEditorRenderTimer();
      setCropEditorRenderTimer(window.setTimeout(() => {
        rerenderCharacterCropImages();
      }, 80));
    }

    async function rerenderCharacterCropImages() {
      const state = getCropEditorState();
      if (!state.imageSrc) return;
      const assets = await generateCharacterCropAssets(state.imageSrc, state.cropPresets);
      setCropEditorState({
        imageSrc: state.imageSrc,
        cropImages: normalizeCharacterCropImages(assets.cropImages),
        cropPresets: normalizeCharacterCropPresets(assets.cropPresets)
      });
      renderCharacterCropEditor();
    }

    function renderCharacterCropEditor() {
      const section = document.getElementById("character-crop-editor");
      if (!section) return;

      const state = getCropEditorState();
      const activeKey = getActiveCropPresetKey();
      const activePreset = state.cropPresets[activeKey] || normalizeCharacterCropPresets(null)[activeKey];
      section.hidden = !state.imageSrc;
      section.querySelectorAll("[data-crop-preset]").forEach(button => {
        button.classList.toggle("active", button.dataset.cropPreset === activeKey);
      });
      section.querySelectorAll("[data-crop-card]").forEach(card => {
        card.classList.toggle("active", card.dataset.cropCard === activeKey);
      });

      cropPresetDefs.forEach(preset => {
        const image = section.querySelector(`#character-crop-preview-${preset.key}`);
        if (image) image.src = state.cropImages[preset.key] || state.imageSrc;
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
      const state = getCropEditorState();
      if (state.imageSrc === image) {
        if (!hasAnyCropImage(state.cropImages)) {
          await rerenderCharacterCropImages();
        }
        return {
          cropImages: normalizeCharacterCropImages(state.cropImages),
          cropPresets: normalizeCharacterCropPresets(state.cropPresets)
        };
      }
      return generateCharacterCropAssets(image, existing?.cropPresets || null);
    }

    function hasAnyCropImage(cropImages) {
      const normalized = normalizeCharacterCropImages(cropImages);
      return Object.values(normalized).some(Boolean);
    }

    return {
      ensureCharacterCropEditor,
      handleCharacterImageChange,
      clearCharacterImage,
      setCharacterCropEditorState,
      clearCharacterCropEditorState,
      updateActiveCropPreset,
      scheduleCharacterCropRender,
      rerenderCharacterCropImages,
      renderCharacterCropEditor,
      resolveCharacterCropAssets,
      hasAnyCropImage,
    };
  }

  window.CardEditorCropRuntime = {
    create: createCardEditorCropRuntime
  };
})();
