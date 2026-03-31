(() => {
  function create(deps = {}) {
    let contentStateModuleApi = null;
    let appInitRuntimeApi = null;

    function ensureContentStateApi() {
      if (!contentStateModuleApi) {
        contentStateModuleApi = deps.contentStateFactory.create({
          clamp: deps.clamp,
          normalizeRates: deps.normalizeRates,
          getRarityModeConfig: deps.getRarityModeConfig,
          getRarityLabel: deps.getRarityLabel
        });
      }
      return contentStateModuleApi;
    }

    function ensureAppInitRuntimeApi() {
      if (!appInitRuntimeApi) {
        appInitRuntimeApi = window.SociaAppInitRuntime?.create?.({
          applyAppMode: deps.applyAppMode,
          currentMode: deps.currentMode,
          ensureAuthUi: deps.ensureAuthUi,
          restoreSession: deps.restoreSession,
          ensureEditorFolderControls: deps.ensureEditorFolderControls,
          setupCollectionScreen: deps.setupCollectionScreen,
          setupFormationScreen: deps.setupFormationScreen,
          setupGachaScreen: deps.setupGachaScreen,
          setupStoryScreen: deps.setupStoryScreen,
          setupEventScreen: deps.setupEventScreen,
          setupSystemEditor: deps.setupSystemEditor,
          setupEntryEditor: deps.setupEntryEditor,
          setupEquipmentCardEditor: deps.setupEquipmentCardEditor,
          setupBaseCharEditor: deps.setupBaseCharEditor,
          setupMusicEditor: deps.setupMusicEditor,
          setupAnnouncementEditor: deps.setupAnnouncementEditor,
          setupTitleEditor: deps.setupTitleEditor,
          setupStoryEditor: deps.setupStoryEditor,
          createEditorScreen: deps.createEditorScreen,
          buildEditorScreenDeps: deps.buildEditorScreenDeps,
          configurePrimaryNavigation: deps.configurePrimaryNavigation,
          openEditorScreen: deps.openEditorScreen,
          ensureBattleEntryButton: deps.ensureBattleEntryButton,
          setupNavigation: deps.setupNavigation,
          setupEditorOverlay: deps.setupEditorOverlay,
          bindEditorOverlayTabs: deps.bindEditorOverlayTabs,
          disableLegacyEditorUi: deps.disableLegacyEditorUi,
          setupEditorForms: deps.setupEditorForms,
          setupEditorPreviews: deps.setupEditorPreviews,
          setupHomeConfig: deps.setupHomeConfig,
          setupHomeInteractions: deps.setupHomeInteractions,
          setupBattleControls: deps.setupBattleControls,
          initializeProjects: deps.initializeProjects,
          loadAllData: deps.loadAllData,
          syncPlayerTitles: deps.syncPlayerTitles,
          applyOrientation: deps.applyOrientation,
          renderAll: deps.renderAll,
          setupTitleScreen: deps.setupTitleScreen,
          syncPlayerProfile: deps.syncPlayerProfile,
          getInitialScreen: deps.getInitialScreen,
          navigateTo: deps.navigateTo,
          promptForProfileSetup: deps.promptForProfileSetup
        }) || null;
      }
      return appInitRuntimeApi;
    }

    return {
      ensureContentStateApi,
      ensureAppInitRuntimeApi
    };
  }

  window.AppInitContentRuntimeFactoryLib = {
    create
  };
})();
