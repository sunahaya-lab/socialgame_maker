(function () {
  function createAppDataNormalizeModule(deps) {
    const { getPlayerState } = deps;

    const DEFAULT_GROWTH_STATE = {
      level: 1,
      evolveStage: 0,
      limitBreak: 0,
      lockedCopies: 0,
      duplicateSpent: 0
    };
    const DEFAULT_INSTANCE_SOURCE = "legacy";

    function normalizeGrowthState(input) {
      const source = input && typeof input === "object" ? input : {};
      return {
        level: Math.max(1, Number(source.level || DEFAULT_GROWTH_STATE.level)),
        evolveStage: Math.max(0, Math.min(3, Number(source.evolveStage || DEFAULT_GROWTH_STATE.evolveStage))),
        limitBreak: Math.max(0, Math.min(5, Number(source.limitBreak || DEFAULT_GROWTH_STATE.limitBreak))),
        lockedCopies: Math.max(0, Number(source.lockedCopies || DEFAULT_GROWTH_STATE.lockedCopies)),
        duplicateSpent: Math.max(0, Number(source.duplicateSpent || DEFAULT_GROWTH_STATE.duplicateSpent))
      };
    }

    function normalizeGrowthResources(input) {
      const source = input && typeof input === "object" ? input : {};
      return {
        resonance: Math.max(0, Number(source.resonance || 0)),
        evolveMaterial: Math.max(0, Number(source.evolveMaterial || 0))
      };
    }

    function normalizeEquipmentInventory(list) {
      return (Array.isArray(list) ? list : [])
        .map(item => ({
          equipmentId: String(item?.equipmentId || "").trim(),
          quantity: Math.max(0, Number(item?.quantity || 0))
        }))
        .filter(item => item.equipmentId && item.quantity > 0);
    }

    function makeCardInstance(cardId, options = {}) {
      const key = String(cardId || "").trim();
      if (!key) return null;
      const now = new Date().toISOString();
      return {
        instanceId: String(options.instanceId || crypto.randomUUID()).trim(),
        cardId: key,
        acquiredAt: String(options.acquiredAt || now),
        source: String(options.source || DEFAULT_INSTANCE_SOURCE).trim() || DEFAULT_INSTANCE_SOURCE,
        isLocked: Boolean(options.isLocked),
        growth: normalizeGrowthState(options.growth)
      };
    }

    function makeEquipmentInstance(equipmentId, options = {}) {
      const key = String(equipmentId || "").trim();
      if (!key) return null;
      const now = new Date().toISOString();
      return {
        instanceId: String(options.instanceId || crypto.randomUUID()).trim(),
        equipmentId: key,
        acquiredAt: String(options.acquiredAt || now),
        source: String(options.source || DEFAULT_INSTANCE_SOURCE).trim() || DEFAULT_INSTANCE_SOURCE,
        isLocked: Boolean(options.isLocked),
        growth: normalizeGrowthState(options.growth)
      };
    }

    function normalizeCardInstances(list) {
      return (Array.isArray(list) ? list : [])
        .map(item => makeCardInstance(item?.cardId, item || {}))
        .filter(Boolean);
    }

    function normalizeEquipmentInstances(list) {
      return (Array.isArray(list) ? list : [])
        .map(item => makeEquipmentInstance(item?.equipmentId, item || {}))
        .filter(Boolean);
    }

    function createLegacyCardInstances(inventory = [], cardGrowthMap = {}) {
      return (Array.isArray(inventory) ? inventory : []).flatMap(item => {
        const cardId = String(item?.cardId || "").trim();
        const quantity = Math.max(0, Number(item?.quantity || 0));
        if (!cardId || quantity <= 0) return [];
        const firstGrowth = normalizeGrowthState(cardGrowthMap?.[cardId]);
        return Array.from({ length: quantity }, (_, index) => makeCardInstance(cardId, {
          acquiredAt: item?.lastAcquiredAt || item?.firstAcquiredAt || item?.updatedAt || item?.createdAt || new Date().toISOString(),
          source: "legacy",
          growth: index === 0 ? firstGrowth : DEFAULT_GROWTH_STATE
        })).filter(Boolean);
      });
    }

    function createLegacyEquipmentInstances(equipmentInventory = [], equipmentGrowthMap = {}) {
      return (Array.isArray(equipmentInventory) ? equipmentInventory : []).flatMap(item => {
        const equipmentId = String(item?.equipmentId || "").trim();
        const quantity = Math.max(0, Number(item?.quantity || 0));
        if (!equipmentId || quantity <= 0) return [];
        const firstGrowth = normalizeGrowthState(equipmentGrowthMap?.[equipmentId]);
        return Array.from({ length: quantity }, (_, index) => makeEquipmentInstance(equipmentId, {
          source: "legacy",
          growth: index === 0 ? firstGrowth : DEFAULT_GROWTH_STATE
        })).filter(Boolean);
      });
    }

    function hasCardInstanceInventoryMismatch(cardInstances = [], inventory = []) {
      const instanceCounts = new Map();
      (Array.isArray(cardInstances) ? cardInstances : []).forEach(item => {
        const cardId = String(item?.cardId || "").trim();
        if (!cardId) return;
        instanceCounts.set(cardId, (instanceCounts.get(cardId) || 0) + 1);
      });

      const inventoryCounts = new Map();
      (Array.isArray(inventory) ? inventory : []).forEach(item => {
        const cardId = String(item?.cardId || "").trim();
        const quantity = Math.max(0, Number(item?.quantity || 0));
        if (!cardId) return;
        inventoryCounts.set(cardId, quantity);
      });

      if (instanceCounts.size !== inventoryCounts.size) return true;
      for (const [cardId, quantity] of inventoryCounts.entries()) {
        if ((instanceCounts.get(cardId) || 0) !== quantity) return true;
      }
      return false;
    }

    function hasEquipmentInstanceInventoryMismatch(equipmentInstances = [], equipmentInventory = []) {
      const instanceCounts = new Map();
      (Array.isArray(equipmentInstances) ? equipmentInstances : []).forEach(item => {
        const equipmentId = String(item?.equipmentId || "").trim();
        if (!equipmentId) return;
        instanceCounts.set(equipmentId, (instanceCounts.get(equipmentId) || 0) + 1);
      });

      const inventoryCounts = new Map();
      (Array.isArray(equipmentInventory) ? equipmentInventory : []).forEach(item => {
        const equipmentId = String(item?.equipmentId || "").trim();
        const quantity = Math.max(0, Number(item?.quantity || 0));
        if (!equipmentId) return;
        inventoryCounts.set(equipmentId, quantity);
      });

      if (instanceCounts.size !== inventoryCounts.size) return true;
      for (const [equipmentId, quantity] of inventoryCounts.entries()) {
        if ((instanceCounts.get(equipmentId) || 0) !== quantity) return true;
      }
      return false;
    }

    function createInventoryFromCardInstances(cardInstances = []) {
      const counts = new Map();
      (Array.isArray(cardInstances) ? cardInstances : []).forEach(item => {
        const cardId = String(item?.cardId || "").trim();
        if (!cardId) return;
        counts.set(cardId, (counts.get(cardId) || 0) + 1);
      });
      return Array.from(counts.entries()).map(([cardId, quantity]) => ({
        id: null,
        cardId,
        quantity,
        firstAcquiredAt: null,
        lastAcquiredAt: null,
        createdAt: null,
        updatedAt: null
      }));
    }

    function createEquipmentInventoryFromInstances(equipmentInstances = []) {
      const counts = new Map();
      (Array.isArray(equipmentInstances) ? equipmentInstances : []).forEach(item => {
        const equipmentId = String(item?.equipmentId || "").trim();
        if (!equipmentId) return;
        counts.set(equipmentId, (counts.get(equipmentId) || 0) + 1);
      });
      return Array.from(counts.entries()).map(([equipmentId, quantity]) => ({
        equipmentId,
        quantity
      }));
    }

    function ensureInstanceCollections(nextState) {
      const state = nextState && typeof nextState === "object" ? nextState : getPlayerState();
      state.cardInstances = normalizeCardInstances(state.cardInstances);
      state.equipmentInstances = normalizeEquipmentInstances(state.equipmentInstances);

      if (!Array.isArray(state.inventory)) {
        state.inventory = [];
      }
      if (!Array.isArray(state.equipmentInventory)) {
        state.equipmentInventory = [];
      }

      if (!state.inventory.length && state.cardInstances.length) {
        state.inventory = createInventoryFromCardInstances(state.cardInstances);
      } else if (state.cardInstances.length && hasCardInstanceInventoryMismatch(state.cardInstances, state.inventory)) {
        state.inventory = createInventoryFromCardInstances(state.cardInstances);
      } else if (!state.cardInstances.length) {
        state.cardInstances = createLegacyCardInstances(state.inventory, state.cardGrowth);
      }
      if (!state.equipmentInventory.length && state.equipmentInstances.length) {
        state.equipmentInventory = createEquipmentInventoryFromInstances(state.equipmentInstances);
      } else if (state.equipmentInstances.length && hasEquipmentInstanceInventoryMismatch(state.equipmentInstances, state.equipmentInventory)) {
        state.equipmentInventory = createEquipmentInventoryFromInstances(state.equipmentInstances);
      } else if (!state.equipmentInstances.length) {
        state.equipmentInstances = createLegacyEquipmentInstances(state.equipmentInventory, state.equipmentGrowth);
      }
      return state;
    }

    return {
      DEFAULT_GROWTH_STATE,
      DEFAULT_INSTANCE_SOURCE,
      normalizeGrowthState,
      normalizeGrowthResources,
      normalizeEquipmentInventory,
      makeCardInstance,
      makeEquipmentInstance,
      normalizeCardInstances,
      normalizeEquipmentInstances,
      createLegacyCardInstances,
      createLegacyEquipmentInstances,
      createInventoryFromCardInstances,
      createEquipmentInventoryFromInstances,
      hasCardInstanceInventoryMismatch,
      hasEquipmentInstanceInventoryMismatch,
      ensureInstanceCollections,
    };
  }

  window.AppDataNormalizeLib = {
    create: createAppDataNormalizeModule
  };
})();
