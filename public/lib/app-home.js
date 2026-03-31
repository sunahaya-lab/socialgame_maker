(function () {
  function createAppHomeModule(deps) {
    const {
      getCurrentScreen,
      getCharacters,
      getStories,
      getGachas,
      getAnnouncements,
      getBaseCharById,
      getEffectiveHomeVoices,
      getEffectiveHomeBirthdays,
      getEffectiveHomeOpinions,
      getEffectiveHomeConversations,
      isBaseCharBirthdayToday,
      isHomeEventActive,
      getSystemConfig,
      getPlayerState,
      setPlayerState,
      getCurrentProjectId,
      getHomeConfigDraft,
      setHomeConfigDraft,
      getActiveHomeConfigTarget,
      setActiveHomeConfigTarget,
      getHomeConfigDrag,
      setHomeConfigDrag,
      getBattleState,
      getHomeDialogueState,
      setHomeDialogueState,
      getActiveGacha,
      getDefaultHomeConfig,
      normalizeHomePreferences,
      loadLocal,
      saveLocal,
      postJSON,
      getPlayerApiUrl,
      API,
      getHomeLayoutPreset,
      getHomeCharacterBaseOffset,
      syncRecoveredCurrenciesInMemory,
      formatCurrencyBalance,
      getCharacterImageForUsage,
      makeFallbackImage,
      buildGachaRateSummary,
      navigateTo,
      getBattleParty,
      getGachaHeroImages,
      normalizeLayoutAssetRecord,
      getCurrentLayoutOwnerId,
      getHomeAssetFolders,
      resolveHomeAssetFolderAssets,
      upsertHomeLayoutAssetInConfig,
      persistSystemConfigState,
      renderHome: renderHomeExternal,
      showToast
    } = deps;

    let homeLayoutOverlayApi = null;
    let homeEditWorkspaceApi = null;
    let homeScreenApi = null;
    let homeConfigApi = null;

    function ensureHomeConfigApi() {
      if (!homeConfigApi) {
        homeConfigApi = window.HomeConfigModule.create({
          getPlayerState,
          setPlayerState,
          getCurrentProjectId,
          getHomeConfigDraft,
          setHomeConfigDraft,
          getActiveHomeConfigTarget,
          setActiveHomeConfigTarget,
          getHomeConfigDrag,
          setHomeConfigDrag,
          getCharacters,
          getSystemConfig,
          getDefaultHomeConfig,
          normalizeHomePreferences,
          loadLocal,
          saveLocal,
          postJSON,
          getPlayerApiUrl,
          API,
          renderHome: renderHomeExternal,
          showToast,
          esc: deps.esc,
          makeFallbackImage,
          clamp: deps.clamp
        });
      }
      return homeConfigApi;
    }

    function ensureHomeScreenApi() {
      if (!homeScreenApi) {
        homeScreenApi = window.HomeScreenModule.create({
          getCharacters,
          getStories,
          getGachas,
          getAnnouncements,
          getSystemConfig,
          getCurrentScreen,
          getPlayerState,
          getHomeDialogueState,
          setHomeDialogueState,
          loadHomeConfig,
          getHomeLayoutPreset,
          getHomeCharacterBaseOffset,
          renderHomeLayoutOverlay,
          syncRecoveredCurrenciesInMemory,
          formatCurrencyBalance,
          makeFallbackImage,
          esc: deps.esc,
          buildGachaRateSummary,
          navigateTo,
          getBaseCharById,
          getEffectiveHomeVoices,
          getEffectiveHomeBirthdays,
          getEffectiveHomeOpinions,
          getEffectiveHomeConversations,
          isBaseCharBirthdayToday,
          isHomeEventActive
        });
      }
      return homeScreenApi;
    }

    function loadHomeConfig() {
      return ensureHomeConfigApi().loadHomeConfig();
    }

    async function saveHomeConfig(config) {
      return ensureHomeConfigApi().saveHomeConfig(config);
    }

    function openHomeConfigPanel() {
      return ensureHomeConfigApi().openHomeConfigPanel();
    }

    function closeHomeConfigPanel() {
      return ensureHomeConfigApi().closeHomeConfigPanel();
    }

    function setupHomeConfig() {
      return ensureHomeConfigApi().setupHomeConfig();
    }

    function syncHomeConfigForm() {
      return ensureHomeConfigApi().syncHomeConfigForm();
    }

    function syncHomeConfigScale() {
      return ensureHomeConfigApi().syncHomeConfigScale();
    }

    function populateHomeCardSelects() {
      return ensureHomeConfigApi().populateHomeCardSelects();
    }

    function populateHomeBackgroundSelect() {
      return ensureHomeConfigApi().populateHomeBackgroundSelect();
    }

    function renderHomeConfigStage() {
      return ensureHomeConfigApi().renderHomeConfigStage();
    }

    function renderHomeConfigStageChar(index) {
      return ensureHomeConfigApi().renderHomeConfigStageChar(index);
    }

    function beginHomeConfigDrag(event, index) {
      return ensureHomeConfigApi().beginHomeConfigDrag(event, index);
    }

    function updateHomeConfigDrag(event) {
      return ensureHomeConfigApi().updateHomeConfigDrag(event);
    }

    function endHomeConfigDrag(event) {
      return ensureHomeConfigApi().endHomeConfigDrag(event);
    }

    function renderHome(reason = "refresh") {
      return ensureHomeScreenApi().renderHome(reason);
    }

    function renderHomeCurrencies() {
      return ensureHomeScreenApi().renderHomeCurrencies();
    }

    function renderAnnouncements() {
      return ensureHomeScreenApi().renderAnnouncements?.();
    }

    function setupHomeInteractions() {
      return ensureHomeScreenApi().setupHomeInteractions();
    }

    function triggerHomeDialogue(index) {
      return ensureHomeScreenApi().triggerHomeDialogue(index);
    }

    function syncHomeDialogue(card1, card2, reason) {
      return ensureHomeScreenApi().syncHomeDialogue(card1, card2, reason);
    }

    function applyHomeDialogue() {
      return ensureHomeScreenApi().applyHomeDialogue();
    }

    function ensureHomeLayoutOverlayApi() {
      if (!homeLayoutOverlayApi) {
        homeLayoutOverlayApi = window.HomeLayoutOverlayModule.create({
          getCharacters,
          getStories,
          getGachas,
          getSystemConfig,
          getPlayerState,
          getBattleState,
          getHomeDialogueState,
          getActiveGacha,
          loadHomeConfig,
          getHomeLayoutPreset,
          syncRecoveredCurrenciesInMemory,
          formatCurrencyBalance,
          getCharacterImageForUsage,
          makeFallbackImage,
          buildGachaRateSummary,
          getBattleParty,
          getGachaHeroImages,
          normalizeLayoutAssetRecord
        });
      }
      return homeLayoutOverlayApi;
    }

    function ensureHomeEditWorkspaceApi() {
      if (!homeEditWorkspaceApi) {
        homeEditWorkspaceApi = window.HomeEditWorkspaceModule?.create?.({
          getSystemConfig,
          setSystemConfig: deps.setSystemConfig,
          getHomeLayoutPreset,
          getCurrentLayoutOwnerId,
          getHomeAssetFolders,
          resolveHomeAssetFolderAssets,
          upsertHomeLayoutAssetInConfig,
          persistSystemConfigState,
          renderHome: renderHomeExternal,
          showToast
        }) || null;
      }
      return homeEditWorkspaceApi;
    }

    function openHomeEditMode() {
      return ensureHomeEditWorkspaceApi()?.openHomeEditMode?.() || null;
    }

    function closeHomeEditMode() {
      return ensureHomeEditWorkspaceApi()?.closeHomeEditMode?.() || null;
    }

    function buildLayoutRuntimeState() {
      return ensureHomeLayoutOverlayApi().buildLayoutRuntimeState();
    }

    function getHomeEventBannerData() {
      return ensureHomeLayoutOverlayApi().getHomeEventBannerData();
    }

    function getHomePlayerName() {
      return ensureHomeLayoutOverlayApi().getHomePlayerName();
    }

    function buildLayoutAssetMap() {
      return ensureHomeLayoutOverlayApi().buildLayoutAssetMap();
    }

    function renderHomeLayoutOverlay(layoutPreset = getHomeLayoutPreset()) {
      const result = ensureHomeLayoutOverlayApi().renderHomeLayoutOverlay(layoutPreset);
      ensureHomeEditWorkspaceApi()?.sync?.();
      return result;
    }

    return {
      loadHomeConfig,
      saveHomeConfig,
      openHomeConfigPanel,
      closeHomeConfigPanel,
      setupHomeConfig,
      syncHomeConfigForm,
      syncHomeConfigScale,
      populateHomeCardSelects,
      populateHomeBackgroundSelect,
      renderHomeConfigStage,
      renderHomeConfigStageChar,
      beginHomeConfigDrag,
      updateHomeConfigDrag,
      endHomeConfigDrag,
      renderHome,
      renderHomeCurrencies,
      renderAnnouncements,
      setupHomeInteractions,
      triggerHomeDialogue,
      syncHomeDialogue,
      applyHomeDialogue,
      openHomeEditMode,
      closeHomeEditMode,
      buildLayoutRuntimeState,
      getHomeEventBannerData,
      getHomePlayerName,
      buildLayoutAssetMap,
      renderHomeLayoutOverlay
    };
  }

  window.AppHomeLib = {
    create: createAppHomeModule
  };
})();
