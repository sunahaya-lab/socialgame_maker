(function () {
  function createRuntime(deps) {
    const {
      navigation,
      renderTitleScreen,
      renderHomeScreen,
      renderEditorApp
    } = deps;

    function refreshCurrentScreen() {
      const screen = navigation?.getCurrentScreen?.() || "home";
      if (screen === "title") {
        renderTitleScreen?.();
        return screen;
      }
      if (screen === "editor") {
        renderEditorApp?.();
        return screen;
      }
      renderHomeScreen?.();
      return screen;
    }

    function renderAll() {
      return refreshCurrentScreen();
    }

    async function init() {
      return renderAll();
    }

    return {
      init,
      renderAll,
      refreshCurrentScreen
    };
  }

  window.SociaRuntimeCore = {
    create: createRuntime
  };
})();
