(function () {
  function createAppCoreRuntimeFactory(deps) {
    // Transitional shared runtime factory.
    // This file still centralizes app-level runtime wiring for AppRuntimeLib and
    // AppDataLib, so edits here have broad bootstrap impact.

    // SECTION 01: dependency intake
    const {
      searchParams,
      roomId,
      getAuthenticatedUserId,
      getCurrentProjectId,
      getProjects,
      setProjects,
      getCurrentPlayerId,
      getCurrentMode,
      setCurrentMode,
      applyAppMode,
      getCurrentScreen,
      setCurrentScreen,
      getFormationScreen,
      getGachaScreen,
      getStoryScreen,
      getEventScreen,
      getCollectionScreen,
      getPlayerState,
      setPlayerState,
      getBaseChars,
      setBaseChars,
      getCharacters,
      setCharacters,
      getEquipmentCards,
      setEquipmentCards,
      getAnnouncements,
      setAnnouncements,
      getStories,
      setStories,
      getGachas,
      setGachas,
      getSystemConfig,
      setSystemConfig,
      getPartyFormation,
      setPartyFormation,
      setBattleState,
      apiUrl,
      API,
      apiGet,
      apiPost,
      fetchJSON,
      postJSON,
      storageLoadLocal,
      storageSaveLocal,
      storageGetScopedStorageKey,
      getDefaultRarityMode,
      getDefaultSystemConfig,
      getDefaultPlayerState,
      getDefaultPartyFormation,
      getDefaultBattleState,
      normalizeCharacterRecord,
      normalizeStoryRecord,
      normalizeFolderList,
      normalizeLayoutAssetRecord,
      normalizeAssetFoldersConfig,
      createDefaultHomeAssetFolder,
      normalizeProjectRecord,
      makeProjectRecord,
      getCurrentProject,
      resetEditState,
      syncProjectQuery,
      normalizePartyFormation,
      mergePlayerState,
      normalizePlayerCurrencies,
      getRecoveredCurrency,
      mergeCollectionState,
      loadProjectRegistry,
      saveProjectRegistry,
      loadAllData,
      resetEditorForms,
      renderAll,
      renderHome,
      renderBattleScreen,
      startBattleLoop,
      stopBattleLoop,
      closeHomeEditMode,
      showToast,
      esc,
      renderHomeCurrencies,
      getCurrentLayoutOwnerId
    } = deps;

    let appRuntimeModuleApi = null;
    let appDataModuleApi = null;

    // AppRuntimeLib bundle:
    // allowed to know app-level navigation, project switching, and screen render entrypoints.
    // do not add raw player-state mutation helpers or editor section-local behavior here.
    function buildAppRuntimeDeps() {
      return {
        getProjects,
        setProjects,
        getCurrentProjectId,
        getCurrentPlayerId,
        setCurrentProjectId: value => deps.setCurrentProjectId(value),
        getCurrentMode,
        setCurrentMode,
        applyAppMode,
        getCurrentScreen,
        setCurrentScreen,
        getFormationScreen,
        getGachaScreen,
        getStoryScreen,
        getEventScreen,
        getCollectionScreen,
        apiUrl,
        API,
        fetchJSON,
        postJSON,
        mergeCollectionState,
        loadProjectRegistry,
        saveProjectRegistry,
        normalizeProjectRecord,
        makeProjectRecord,
        getCurrentProject,
        resetEditState,
        syncProjectQuery,
        loadAllData,
        resetEditorForms,
        renderAll,
        renderHome,
        renderBattleScreen,
        renderGachaScreen: () => getGachaScreen()?.renderGachaScreen?.(),
        renderStoryScreen: () => getStoryScreen()?.renderStoryScreen?.(),
        renderEventScreen: () => getEventScreen()?.renderEventScreen?.(),
        renderCollectionScreen: () => getCollectionScreen()?.renderCollectionScreen?.(),
        renderFormationScreen: () => getFormationScreen()?.renderFormationScreen?.(),
        startBattleLoop,
        stopBattleLoop,
        closeHomeEditMode,
        showToast,
        esc
      };
    }

    // AppDataLib bundle:
    // allowed to know storage, normalization, player/data state, and data-facing render sync.
    // do not add screen-local UI workflow or editor section-local behavior here.
    function buildAppDataDeps() {
      return {
        searchParams,
        roomId,
        getAuthenticatedUserId,
        getCurrentProjectId,
        getPlayerState,
        setPlayerState,
        getBaseChars,
        setBaseChars,
        getCharacters,
        setCharacters,
        getEquipmentCards,
        setEquipmentCards,
        getAnnouncements,
        setAnnouncements,
        getStories,
        setStories,
        getGachas,
        setGachas,
        getSystemConfig,
        setSystemConfig,
        getPartyFormation,
        setPartyFormation,
        setBattleState,
        apiUrl,
        API,
        apiGet,
        apiPost,
        storageLoadLocal,
        storageSaveLocal,
        storageGetScopedStorageKey,
        getDefaultSystemConfig: () => getDefaultSystemConfig(getDefaultRarityMode()),
        getDefaultPlayerState,
        getDefaultPartyFormation,
        getDefaultBattleState,
        normalizeCharacterRecord,
        normalizeStoryRecord,
        normalizeFolderList,
        normalizeLayoutAssetRecord,
        normalizeAssetFoldersConfig,
        createDefaultHomeAssetFolder,
        normalizePartyFormation,
        mergePlayerState,
        normalizePlayerCurrencies,
        getRecoveredCurrency,
        getCurrentScreen,
        renderHomeCurrencies
      };
    }

    // SECTION 02: app runtime module bootstrap
    function ensureAppRuntimeApi() {
      if (!appRuntimeModuleApi) {
        appRuntimeModuleApi = window.AppRuntimeLib.create(buildAppRuntimeDeps());
      }
      return appRuntimeModuleApi;
    }

    // SECTION 03: app data module bootstrap
    function ensureAppDataApi() {
      if (!appDataModuleApi) {
        appDataModuleApi = window.AppDataLib.create(buildAppDataDeps());
      }
      return appDataModuleApi;
    }

    // SECTION 04: public factory surface
    return {
      ensureAppRuntimeApi,
      ensureAppDataApi
    };
  }

  window.AppCoreRuntimeFactoryLib = {
    create: createAppCoreRuntimeFactory
  };
})();
