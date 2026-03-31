(function () {
  function createEquipmentCardEditorRuntime(deps) {
    const {
      getEquipmentCards,
      setEquipmentCards,
      getEditState,
      getEquipmentCardsApiUrl,
      getSystemApi,
      readFileAsDataUrl,
      saveLocal,
      postJSON,
      showToast,
      esc
    } = deps;

    function setup() {
      return window.EquipmentCardEditor?.setupEquipmentCardEditor?.({
        getEquipmentCards,
        setEquipmentCards,
        getEditState,
        getApi: () => ({ equipmentCards: getEquipmentCardsApiUrl() }),
        getSystemApi,
        readFileAsDataUrl,
        saveLocal,
        postJSON,
        showToast,
        esc
      }) || null;
    }

    return {
      setup
    };
  }

  window.SociaEquipmentCardEditorRuntime = {
    create: createEquipmentCardEditorRuntime
  };
})();
