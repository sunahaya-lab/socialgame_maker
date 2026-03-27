(function () {
  function createEditorLegacyHost(deps) {
    const {
      api,
      legacyApi,
      onAfterRender,
      onAfterEnsure,
      onAfterClose,
      onAfterActivate
    } = deps;

    function getLegacyMethod(name) {
      if (legacyApi && typeof legacyApi[name] === "function") {
        return legacyApi[name];
      }
      const direct = api?.[name];
      return typeof direct === "function" ? direct.bind(api) : null;
    }

    const legacyRenderEditorScreen = getLegacyMethod("renderEditorScreen");
    const legacyEnsureEditorWindows = getLegacyMethod("ensureEditorWindows");
    const legacyActivateEditorTab = getLegacyMethod("activateEditorTab");
    const legacyCloseAllEditorWindows = getLegacyMethod("closeAllEditorWindows");

    function render() {
      legacyRenderEditorScreen?.();
      onAfterRender?.();
    }

    function ensure() {
      legacyEnsureEditorWindows?.();
      onAfterEnsure?.();
    }

    function closeAll() {
      legacyCloseAllEditorWindows?.();
      onAfterClose?.();
    }

    function activate(tabName) {
      legacyActivateEditorTab?.(tabName);
      onAfterActivate?.(tabName);
    }

    return {
      render,
      ensure,
      closeAll,
      activate
    };
  }

  window.EditorLegacyHost = {
    create: createEditorLegacyHost
  };
})();
