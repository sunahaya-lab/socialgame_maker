(function () {
  function createStoryScreenRuntime(deps) {
    const {
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
      showCardDetail,
      showToast,
      esc
    } = deps;

    function setup() {
      return window.StoryScreen?.setupStoryScreen?.({
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
        showCardDetail,
        showToast,
        esc
      }) || null;
    }

    return {
      setup
    };
  }

  window.SociaStoryScreenRuntime = {
    create: createStoryScreenRuntime
  };
})();
