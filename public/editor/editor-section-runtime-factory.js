/* Mainline editor section runtime factory.
 * Role: centralizes editor section runtime wiring for the active editor runtime
 * from `public/editor/`.
 */
(() => {
  function create(deps = {}) {
    // SECTION 01: cached runtime handles
    let systemEditorRuntimeApi = null;
    let announcementEditorRuntimeApi = null;
    let musicEditorRuntimeApi = null;
    let storyEditorRuntimeApi = null;
    let entryEditorRuntimeApi = null;
    let equipmentCardEditorRuntimeApi = null;
    let baseCharEditorRuntimeApi = null;
    let titleEditorRuntimeApi = null;

    // SECTION 02: system / notices / music runtime wiring
    function ensureSystemEditorRuntimeApi() {
      if (!systemEditorRuntimeApi) {
        const runtimeDeps = deps.systemEditor || {};
        systemEditorRuntimeApi = window.SociaSystemEditorRuntime?.create?.({
          getSystemConfig: runtimeDeps.getSystemConfig,
          setSystemConfig: runtimeDeps.setSystemConfig,
          getEditState: runtimeDeps.getEditState,
          getGachas: runtimeDeps.getGachas,
          getStories: runtimeDeps.getStories,
          getCurrentScreen: runtimeDeps.getCurrentScreen,
          readFileAsDataUrl: runtimeDeps.readFileAsDataUrl,
          saveConfig: runtimeDeps.saveConfig,
          renderAll: runtimeDeps.renderAll,
          applyOrientation: runtimeDeps.applyOrientation,
          refreshCollection: runtimeDeps.refreshCollection,
          refreshGacha: runtimeDeps.refreshGacha,
          getFeatureAccess: runtimeDeps.getFeatureAccess,
          rarityApi: runtimeDeps.rarityApi,
          showToast: runtimeDeps.showToast
        }) || null;
      }
      return systemEditorRuntimeApi;
    }

    function ensureAnnouncementEditorRuntimeApi() {
      if (!announcementEditorRuntimeApi) {
        const runtimeDeps = deps.announcementEditor || {};
        announcementEditorRuntimeApi = window.SociaAnnouncementEditorRuntime?.create?.({
          getAnnouncements: runtimeDeps.getAnnouncements,
          setAnnouncements: runtimeDeps.setAnnouncements,
          getEditState: runtimeDeps.getEditState,
          getAnnouncementsApiUrl: runtimeDeps.getAnnouncementsApiUrl,
          readFileAsDataUrl: runtimeDeps.readFileAsDataUrl,
          uploadStaticImageAsset: runtimeDeps.uploadAnnouncementImage,
          saveLocal: runtimeDeps.saveLocal,
          postJSON: runtimeDeps.postJSON,
          showToast: runtimeDeps.showToast,
          upsertItem: runtimeDeps.upsertItem,
          renderHome: runtimeDeps.renderHome,
          esc: runtimeDeps.esc
        }) || null;
      }
      return announcementEditorRuntimeApi;
    }

    function ensureMusicEditorRuntimeApi() {
      if (!musicEditorRuntimeApi) {
        const runtimeDeps = deps.musicEditor || {};
        musicEditorRuntimeApi = window.SociaMusicEditorRuntime?.create?.({
          getSystemConfig: runtimeDeps.getSystemConfig,
          setSystemConfig: runtimeDeps.setSystemConfig,
          getCurrentProjectId: runtimeDeps.getCurrentProjectId,
          getCurrentPlayerId: runtimeDeps.getCurrentPlayerId,
          getPlayerState: runtimeDeps.getPlayerState,
          persistSystemConfigState: runtimeDeps.persistSystemConfigState,
          apiUrl: runtimeDeps.apiUrl,
          API: runtimeDeps.API,
          showToast: runtimeDeps.showToast,
          renderHome: runtimeDeps.renderHome,
          esc: runtimeDeps.esc
        }) || null;
      }
      return musicEditorRuntimeApi;
    }

    // SECTION 03: story / card runtime wiring
    function ensureStoryEditorRuntimeApi() {
      if (!storyEditorRuntimeApi) {
        const runtimeDeps = deps.storyEditor || {};
        storyEditorRuntimeApi = window.SociaStoryEditorRuntime?.create?.({
          getStories: runtimeDeps.getStories,
          setStories: runtimeDeps.setStories,
          getBaseChars: runtimeDeps.getBaseChars,
          getCharacters: runtimeDeps.getCharacters,
          getSystemConfig: runtimeDeps.getSystemConfig,
          getStoryFolders: runtimeDeps.getStoryFolders,
          getEditState: runtimeDeps.getEditState,
          getStoriesApiUrl: runtimeDeps.getStoriesApiUrl,
          readFileAsDataUrl: runtimeDeps.readFileAsDataUrl,
          saveLocal: runtimeDeps.saveLocal,
          postJSON: runtimeDeps.postJSON,
          showToast: runtimeDeps.showToast,
          getFeatureAccess: runtimeDeps.getFeatureAccess,
          upsertItem: runtimeDeps.upsertItem,
          updateEditorSubmitLabels: runtimeDeps.updateEditorSubmitLabels,
          renderHome: runtimeDeps.renderHome,
          renderEditorStoryList: runtimeDeps.renderEditorStoryList,
          createContentFolder: runtimeDeps.createContentFolder,
          getBaseCharById: runtimeDeps.getBaseCharById,
          esc: runtimeDeps.esc
        }) || null;
      }
      return storyEditorRuntimeApi;
    }

    function ensureEntryEditorRuntimeApi() {
      if (!entryEditorRuntimeApi) {
        const runtimeDeps = deps.entryEditor || {};
        entryEditorRuntimeApi = window.SociaEntryEditorRuntime?.create?.({
          getCharacters: runtimeDeps.getCharacters,
          setCharacters: runtimeDeps.setCharacters,
          getBaseChars: runtimeDeps.getBaseChars,
          getCardFolders: runtimeDeps.getCardFolders,
          getEditState: runtimeDeps.getEditState,
          getCharactersApiUrl: runtimeDeps.getCharactersApiUrl,
          getSystemApi: runtimeDeps.getEntrySystemApi,
          readFileAsDataUrl: runtimeDeps.readFileAsDataUrl,
          generateCharacterCropAssets: runtimeDeps.generateCharacterCropAssets,
          normalizeCharacterCropImages: runtimeDeps.normalizeCharacterCropImages,
          normalizeCharacterCropPresets: runtimeDeps.normalizeCharacterCropPresets,
          normalizeCharacterSdImages: runtimeDeps.normalizeCharacterSdImages,
          normalizeCharacterBattleKit: runtimeDeps.normalizeCharacterBattleKit,
          makeFallbackImage: runtimeDeps.makeFallbackImage,
          normalizeRarityValue: runtimeDeps.normalizeRarityValue,
          saveLocal: runtimeDeps.saveLocal,
          postJSON: runtimeDeps.postJSON,
          showToast: runtimeDeps.showToast,
          getFeatureAccess: runtimeDeps.getFeatureAccess,
          upsertItem: runtimeDeps.upsertItem,
          updateEditorSubmitLabels: runtimeDeps.updateEditorSubmitLabels,
          renderHome: runtimeDeps.renderHome,
          renderEditorCharacterList: runtimeDeps.renderEditorCharacterList,
          renderGachaPoolChars: runtimeDeps.renderGachaPoolChars,
          getEditingFeaturedIds: runtimeDeps.getEditingFeaturedIds,
          createContentFolder: runtimeDeps.createContentFolder,
          uploadStaticImageAsset: runtimeDeps.uploadCharacterImage,
          renderVoiceLineFields: runtimeDeps.renderVoiceLineFields,
          collectVoiceLineFields: runtimeDeps.collectVoiceLineFields,
          baseCharVoiceLineDefs: runtimeDeps.baseCharVoiceLineDefs,
          baseCharHomeVoiceDefs: runtimeDeps.baseCharHomeVoiceDefs,
          esc: runtimeDeps.esc
        }) || null;
      }
      return entryEditorRuntimeApi;
    }

    function ensureEquipmentCardEditorRuntimeApi() {
      if (!equipmentCardEditorRuntimeApi) {
        const runtimeDeps = deps.equipmentCardEditor || {};
        equipmentCardEditorRuntimeApi = window.SociaEquipmentCardEditorRuntime?.create?.({
          getEquipmentCards: runtimeDeps.getEquipmentCards,
          setEquipmentCards: runtimeDeps.setEquipmentCards,
          getEditState: runtimeDeps.getEditState,
          getEquipmentCardsApiUrl: runtimeDeps.getEquipmentCardsApiUrl,
          getSystemApi: runtimeDeps.getEquipmentSystemApi,
          readFileAsDataUrl: runtimeDeps.readFileAsDataUrl,
          saveLocal: runtimeDeps.saveLocal,
          postJSON: runtimeDeps.postJSON,
          showToast: runtimeDeps.showToast,
          esc: runtimeDeps.esc
        }) || null;
      }
      return equipmentCardEditorRuntimeApi;
    }

    // SECTION 04: base-char / title runtime wiring
    function ensureBaseCharEditorRuntimeApi() {
      if (!baseCharEditorRuntimeApi) {
        const runtimeDeps = deps.baseCharEditor || {};
        baseCharEditorRuntimeApi = window.SociaBaseCharEditorRuntime?.create?.({
          getBaseChars: runtimeDeps.getBaseChars,
          setBaseChars: runtimeDeps.setBaseChars,
          getEditState: runtimeDeps.getEditState,
          getBaseCharsApiUrl: runtimeDeps.getBaseCharsApiUrl,
          readFileAsDataUrl: runtimeDeps.readFileAsDataUrl,
          uploadStaticImageAsset: runtimeDeps.uploadBaseCharImage,
          makeBaseCharFallback: runtimeDeps.makeBaseCharFallback,
          normalizeBirthday: runtimeDeps.normalizeBirthday,
          saveLocal: runtimeDeps.saveLocal,
          postJSON: runtimeDeps.postJSON,
          showToast: runtimeDeps.showToast,
          upsertItem: runtimeDeps.upsertItem,
          updateEditorSubmitLabels: runtimeDeps.updateEditorSubmitLabels,
          renderBaseCharList: runtimeDeps.renderBaseCharList,
          populateBaseCharSelects: runtimeDeps.populateBaseCharSelects,
          renderVoiceLineFields: runtimeDeps.renderVoiceLineFields,
          collectVoiceLineFields: runtimeDeps.collectVoiceLineFields,
          baseCharVoiceLineDefs: runtimeDeps.baseCharVoiceLineDefs,
          baseCharHomeVoiceDefs: runtimeDeps.baseCharHomeVoiceDefs,
          esc: runtimeDeps.esc
        }) || null;
      }
      return baseCharEditorRuntimeApi;
    }

    function ensureTitleEditorRuntimeApi() {
      if (!titleEditorRuntimeApi) {
        const runtimeDeps = deps.titleEditor || {};
        titleEditorRuntimeApi = window.SociaTitleEditorRuntime?.create?.({
          getPlayerState: runtimeDeps.getPlayerState,
          getBaseChars: runtimeDeps.getBaseChars,
          getSystemConfig: runtimeDeps.getSystemConfig,
          setSystemConfig: runtimeDeps.setSystemConfig,
          persistSystemConfigState: runtimeDeps.persistSystemConfigState,
          syncProfileUi: runtimeDeps.syncProfileUi,
          syncTitles: runtimeDeps.syncTitles,
          showToast: runtimeDeps.showToast,
          esc: runtimeDeps.esc
        }) || null;
      }
      return titleEditorRuntimeApi;
    }

    // SECTION 05: public factory surface
    return {
      ensureSystemEditorRuntimeApi,
      ensureAnnouncementEditorRuntimeApi,
      ensureMusicEditorRuntimeApi,
      ensureStoryEditorRuntimeApi,
      ensureEntryEditorRuntimeApi,
      ensureEquipmentCardEditorRuntimeApi,
      ensureBaseCharEditorRuntimeApi,
      ensureTitleEditorRuntimeApi
    };
  }

  window.SociaEditorSectionRuntimeFactory = {
    create
  };
})();
