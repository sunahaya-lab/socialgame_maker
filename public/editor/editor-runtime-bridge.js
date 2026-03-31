(function () {
  function createEditorRuntimeBridge() {
    function createActiveEditorScreen({ runtimeName, deps }) {
      const baseEditorScreen = window.EditorScreen;
      if (!baseEditorScreen?.setupEditorScreen) return null;
      const api = baseEditorScreen.setupEditorScreen(deps);
      const createEditorHost =
        window.SociaEditorV1HostApp?.create ||
        window.EditorV1Host?.create ||
        null;
      if (runtimeName !== "v1" || !createEditorHost) {
        return api;
      }
      const host = createEditorHost({
        api,
        ...deps
      });
      if (!host) return api;
      return {
        ...api,
        renderEditorScreen() {
          host.render();
        },
        ensureEditorWindows() {
          host.ensure();
        },
        closeAllEditorWindows() {
          host.closeAll();
        },
        activateEditorTab(tabName) {
          host.activate(tabName);
        },
        openShareManagement() {
          host.openShareManagement();
        },
        openMemberManagement() {
          host.openMemberManagement();
        }
      };
    }

    return {
      createActiveEditorScreen
    };
  }

  window.SociaEditorRuntimeBridge = {
    create: createEditorRuntimeBridge
  };
})();
