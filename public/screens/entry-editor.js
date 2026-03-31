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
    // Transitional entry editor.
    // Active behavior is increasingly delegated to section-local runtimes; this
    // file still contains retained in-file reference bodies alongside runtime bridges.

    // SECTION 01: dependency intake + runtime binding
    const entryText = window.EntryEditorTextLib || null;
    const text = (key, fallback = "") => entryText?.get?.(key, fallback) || fallback;
    const {
      getCharacters,
      setCharacters,
      getBaseChars,
      getCardFolders,
      getEditState,
      getApi,
      getSystemApi,
      readFileAsDataUrl,
      uploadStaticImageAsset,
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
    const relationsApi = window.CardEditorRelationsRuntime?.create?.({
      getBaseChars,
      renderVoiceLineFields,
      collectVoiceLineFields,
      baseCharVoiceLineDefs,
      baseCharHomeVoiceDefs,
      esc,
      text
    }) || null;
    const sdApi = window.CardEditorSdRuntime?.create?.({
      text,
      esc,
      readFileAsDataUrl,
      normalizeCharacterSdImages,
      refreshBattlePackUi
    }) || null;
    const battleApi = window.CardEditorBattleRuntime?.create?.({
      text,
      esc,
      normalizeCharacterBattleKit,
      getFeatureAccess,
    }) || null;
    const cropApi = window.CardEditorCropRuntime?.create?.({
      text,
      esc,
      cropPresetDefs,
      getActiveCropPresetKey: () => activeCropPresetKey,
      setActiveCropPresetKey: value => { activeCropPresetKey = value; },
      getCropEditorState: () => cropEditorState,
      setCropEditorState: value => { cropEditorState = value; },
      getCharacterForm,
      getCharacterImageInput,
      getEditState,
      setCharacterImageCleared,
      readFileAsDataUrl,
      generateCharacterCropAssets,
      normalizeCharacterCropImages,
      normalizeCharacterCropPresets,
      clearCropEditorRenderTimer: () => window.clearTimeout(cropEditorRenderTimer),
      setCropEditorRenderTimer: value => { cropEditorRenderTimer = value; },
    }) || null;
    const formApi = window.CardEditorFormRuntime?.create?.({
      getCharacterForm,
      getCharacterFolderSelect,
      getEditState,
      getSystemApi,
      normalizeAttributeValue,
      renderCardVoiceLineFields,
      renderCardHomeVoiceLineFields,
      populateCharacterRelationFields,
      makeFallbackImage,
      setCharacterCropEditorState,
      normalizeCharacterCropPresets,
      normalizeCharacterCropImages,
      populateCharacterSdEditor,
      resetCharacterSdEditor,
      normalizeCharacterSdImages,
      populateCharacterBattleEditor,
      resetCharacterBattleEditor,
      normalizeCharacterBattleKit,
      updateEditorSubmitLabels,
      setCharacterImageCleared,
      clearCharacterRelationLists,
      clearCharacterCropEditorState,
      getAttributeFallback: () => ATTRIBUTE_FALLBACK,
      normalizeAttributeFallback: normalizeAttributeValue,
      clearCropEditorRenderTimer: () => window.clearTimeout(cropEditorRenderTimer),
    }) || null;
    const saveApi = window.CardEditorSaveRuntime?.create?.({
      text,
      getCharacters,
      setCharacters,
      getEditState,
      getApi,
      getCharacterImageInput,
      isCharacterImageCleared,
      normalizeCharacterCropImages,
      normalizeCharacterCropPresets,
      normalizeCharacterSdImages,
      normalizeCharacterBattleKit,
      normalizeRarityValue,
      normalizeAttributeValue,
      getCharacterFolderSelect,
      resolveStaticImage,
      resolveCharacterCropAssets,
      collectCharacterSdImages,
      collectCardVoiceLines,
      collectCardHomeVoiceLines,
      collectCardHomeOpinions,
      collectCardHomeConversations,
      collectCardHomeBirthdays,
      upsertItem,
      saveLocal,
      postJSON,
      showToast,
      renderEditorCharacterList,
      renderGachaPoolChars,
      getEditingFeaturedIds,
      renderHome,
      resetCharacterForm: () => formApi?.resetCharacterForm?.(),
    }) || null;

    // SECTION 02: local DOM/state helpers
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
      relationsApi?.clearCharacterRelationLists?.();
    }

    function populateCharacterRelationFields(char) {
      relationsApi?.populateCharacterRelationFields?.(char);
    }

    async function resolveStaticImage(file, options = {}, fallback = "") {
      if (!file) return fallback;
      if (typeof uploadStaticImageAsset === "function") {
        try {
          const uploaded = await uploadStaticImageAsset(file, options);
          if (uploaded?.src) return uploaded.src;
        } catch (error) {
          console.error("Failed to upload normalized card image, falling back to data URL:", error);
          showToast(text("uploadFallback", "画像アップロードに失敗したため、一時的にローカル画像を使用します。"));
        }
      }
      return readFileAsDataUrl(file);
    }

    // SECTION 03: top-level apply/save flow

    // SECTION 04A: retired crop editor retained body
    // SECTION 04B: crop editor active runtime delegation

    function ensureCharacterCropEditor() {
      return cropApi?.ensureCharacterCropEditor?.();
    }

    async function handleCharacterImageChange(event) {
      return cropApi?.handleCharacterImageChange?.(event);
    }

    function clearCharacterImage() {
      return cropApi?.clearCharacterImage?.();
    }

    async function setCharacterCropEditorState(imageSrc, cropPresets = null, cropImages = null) {
      return cropApi?.setCharacterCropEditorState?.(imageSrc, cropPresets, cropImages);
    }

    function clearCharacterCropEditorState() {
      return cropApi?.clearCharacterCropEditorState?.();
    }

    function updateActiveCropPreset(patch) {
      return cropApi?.updateActiveCropPreset?.(patch);
    }

    function scheduleCharacterCropRender() {
      return cropApi?.scheduleCharacterCropRender?.();
    }

    async function rerenderCharacterCropImages() {
      return cropApi?.rerenderCharacterCropImages?.();
    }

    function renderCharacterCropEditor() {
      return cropApi?.renderCharacterCropEditor?.();
    }

    async function resolveCharacterCropAssets(image, existing) {
      return cropApi?.resolveCharacterCropAssets?.(image, existing);
    }

    // SECTION 05A: retired SD editor retained body

    function ensureCharacterSdEditor() {
      return sdApi?.ensureCharacterSdEditor?.();
    }

    async function collectCharacterSdImages(existingSdImages) {
      return sdApi?.collectCharacterSdImages?.(existingSdImages) || normalizeCharacterSdImages(existingSdImages);
    }

    function populateCharacterSdEditor(sdImages) {
      return sdApi?.populateCharacterSdEditor?.(sdImages);
    }

    function resetCharacterSdEditor() {
      return sdApi?.resetCharacterSdEditor?.();
    }

    // SECTION 06A: retired battle editor retained body

    function ensureCharacterBattleEditor() {
      return battleApi?.ensureCharacterBattleEditor?.();
    }

    function addCharacterSkillPartRow(skillKey, part = null) {
      return battleApi?.addCharacterSkillPartRow?.(skillKey, part);
    }

    function collectCharacterBattleKit() {
      return battleApi?.collectCharacterBattleKit?.() || normalizeCharacterBattleKit(null);
    }

    function populateCharacterBattleEditor(battleKit) {
      return battleApi?.populateCharacterBattleEditor?.(battleKit);
    }

    function resetCharacterBattleEditor() {
      return battleApi?.resetCharacterBattleEditor?.();
    }


    // SECTION 07A: retired relation/home voice retained body

    function renderCardVoiceLineFields(values = {}) {
      return relationsApi?.renderCardVoiceLineFields?.(values);
    }

    function collectCardVoiceLines() {
      return relationsApi?.collectCardVoiceLines?.() || {};
    }

    function renderCardHomeVoiceLineFields(values = {}) {
      return relationsApi?.renderCardHomeVoiceLineFields?.(values);
    }

    function collectCardHomeVoiceLines() {
      return relationsApi?.collectCardHomeVoiceLines?.() || {};
    }

    // SECTION 07B: relation/home voice active runtime delegation
    function addCardHomeOpinionInput(item = null) {
      return relationsApi?.addCardHomeOpinionInput?.(item);
    }

    function addCardHomeConversationInput(item = null) {
      return relationsApi?.addCardHomeConversationInput?.(item);
    }

    function addCardHomeBirthdayInput(item = null) {
      return relationsApi?.addCardHomeBirthdayInput?.(item);
    }

    function collectCardHomeOpinions() {
      return relationsApi?.collectCardHomeOpinions?.() || [];
    }

    function collectCardHomeConversations() {
      return relationsApi?.collectCardHomeConversations?.() || [];
    }

    function collectCardHomeBirthdays() {
      return relationsApi?.collectCardHomeBirthdays?.() || [];
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
        showToast(text("folderMoveFailed", "カードのフォルダ移動保存に失敗しました。"));
      }
    }

    // SECTION 03A: retired save-path retained body

    async function handleCharacterSubmitClean(e) {
      return saveApi?.handleCharacterSubmit?.(e);
    }

    function beginCharacterEditClean(id) {
      return formApi?.beginCharacterEdit?.(id, getCharacters);
    }

    function resetCharacterFormClean() {
      return formApi?.resetCharacterForm?.();
    }

    async function refreshBattlePackUi() {
      return battleApi?.refreshBattlePackUi?.();
    }

    // SECTION 08: public editor surface
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
