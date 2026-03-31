(function () {
  function createTitleEditorRuntime(deps) {
    const {
      getPlayerState,
      getBaseChars,
      getSystemConfig,
      setSystemConfig,
      persistSystemConfigState,
      syncProfileUi,
      syncTitles,
      showToast,
      esc
    } = deps;

    function setup() {
      return window.TitleEditor?.setupTitleEditor?.({
        getPlayerState,
        getBaseChars,
        getSystemConfig,
        setSystemConfig,
        persistSystemConfigState,
        syncProfileUi,
        syncTitles,
        showToast,
        esc
      }) || null;
    }

    return {
      setup
    };
  }

  window.SociaTitleEditorRuntime = {
    create: createTitleEditorRuntime
  };
})();
