(function () {
  function createGachaSelectionRuntime(deps) {
    const { getEditState, getGachas } = deps;

    function getEditingFeaturedIds() {
      const editState = getEditState?.() || {};
      if (!editState.gachaId) return [];
      return getGachas?.().find(gacha => gacha.id === editState.gachaId)?.featured || [];
    }

    return {
      getEditingFeaturedIds
    };
  }

  window.SociaGachaSelectionRuntime = {
    create: createGachaSelectionRuntime
  };
})();
