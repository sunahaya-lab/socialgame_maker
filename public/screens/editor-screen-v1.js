(function () {
  const legacyEditorScreen = window.EditorScreen;
  if (!legacyEditorScreen?.setupEditorScreen) return;

  function setupEditorScreenV1(deps) {
    const api = legacyEditorScreen.setupEditorScreen(deps);
    const legacyApi = {
      renderEditorScreen: api?.renderEditorScreen?.bind(api),
      ensureEditorWindows: api?.ensureEditorWindows?.bind(api),
      closeAllEditorWindows: api?.closeAllEditorWindows?.bind(api),
      activateEditorTab: api?.activateEditorTab?.bind(api),
      ensureFolderManagerWindow: api?.ensureFolderManagerWindow?.bind(api),
      openFolderManager: api?.openFolderManager?.bind(api),
      closeFolderManager: api?.closeFolderManager?.bind(api),
      renderFolderManager: api?.renderFolderManager?.bind(api),
      renderBaseCharList: api?.renderBaseCharList?.bind(api),
      renderEditorCharacterList: api?.renderEditorCharacterList?.bind(api),
      renderEditorStoryList: api?.renderEditorStoryList?.bind(api),
      renderEditorGachaList: api?.renderEditorGachaList?.bind(api),
      renderGachaPoolChars: api?.renderGachaPoolChars?.bind(api)
    };
    api.__legacyApi = legacyApi;
    const host = window.EditorV1Host?.create?.({
      api,
      legacyApi,
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

  window.EditorScreen = {
    ...legacyEditorScreen,
    setupEditorScreen: setupEditorScreenV1
  };
})();
