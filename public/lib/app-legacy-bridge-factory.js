(() => {
  function create(deps = {}) {
    return {
      openEditorSurface(tabName = null, screen) {
        return deps.openEditorSurface(tabName, screen);
      },
      openEditorScreen(tabName = null) {
        deps.setEditMode();
        return deps.openEditorScreen(tabName);
      },
      closeEditorScreen() {
        deps.setPlayMode();
        return deps.closeEditorScreen();
      },
      async fetchJSON(url) {
        return deps.fetchJSON(url);
      },
      async postJSON(url, data) {
        return deps.postJSON(url, data);
      },
      loadLocal(key, fallback) {
        return deps.loadLocal(key, fallback);
      },
      saveLocal(key, data) {
        return deps.saveLocal(key, data);
      },
      getCurrentPlayerId() {
        return deps.getCurrentPlayerId();
      },
      getPlayerIdentityScope() {
        return deps.getPlayerIdentityScope();
      },
      getPlayerApiUrl(path) {
        return deps.getPlayerApiUrl(path);
      },
      updateLocalProfileMeta(updater) {
        return deps.updateLocalProfileMeta(updater);
      },
      syncPlayerTitles(options = {}) {
        return deps.syncPlayerTitles(options);
      },
      getScopedStorageKey(key) {
        return deps.getScopedStorageKey(key);
      },
      getPlayerStoryProgress(storyId) {
        return deps.getPlayerStoryProgress(storyId);
      },
      upsertPlayerStoryProgress(nextItem) {
        return deps.upsertPlayerStoryProgress(nextItem);
      },
      upsertInventoryRecord(nextItem) {
        return deps.upsertInventoryRecord(nextItem);
      },
      getOwnedCardCount(cardId) {
        return deps.getOwnedCardCount(cardId);
      },
      getOwnedEquipmentCount(equipmentId) {
        return deps.getOwnedEquipmentCount(equipmentId);
      },
      getCardInstances(cardId = "") {
        return deps.getCardInstances(cardId);
      },
      getEquipmentInstances(equipmentId = "") {
        return deps.getEquipmentInstances(equipmentId);
      },
      getCardInstance(instanceId) {
        return deps.getCardInstance(instanceId);
      },
      getEquipmentInstance(instanceId) {
        return deps.getEquipmentInstance(instanceId);
      },
      getCardInstanceGrowth(instanceId) {
        return deps.getCardInstanceGrowth(instanceId);
      },
      getEquipmentInstanceGrowth(instanceId) {
        return deps.getEquipmentInstanceGrowth(instanceId);
      },
      getCardGrowth(cardId) {
        return deps.getCardGrowth(cardId);
      },
      getEquipmentGrowth(equipmentId) {
        return deps.getEquipmentGrowth(equipmentId);
      },
      getGrowthResources() {
        return deps.getGrowthResources();
      },
      setCardLockedCopies(cardId, value) {
        return deps.setCardLockedCopies(cardId, value);
      },
      setEquipmentLockedCopies(equipmentId, value) {
        return deps.setEquipmentLockedCopies(equipmentId, value);
      },
      enhanceCard(cardId) {
        return deps.enhanceCard(cardId);
      },
      enhanceEquipment(equipmentId) {
        return deps.enhanceEquipment(equipmentId);
      },
      enhanceCardInstance(instanceId) {
        return deps.enhanceCardInstance(instanceId);
      },
      enhanceEquipmentInstance(instanceId) {
        return deps.enhanceEquipmentInstance(instanceId);
      },
      evolveCard(cardId) {
        return deps.evolveCard(cardId);
      },
      evolveEquipment(equipmentId) {
        return deps.evolveEquipment(equipmentId);
      },
      evolveCardInstance(instanceId) {
        return deps.evolveCardInstance(instanceId);
      },
      evolveEquipmentInstance(instanceId) {
        return deps.evolveEquipmentInstance(instanceId);
      },
      limitBreakCard(cardId) {
        return deps.limitBreakCard(cardId);
      },
      limitBreakEquipment(equipmentId) {
        return deps.limitBreakEquipment(equipmentId);
      },
      limitBreakCardInstance(instanceId, materialInstanceId) {
        return deps.limitBreakCardInstance(instanceId, materialInstanceId);
      },
      limitBreakEquipmentInstance(instanceId, materialInstanceId) {
        return deps.limitBreakEquipmentInstance(instanceId, materialInstanceId);
      },
      convertCardDuplicates(cardId, target, amount) {
        return deps.convertCardDuplicates(cardId, target, amount);
      },
      convertEquipmentDuplicates(equipmentId, target, amount) {
        return deps.convertEquipmentDuplicates(equipmentId, target, amount);
      },
      convertSelectedCharacterCards(selectionCounts, options) {
        return deps.convertSelectedCharacterCards(selectionCounts, options);
      },
      convertSelectedEquipmentCards(selectionCounts, options) {
        return deps.convertSelectedEquipmentCards(selectionCounts, options);
      },
      convertSelectedCharacterInstances(instanceIds, options) {
        return deps.convertSelectedCharacterInstances(instanceIds, options);
      },
      convertSelectedEquipmentInstances(instanceIds, options) {
        return deps.convertSelectedEquipmentInstances(instanceIds, options);
      },
      convertStaminaToGrowthPoints(amount, options) {
        return deps.convertStaminaToGrowthPoints(amount, options);
      }
    };
  }

  window.AppLegacyBridgeFactoryLib = {
    create
  };
})();
