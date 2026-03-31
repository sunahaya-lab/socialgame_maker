(function () {
  function createMusicEditorRuntime(deps) {
    const {
      getSystemConfig,
      setSystemConfig,
      getCurrentProjectId,
      getCurrentPlayerId,
      persistSystemConfigState,
      apiUrl,
      API,
      showToast,
      renderHome,
      esc
    } = deps;

    function setup() {
      return window.MusicEditor?.setupMusicEditor?.({
        getSystemConfig,
        setSystemConfig,
        getCurrentProjectId,
        getCurrentPlayerId,
        persistSystemConfigState,
        apiUrl,
        API,
        showToast,
        renderHome,
        esc
      }) || null;
    }

    return {
      setup
    };
  }

  window.SociaMusicEditorRuntime = {
    create: createMusicEditorRuntime
  };
})();
