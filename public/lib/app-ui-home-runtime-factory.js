(() => {
  function create(deps = {}) {
    let appUiModuleApi = null;
    let appHomeModuleApi = null;

    function ensureAppUiApi() {
      if (!appUiModuleApi) {
        appUiModuleApi = window.AppUiLib.create({
          getCollectionScreen: deps.getCollectionScreen,
          getFormationScreen: deps.getFormationScreen,
          getEditorScreen: deps.getEditorScreen,
          populateFolderSelects: deps.populateFolderSelects,
          refreshTitleScreen: deps.refreshTitleScreen,
          renderHome: deps.renderHome,
          renderBattleScreen: deps.renderBattleScreen,
          readFileAsDataUrl: deps.readFileAsDataUrl,
          makeBaseCharFallback: deps.makeBaseCharFallback,
          makeFallbackImage: deps.makeFallbackImage,
          esc: deps.esc,
          showToast: deps.showToast,
          getSystemConfig: deps.getSystemConfig,
          baseCharVoiceLineDefs: deps.baseCharVoiceLineDefs,
          baseCharHomeVoiceDefs: deps.baseCharHomeVoiceDefs
        });
      }
      return appUiModuleApi;
    }

    function ensureAppHomeApi() {
      if (!appHomeModuleApi) {
        appHomeModuleApi = window.AppHomeLib.create({
          getCurrentScreen: deps.getCurrentScreen,
          getCharacters: deps.getCharacters,
          getStories: deps.getStories,
          getGachas: deps.getGachas,
          getAnnouncements: deps.getAnnouncements,
          getBaseCharById: deps.getBaseCharById,
          getEffectiveHomeVoices: deps.getEffectiveHomeVoices,
          getEffectiveHomeBirthdays: deps.getEffectiveHomeBirthdays,
          getEffectiveHomeOpinions: deps.getEffectiveHomeOpinions,
          getEffectiveHomeConversations: deps.getEffectiveHomeConversations,
          isBaseCharBirthdayToday: deps.isBaseCharBirthdayToday,
          isHomeEventActive: deps.isHomeEventActive,
          getSystemConfig: deps.getSystemConfig,
          setSystemConfig: deps.setSystemConfig,
          getPlayerState: deps.getPlayerState,
          setPlayerState: deps.setPlayerState,
          getCurrentProjectId: deps.getCurrentProjectId,
          getHomeConfigDraft: deps.getHomeConfigDraft,
          setHomeConfigDraft: deps.setHomeConfigDraft,
          getActiveHomeConfigTarget: deps.getActiveHomeConfigTarget,
          setActiveHomeConfigTarget: deps.setActiveHomeConfigTarget,
          getHomeConfigDrag: deps.getHomeConfigDrag,
          setHomeConfigDrag: deps.setHomeConfigDrag,
          getBattleState: deps.getBattleState,
          getHomeDialogueState: deps.getHomeDialogueState,
          setHomeDialogueState: deps.setHomeDialogueState,
          getActiveGacha: deps.getActiveGacha,
          getDefaultHomeConfig: deps.getDefaultHomeConfig,
          normalizeHomePreferences: deps.normalizeHomePreferences,
          loadLocal: deps.loadLocal,
          saveLocal: deps.saveLocal,
          postJSON: deps.postJSON,
          getPlayerApiUrl: deps.getPlayerApiUrl,
          API: deps.API,
          getHomeLayoutPreset: deps.getHomeLayoutPreset,
          getHomeCharacterBaseOffset: deps.getHomeCharacterBaseOffset,
          syncRecoveredCurrenciesInMemory: deps.syncRecoveredCurrenciesInMemory,
          formatCurrencyBalance: deps.formatCurrencyBalance,
          navigateTo: deps.navigateTo,
          getCharacterImageForUsage: deps.getCharacterImageForUsage,
          makeFallbackImage: deps.makeFallbackImageForHome,
          buildGachaRateSummary: deps.buildGachaRateSummary,
          getBattleParty: deps.getBattleParty,
          getGachaHeroImages: deps.getGachaHeroImages,
          normalizeLayoutAssetRecord: deps.normalizeLayoutAssetRecord,
          getCurrentLayoutOwnerId: deps.getCurrentLayoutOwnerId,
          getHomeAssetFolders: deps.getHomeAssetFolders,
          resolveHomeAssetFolderAssets: deps.resolveHomeAssetFolderAssets,
          upsertHomeLayoutAssetInConfig: deps.upsertHomeLayoutAssetInConfig,
          persistSystemConfigState: deps.persistSystemConfigState,
          renderHome: deps.renderHome,
          showToast: deps.showToastForHome,
          esc: deps.escForHome,
          clamp: deps.clamp
        });
      }
      return appHomeModuleApi;
    }

    return {
      ensureAppUiApi,
      ensureAppHomeApi
    };
  }

  window.AppUiHomeRuntimeFactoryLib = {
    create
  };
})();
