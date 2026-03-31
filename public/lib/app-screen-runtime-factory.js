(function () {
  function createAppScreenRuntimeFactory(deps) {
    const {
      getCharacters,
      getEquipmentCards,
      getGachas,
      getStories,
      getSystemConfig,
      getPlayerState,
      getPartyFormation,
      setPartyFormation,
      getCurrentScreen,
      getCurrentStoryType,
      setCurrentStoryType,
      getStoryReaderState,
      setStoryReaderState,
      getActiveGacha,
      setActiveGacha,
      getBattleState,
      setBattleState,
      getBattleLoopTimer,
      setBattleLoopTimer,
      getPlayerCurrencyAmount,
      getOwnedCount,
      getOwnedEquipmentCount,
      getCardInstances,
      getEquipmentInstances,
      getCardInstance,
      getEquipmentInstance,
      getCardInstanceGrowth,
      getEquipmentInstanceGrowth,
      getCardGrowth,
      getEquipmentGrowth,
      getGrowthResources,
      setCardLockedCopies,
      setEquipmentLockedCopies,
      enhanceCard,
      enhanceCardInstance,
      enhanceEquipment,
      enhanceEquipmentInstance,
      evolveCard,
      evolveCardInstance,
      evolveEquipment,
      evolveEquipmentInstance,
      limitBreakCard,
      limitBreakCardInstance,
      limitBreakEquipment,
      limitBreakEquipmentInstance,
      convertCardDuplicates,
      convertEquipmentDuplicates,
      convertSelectedCharacterCards,
      convertSelectedEquipmentCards,
      convertSelectedCharacterInstances,
      convertSelectedEquipmentInstances,
      convertStaminaToGrowthPoints,
      getDefaultBattleState,
      normalizePartyFormation,
      getBaseCharById,
      findCharacterImageByName,
      resolveScenePortrait,
      getStoryProgress,
      saveStoryProgress,
      getCharacterBattleVisual,
      normalizeCharacterSdImages,
      getCharacterImageForUsage,
      getEffectiveVoiceLines,
      showCardDetail,
      openStoryReader,
      renderStoryScreen,
      getEventItemCounts,
      getEventExchangeStatus,
      purchaseEventExchangeItem,
      getEventLoginBonusStatus,
      claimEventLoginBonus,
      recordGachaPulls,
      refreshPlayerState,
      buildGachaRateSummary,
      getDefaultRates,
      normalizeRates,
      getRarityModeConfig,
      getRarityRank,
      getRarityLabel,
      getRarityCssClass,
      normalizeRarityValue,
      getEventScreen,
      getCollectionScreen,
      navigateTo,
      showToast,
      makeFallbackImage,
      esc,
      battleControllerLib,
      battleEngineLib,
      battleStateLib,
      battleViewLib
    } = deps;

    let battleScreenModuleApi = null;
    let collectionScreenRuntimeApi = null;
    let formationScreenRuntimeApi = null;
    let gachaScreenRuntimeApi = null;
    let storyScreenRuntimeApi = null;
    let eventScreenRuntimeApi = null;

    function ensureBattleScreenApi() {
      if (!battleScreenModuleApi) {
        battleScreenModuleApi = window.BattleScreenModule.create({
          getCharacters,
          getPartyFormation,
          getCurrentScreen,
          getSystemConfig,
          getPlayerState,
          getBattleState,
          setBattleState,
          getBattleLoopTimer,
          setBattleLoopTimer,
          getDefaultBattleState,
          normalizePartyFormation,
          battleControllerLib,
          battleEngineLib,
          battleStateLib,
          battleViewLib,
          getCharacterBattleVisual,
          normalizeCharacterSdImages,
          makeFallbackImage,
          esc,
          renderBattleScreenExternal: () => renderBattleScreen()
        });
      }
      return battleScreenModuleApi;
    }

    function ensureCollectionScreenRuntimeApi() {
      if (!collectionScreenRuntimeApi) {
        collectionScreenRuntimeApi = window.SociaCollectionScreenRuntime?.create?.({
          getCharacters,
          getStories,
          getSystemConfig,
          getPlayerState,
          getOwnedCount,
          getCharacterImageForUsage,
          baseCharVoiceLineDefs: deps.baseCharVoiceLineDefs,
          getBaseCharById,
          getEffectiveVoiceLines,
          openStoryReader,
          getRarityModeConfig,
          normalizeRarityValue,
          getRarityLabel,
          getRarityCssClass,
          makeFallbackImage,
          esc
        }) || null;
      }
      return collectionScreenRuntimeApi;
    }

    function ensureFormationScreenRuntimeApi() {
      if (!formationScreenRuntimeApi) {
        formationScreenRuntimeApi = window.SociaFormationScreenRuntime?.create?.({
          getCharacters,
          getEquipmentCards,
          getOwnedCount,
          getOwnedEquipmentCount,
          getCardInstances,
          getEquipmentInstances,
          getCardInstance,
          getEquipmentInstance,
          getCardInstanceGrowth,
          getEquipmentInstanceGrowth,
          getPartyFormation,
          setPartyFormation,
          getSystemConfig,
          getCharacterImageForUsage,
          getRarityLabel,
          getRarityCssClass,
          makeFallbackImage,
          showCardDetail,
          getCardGrowth,
          getEquipmentGrowth,
          getGrowthResources,
          setCardLockedCopies,
          setEquipmentLockedCopies,
          enhanceCard,
          enhanceCardInstance,
          enhanceEquipment,
          enhanceEquipmentInstance,
          evolveCard,
          evolveCardInstance,
          evolveEquipment,
          evolveEquipmentInstance,
          limitBreakCard,
          limitBreakCardInstance,
          limitBreakEquipment,
          limitBreakEquipmentInstance,
          convertCardDuplicates,
          convertEquipmentDuplicates,
          convertSelectedCharacterCards,
          convertSelectedEquipmentCards,
          convertSelectedCharacterInstances,
          convertSelectedEquipmentInstances,
          convertStaminaToGrowthPoints,
          getPlayerCurrencyAmount,
          getDefaultBattleState,
          setBattleState,
          navigateTo,
          showToast,
          esc
        }) || null;
      }
      return formationScreenRuntimeApi;
    }

    function ensureGachaScreenRuntimeApi() {
      if (!gachaScreenRuntimeApi) {
        gachaScreenRuntimeApi = window.SociaGachaScreenRuntime?.create?.({
          getCharacters,
          getGachas,
          getPlayerState,
          getSystemConfig,
          getActiveGacha,
          setActiveGacha,
          buildGachaRateSummary,
          normalizeRates,
          getDefaultRates,
          getRarityModeConfig,
          getRarityRank,
          getRarityLabel,
          getRarityCssClass,
          normalizeRarityValue,
          makeFallbackImage,
          showCardDetail,
          getPlayerCurrencyAmount,
          recordGachaPulls,
          refreshPlayerState,
          showToast,
          esc
        }) || null;
      }
      return gachaScreenRuntimeApi;
    }

    function ensureStoryScreenRuntimeApi() {
      if (!storyScreenRuntimeApi) {
        storyScreenRuntimeApi = window.SociaStoryScreenRuntime?.create?.({
          getStories,
          getCharacters,
          getSystemConfig,
          getPlayerState,
          getCurrentStoryType,
          setCurrentStoryType,
          getStoryReaderState,
          setStoryReaderState,
          getBaseCharById,
          findCharacterImageByName,
          resolveScenePortrait,
          getOwnedCount,
          getStoryProgress,
          saveStoryProgress,
          showCardDetail: char => getCollectionScreen()?.showCardDetail?.(char),
          showToast,
          esc
        }) || null;
      }
      return storyScreenRuntimeApi;
    }

    function ensureEventScreenRuntimeApi() {
      if (!eventScreenRuntimeApi) {
        eventScreenRuntimeApi = window.SociaEventScreenRuntime?.create?.({
          getSystemConfig,
          getCharacters,
          getStories,
          getOwnedCount: cardId => getOwnedCount(cardId),
          showCardDetail: char => getCollectionScreen()?.showCardDetail?.(char),
          getGrowthResources,
          getPlayerCurrencyAmount,
          getEventItemCounts,
          setCurrentStoryType,
          renderStoryScreen,
          openStoryReader,
          getEventExchangeStatus,
          purchaseEventExchangeItem,
          getEventLoginBonusStatus,
          claimEventLoginBonus,
          navigateTo,
          showToast
        }) || null;
      }
      return eventScreenRuntimeApi;
    }

    function renderBattleScreen() {
      return ensureBattleScreenApi().renderBattleScreen();
    }

    function getBattleParty() {
      return ensureBattleScreenApi().getBattleParty();
    }

    function startBattleLoop() {
      return ensureBattleScreenApi().startBattleLoop();
    }

    function stopBattleLoop() {
      return ensureBattleScreenApi().stopBattleLoop();
    }

    return {
      ensureBattleScreenApi,
      ensureCollectionScreenRuntimeApi,
      ensureFormationScreenRuntimeApi,
      ensureGachaScreenRuntimeApi,
      ensureStoryScreenRuntimeApi,
      ensureEventScreenRuntimeApi,
      renderBattleScreen,
      getBattleParty,
      startBattleLoop,
      stopBattleLoop
    };
  }

  window.AppScreenRuntimeFactoryLib = {
    create: createAppScreenRuntimeFactory
  };
})();
