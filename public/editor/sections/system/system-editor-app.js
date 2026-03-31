(function () {
  function setupSystemEditor(deps) {
    const api = createSystemEditor(deps);

    api.ensureTitleScreenControls();
    api.ensureBattleSystemControls();
    document.getElementById("system-form").addEventListener("submit", api.handleSystemSubmit);
    document.querySelector("#system-form select[name='rarityMode']").addEventListener("change", api.handleSystemModePreview);

    return api;
  }

  function createSystemEditor(deps) {
    const {
      getSystemConfig,
      setSystemConfig,
      getStories,
      getCurrentScreen,
      readFileAsDataUrl,
      saveConfig,
      renderAll,
      applyOrientation,
      refreshCollection,
      refreshGacha,
      getFeatureAccess,
      rarityApi,
      showToast
    } = deps;

    const titleController = window.SystemEditorTitleLib?.create?.({
      getSystemConfig,
      readFileAsDataUrl
    });
    const battleController = window.SystemEditorBattleLib?.create?.({
      getFeatureAccess,
      rarityApi
    });
    const formController = window.SystemEditorFormLib?.create?.({
      getSystemConfig,
      setSystemConfig,
      getCurrentScreen,
      getFeatureAccess,
      titleController,
      rarityApi,
      saveConfig,
      applyOrientation,
      renderAll,
      refreshCollection,
      refreshGacha,
      renderSystemPreview: () => renderSystemPreview(),
      renderTitleScreenPreview: () => renderTitleScreenPreview(),
      refreshBattlePackUi: () => refreshBattlePackUi(),
      showToast
    });

    function ensureTitleScreenControls() {
      return titleController?.ensureTitleScreenControls?.();
    }

    function renderSystemForm() {
      return formController?.renderSystemForm?.();
    }

    function renderCharacterRarityOptions(selectedValue) {
      return formController?.renderCharacterRarityOptions?.(selectedValue);
    }

    function renderGachaRateInputs(values) {
      return formController?.renderGachaRateInputs?.(values);
    }

    function handleSystemModePreview(event) {
      return formController?.handleSystemModePreview?.(event);
    }

    async function handleSystemSubmit(event) {
      return formController?.handleSystemSubmit?.(event);
    }

    function ensureBattleSystemControls() {
      return battleController?.ensureBattleSystemControls?.();
    }

    function renderSystemPreview() {
      return battleController?.renderSystemPreview?.();
    }

    async function refreshBattlePackUi() {
      return battleController?.refreshBattlePackUi?.();
    }

    function renderTitleScreenPreview() {
      return titleController?.renderTitleScreenPreview?.();
    }

    return {
      ensureTitleScreenControls,
      ensureBattleSystemControls,
      refreshBattlePackUi,
      renderSystemForm,
      renderTitleScreenPreview,
      renderSystemPreview,
      renderCharacterRarityOptions,
      renderGachaRateInputs,
      handleSystemModePreview,
      handleSystemSubmit
    };
  }

  window.SociaSystemEditorApp = {
    setup: setupSystemEditor,
    create: createSystemEditor
  };
})();
