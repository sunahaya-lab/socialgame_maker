(function () {
  function createAppInitRuntime(deps) {
    const {
      applyAppMode,
      currentMode,
      ensureAuthUi,
      restoreSession,
      ensureEditorFolderControls,
      setupCollectionScreen,
      setupFormationScreen,
      setupGachaScreen,
      setupStoryScreen,
      setupEventScreen,
      setupSystemEditor,
      setupEntryEditor,
      setupEquipmentCardEditor,
      setupBaseCharEditor,
      setupMusicEditor,
      setupAnnouncementEditor,
      setupTitleEditor,
      setupStoryEditor,
      createEditorScreen,
      buildEditorScreenDeps,
      configurePrimaryNavigation,
      openEditorScreen,
      ensureBattleEntryButton,
      setupNavigation,
      setupEditorOverlay,
      bindEditorOverlayTabs,
      disableLegacyEditorUi,
      setupEditorForms,
      setupEditorPreviews,
      setupHomeConfig,
      setupHomeInteractions,
      setupBattleControls,
      initializeProjects,
      loadAllData,
      syncPlayerTitles,
      applyOrientation,
      renderAll,
      setupTitleScreen,
      syncPlayerProfile,
      getInitialScreen,
      navigateTo,
      promptForProfileSetup
    } = deps;

    function setupFeatureModules() {
      const modules = {
        collectionScreen: setupCollectionScreen?.() || null,
        formationScreen: setupFormationScreen?.() || null,
        gachaScreen: setupGachaScreen?.() || null,
        storyScreen: setupStoryScreen?.() || null,
        eventScreen: setupEventScreen?.() || null,
        systemEditor: setupSystemEditor?.() || null,
        entryEditor: setupEntryEditor?.() || null,
        equipmentCardEditor: setupEquipmentCardEditor?.() || null,
        baseCharEditor: setupBaseCharEditor?.() || null,
        musicEditor: setupMusicEditor?.() || null,
        announcementEditor: setupAnnouncementEditor?.() || null,
        titleEditor: setupTitleEditor?.() || null,
        storyEditor: setupStoryEditor?.() || null
      };
      modules.editorScreen = createEditorScreen?.(buildEditorScreenDeps?.(modules) || {}) || null;
      return modules;
    }

    function setupEditorAndPlayShell() {
      configurePrimaryNavigation?.({
        openEditorScreen,
        navigateTo
      });
      ensureBattleEntryButton?.(navigateTo);
      setupNavigation?.();
      setupEditorOverlay?.();
      bindEditorOverlayTabs?.();
      disableLegacyEditorUi?.();
      setupEditorForms?.();
      setupEditorPreviews?.();
      setupHomeConfig?.();
      setupHomeInteractions?.();
      setupBattleControls?.();
    }

    async function initializeDataAndUi() {
      await initializeProjects?.();
      await loadAllData?.();
      syncPlayerTitles?.({ showToast: false, render: false });
      applyOrientation?.();
      renderAll?.();
      setupTitleScreen?.();
      syncPlayerProfile?.();
      navigateTo?.(getInitialScreen?.() || "home");
      promptForProfileSetup?.();
    }

    async function init() {
      applyAppMode?.(currentMode);
      ensureAuthUi?.();
      await restoreSession?.();
      ensureEditorFolderControls?.();
      const modules = setupFeatureModules();
      setupEditorAndPlayShell();
      await initializeDataAndUi();
      return modules;
    }

    return {
      init,
      setupFeatureModules,
      setupEditorAndPlayShell,
      initializeDataAndUi
    };
  }

  window.SociaAppInitRuntime = {
    create: createAppInitRuntime
  };
})();
