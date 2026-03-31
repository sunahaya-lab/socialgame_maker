(function () {
  function createCollectionScreenRuntime(deps) {
    const {
      getCharacters,
      getStories,
      getSystemConfig,
      getPlayerState,
      getOwnedCount,
      getCharacterImageForUsage,
      baseCharVoiceLineDefs,
      getBaseCharById,
      getEffectiveVoiceLines,
      openStoryReader,
      getRarityModeConfig,
      normalizeRarityValue,
      getRarityLabel,
      getRarityCssClass,
      makeFallbackImage,
      esc
    } = deps;

    function setup() {
      return window.CollectionScreen?.setupCollectionScreen?.({
        getCharacters,
        getStories,
        getSystemConfig,
        getPlayerState,
        getOwnedCount,
        getCharacterImageForUsage,
        baseCharVoiceLineDefs,
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

    return {
      setup
    };
  }

  window.SociaCollectionScreenRuntime = {
    create: createCollectionScreenRuntime
  };
})();
