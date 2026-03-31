(function () {
  function createAppDataInventoryModule(deps) {
    const {
      API,
      getCurrentProjectId,
      getPlayerState,
      setPlayerState,
      persistPlayerState,
      postJSON,
      getPlayerApiUrl,
      normalizeEquipmentInventory,
      normalizeCardInstances,
      normalizeEquipmentInstances,
      normalizeGrowthState,
      makeCardInstance,
    } = deps;

    function getPlayerStoryProgress(storyId) {
      return getPlayerState().storyProgress.find(item => item.storyId === storyId) || null;
    }

    async function saveStoryProgress(storyId, values = {}) {
      if (!storyId || !getCurrentProjectId()) return null;

      const response = await postJSON(getPlayerApiUrl(API.playerStoryProgress), {
        storyId,
        ...values
      });
      const next = response?.storyProgress;
      if (!next) return null;

      upsertPlayerStoryProgress(next);
      persistPlayerState();
      return next;
    }

    function upsertPlayerStoryProgress(nextItem) {
      const playerState = getPlayerState();
      const list = Array.isArray(playerState.storyProgress) ? playerState.storyProgress : [];
      const index = list.findIndex(item => item.storyId === nextItem.storyId);
      if (index >= 0) list[index] = nextItem;
      else list.unshift(nextItem);
      playerState.storyProgress = list;
      setPlayerState(playerState);
    }

    function upsertInventoryRecord(nextItem) {
      const playerState = getPlayerState();
      const list = Array.isArray(playerState.inventory) ? playerState.inventory : [];
      const index = list.findIndex(item => item.cardId === nextItem.cardId);
      if (index >= 0) {
        list[index] = { ...list[index], ...nextItem };
      } else {
        list.unshift({
          id: null,
          firstAcquiredAt: null,
          lastAcquiredAt: null,
          createdAt: null,
          updatedAt: null,
          ...nextItem
        });
      }
      playerState.inventory = list;
      reconcileCardInstancesWithInventory(playerState, String(nextItem?.cardId || "").trim(), Number(nextItem?.quantity || 0));
      setPlayerState(playerState);
    }

    function getOwnedEquipmentCount(equipmentId) {
      const key = String(equipmentId || "").trim();
      if (!key) return 0;
      const item = normalizeEquipmentInventory(getPlayerState()?.equipmentInventory).find(entry => entry.equipmentId === key);
      return Math.max(0, Number(item?.quantity || 0));
    }

    function getOwnedCardCount(cardId) {
      const key = String(cardId || "").trim();
      if (!key) return 0;
      return getCardInstances(key).length;
    }

    function reconcileCardInstancesWithInventory(playerState, cardId, targetQuantity) {
      const key = String(cardId || "").trim();
      if (!key) return;
      const safeTargetQuantity = Math.max(0, Number(targetQuantity || 0));
      const instances = normalizeCardInstances(playerState.cardInstances);
      const matching = instances.filter(item => item.cardId === key);
      const diff = safeTargetQuantity - matching.length;
      if (diff > 0) {
        const appended = Array.from({ length: diff }, () => makeCardInstance(key, { source: "inventory_sync" })).filter(Boolean);
        playerState.cardInstances = [...instances, ...appended];
        return;
      }
      if (diff < 0) {
        let removeCount = Math.abs(diff);
        playerState.cardInstances = instances.filter(item => {
          if (item.cardId !== key || removeCount <= 0) return true;
          removeCount -= 1;
          return false;
        });
        return;
      }
      playerState.cardInstances = instances;
    }

    function getCardInstances(cardId = "") {
      const key = String(cardId || "").trim();
      const list = normalizeCardInstances(getPlayerState()?.cardInstances);
      return key ? list.filter(item => item.cardId === key) : list;
    }

    function getEquipmentInstances(equipmentId = "") {
      const key = String(equipmentId || "").trim();
      const list = normalizeEquipmentInstances(getPlayerState()?.equipmentInstances);
      return key ? list.filter(item => item.equipmentId === key) : list;
    }

    function getCardInstance(instanceId) {
      const key = String(instanceId || "").trim();
      if (!key) return null;
      return getCardInstances().find(item => item.instanceId === key) || null;
    }

    function getEquipmentInstance(instanceId) {
      const key = String(instanceId || "").trim();
      if (!key) return null;
      return getEquipmentInstances().find(item => item.instanceId === key) || null;
    }

    function updateCardInstance(instanceId, updater) {
      const key = String(instanceId || "").trim();
      if (!key) return null;
      const playerState = getPlayerState();
      const list = normalizeCardInstances(playerState.cardInstances);
      const index = list.findIndex(item => item.instanceId === key);
      if (index < 0) return null;
      const current = list[index];
      const next = typeof updater === "function" ? updater(current) : { ...current, ...(updater || {}) };
      list[index] = {
        ...current,
        ...next,
        instanceId: current.instanceId,
        cardId: current.cardId,
        growth: normalizeGrowthState(next?.growth || current.growth)
      };
      playerState.cardInstances = list;
      setPlayerState(playerState);
      return list[index];
    }

    function updateEquipmentInstance(instanceId, updater) {
      const key = String(instanceId || "").trim();
      if (!key) return null;
      const playerState = getPlayerState();
      const list = normalizeEquipmentInstances(playerState.equipmentInstances);
      const index = list.findIndex(item => item.instanceId === key);
      if (index < 0) return null;
      const current = list[index];
      const next = typeof updater === "function" ? updater(current) : { ...current, ...(updater || {}) };
      list[index] = {
        ...current,
        ...next,
        instanceId: current.instanceId,
        equipmentId: current.equipmentId,
        growth: normalizeGrowthState(next?.growth || current.growth)
      };
      playerState.equipmentInstances = list;
      setPlayerState(playerState);
      return list[index];
    }

    function removeCardInstance(instanceId) {
      const key = String(instanceId || "").trim();
      if (!key) return null;
      const playerState = getPlayerState();
      const list = normalizeCardInstances(playerState.cardInstances);
      const index = list.findIndex(item => item.instanceId === key);
      if (index < 0) return null;
      const [removed] = list.splice(index, 1);
      playerState.cardInstances = list;
      setPlayerState(playerState);
      return removed;
    }

    function removeEquipmentInstance(instanceId) {
      const key = String(instanceId || "").trim();
      if (!key) return null;
      const playerState = getPlayerState();
      const list = normalizeEquipmentInstances(playerState.equipmentInstances);
      const index = list.findIndex(item => item.instanceId === key);
      if (index < 0) return null;
      const [removed] = list.splice(index, 1);
      playerState.equipmentInstances = list;
      setPlayerState(playerState);
      return removed;
    }

    function getCardInstanceGrowth(instanceId) {
      return normalizeGrowthState(getCardInstance(instanceId)?.growth);
    }

    function getEquipmentInstanceGrowth(instanceId) {
      return normalizeGrowthState(getEquipmentInstance(instanceId)?.growth);
    }

    function syncLegacyInventoryCountsFromInstances() {
      const playerState = getPlayerState();
      const cardCounts = new Map();
      getCardInstances().forEach(instance => {
        cardCounts.set(instance.cardId, (cardCounts.get(instance.cardId) || 0) + 1);
      });
      playerState.inventory = Array.from(cardCounts.entries()).map(([cardId, quantity]) => ({
        id: null,
        cardId,
        quantity,
        firstAcquiredAt: null,
        lastAcquiredAt: null,
        createdAt: null,
        updatedAt: null
      }));

      const equipmentCounts = new Map();
      getEquipmentInstances().forEach(instance => {
        equipmentCounts.set(instance.equipmentId, (equipmentCounts.get(instance.equipmentId) || 0) + 1);
      });
      playerState.equipmentInventory = Array.from(equipmentCounts.entries()).map(([equipmentId, quantity]) => ({
        equipmentId,
        quantity
      }));
      setPlayerState(playerState);
    }

    return {
      getPlayerStoryProgress,
      saveStoryProgress,
      upsertPlayerStoryProgress,
      upsertInventoryRecord,
      getOwnedCardCount,
      getOwnedEquipmentCount,
      getCardInstances,
      getEquipmentInstances,
      getCardInstance,
      getEquipmentInstance,
      updateCardInstance,
      updateEquipmentInstance,
      removeCardInstance,
      removeEquipmentInstance,
      getCardInstanceGrowth,
      getEquipmentInstanceGrowth,
      syncLegacyInventoryCountsFromInstances,
    };
  }

  window.AppDataInventoryLib = {
    create: createAppDataInventoryModule
  };
})();
