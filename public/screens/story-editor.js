(function () {
  // SECTION 01: setup entrypoint
  function setupStoryEditor(deps) {
    const api = createStoryEditor(deps);

    document.getElementById("story-form").addEventListener("submit", api.handleStorySubmit);
    document.getElementById("add-scene-btn").addEventListener("click", () => api.addSceneInput());
    document.querySelector("#story-form select[name='type']").addEventListener("change", api.handleStoryTypeChange);
    document.getElementById("create-story-folder-btn")?.addEventListener("click", () => api.handleCreateStoryFolder());
    api.renderStoryBgmOptions?.();

    return api;
  }

  // SECTION 02: editor creation + dependency intake
  function createStoryEditor(deps) {
    const storyText = window.StoryEditorTextLib || null;
    const text = (key, fallback = "") => storyText?.get?.(key, fallback) || fallback;
    const PLAYER_CHARACTER_ID = "__player__";
    const PLAYER_CHARACTER_LABEL = "\u30d7\u30ec\u30a4\u30e4\u30fc";
    const {
      getStories,
      setStories,
      getBaseChars,
      getCharacters,
      getSystemConfig,
      getStoryFolders,
      getEditState,
      getApi,
      readFileAsDataUrl,
      saveLocal,
      postJSON,
      showToast,
      getFeatureAccess,
      upsertItem,
      updateEditorSubmitLabels,
      renderHome,
      renderEditorStoryList,
      createContentFolder,
      getBaseCharById,
      esc
    } = deps;
    // SECTION 03: story-local runtime handles
    const uiApi = window.StoryEditorUiRuntime?.create?.({
      text,
      esc,
      getBaseChars,
      getBaseCharById,
      getFeatureAccess,
      getSystemConfig
    }) || null;
    const lifecycleApi = window.StoryEditorLifecycleRuntime?.create?.({
      getStories,
      getEditState,
      updateEditorSubmitLabels,
      renderStoryBgmOptions: selectedValue => renderStoryBgmOptions(selectedValue),
      handleStoryTypeChange: () => handleStoryTypeChange(),
      renderStoryVariantDefaults: assignments => renderStoryVariantDefaults(assignments),
      addSceneInput: scene => addSceneInput(scene),
      refreshStoryFxUi: () => refreshStoryFxUi()
    }) || null;
    const sceneApi = window.StoryEditorSceneRuntime?.create?.({
      text,
      esc,
      getBaseChars,
      getBaseCharById,
      getSystemConfig,
      readFileAsDataUrl,
      updateSceneCharacterOptions: sceneItem => updateSceneCharacterOptions(sceneItem),
      refreshStoryFxUi: () => refreshStoryFxUi()
    }) || null;
    const saveApi = window.StoryEditorSaveRuntime?.create?.({
      text,
      getStories,
      setStories,
      getEditState,
      getApi,
      saveLocal,
      postJSON,
      showToast,
      upsertItem,
      renderHome,
      renderEditorStoryList,
      resetStoryForm: () => resetStoryForm(),
      collectStoryScenes: () => collectStoryScenes(),
      collectStoryVariantAssignments: () => collectStoryVariantAssignments()
    }) || null;

    async function handleStorySubmit(e) {
      return saveApi?.handleStorySubmit?.(e);
    }

    function collectStoryScenes() {
      const scenes = [];
      document.querySelectorAll(".scene-item").forEach(item => {
        const charId = item.querySelector("[name='scene-character-id']").value;
        const text = item.querySelector("[name='scene-text']").value.trim();
        if (!text) return;
        const baseChar = charId ? getBaseCharById(charId) : null;

        scenes.push({
          characterId: charId || null,
          character: charId === PLAYER_CHARACTER_ID ? PLAYER_CHARACTER_LABEL : (baseChar ? baseChar.name : null),
          variantName: item.querySelector("[name='scene-variant']")?.value || null,
          expressionName: item.querySelector("[name='scene-expression']")?.value || null,
          text,
          bgm: item.querySelector("[name='scene-bgm']")?.value.trim() || null,
          bgmAssetId: String(item.querySelector("[name='scene-bgm-asset-id']")?.value || "").trim() || null,
          background: item.dataset.background || null
        });
      });
      return scenes;
    }

    function collectStoryVariantAssignments() {
      return Array.from(document.querySelectorAll(".story-variant-default-item")).map(item => ({
        characterId: item.dataset.characterId,
        variantName: item.querySelector("[name='story-default-variant']").value
      })).filter(item => item.characterId && item.variantName);
    }

    // SECTION 05: active ui / lifecycle bridge
    function getStoryBillingErrorMessage(error, fallback) {
      return saveApi?.getStoryBillingErrorMessage?.(error, fallback) || fallback;
    }

    function renderStoryVariantDefaults(assignments = []) {
      return uiApi?.renderStoryVariantDefaults?.(assignments);
    }

    function addSceneInput(scene = null) {
      return sceneApi?.addSceneInput?.(scene);
    }

    function ensureStoryFxPackNote() {
      return uiApi?.ensureStoryFxPackNote?.();
    }

    function handleStoryTypeChange() {
      return uiApi?.handleStoryTypeChange?.();
    }

    function beginStoryEdit(id) {
      return lifecycleApi?.beginStoryEdit?.(id);
    }

    function resetStoryForm() {
      return lifecycleApi?.resetStoryForm?.();
    }

    async function refreshStoryFxUi() {
      return uiApi?.refreshStoryFxUi?.();
    }

    function renderStoryBgmOptions(selectedValue = "") {
      return uiApi?.renderStoryBgmOptions?.(selectedValue);
    }

    async function moveStoryOrder(storyId, direction) {
      return saveApi?.moveStoryOrder?.(storyId, direction);
    }

    async function handleCreateStoryFolder() {
      const folder = await createContentFolder("story");
      if (!folder) return;
      const select = document.querySelector("#story-form select[name='folderId']");
      if (select) select.value = folder.id;
    }

    async function assignStoryFolder(storyId, folderId) {
      return saveApi?.assignStoryFolder?.(storyId, folderId);
    }

    async function reorderStoriesInFolder(folderId, draggedId, beforeId = null) {
      return saveApi?.reorderStoriesInFolder?.(folderId, draggedId, beforeId);
    }

    async function persistStories(list) {
      return saveApi?.persistStories?.(list);
    }

    function updateSceneCharacterOptions(sceneItem) {
      return uiApi?.updateSceneCharacterOptions?.(sceneItem);
    }

    // SECTION 06: public editor surface
    return {
      handleStorySubmit,
      collectStoryScenes,
      collectStoryVariantAssignments,
      renderStoryVariantDefaults,
      renderStoryBgmOptions,
      addSceneInput,
      handleStoryTypeChange,
      beginStoryEdit,
      resetStoryForm,
      refreshStoryFxUi,
      handleCreateStoryFolder,
      moveStoryOrder,
      assignStoryFolder,
      reorderStoriesInFolder,
      updateSceneCharacterOptions
    };
  }

  window.StoryEditor = {
    setupStoryEditor,
    createStoryEditor
  };
})();




