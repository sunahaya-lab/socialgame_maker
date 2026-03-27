(function () {
  function createAppDataModule(deps) {
    const {
      searchParams,
      roomId,
      getCurrentProjectId,
      getPlayerState,
      setPlayerState,
      getBaseChars,
      setBaseChars,
      getCharacters,
      setCharacters,
      getEquipmentCards,
      setEquipmentCards,
      getStories,
      setStories,
      getGachas,
      setGachas,
      getSystemConfig,
      setSystemConfig,
      getPartyFormation,
      setPartyFormation,
      setBattleState,
      apiUrl,
      API,
      apiGet,
      apiPost,
      storageLoadLocal,
      storageSaveLocal,
      storageGetScopedStorageKey,
      getDefaultSystemConfig,
      getDefaultPlayerState,
      getDefaultPartyFormation,
      getDefaultBattleState,
      normalizeCharacterRecord,
      normalizeStoryRecord,
      normalizeFolderList,
      normalizeLayoutAssetRecord,
      normalizeAssetFoldersConfig,
      createDefaultHomeAssetFolder,
      normalizePartyFormation,
      mergePlayerState,
      normalizePlayerCurrencies,
    } = deps;
    let homeCurrencyTimer = null;
    const DEFAULT_GROWTH_STATE = {
      level: 1,
      evolveStage: 0,
      limitBreak: 0,
      lockedCopies: 0,
      duplicateSpent: 0
    };
    const DEFAULT_INSTANCE_SOURCE = "legacy";

    function mergeCollectionState(remoteItems, localItems) {
      const merged = [];
      const seenIds = new Set();

      [...(Array.isArray(remoteItems) ? remoteItems : []), ...(Array.isArray(localItems) ? localItems : [])].forEach(item => {
        if (!item || !item.id || seenIds.has(item.id)) return;
        seenIds.add(item.id);
        merged.push(item);
      });

      return merged;
    }

    async function fetchJSON(url) {
      return apiGet(url);
    }

    async function postJSON(url, data) {
      return apiPost(url, data);
    }

    function getDataScope() {
      const projectId = String(getCurrentProjectId() || "").trim();
      return projectId ? `project:${projectId}` : null;
    }

    function getPlayerIdentityScope() {
      return "viewer";
    }

    function getProjectRegistryScope() {
      return "projects";
    }

    function loadLocal(key, fallback) {
      return storageLoadLocal(key, fallback, getDataScope());
    }

    function saveLocal(key, data) {
      storageSaveLocal(key, data, getDataScope());
    }

    function getScopedStorageKey(key) {
      return storageGetScopedStorageKey(key, getDataScope());
    }

    function loadProjectRegistry(key, fallback) {
      return storageLoadLocal(key, fallback, getProjectRegistryScope());
    }

    function saveProjectRegistry(key, data) {
      storageSaveLocal(key, data, getProjectRegistryScope());
    }

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

    function ensureInstanceCollections(nextState) {
      const state = nextState && typeof nextState === "object" ? nextState : getPlayerState();
      state.cardInstances = normalizeCardInstances(state.cardInstances);
      state.equipmentInstances = normalizeEquipmentInstances(state.equipmentInstances);

      if (!state.cardInstances.length) {
        state.cardInstances = createLegacyCardInstances(state.inventory, state.cardGrowth);
      }
      if (!state.equipmentInstances.length) {
        state.equipmentInstances = createLegacyEquipmentInstances(state.equipmentInventory, state.equipmentGrowth);
      }
      return state;
    }

    function persistPlayerState() {
      saveLocal("socia-player-state", getPlayerState());
    }

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

    function ensureEventCurrencies(config = {}) {
      const definitions = Array.isArray(config?.eventCurrencies) ? config.eventCurrencies : [];
      if (!definitions.length) return normalizePlayerCurrencies(getPlayerState()?.currencies);

      const playerState = getPlayerState();
      const current = normalizePlayerCurrencies(playerState?.currencies);
      const seen = new Set(current.map(currency => currency.key));
      const additions = definitions
        .map(item => ({
          key: String(item?.key || "").trim(),
          amount: Math.max(0, Number(item?.initialAmount || 0)),
          maxAmount: null,
          updatedAt: null
        }))
        .filter(item => item.key && !seen.has(item.key));

      if (!additions.length) {
        return current;
      }

      playerState.currencies = normalizePlayerCurrencies([...current, ...additions]);
      setPlayerState(playerState);
      persistPlayerState();
      return playerState.currencies;
    }

    function getLoginBonusEventKey(config = {}) {
      const title = String(config?.title || "").trim();
      const label = String(config?.loginBonusLabel || "").trim();
      const storyId = String(config?.storyId || "").trim();
      return [title || "event", label || "login-bonus", storyId || "default"].join("::");
    }

    function getEventExchangeKey(config = {}) {
      const title = String(config?.title || "").trim();
      const label = String(config?.exchangeLabel || "").trim();
      const storyId = String(config?.storyId || "").trim();
      return [title || "event", label || "exchange", storyId || "default"].join("::");
    }

    function getEventItemCounts() {
      const items = getPlayerState()?.eventItems;
      return items && typeof items === "object" ? items : {};
    }

    function applyRemoteEventState(payload = {}) {
      const playerState = getPlayerState();
      playerState.eventItems = payload?.eventItems && typeof payload.eventItems === "object"
        ? payload.eventItems
        : {};
      playerState.loginBonuses = payload?.loginBonuses && typeof payload.loginBonuses === "object"
        ? payload.loginBonuses
        : {};
      playerState.eventExchangePurchases = payload?.eventExchangePurchases && typeof payload.eventExchangePurchases === "object"
        ? payload.eventExchangePurchases
        : {};
      if (Array.isArray(payload?.currencies)) {
        playerState.currencies = normalizePlayerCurrencies(payload.currencies);
      }
      setPlayerState(playerState);
      persistPlayerState();
      return playerState;
    }

    function normalizeLoginBonusProgress(input = {}) {
      return {
        claimedDays: Math.max(0, Number(input?.claimedDays || 0)),
        lastClaimedOn: String(input?.lastClaimedOn || "").trim() || null
      };
    }

    function getEventLoginBonusStatus(config = {}) {
      ensureEventCurrencies(config);
      const rewards = Array.isArray(config?.loginBonusRewards) ? config.loginBonusRewards : [];
      const eventKey = getLoginBonusEventKey(config);
      const progressMap = getPlayerState()?.loginBonuses && typeof getPlayerState().loginBonuses === "object"
        ? getPlayerState().loginBonuses
        : {};
      const progress = normalizeLoginBonusProgress(progressMap[eventKey]);
      const today = new Date().toISOString().slice(0, 10);
      const currentIndex = rewards.length > 0 ? (progress.claimedDays % rewards.length) : 0;
      return {
        eventKey,
        progress,
        rewards,
        currentIndex,
        currentReward: rewards[currentIndex] || null,
        canClaimToday: Boolean(rewards.length > 0 && progress.lastClaimedOn !== today),
        today
      };
    }

    function getEventExchangeStatus(config = {}) {
      ensureEventCurrencies(config);
      const items = Array.isArray(config?.exchangeItems) ? config.exchangeItems : [];
      const exchangeKey = getEventExchangeKey(config);
      const purchaseMap = getPlayerState()?.eventExchangePurchases && typeof getPlayerState().eventExchangePurchases === "object"
        ? getPlayerState().eventExchangePurchases
        : {};
      const current = purchaseMap[exchangeKey] && typeof purchaseMap[exchangeKey] === "object"
        ? purchaseMap[exchangeKey]
        : {};
      return {
        exchangeKey,
        items: items.map(item => {
          const purchasedCount = Math.max(0, Number(current[item.id] || 0));
          const ownedCurrency = getPlayerCurrencyAmount(item.costCurrencyKey);
          const remainingStock = Math.max(0, Number(item.stock || 0) - purchasedCount);
          const eventItemCounts = getEventItemCounts();
          return {
            ...item,
            purchasedCount,
            remainingStock,
            ownedCurrency,
            ownedRewardCount: item.rewardKind === "event_item"
              ? Math.max(0, Number(eventItemCounts[item.rewardValue] || 0))
              : 0,
            canPurchase: remainingStock > 0 && ownedCurrency >= Number(item.costAmount || 0)
          };
        })
      };
    }

    async function claimEventLoginBonus(config = {}) {
      ensureEventCurrencies(config);
      const status = getEventLoginBonusStatus(config);
      if (!status.currentReward) {
        return { ok: false, code: "login_bonus_not_configured" };
      }
      if (!status.canClaimToday) {
        return { ok: false, code: "login_bonus_already_claimed", status };
      }

      if (!getCurrentProjectId()) {
        return { ok: false, code: "project_required" };
      }

      try {
        const response = await postJSON(getPlayerApiUrl(API.playerEventLoginBonusClaim), {});
        applyRemoteEventState({
          eventItems: response?.eventState?.eventItems,
          loginBonuses: response?.eventState?.loginBonuses,
          eventExchangePurchases: response?.eventState?.eventExchangePurchases,
          currencies: response?.currencies
        });
        return {
          ok: true,
          reward: response?.reward || status.currentReward,
          status: getEventLoginBonusStatus(config)
        };
      } catch (error) {
        console.error("Failed to claim event login bonus:", error);
        return {
          ok: false,
          code: String(error?.data?.code || "event_login_bonus_claim_failed"),
          status: getEventLoginBonusStatus(config)
        };
      }
    }

    async function purchaseEventExchangeItem(config = {}, itemId = "") {
      ensureEventCurrencies(config);
      const status = getEventExchangeStatus(config);
      const item = status.items.find(entry => entry.id === String(itemId || "").trim());
      if (!item) {
        return { ok: false, code: "exchange_item_not_found" };
      }
      if (item.remainingStock <= 0) {
        return { ok: false, code: "exchange_out_of_stock", item };
      }
      if (item.ownedCurrency < Number(item.costAmount || 0)) {
        return { ok: false, code: "exchange_currency_shortage", item };
      }

      if (!getCurrentProjectId()) {
        return { ok: false, code: "project_required", item };
      }

      try {
        const response = await postJSON(getPlayerApiUrl(API.playerEventExchangePurchase), {
          itemId: item.id
        });
        applyRemoteEventState({
          eventItems: response?.eventState?.eventItems,
          loginBonuses: response?.eventState?.loginBonuses,
          eventExchangePurchases: response?.eventState?.eventExchangePurchases,
          currencies: response?.currencies
        });

        const rewardResult = response?.rewardResult || null;
        if (rewardResult?.kind === "growth" && rewardResult.value === "resonance") {
          addGrowthResources({ resonance: Number(rewardResult.amount || 0) });
        }
        if (rewardResult?.cardId) {
          upsertInventoryRecord({
            cardId: rewardResult.cardId,
            quantity: Math.max(0, Number(rewardResult.quantity || 0))
          });
        }

        return {
          ok: true,
          item: response?.item || item,
          rewardResult,
          status: getEventExchangeStatus(config)
        };
      } catch (error) {
        console.error("Failed to purchase event exchange item:", error);
        return {
          ok: false,
          code: String(error?.data?.code || "event_exchange_purchase_failed"),
          item,
          status: getEventExchangeStatus(config)
        };
      }
    }

    function getCurrentPlayerId() {
      const explicit = searchParams.get("user");
      if (explicit) return explicit;

      const stored = storageLoadLocal("socia-player-id", null, getPlayerIdentityScope());
      if (stored) return stored;

      const next = crypto.randomUUID();
      storageSaveLocal("socia-player-id", next, getPlayerIdentityScope());
      return next;
    }

    function getPlayerApiUrl(path) {
      return apiUrl(path, {
        query: {
          user: getCurrentPlayerId()
        }
      });
    }

    async function ensurePlayerProfile() {
      if (!getCurrentProjectId()) return null;
      try {
        const response = await postJSON(getPlayerApiUrl(API.playerProfile), {});
        if (response?.profile) {
          const playerState = getPlayerState();
          playerState.profile = response.profile;
          setPlayerState(playerState);
          persistPlayerState();
        }
        return response?.profile || null;
      } catch (error) {
        console.error("Failed to ensure player profile:", error);
        return null;
      }
    }

    async function loadPlayerState() {
      const localState = loadLocal("socia-player-state", getDefaultPlayerState(getCurrentProjectId(), getCurrentPlayerId()));
      if (!getCurrentProjectId()) {
        const next = getDefaultPlayerState(null, getCurrentPlayerId());
        setPlayerState(next);
        return next;
      }

      let nextState;
      try {
        await ensurePlayerProfile();
        const response = await fetchJSON(getPlayerApiUrl(API.playerBootstrap));
        nextState = mergePlayerState(
          response?.bootstrap || getDefaultPlayerState(getCurrentProjectId(), getCurrentPlayerId()),
          localState || getDefaultPlayerState(getCurrentProjectId(), getCurrentPlayerId())
        );
      } catch (error) {
        console.error("Failed to load player state:", error);
        nextState = localState || getDefaultPlayerState(getCurrentProjectId(), getCurrentPlayerId());
      }

      nextState.equipmentInventory = normalizeEquipmentInventory(nextState.equipmentInventory || []);
      nextState.cardGrowth = nextState.cardGrowth && typeof nextState.cardGrowth === "object"
        ? nextState.cardGrowth
        : {};
      nextState.equipmentGrowth = nextState.equipmentGrowth && typeof nextState.equipmentGrowth === "object"
        ? nextState.equipmentGrowth
        : {};
      nextState.loginBonuses = nextState.loginBonuses && typeof nextState.loginBonuses === "object"
        ? nextState.loginBonuses
        : {};
      nextState.eventExchangePurchases = nextState.eventExchangePurchases && typeof nextState.eventExchangePurchases === "object"
        ? nextState.eventExchangePurchases
        : {};
      nextState.eventItems = nextState.eventItems && typeof nextState.eventItems === "object"
        ? nextState.eventItems
        : {};
      nextState.growthResources = normalizeGrowthResources(nextState.growthResources);
      ensureInstanceCollections(nextState);
      setPlayerState(nextState);
      persistPlayerState();
      return nextState;
    }

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
      setPlayerState(playerState);
    }

    function getOwnedEquipmentCount(equipmentId) {
      const key = String(equipmentId || "").trim();
      if (!key) return 0;
      const item = normalizeEquipmentInventory(getPlayerState()?.equipmentInventory).find(entry => entry.equipmentId === key);
      return Math.max(0, Number(item?.quantity || 0));
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
      const next = typeof updater === "function"
        ? updater(current)
        : { ...current, ...(updater || {}) };
      list[index] = makeCardInstance(next.cardId, next);
      playerState.cardInstances = list;
      setPlayerState(playerState);
      persistPlayerState();
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
      const next = typeof updater === "function"
        ? updater(current)
        : { ...current, ...(updater || {}) };
      list[index] = makeEquipmentInstance(next.equipmentId, next);
      playerState.equipmentInstances = list;
      setPlayerState(playerState);
      persistPlayerState();
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

    function getCardGrowth(cardId) {
      const key = String(cardId || "").trim();
      if (!key) return { ...DEFAULT_GROWTH_STATE };
      const map = getPlayerState()?.cardGrowth || {};
      return normalizeGrowthState(map[key]);
    }

    function getEquipmentGrowth(equipmentId) {
      const key = String(equipmentId || "").trim();
      if (!key) return { ...DEFAULT_GROWTH_STATE };
      const map = getPlayerState()?.equipmentGrowth || {};
      return normalizeGrowthState(map[key]);
    }

    function getGrowthResources() {
      return normalizeGrowthResources(getPlayerState()?.growthResources);
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

    function updateCardGrowth(cardId, updater) {
      const key = String(cardId || "").trim();
      if (!key) return null;
      const playerState = getPlayerState();
      const map = playerState.cardGrowth && typeof playerState.cardGrowth === "object"
        ? { ...playerState.cardGrowth }
        : {};
      const current = normalizeGrowthState(map[key]);
      const next = normalizeGrowthState(
        typeof updater === "function"
          ? updater(current)
          : { ...current, ...(updater || {}) }
      );
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
      const map = playerState.equipmentGrowth && typeof playerState.equipmentGrowth === "object"
        ? { ...playerState.equipmentGrowth }
        : {};
      const current = normalizeGrowthState(map[key]);
      const next = normalizeGrowthState(
        typeof updater === "function"
          ? updater(current)
          : { ...current, ...(updater || {}) }
      );
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

    function setCardLockedCopies(cardId, value) {
      const key = String(cardId || "").trim();
      if (!key) return { ok: false, code: "invalid_card" };
      const owned = getOwnedCardCount(key);
      const current = getCardGrowth(key);
      const maxLocked = Math.max(0, owned - 1 - current.duplicateSpent);
      const locked = Math.max(0, Math.min(maxLocked, Number(value || 0)));
      const next = updateCardGrowth(key, {
        ...current,
        lockedCopies: locked
      });
      return { ok: true, growth: next, maxLocked };
    }

    function enhanceCard(cardId) {
      const key = String(cardId || "").trim();
      if (!key) return { ok: false, code: "invalid_card" };
      const next = updateCardGrowth(key, current => ({
        ...current,
        level: Math.min(80, current.level + 1)
      }));
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

    function evolveCard(cardId) {
      const key = String(cardId || "").trim();
      if (!key) return { ok: false, code: "invalid_card" };
      const current = getCardGrowth(key);
      if (current.evolveStage >= 3) return { ok: false, code: "evolve_max" };
      const resources = getGrowthResources();
      const cost = (current.evolveStage + 1) * 5;
      if (resources.evolveMaterial < cost) {
        return { ok: false, code: "material_shortage", cost };
      }

      const playerState = getPlayerState();
      playerState.growthResources = {
        ...resources,
        evolveMaterial: Math.max(0, resources.evolveMaterial - cost)
      };
      setPlayerState(playerState);
      const next = updateCardGrowth(key, {
        ...current,
        evolveStage: current.evolveStage + 1
      });
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
      if (resources.evolveMaterial < cost) {
        return { ok: false, code: "material_shortage", cost };
      }
      const playerState = getPlayerState();
      playerState.growthResources = {
        ...resources,
        evolveMaterial: Math.max(0, resources.evolveMaterial - cost)
      };
      setPlayerState(playerState);
      const next = updateCardInstance(instanceId, item => ({
        ...item,
        growth: {
          ...normalizeGrowthState(item.growth),
          evolveStage: growth.evolveStage + 1
        }
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
      const next = updateCardGrowth(key, {
        ...current,
        limitBreak: Math.min(5, current.limitBreak + 1)
      });
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
        growth: {
          ...normalizeGrowthState(item.growth),
          limitBreak: Math.min(5, growth.limitBreak + 1)
        }
      }));
      persistPlayerState();
      return { ok: true, instance: next };
    }

    function convertCardDuplicates(cardId, target, amount) {
      const key = String(cardId || "").trim();
      const safeTarget = String(target || "").trim();
      const safeAmount = Math.max(0, Number(amount || 0));
      if (!key || safeAmount <= 0) return { ok: false, code: "invalid_convert_request" };
      if (!["resonance", "evolveMaterial", "gold"].includes(safeTarget)) {
        return { ok: false, code: "invalid_convert_target" };
      }
      const available = getAvailableCardDuplicates(key);
      if (safeAmount > available) return { ok: false, code: "duplicate_shortage" };

      const current = getCardGrowth(key);
      updateCardGrowth(key, {
        ...current,
        duplicateSpent: current.duplicateSpent + safeAmount
      });

      const playerState = getPlayerState();
      const resources = getGrowthResources();
      if (safeTarget === "gold") {
        const currencies = normalizePlayerCurrencies(playerState.currencies);
        playerState.currencies = currencies.map(currency =>
          currency.key === "gold"
            ? { ...currency, amount: Math.max(0, Number(currency.amount || 0) + safeAmount * 500) }
            : currency
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
      return {
        ok: true,
        growth: getCardGrowth(key),
        resources: getGrowthResources(),
        available: getAvailableCardDuplicates(key)
      };
    }

    function getAvailableEquipmentDuplicates(equipmentId) {
      const owned = getOwnedEquipmentCount(equipmentId);
      const growth = getEquipmentGrowth(equipmentId);
      const maxLocked = Math.max(0, owned - 1 - growth.duplicateSpent);
      const locked = Math.max(0, Math.min(maxLocked, growth.lockedCopies));
      return Math.max(0, owned - 1 - growth.duplicateSpent - locked);
    }

    function setEquipmentLockedCopies(equipmentId, value) {
      const key = String(equipmentId || "").trim();
      if (!key) return { ok: false, code: "invalid_equipment" };
      const owned = getOwnedEquipmentCount(key);
      const current = getEquipmentGrowth(key);
      const maxLocked = Math.max(0, owned - 1 - current.duplicateSpent);
      const locked = Math.max(0, Math.min(maxLocked, Number(value || 0)));
      const next = updateEquipmentGrowth(key, {
        ...current,
        lockedCopies: locked
      });
      return { ok: true, growth: next, maxLocked };
    }

    function enhanceEquipment(equipmentId) {
      const key = String(equipmentId || "").trim();
      if (!key) return { ok: false, code: "invalid_equipment" };
      const next = updateEquipmentGrowth(key, current => ({
        ...current,
        level: Math.min(80, current.level + 1)
      }));
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

    function evolveEquipment(equipmentId) {
      const key = String(equipmentId || "").trim();
      if (!key) return { ok: false, code: "invalid_equipment" };
      const current = getEquipmentGrowth(key);
      if (current.evolveStage >= 3) return { ok: false, code: "evolve_max" };
      const resources = getGrowthResources();
      const cost = (current.evolveStage + 1) * 5;
      if (resources.evolveMaterial < cost) {
        return { ok: false, code: "material_shortage", cost };
      }

      const playerState = getPlayerState();
      playerState.growthResources = {
        ...resources,
        evolveMaterial: Math.max(0, resources.evolveMaterial - cost)
      };
      setPlayerState(playerState);
      const next = updateEquipmentGrowth(key, {
        ...current,
        evolveStage: current.evolveStage + 1
      });
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
      if (resources.evolveMaterial < cost) {
        return { ok: false, code: "material_shortage", cost };
      }
      const playerState = getPlayerState();
      playerState.growthResources = {
        ...resources,
        evolveMaterial: Math.max(0, resources.evolveMaterial - cost)
      };
      setPlayerState(playerState);
      const next = updateEquipmentInstance(instanceId, item => ({
        ...item,
        growth: {
          ...normalizeGrowthState(item.growth),
          evolveStage: growth.evolveStage + 1
        }
      }));
      persistPlayerState();
      return { ok: true, instance: next, resources: getGrowthResources(), cost };
    }

    function limitBreakEquipment(equipmentId) {
      const key = String(equipmentId || "").trim();
      if (!key) return { ok: false, code: "invalid_equipment" };
      const current = getEquipmentGrowth(key);
      if (current.limitBreak >= 5) return { ok: false, code: "limit_break_max" };
      const available = getAvailableEquipmentDuplicates(key);
      if (available <= 0) return { ok: false, code: "duplicate_shortage" };
      updateEquipmentInventoryQuantity(key, -1);
      const next = updateEquipmentGrowth(key, {
        ...current,
        limitBreak: Math.min(5, current.limitBreak + 1)
      });
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
        growth: {
          ...normalizeGrowthState(item.growth),
          limitBreak: Math.min(5, growth.limitBreak + 1)
        }
      }));
      persistPlayerState();
      return { ok: true, instance: next };
    }

    function convertEquipmentDuplicates(equipmentId, target, amount) {
      const key = String(equipmentId || "").trim();
      const safeTarget = String(target || "").trim();
      const safeAmount = Math.max(0, Number(amount || 0));
      if (!key || safeAmount <= 0) return { ok: false, code: "invalid_convert_request" };
      if (!["resonance", "evolveMaterial", "gold"].includes(safeTarget)) {
        return { ok: false, code: "invalid_convert_target" };
      }
      const available = getAvailableEquipmentDuplicates(key);
      if (safeAmount > available) return { ok: false, code: "duplicate_shortage" };

      const current = getEquipmentGrowth(key);
      updateEquipmentGrowth(key, {
        ...current,
        duplicateSpent: current.duplicateSpent + safeAmount
      });

      const playerState = getPlayerState();
      const resources = getGrowthResources();
      if (safeTarget === "gold") {
        const currencies = normalizePlayerCurrencies(playerState.currencies);
        playerState.currencies = currencies.map(currency =>
          currency.key === "gold"
            ? { ...currency, amount: Math.max(0, Number(currency.amount || 0) + safeAmount * 500) }
            : currency
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
      return {
        ok: true,
        growth: getEquipmentGrowth(key),
        resources: getGrowthResources(),
        available: getAvailableEquipmentDuplicates(key)
      };
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

      safeEntries.forEach(([cardId, count]) => {
        updateInventoryQuantity(cardId, -count);
      });
      sanitizeFormationAgainstInventory();
      const pointGain = totalSelected * Math.max(1, Number(options.pointPerCard || 10));
      const resources = addGrowthResources({ resonance: pointGain });
      persistPlayerState();
      return {
        ok: true,
        convertedCards: totalSelected,
        pointGain,
        resources
      };
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

      safeEntries.forEach(([equipmentId, count]) => {
        updateEquipmentInventoryQuantity(equipmentId, -count);
      });
      const pointGain = totalSelected * Math.max(1, Number(options.pointPerCard || 10));
      const resources = addGrowthResources({ resonance: pointGain });
      persistPlayerState();
      return {
        ok: true,
        convertedCards: totalSelected,
        pointGain,
        resources
      };
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
      return {
        ok: true,
        spentStamina: safeAmount,
        pointGain,
        rate,
        stamina: getPlayerCurrencyAmount("stamina"),
        resources
      };
    }

    async function recordGachaPulls(gachaId, resultsOrCount = []) {
      if (!gachaId || !getCurrentProjectId()) return null;

      const count = Array.isArray(resultsOrCount)
        ? resultsOrCount.length
        : Math.max(0, Math.floor(Number(resultsOrCount || 0)));
      if (![1, 10].includes(count)) return null;

      const response = await postJSON(getPlayerApiUrl(API.playerGachaPulls), {
        gachaId,
        count
      });

      if (response?.results?.length) {
        response.results.forEach(result => {
          upsertInventoryRecord({
            cardId: result.cardId,
            quantity: result.quantity
          });
        });
        if (response?.currencies) {
          const playerState = getPlayerState();
          playerState.currencies = normalizePlayerCurrencies(response.currencies);
          setPlayerState(playerState);
        }
        persistPlayerState();
      }

      return response;
    }

    function getOwnedCardCount(cardId) {
      const item = getPlayerState().inventory.find(entry => entry.cardId === cardId);
      return Math.max(0, Number(item?.quantity || 0));
    }

    async function loadAllData() {
      const localBaseChars = loadLocal("socia-base-chars", []);
      const localCharacters = loadLocal("socia-characters", []);
      const localEquipmentCards = loadLocal("socia-equipment-cards", []);
      const localStories = loadLocal("socia-stories", []);
      const localGachas = loadLocal("socia-gachas", []);
      const localSystem = loadLocal("socia-system", getDefaultSystemConfig());

      const [remoteBaseChars, remoteCharacters, remoteEquipmentCards, remoteStories, remoteGachas, remoteSystem] = await Promise.all([
        fetchJSON(apiUrl(API.baseChars)).then(data => data.baseChars || []).catch(() => null),
        fetchJSON(apiUrl(API.characters)).then(data => data.entries || []).catch(() => null),
        fetchJSON(apiUrl(API.equipmentCards)).then(data => data.equipmentCards || []).catch(() => null),
        fetchJSON(apiUrl(API.stories)).then(data => data.stories || []).catch(() => null),
        fetchJSON(apiUrl(API.gachas)).then(data => data.gachas || []).catch(() => null),
        fetchJSON(apiUrl(API.system)).then(data => data.system || getDefaultSystemConfig()).catch(() => null)
      ]);

      setBaseChars(mergeCollectionState(remoteBaseChars, localBaseChars));
      setCharacters(mergeCollectionState(remoteCharacters, localCharacters).map(normalizeCharacterRecord));
      setEquipmentCards(mergeCollectionState(remoteEquipmentCards, localEquipmentCards));
      setStories(mergeCollectionState(remoteStories, localStories).map(normalizeStoryRecord));
      setGachas(mergeCollectionState(remoteGachas, localGachas));

      const nextSystemConfig = {
        ...getDefaultSystemConfig(),
        ...(remoteSystem || {}),
        ...(localSystem || {}),
        layoutPresets: {
          ...getDefaultSystemConfig().layoutPresets,
          ...(remoteSystem?.layoutPresets || {}),
          ...(localSystem?.layoutPresets || {}),
          home: {
            ...getDefaultSystemConfig().layoutPresets.home,
            ...(remoteSystem?.layoutPresets?.home || {}),
            ...(localSystem?.layoutPresets?.home || {})
          }
        },
        layoutAssets: {
          ...getDefaultSystemConfig().layoutAssets,
          ...(remoteSystem?.layoutAssets || {}),
          ...(localSystem?.layoutAssets || {}),
          home: Array.isArray(localSystem?.layoutAssets?.home)
            ? localSystem.layoutAssets.home
            : (Array.isArray(remoteSystem?.layoutAssets?.home) ? remoteSystem.layoutAssets.home : [])
        },
        assetFolders: {
          ...getDefaultSystemConfig().assetFolders,
          ...(remoteSystem?.assetFolders || {}),
          ...(localSystem?.assetFolders || {}),
          home: Array.isArray(localSystem?.assetFolders?.home)
            ? localSystem.assetFolders.home
            : (Array.isArray(remoteSystem?.assetFolders?.home) ? remoteSystem.assetFolders.home : [])
        }
      };
      nextSystemConfig.cardFolders = normalizeFolderList(nextSystemConfig.cardFolders);
      nextSystemConfig.storyFolders = normalizeFolderList(nextSystemConfig.storyFolders);
      nextSystemConfig.layoutAssets = {
        ...getDefaultSystemConfig().layoutAssets,
        ...(nextSystemConfig.layoutAssets || {}),
        home: (Array.isArray(nextSystemConfig?.layoutAssets?.home) ? nextSystemConfig.layoutAssets.home : [])
          .map(asset => normalizeLayoutAssetRecord(asset))
          .filter(Boolean)
      };
      nextSystemConfig.assetFolders = normalizeAssetFoldersConfig(nextSystemConfig.assetFolders);
      if (!nextSystemConfig.assetFolders.home.length) {
        nextSystemConfig.assetFolders.home = [createDefaultHomeAssetFolder()];
      }
      setSystemConfig(nextSystemConfig);

      saveLocal("socia-base-chars", getBaseChars());
      saveLocal("socia-characters", getCharacters());
      saveLocal("socia-equipment-cards", getEquipmentCards());
      saveLocal("socia-stories", getStories());
      saveLocal("socia-gachas", getGachas());
      saveLocal("socia-system", nextSystemConfig);
      setPartyFormation(normalizePartyFormation(loadLocal("socia-party-formation", getDefaultPartyFormation())));
      setBattleState(getDefaultBattleState());
      await loadPlayerState();
      ensureEventCurrencies(nextSystemConfig.eventConfig || {});
      ensureHomeCurrencyTimerImpl();
    }

    function syncRecoveredCurrenciesInMemory(nowMs = Date.now()) {
      const playerState = getPlayerState();
      const current = normalizePlayerCurrencies(playerState?.currencies || []);
      let changed = false;
      const next = current.map(currency => {
        const recovered = deps.getRecoveredCurrency(currency, nowMs);
        if (recovered.amount !== currency.amount || recovered.updatedAt !== currency.updatedAt) {
          changed = true;
        }
        return recovered;
      });

      if (changed && playerState) {
        playerState.currencies = next;
        setPlayerState(playerState);
        persistPlayerState();
      }

      return next;
    }

    function getEffectivePlayerCurrency(key, nowMs = Date.now()) {
      const currencies = syncRecoveredCurrenciesInMemory(nowMs);
      return currencies.find(currency => currency.key === key) || null;
    }

    function getPlayerCurrencyAmount(key) {
      return Math.max(0, Number(getEffectivePlayerCurrency(key)?.amount || 0));
    }

    function ensureHomeCurrencyTimerImpl() {
      if (homeCurrencyTimer) return;
      homeCurrencyTimer = window.setInterval(() => {
        const before = getPlayerCurrencyAmount("stamina");
        syncRecoveredCurrenciesInMemory();
        const after = getPlayerCurrencyAmount("stamina");
        if (before !== after && deps.getCurrentScreen?.() === "home") {
          deps.renderHomeCurrencies?.();
        }
      }, 1000);
    }

    return {
      mergeCollectionState,
      fetchJSON,
      postJSON,
      loadLocal,
      saveLocal,
      getCurrentPlayerId,
      getPlayerIdentityScope,
      getPlayerApiUrl,
      getScopedStorageKey,
      loadProjectRegistry,
      saveProjectRegistry,
      getProjectRegistryScope,
      getDataScope,
      ensurePlayerProfile,
      loadPlayerState,
      getPlayerStoryProgress,
      saveStoryProgress,
      upsertPlayerStoryProgress,
      recordGachaPulls,
      getEventItemCounts,
      getEventExchangeStatus,
      purchaseEventExchangeItem,
      getEventLoginBonusStatus,
      claimEventLoginBonus,
      upsertInventoryRecord,
      getOwnedCardCount,
      getOwnedEquipmentCount,
      getCardInstances,
      getEquipmentInstances,
      getCardInstance,
      getEquipmentInstance,
      getCardInstanceGrowth,
      getEquipmentInstanceGrowth,
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
      convertSelectedEquipmentCards,
      convertSelectedCharacterInstances,
      convertSelectedEquipmentInstances,
      convertStaminaToGrowthPoints,
      loadAllData,
      syncRecoveredCurrenciesInMemory,
      getEffectivePlayerCurrency,
      getPlayerCurrencyAmount,
      ensureHomeCurrencyTimer: ensureHomeCurrencyTimerImpl
    };
  }

  window.AppDataLib = {
    create: createAppDataModule
  };
})();
