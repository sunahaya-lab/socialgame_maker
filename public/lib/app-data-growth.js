(function () {
  function createAppDataGrowthModule(deps) {
    const {
      getPlayerState,
      setPlayerState,
      persistPlayerState,
      normalizeGrowthState,
      normalizeGrowthResources,
      normalizePlayerCurrencies,
      getOwnedCardCount,
      getOwnedEquipmentCount,
      getCardInstance,
      getEquipmentInstance,
      updateCardInstance,
      updateEquipmentInstance,
      removeCardInstance,
      removeEquipmentInstance,
      syncLegacyInventoryCountsFromInstances,
      updateInventoryQuantity,
      updateEquipmentInventoryQuantity,
      sanitizeFormationAgainstInventory,
      addGrowthResources,
      updatePlayerCurrencyAmount,
      getPlayerCurrencyAmount,
    } = deps;

    function getCardGrowth(cardId) {
      const key = String(cardId || "").trim();
      if (!key) return { ...deps.DEFAULT_GROWTH_STATE };
      const map = getPlayerState()?.cardGrowth || {};
      return normalizeGrowthState(map[key]);
    }

    function getEquipmentGrowth(equipmentId) {
      const key = String(equipmentId || "").trim();
      if (!key) return { ...deps.DEFAULT_GROWTH_STATE };
      const map = getPlayerState()?.equipmentGrowth || {};
      return normalizeGrowthState(map[key]);
    }

    function getGrowthResources() {
      return normalizeGrowthResources(getPlayerState()?.growthResources);
    }

    function updateCardGrowth(cardId, updater) {
      const key = String(cardId || "").trim();
      if (!key) return null;
      const playerState = getPlayerState();
      const map = playerState.cardGrowth && typeof playerState.cardGrowth === "object" ? { ...playerState.cardGrowth } : {};
      const current = normalizeGrowthState(map[key]);
      const next = normalizeGrowthState(typeof updater === "function" ? updater(current) : { ...current, ...(updater || {}) });
      map[key] = next;
      playerState.cardGrowth = map;
      setPlayerState(playerState);
      persistPlayerState();
      return next;
    }

    function updateEquipmentGrowth(equipmentId, updater) {
      const key = String(equipmentId || "").trim();
      if (!key) return null;
      const playerState = getPlayerState();
      const map = playerState.equipmentGrowth && typeof playerState.equipmentGrowth === "object" ? { ...playerState.equipmentGrowth } : {};
      const current = normalizeGrowthState(map[key]);
      const next = normalizeGrowthState(typeof updater === "function" ? updater(current) : { ...current, ...(updater || {}) });
      map[key] = next;
      playerState.equipmentGrowth = map;
      setPlayerState(playerState);
      persistPlayerState();
      return next;
    }

    function getAvailableCardDuplicates(cardId) {
      const owned = getOwnedCardCount(cardId);
      const growth = getCardGrowth(cardId);
      const maxLocked = Math.max(0, owned - 1 - growth.duplicateSpent);
      const locked = Math.max(0, Math.min(maxLocked, growth.lockedCopies));
      return Math.max(0, owned - 1 - growth.duplicateSpent - locked);
    }

    function getAvailableEquipmentDuplicates(equipmentId) {
      const owned = getOwnedEquipmentCount(equipmentId);
      const growth = getEquipmentGrowth(equipmentId);
      const maxLocked = Math.max(0, owned - 1 - growth.duplicateSpent);
      const locked = Math.max(0, Math.min(maxLocked, growth.lockedCopies));
      return Math.max(0, owned - 1 - growth.duplicateSpent - locked);
    }

    function setCardLockedCopies(cardId, value) {
      const key = String(cardId || "").trim();
      if (!key) return { ok: false, code: "invalid_card" };
      const owned = getOwnedCardCount(key);
      const current = getCardGrowth(key);
      const maxLocked = Math.max(0, owned - 1 - current.duplicateSpent);
      const locked = Math.max(0, Math.min(maxLocked, Number(value || 0)));
      const next = updateCardGrowth(key, { ...current, lockedCopies: locked });
      return { ok: true, growth: next, maxLocked };
    }

    function setEquipmentLockedCopies(equipmentId, value) {
      const key = String(equipmentId || "").trim();
      if (!key) return { ok: false, code: "invalid_equipment" };
      const owned = getOwnedEquipmentCount(key);
      const current = getEquipmentGrowth(key);
      const maxLocked = Math.max(0, owned - 1 - current.duplicateSpent);
      const locked = Math.max(0, Math.min(maxLocked, Number(value || 0)));
      const next = updateEquipmentGrowth(key, { ...current, lockedCopies: locked });
      return { ok: true, growth: next, maxLocked };
    }

    function enhanceCard(cardId) {
      const key = String(cardId || "").trim();
      if (!key) return { ok: false, code: "invalid_card" };
      const next = updateCardGrowth(key, current => ({ ...current, level: Math.min(80, current.level + 1) }));
      return { ok: true, growth: next };
    }

    function enhanceCardInstance(instanceId) {
      const current = getCardInstance(instanceId);
      if (!current) return { ok: false, code: "invalid_card_instance" };
      const next = updateCardInstance(instanceId, item => ({
        ...item,
        growth: {
          ...normalizeGrowthState(item.growth),
          level: Math.min(80, normalizeGrowthState(item.growth).level + 1)
        }
      }));
      return { ok: true, instance: next };
    }

    function enhanceEquipment(equipmentId) {
      const key = String(equipmentId || "").trim();
      if (!key) return { ok: false, code: "invalid_equipment" };
      const next = updateEquipmentGrowth(key, current => ({ ...current, level: Math.min(80, current.level + 1) }));
      return { ok: true, growth: next };
    }

    function enhanceEquipmentInstance(instanceId) {
      const current = getEquipmentInstance(instanceId);
      if (!current) return { ok: false, code: "invalid_equipment_instance" };
      const next = updateEquipmentInstance(instanceId, item => ({
        ...item,
        growth: {
          ...normalizeGrowthState(item.growth),
          level: Math.min(80, normalizeGrowthState(item.growth).level + 1)
        }
      }));
      return { ok: true, instance: next };
    }

    function evolveCard(cardId) {
      const key = String(cardId || "").trim();
      if (!key) return { ok: false, code: "invalid_card" };
      const current = getCardGrowth(key);
      if (current.evolveStage >= 3) return { ok: false, code: "evolve_max" };
      const resources = getGrowthResources();
      const cost = (current.evolveStage + 1) * 5;
      if (resources.evolveMaterial < cost) return { ok: false, code: "material_shortage", cost };
      const playerState = getPlayerState();
      playerState.growthResources = { ...resources, evolveMaterial: Math.max(0, resources.evolveMaterial - cost) };
      setPlayerState(playerState);
      const next = updateCardGrowth(key, { ...current, evolveStage: current.evolveStage + 1 });
      persistPlayerState();
      return { ok: true, growth: next, resources: getGrowthResources(), cost };
    }

    function evolveCardInstance(instanceId) {
      const current = getCardInstance(instanceId);
      if (!current) return { ok: false, code: "invalid_card_instance" };
      const growth = normalizeGrowthState(current.growth);
      if (growth.evolveStage >= 3) return { ok: false, code: "evolve_max" };
      const resources = getGrowthResources();
      const cost = (growth.evolveStage + 1) * 5;
      if (resources.evolveMaterial < cost) return { ok: false, code: "material_shortage", cost };
      const playerState = getPlayerState();
      playerState.growthResources = { ...resources, evolveMaterial: Math.max(0, resources.evolveMaterial - cost) };
      setPlayerState(playerState);
      const next = updateCardInstance(instanceId, item => ({
        ...item,
        growth: { ...normalizeGrowthState(item.growth), evolveStage: growth.evolveStage + 1 }
      }));
      persistPlayerState();
      return { ok: true, instance: next, resources: getGrowthResources(), cost };
    }

    function evolveEquipment(equipmentId) {
      const key = String(equipmentId || "").trim();
      if (!key) return { ok: false, code: "invalid_equipment" };
      const current = getEquipmentGrowth(key);
      if (current.evolveStage >= 3) return { ok: false, code: "evolve_max" };
      const resources = getGrowthResources();
      const cost = (current.evolveStage + 1) * 5;
      if (resources.evolveMaterial < cost) return { ok: false, code: "material_shortage", cost };
      const playerState = getPlayerState();
      playerState.growthResources = { ...resources, evolveMaterial: Math.max(0, resources.evolveMaterial - cost) };
      setPlayerState(playerState);
      const next = updateEquipmentGrowth(key, { ...current, evolveStage: current.evolveStage + 1 });
      persistPlayerState();
      return { ok: true, growth: next, resources: getGrowthResources(), cost };
    }

    function evolveEquipmentInstance(instanceId) {
      const current = getEquipmentInstance(instanceId);
      if (!current) return { ok: false, code: "invalid_equipment_instance" };
      const growth = normalizeGrowthState(current.growth);
      if (growth.evolveStage >= 3) return { ok: false, code: "evolve_max" };
      const resources = getGrowthResources();
      const cost = (growth.evolveStage + 1) * 5;
      if (resources.evolveMaterial < cost) return { ok: false, code: "material_shortage", cost };
      const playerState = getPlayerState();
      playerState.growthResources = { ...resources, evolveMaterial: Math.max(0, resources.evolveMaterial - cost) };
      setPlayerState(playerState);
      const next = updateEquipmentInstance(instanceId, item => ({
        ...item,
        growth: { ...normalizeGrowthState(item.growth), evolveStage: growth.evolveStage + 1 }
      }));
      persistPlayerState();
      return { ok: true, instance: next, resources: getGrowthResources(), cost };
    }

    function limitBreakCard(cardId) {
      const key = String(cardId || "").trim();
      if (!key) return { ok: false, code: "invalid_card" };
      const current = getCardGrowth(key);
      if (current.limitBreak >= 5) return { ok: false, code: "limit_break_max" };
      const available = getAvailableCardDuplicates(key);
      if (available <= 0) return { ok: false, code: "duplicate_shortage" };
      updateInventoryQuantity(key, -1);
      sanitizeFormationAgainstInventory();
      const next = updateCardGrowth(key, { ...current, limitBreak: Math.min(5, current.limitBreak + 1) });
      persistPlayerState();
      return { ok: true, growth: next, available: getAvailableCardDuplicates(key) };
    }

    function limitBreakCardInstance(instanceId, materialInstanceId) {
      const current = getCardInstance(instanceId);
      if (!current) return { ok: false, code: "invalid_card_instance" };
      const material = getCardInstance(materialInstanceId);
      if (!material || material.cardId !== current.cardId || material.instanceId === current.instanceId) {
        return { ok: false, code: "duplicate_shortage" };
      }
      const growth = normalizeGrowthState(current.growth);
      if (growth.limitBreak >= 5) return { ok: false, code: "limit_break_max" };
      removeCardInstance(materialInstanceId);
      syncLegacyInventoryCountsFromInstances();
      sanitizeFormationAgainstInventory();
      const next = updateCardInstance(instanceId, item => ({
        ...item,
        growth: { ...normalizeGrowthState(item.growth), limitBreak: Math.min(5, growth.limitBreak + 1) }
      }));
      persistPlayerState();
      return { ok: true, instance: next };
    }

    function limitBreakEquipment(equipmentId) {
      const key = String(equipmentId || "").trim();
      if (!key) return { ok: false, code: "invalid_equipment" };
      const current = getEquipmentGrowth(key);
      if (current.limitBreak >= 5) return { ok: false, code: "limit_break_max" };
      const available = getAvailableEquipmentDuplicates(key);
      if (available <= 0) return { ok: false, code: "duplicate_shortage" };
      updateEquipmentInventoryQuantity(key, -1);
      const next = updateEquipmentGrowth(key, { ...current, limitBreak: Math.min(5, current.limitBreak + 1) });
      persistPlayerState();
      return { ok: true, growth: next, available: getAvailableEquipmentDuplicates(key) };
    }

    function limitBreakEquipmentInstance(instanceId, materialInstanceId) {
      const current = getEquipmentInstance(instanceId);
      if (!current) return { ok: false, code: "invalid_equipment_instance" };
      const material = getEquipmentInstance(materialInstanceId);
      if (!material || material.equipmentId !== current.equipmentId || material.instanceId === current.instanceId) {
        return { ok: false, code: "duplicate_shortage" };
      }
      const growth = normalizeGrowthState(current.growth);
      if (growth.limitBreak >= 5) return { ok: false, code: "limit_break_max" };
      removeEquipmentInstance(materialInstanceId);
      syncLegacyInventoryCountsFromInstances();
      const next = updateEquipmentInstance(instanceId, item => ({
        ...item,
        growth: { ...normalizeGrowthState(item.growth), limitBreak: Math.min(5, growth.limitBreak + 1) }
      }));
      persistPlayerState();
      return { ok: true, instance: next };
    }

    function convertCardDuplicates(cardId, target, amount) {
      const key = String(cardId || "").trim();
      const safeTarget = String(target || "").trim();
      const safeAmount = Math.max(0, Number(amount || 0));
      if (!key || safeAmount <= 0) return { ok: false, code: "invalid_convert_request" };
      if (!["resonance", "evolveMaterial", "gold"].includes(safeTarget)) return { ok: false, code: "invalid_convert_target" };
      const available = getAvailableCardDuplicates(key);
      if (safeAmount > available) return { ok: false, code: "duplicate_shortage" };

      const current = getCardGrowth(key);
      updateCardGrowth(key, { ...current, duplicateSpent: current.duplicateSpent + safeAmount });

      const playerState = getPlayerState();
      const resources = getGrowthResources();
      if (safeTarget === "gold") {
        const currencies = normalizePlayerCurrencies(playerState.currencies);
        playerState.currencies = currencies.map(currency =>
          currency.key === "gold" ? { ...currency, amount: Math.max(0, Number(currency.amount || 0) + safeAmount * 500) } : currency
        );
      } else {
        playerState.growthResources = {
          ...resources,
          resonance: safeTarget === "resonance" ? resources.resonance + safeAmount * 10 : resources.resonance,
          evolveMaterial: safeTarget === "evolveMaterial" ? resources.evolveMaterial + safeAmount * 5 : resources.evolveMaterial
        };
      }
      setPlayerState(playerState);
      persistPlayerState();
      return { ok: true, growth: getCardGrowth(key), resources: getGrowthResources(), available: getAvailableCardDuplicates(key) };
    }

    function convertEquipmentDuplicates(equipmentId, target, amount) {
      const key = String(equipmentId || "").trim();
      const safeTarget = String(target || "").trim();
      const safeAmount = Math.max(0, Number(amount || 0));
      if (!key || safeAmount <= 0) return { ok: false, code: "invalid_convert_request" };
      if (!["resonance", "evolveMaterial", "gold"].includes(safeTarget)) return { ok: false, code: "invalid_convert_target" };
      const available = getAvailableEquipmentDuplicates(key);
      if (safeAmount > available) return { ok: false, code: "duplicate_shortage" };

      const current = getEquipmentGrowth(key);
      updateEquipmentGrowth(key, { ...current, duplicateSpent: current.duplicateSpent + safeAmount });

      const playerState = getPlayerState();
      const resources = getGrowthResources();
      if (safeTarget === "gold") {
        const currencies = normalizePlayerCurrencies(playerState.currencies);
        playerState.currencies = currencies.map(currency =>
          currency.key === "gold" ? { ...currency, amount: Math.max(0, Number(currency.amount || 0) + safeAmount * 500) } : currency
        );
      } else {
        playerState.growthResources = {
          ...resources,
          resonance: safeTarget === "resonance" ? resources.resonance + safeAmount * 10 : resources.resonance,
          evolveMaterial: safeTarget === "evolveMaterial" ? resources.evolveMaterial + safeAmount * 5 : resources.evolveMaterial
        };
      }
      setPlayerState(playerState);
      persistPlayerState();
      return { ok: true, growth: getEquipmentGrowth(key), resources: getGrowthResources(), available: getAvailableEquipmentDuplicates(key) };
    }

    function convertSelectedCharacterCards(selectionCounts = {}, options = {}) {
      const source = selectionCounts && typeof selectionCounts === "object" ? selectionCounts : {};
      const safeEntries = Object.entries(source)
        .map(([cardId, count]) => [String(cardId || "").trim(), Math.max(0, Number(count || 0))])
        .filter(([cardId, count]) => cardId && count > 0);
      if (!safeEntries.length) return { ok: false, code: "empty_selection" };
      const totalSelected = safeEntries.reduce((sum, [, count]) => sum + count, 0);
      const shortage = safeEntries.find(([cardId, count]) => getOwnedCardCount(cardId) < count);
      if (shortage) return { ok: false, code: "selection_shortage", cardId: shortage[0] };
      safeEntries.forEach(([cardId, count]) => updateInventoryQuantity(cardId, -count));
      sanitizeFormationAgainstInventory();
      const pointGain = totalSelected * Math.max(1, Number(options.pointPerCard || 10));
      const resources = addGrowthResources({ resonance: pointGain });
      persistPlayerState();
      return { ok: true, convertedCards: totalSelected, pointGain, resources };
    }

    function convertSelectedCharacterInstances(instanceIds = [], options = {}) {
      const ids = Array.from(new Set((Array.isArray(instanceIds) ? instanceIds : []).map(value => String(value || "").trim()).filter(Boolean)));
      if (!ids.length) return { ok: false, code: "empty_selection" };
      const instances = ids.map(id => getCardInstance(id)).filter(Boolean);
      if (instances.length !== ids.length) return { ok: false, code: "selection_shortage" };
      instances.forEach(instance => removeCardInstance(instance.instanceId));
      syncLegacyInventoryCountsFromInstances();
      sanitizeFormationAgainstInventory();
      const pointGain = ids.length * Math.max(1, Number(options.pointPerCard || 10));
      const resources = addGrowthResources({ resonance: pointGain });
      persistPlayerState();
      return { ok: true, convertedCards: ids.length, pointGain, resources };
    }

    function convertSelectedEquipmentCards(selectionCounts = {}, options = {}) {
      const source = selectionCounts && typeof selectionCounts === "object" ? selectionCounts : {};
      const safeEntries = Object.entries(source)
        .map(([equipmentId, count]) => [String(equipmentId || "").trim(), Math.max(0, Number(count || 0))])
        .filter(([equipmentId, count]) => equipmentId && count > 0);
      if (!safeEntries.length) return { ok: false, code: "empty_selection" };
      const totalSelected = safeEntries.reduce((sum, [, count]) => sum + count, 0);
      const shortage = safeEntries.find(([equipmentId, count]) => getOwnedEquipmentCount(equipmentId) < count);
      if (shortage) return { ok: false, code: "selection_shortage", equipmentId: shortage[0] };
      safeEntries.forEach(([equipmentId, count]) => updateEquipmentInventoryQuantity(equipmentId, -count));
      const pointGain = totalSelected * Math.max(1, Number(options.pointPerCard || 10));
      const resources = addGrowthResources({ resonance: pointGain });
      persistPlayerState();
      return { ok: true, convertedCards: totalSelected, pointGain, resources };
    }

    function convertSelectedEquipmentInstances(instanceIds = [], options = {}) {
      const ids = Array.from(new Set((Array.isArray(instanceIds) ? instanceIds : []).map(value => String(value || "").trim()).filter(Boolean)));
      if (!ids.length) return { ok: false, code: "empty_selection" };
      const instances = ids.map(id => getEquipmentInstance(id)).filter(Boolean);
      if (instances.length !== ids.length) return { ok: false, code: "selection_shortage" };
      instances.forEach(instance => removeEquipmentInstance(instance.instanceId));
      syncLegacyInventoryCountsFromInstances();
      const pointGain = ids.length * Math.max(1, Number(options.pointPerCard || 10));
      const resources = addGrowthResources({ resonance: pointGain });
      persistPlayerState();
      return { ok: true, convertedCards: ids.length, pointGain, resources };
    }

    function convertStaminaToGrowthPoints(amount, options = {}) {
      const safeAmount = Math.max(0, Math.floor(Number(amount || 0)));
      const rate = Math.max(1, Math.floor(Number(options.staminaPerPoint || 10)));
      if (safeAmount <= 0) return { ok: false, code: "invalid_stamina_amount" };
      const currentStamina = getPlayerCurrencyAmount("stamina");
      if (safeAmount > currentStamina) return { ok: false, code: "stamina_shortage", stamina: currentStamina };
      const pointGain = Math.floor(safeAmount / rate);
      if (pointGain <= 0) return { ok: false, code: "stamina_rate_shortage", rate };
      updatePlayerCurrencyAmount("stamina", -safeAmount);
      const resources = addGrowthResources({ resonance: pointGain });
      persistPlayerState();
      return { ok: true, spentStamina: safeAmount, pointGain, rate, stamina: getPlayerCurrencyAmount("stamina"), resources };
    }

    return {
      getCardGrowth,
      getEquipmentGrowth,
      getGrowthResources,
      updateCardGrowth,
      updateEquipmentGrowth,
      getAvailableCardDuplicates,
      getAvailableEquipmentDuplicates,
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
      convertSelectedCharacterInstances,
      convertSelectedEquipmentCards,
      convertSelectedEquipmentInstances,
      convertStaminaToGrowthPoints,
    };
  }

  window.AppDataGrowthLib = {
    create: createAppDataGrowthModule
  };
})();
