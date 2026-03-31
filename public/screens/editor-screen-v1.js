(function () {
  const legacyEditorScreen = window.EditorScreen;
  if (!legacyEditorScreen?.setupEditorScreen) return;

  function setupEditorScreenV1(deps) {
    const api = legacyEditorScreen.setupEditorScreen(deps);
    const host = window.EditorV1Host?.create?.({
      api,
      ...deps
    });

    if (!host) return api;

    api.renderEditorScreen = function renderEditorScreenV1() {
      host.render();
    };

    api.ensureEditorWindows = function ensureEditorWindowsV1() {
      host.ensure();
    };

    api.closeAllEditorWindows = function closeAllEditorWindowsV1() {
      host.closeAll();
    };

    api.activateEditorTab = function activateEditorTabV1(tabName) {
      host.activate(tabName);
    };

    api.openShareManagement = function openShareManagementV1() {
      host.openShareManagement();
    };

    api.openMemberManagement = function openMemberManagementV1() {
      host.openMemberManagement();
    };

    api.renderEditorScreen?.();
    return api;
  }

  window.EditorScreenV1 = {
    setupEditorScreen: setupEditorScreenV1,
    base: legacyEditorScreen
  };
})();
