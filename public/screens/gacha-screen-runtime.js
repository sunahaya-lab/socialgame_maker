(function () {
  function createGachaScreenRuntime(deps) {
    const {
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
    } = deps;

    function setup() {
      return window.GachaScreen?.setupGachaScreen?.({
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

    return {
      setup
    };
  }

  window.SociaGachaScreenRuntime = {
    create: createGachaScreenRuntime
  };
})();
