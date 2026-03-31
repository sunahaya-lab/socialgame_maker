(function () {
  function createAppDataBridgeModule(deps) {
    const {
      getPartyFormation,
      setPartyFormation,
      saveLocal,
      getOwnedCardCount,
      getPlayerState,
      setPlayerState,
      normalizeCardInstances,
      normalizeEquipmentInventory,
      normalizeEquipmentInstances,
      makeCardInstance,
      makeEquipmentInstance,
      normalizePlayerCurrencies,
      getGrowthResources,
    } = deps;

    function sanitizeFormationAgainstInventory() {
      const formation = Array.isArray(getPartyFormation?.()) ? getPartyFormation().slice(0, 5) : [];
      if (!formation.length) return;

      const availableMap = new Map();
      formation.forEach(cardId => {
        const key = String(cardId || "").trim();
        if (!key || availableMap.has(key)) return;
        availableMap.set(key, getOwnedCardCount(key));
      });

      const nextFormation = formation.map(cardId => {
        const key = String(cardId || "").trim();
        if (!key) return "";
        const remaining = Math.max(0, Number(availableMap.get(key) || 0));
        if (remaining <= 0) return "";
        availableMap.set(key, remaining - 1);
        return key;
      });

      setPartyFormation(nextFormation);
      saveLocal("socia-party-formation", nextFormation);
    }

    function updateInventoryQuantity(cardId, delta) {
      const key = String(cardId || "").trim();
      if (!key || !Number.isFinite(Number(delta))) return 0;
      const safeDelta = Number(delta);
      const playerState = getPlayerState();
      const list = Array.isArray(playerState.inventory) ? [...playerState.inventory] : [];
      const index = list.findIndex(item => item.cardId === key);
      const current = Math.max(0, Number(list[index]?.quantity || 0));
      const nextQuantity = Math.max(0, current + safeDelta);

      if (index >= 0) {
        if (nextQuantity <= 0) list.splice(index, 1);
        else list[index] = { ...list[index], quantity: nextQuantity };
      } else if (nextQuantity > 0) {
        list.unshift({
          id: null,
          cardId: key,
          quantity: nextQuantity,
          firstAcquiredAt: null,
          lastAcquiredAt: null,
          createdAt: null,
          updatedAt: null
        });
      }

      playerState.inventory = list;
      const currentInstances = normalizeCardInstances(playerState.cardInstances);
      if (safeDelta > 0) {
        const appended = Array.from({ length: safeDelta }, () => makeCardInstance(key, { source: "inventory_sync" })).filter(Boolean);
        playerState.cardInstances = [...currentInstances, ...appended];
      } else if (safeDelta < 0) {
        let removeCount = Math.min(currentInstances.filter(item => item.cardId === key).length, Math.abs(safeDelta));
        playerState.cardInstances = currentInstances.filter(item => {
          if (item.cardId !== key || removeCount <= 0) return true;
          removeCount -= 1;
          return false;
        });
      } else {
        playerState.cardInstances = currentInstances;
      }
      setPlayerState(playerState);
      return nextQuantity;
    }

    function updateEquipmentInventoryQuantity(equipmentId, delta) {
      const key = String(equipmentId || "").trim();
      if (!key || !Number.isFinite(Number(delta))) return 0;
      const safeDelta = Number(delta);
      const playerState = getPlayerState();
      const list = normalizeEquipmentInventory(playerState.equipmentInventory || []);
      const index = list.findIndex(item => item.equipmentId === key);
      const current = Math.max(0, Number(list[index]?.quantity || 0));
      const nextQuantity = Math.max(0, current + safeDelta);

      if (index >= 0) {
        if (nextQuantity <= 0) list.splice(index, 1);
        else list[index] = { ...list[index], quantity: nextQuantity };
      } else if (nextQuantity > 0) {
        list.unshift({
          equipmentId: key,
          quantity: nextQuantity
        });
      }

      playerState.equipmentInventory = list;
      const currentInstances = normalizeEquipmentInstances(playerState.equipmentInstances);
      if (safeDelta > 0) {
        const appended = Array.from({ length: safeDelta }, () => makeEquipmentInstance(key, { source: "inventory_sync" })).filter(Boolean);
        playerState.equipmentInstances = [...currentInstances, ...appended];
      } else if (safeDelta < 0) {
        let removeCount = Math.min(currentInstances.filter(item => item.equipmentId === key).length, Math.abs(safeDelta));
        playerState.equipmentInstances = currentInstances.filter(item => {
          if (item.equipmentId !== key || removeCount <= 0) return true;
          removeCount -= 1;
          return false;
        });
      } else {
        playerState.equipmentInstances = currentInstances;
      }
      setPlayerState(playerState);
      return nextQuantity;
    }

    function addGrowthResources(delta = {}) {
      const playerState = getPlayerState();
      const resources = getGrowthResources();
      playerState.growthResources = {
        resonance: Math.max(0, resources.resonance + Number(delta.resonance || 0)),
        evolveMaterial: Math.max(0, resources.evolveMaterial + Number(delta.evolveMaterial || 0))
      };
      setPlayerState(playerState);
      return playerState.growthResources;
    }

    function updatePlayerCurrencyAmount(key, delta) {
      const safeKey = String(key || "").trim();
      const safeDelta = Number(delta || 0);
      if (!safeKey || !Number.isFinite(safeDelta)) return null;
      const playerState = getPlayerState();
      const currencies = normalizePlayerCurrencies(playerState.currencies);
      const nextCurrencies = currencies.map(currency => {
        if (currency.key !== safeKey) return currency;
        const maxAmount = currency.maxAmount === null || currency.maxAmount === undefined
          ? null
          : Math.max(0, Number(currency.maxAmount || 0));
        const nextAmountBase = Math.max(0, Number(currency.amount || 0) + safeDelta);
        const nextAmount = maxAmount === null ? nextAmountBase : Math.min(maxAmount, nextAmountBase);
        return {
          ...currency,
          amount: nextAmount,
          updatedAt: safeKey === "stamina" ? new Date().toISOString() : currency.updatedAt || null
        };
      });
      playerState.currencies = nextCurrencies;
      setPlayerState(playerState);
      return nextCurrencies.find(currency => currency.key === safeKey) || null;
    }

    return {
      sanitizeFormationAgainstInventory,
      updateInventoryQuantity,
      updateEquipmentInventoryQuantity,
      addGrowthResources,
      updatePlayerCurrencyAmount,
    };
  }

  window.AppDataBridgeLib = {
    create: createAppDataBridgeModule
  };
})();
