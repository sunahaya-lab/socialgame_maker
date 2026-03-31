(function () {
  function createEditorLegacyBridge(deps) {
    const { api } = deps;

    function removeLegacyChrome() {
      const overlay = document.getElementById("screen-editor");
      if (!overlay) return;
      overlay.querySelector(".screen-header")?.remove();
      overlay.querySelector(".editor-tabs")?.remove();
      overlay.classList.add("editor-window-mode");
    }

    function getMethod(name) {
      const direct = api?.[name];
      return typeof direct === "function" ? direct.bind(api) : null;
    }

    return {
      removeLegacyChrome,
      renderEditorScreen: getMethod("renderEditorScreen"),
      ensureEditorWindows: getMethod("ensureEditorWindows"),
      activateEditorTab: getMethod("activateEditorTab"),
      closeAllEditorWindows: getMethod("closeAllEditorWindows"),
      ensureEditorWindowSet: getMethod("ensureEditorWindowSet"),
      openEditorWindowByTab: getMethod("openEditorWindowByTab"),
      closeEditorWindowByTab: getMethod("closeEditorWindowByTab")
    };
  }

  window.SociaEditorLegacyBridge = {
    create: createEditorLegacyBridge
  };
})();
