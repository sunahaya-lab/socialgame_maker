/* Mainline editor runtime factory.
 * Role: centralizes `AppEditorLib` construction on the editor mainline side.
 * Compatibility adapters may still expose this through legacy globals during transition.
 */
(function () {
  function create(deps = {}) {
    // SECTION 01: cached editor runtime facade
    let appEditorModuleApi = null;

    // SECTION 02: shared AppEditorLib wiring
    function ensureAppEditorApi() {
      if (!appEditorModuleApi) {
        appEditorModuleApi = window.AppEditorLib.create({
          getRoomId: deps.getRoomId,
          getCurrentPlayerId: deps.getCurrentPlayerId,
          getCurrentProjectId: deps.getCurrentProjectId,
          getEditState: deps.getEditState,
          getGachas: deps.getGachas,
          setGachas: deps.setGachas,
          getStories: deps.getStories,
          getCharacters: deps.getCharacters,
          getBaseChars: deps.getBaseChars,
          getSystemConfig: deps.getSystemConfig,
          setSystemConfig: deps.setSystemConfig,
          getBaseCharEditor: deps.getBaseCharEditor,
          getEntryEditor: deps.getEntryEditor,
          getStoryEditor: deps.getStoryEditor,
          getSystemEditor: deps.getSystemEditor,
          getEditorScreen: deps.getEditorScreen,
          readFileAsDataUrl: deps.readFileAsDataUrl,
          getDefaultRates: deps.getDefaultRates,
          getRarityModeConfig: deps.getRarityModeConfig,
          getRarityLabel: deps.getRarityLabel,
          getBaseCharById: deps.getBaseCharById,
          apiUrl: deps.apiUrl,
          API: deps.API,
          fetchJSON: deps.fetchJSON,
          postJSON: deps.postJSON,
          createProjectMembersRuntime: deps.createProjectMembersRuntime,
          saveLocal: deps.saveLocal,
          renderHome: deps.renderHome,
          renderEditorScreen: deps.renderEditorScreen,
          renderGachaPoolChars: deps.renderGachaPoolChars,
          showToast: deps.showToast,
          esc: deps.esc,
          getDefaultSystemConfig: deps.getDefaultSystemConfig
        });
      }
      return appEditorModuleApi;
    }

    // SECTION 03: public factory surface
    return {
      ensureAppEditorApi
    };
  }

  window.SociaEditorRuntimeFactory = {
    create
  };
})();
