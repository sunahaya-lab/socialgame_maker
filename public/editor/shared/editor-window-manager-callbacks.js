(function () {
  function createEditorWindowManagerCallbacks(deps) {
    const {
      legacyWorkspace,
      legacyBridge,
      api,
      getEditingFeaturedIds
    } = deps;

    function onEnsureWindow() {
      legacyWorkspace?.ensure?.();
      return true;
    }

    function onOpenWindow(key) {
      legacyWorkspace?.ensure?.();
      legacyBridge?.closeAllEditorWindows?.();
      legacyBridge?.openEditorWindowByTab?.(key) || legacyBridge?.activateEditorTab?.(key);
      if (key === "gacha") {
        api?.renderGachaPoolChars?.(getEditingFeaturedIds?.());
      }
      if (key === "system") {
        api?.renderEditorScreen?.();
        api?.ensureEditorWindows?.();
      }
      return true;
    }

    function onCloseWindow(key) {
      legacyBridge?.closeEditorWindowByTab?.(key);
      return true;
    }

    function onCloseAllWindows() {
      legacyBridge?.closeAllEditorWindows?.();
    }

    return {
      onEnsureWindow,
      onOpenWindow,
      onCloseWindow,
      onCloseAllWindows
    };
  }

  window.SociaEditorWindowManagerCallbacks = {
    create: createEditorWindowManagerCallbacks
  };
})();
