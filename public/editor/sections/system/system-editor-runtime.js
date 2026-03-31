(function () {
  function createSystemEditorRuntime(deps) {
    const {
      getSystemConfig,
      setSystemConfig,
      getEditState,
      getGachas,
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

    function setup() {
      return window.SystemEditor?.setupSystemEditor?.({
        getSystemConfig,
        setSystemConfig,
        getEditState,
        getEditStateObject: getEditState,
        getGachas,
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
      }) || null;
    }

    return {
      setup
    };
  }

  window.SociaSystemEditorRuntime = {
    create: createSystemEditorRuntime
  };
})();
