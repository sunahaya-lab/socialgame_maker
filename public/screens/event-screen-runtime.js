(function () {
  function createEventScreenRuntime(deps) {
    const {
      getSystemConfig,
      getCharacters,
      getStories,
      getOwnedCount,
      showCardDetail,
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
    } = deps;

    function setup() {
      return window.EventScreen?.setupEventScreen?.({
        getSystemConfig,
        getCharacters,
        getStories,
        getOwnedCount,
        showCardDetail,
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

    return {
      setup
    };
  }

  window.SociaEventScreenRuntime = {
    create: createEventScreenRuntime
  };
})();
