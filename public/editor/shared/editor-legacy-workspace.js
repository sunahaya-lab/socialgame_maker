(function () {
  function createEditorLegacyWorkspace(deps) {
    const {
      legacyBridge,
      ensureDashboardLauncher,
      bindWindowCloseRestore,
      onRenderDashboard,
      onShowDashboard,
      onCloseAuxWindows
    } = deps;

    function ensure() {
      legacyBridge?.ensureEditorWindowSet?.() || legacyBridge?.ensureEditorWindows?.();
      legacyBridge?.removeLegacyChrome?.();
      ensureDashboardLauncher?.();
      bindWindowCloseRestore?.();
    }

    function render() {
      legacyBridge?.renderEditorScreen?.();
      ensure();
      onRenderDashboard?.();
      onShowDashboard?.();
      onCloseAuxWindows?.();
    }

    return {
      ensure,
      render
    };
  }

  window.SociaEditorLegacyWorkspace = {
    create: createEditorLegacyWorkspace
  };
})();
