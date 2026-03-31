(function () {
  function createAppDataModule(deps) {
    // SECTION 01: dependency intake
    const {
      searchParams,
      roomId,
      getAuthenticatedUserId,
      getCurrentProjectId,
      getPlayerState,
      setPlayerState,
      getBaseChars,
      setBaseChars,
      getCharacters,
      setCharacters,
      getEquipmentCards,
      setEquipmentCards,
      getAnnouncements,
      setAnnouncements,
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

    // SECTION 02: storage + normalize bootstrap
    const storageApi = window.AppDataStorageLib.create({
      apiGet,
      apiPost,
      getCurrentPlayerId: (...args) => getCurrentPlayerId(...args),
      getCurrentProjectId,
      getAuthenticatedUserId,
      storageLoadLocal,
      storageSaveLocal,
      storageGetScopedStorageKey,
    });
    const {
      mergeCollectionState,
      fetchJSON,
      postJSON,
      getDataScope,
      getPlayerIdentityScope,
      getProjectRegistryScope,
      loadLocal,
      saveLocal,
      getScopedStorageKey,
      clearCharactersLocalCache,
      loadProjectRegistry,
      saveProjectRegistry,
    } = storageApi;
    const normalizeApi = window.AppDataNormalizeLib.create({
      getPlayerState,
    });
    const {
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
      hasCardInstanceInventoryMismatch,
      hasEquipmentInstanceInventoryMismatch,
      ensureInstanceCollections,
    } = normalizeApi;

    // SECTION 03: player + inventory bootstrap
    const playerApi = window.AppDataPlayerLib.create({
      searchParams,
      apiUrl,
      API,
      fetchJSON,
      postJSON,
      saveLocal,
      loadLocal,
      storageLoadLocal,
      storageSaveLocal,
      getPlayerIdentityScope,
      getAuthenticatedUserId,
      getCurrentProjectId,
      getPlayerState,
      setPlayerState,
      getDefaultPlayerState,
      mergePlayerState,
      normalizeEquipmentInventory,
      normalizeGrowthResources,
      normalizePlayerCurrencies,
      ensureInstanceCollections,
    });
    const {
      persistPlayerState,
      getCurrentPlayerId,
      getPlayerApiUrl,
      ensurePlayerProfile,
      updatePlayerProfile,
      loadPlayerState,
    } = playerApi;
    const inventoryApi = window.AppDataInventoryLib.create({
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
    });
    const {
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
    } = inventoryApi;

    // SECTION 04: event + currency + bridge + growth bootstrap
    const eventApi = window.AppDataEventLib.create({
      API,
      getPlayerState,
      setPlayerState,
      getCurrentProjectId,
      normalizePlayerCurrencies,
      getPlayerCurrencyAmount: (...args) => getPlayerCurrencyAmount(...args),
      persistPlayerState,
      postJSON,
      getPlayerApiUrl,
      addGrowthResources: (...args) => addGrowthResources(...args),
      upsertInventoryRecord,
    });
    const {
      ensureEventCurrencies,
      getLoginBonusEventKey,
      getEventExchangeKey,
      getEventItemCounts,
      applyRemoteEventState,
      normalizeLoginBonusProgress,
      getEventLoginBonusStatus,
      getEventExchangeStatus,
      claimEventLoginBonus,
      purchaseEventExchangeItem,
    } = eventApi;
    const currencyApi = window.AppDataCurrencyLib.create({
      getPlayerState,
      setPlayerState,
      persistPlayerState,
      normalizePlayerCurrencies,
      getRecoveredCurrency: deps.getRecoveredCurrency,
      getCurrentScreen: deps.getCurrentScreen,
      renderHomeCurrencies: deps.renderHomeCurrencies,
    });
    const {
      syncRecoveredCurrenciesInMemory,
      getEffectivePlayerCurrency,
      getPlayerCurrencyAmount,
      ensureHomeCurrencyTimer,
    } = currencyApi;
    const bridgeApi = window.AppDataBridgeLib.create({
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
      getGrowthResources: () => growthGetGrowthResources(),
    });
    const {
      sanitizeFormationAgainstInventory,
      updateInventoryQuantity,
      updateEquipmentInventoryQuantity,
      addGrowthResources,
      updatePlayerCurrencyAmount,
    } = bridgeApi;
    const growthApi = window.AppDataGrowthLib.create({
      DEFAULT_GROWTH_STATE,
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
    });
    const {
      getCardGrowth: growthGetCardGrowth,
      getEquipmentGrowth: growthGetEquipmentGrowth,
      getGrowthResources: growthGetGrowthResources,
      updateCardGrowth: growthUpdateCardGrowth,
      updateEquipmentGrowth: growthUpdateEquipmentGrowth,
      getAvailableCardDuplicates: growthGetAvailableCardDuplicates,
      getAvailableEquipmentDuplicates: growthGetAvailableEquipmentDuplicates,
      setCardLockedCopies: growthSetCardLockedCopies,
      setEquipmentLockedCopies: growthSetEquipmentLockedCopies,
      enhanceCard: growthEnhanceCard,
      enhanceCardInstance: growthEnhanceCardInstance,
      enhanceEquipment: growthEnhanceEquipment,
      enhanceEquipmentInstance: growthEnhanceEquipmentInstance,
      evolveCard: growthEvolveCard,
      evolveCardInstance: growthEvolveCardInstance,
      evolveEquipment: growthEvolveEquipment,
      evolveEquipmentInstance: growthEvolveEquipmentInstance,
      limitBreakCard: growthLimitBreakCard,
      limitBreakCardInstance: growthLimitBreakCardInstance,
      limitBreakEquipment: growthLimitBreakEquipment,
      limitBreakEquipmentInstance: growthLimitBreakEquipmentInstance,
      convertCardDuplicates: growthConvertCardDuplicates,
      convertEquipmentDuplicates: growthConvertEquipmentDuplicates,
      convertSelectedCharacterCards: growthConvertSelectedCharacterCards,
      convertSelectedCharacterInstances: growthConvertSelectedCharacterInstances,
      convertSelectedEquipmentCards: growthConvertSelectedEquipmentCards,
      convertSelectedEquipmentInstances: growthConvertSelectedEquipmentInstances,
      convertStaminaToGrowthPoints: growthConvertStaminaToGrowthPoints,
    } = growthApi;
    const bootstrapApi = window.AppDataBootstrapLib.create({
      API,
      apiUrl,
      fetchJSON,
      postJSON,
      getCurrentProjectId,
      getPlayerApiUrl,
      getPlayerState,
      setPlayerState,
      persistPlayerState,
      normalizePlayerCurrencies,
      upsertInventoryRecord,
      clearCharactersLocalCache,
      loadLocal,
      saveLocal,
      getDefaultSystemConfig,
      getDefaultPartyFormation,
      getDefaultBattleState,
      getBaseChars,
      setBaseChars,
      getCharacters,
      setCharacters,
      getEquipmentCards,
      setEquipmentCards,
      getAnnouncements,
      setAnnouncements,
      getStories,
      setStories,
      getGachas,
      setGachas,
      setSystemConfig,
      normalizeCharacterRecord,
      normalizeStoryRecord,
      normalizeFolderList,
      normalizeLayoutAssetRecord,
      normalizeAssetFoldersConfig,
      createDefaultHomeAssetFolder,
      mergeCollectionState,
      normalizePartyFormation,
      setPartyFormation,
      setBattleState,
      loadPlayerState,
      ensureEventCurrencies,
      ensureHomeCurrencyTimer,
    });
    const {
      recordGachaPulls: bootstrapRecordGachaPulls,
      loadAllData: bootstrapLoadAllData,
    } = bootstrapApi;

    // SECTION 05: legacy event / player / inventory / growth bridge bodies
    // Legacy bridge retained while app-data.js is hollowed out.
    function _legacyEnsureEventCurrencies(config = {}) {
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

    function _legacyGetLoginBonusEventKey(config = {}) {
      const title = String(config?.title || "").trim();
      const label = String(config?.loginBonusLabel || "").trim();
      const storyId = String(config?.storyId || "").trim();
      return [title || "event", label || "login-bonus", storyId || "default"].join("::");
    }

    function _legacyGetEventExchangeKey(config = {}) {
      const title = String(config?.title || "").trim();
      const label = String(config?.exchangeLabel || "").trim();
      const storyId = String(config?.storyId || "").trim();
      return [title || "event", label || "exchange", storyId || "default"].join("::");
    }

    function _legacyGetEventItemCounts() {
      const items = getPlayerState()?.eventItems;
      return items && typeof items === "object" ? items : {};
    }

    function _legacyApplyRemoteEventState(payload = {}) {
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

    function _legacyNormalizeLoginBonusProgress(input = {}) {
      return {
        claimedDays: Math.max(0, Number(input?.claimedDays || 0)),
        lastClaimedOn: String(input?.lastClaimedOn || "").trim() || null
      };
    }

    function _legacyGetEventLoginBonusStatus(config = {}) {
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

    function _legacyGetEventExchangeStatus(config = {}) {
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

    async function _legacyClaimEventLoginBonus(config = {}) {
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

    async function _legacyPurchaseEventExchangeItem(config = {}, itemId = "") {
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

    // 05A: player profile + bootstrap state
    // Retired in-file reference block removed.
    // Active path already comes from `playerApi` destructuring above.

    // 05B: story progress + inventory records
    // Retired in-file reference block removed.
    // Active path already comes from `inventoryApi` destructuring above.

    // 05C: inventory instance bridge
    // Retired in-file reference block removed.
    // Active path already comes from `inventoryApi` destructuring above.

    // 05D: growth / evolve / convert bridge
    // Active path already comes from `growthApi` destructuring above.
    // The `_legacy*` bodies below are retained only as in-file reference while app-data.js
    // is being hollowed out.
    // Legacy growth bridge retained while public growth API is delegated to AppDataGrowthLib.
    // 05D-A: growth state readers + low-level mutators
    // Retired in-file reference block removed.
    // All higher-level retained callers were retired; active path already comes from `growthApi` destructuring above.
    // 05D-B: card growth / evolve / limit break / convert
    // Retired in-file reference block removed.
    // Active path already comes from `growthApi` destructuring above.

    // 05D-C: equipment growth / evolve / limit break / convert
    // Retired in-file reference block removed.
    // Active path already comes from `growthApi` destructuring above.

    // 05D-D: bulk conversion helpers
    // Retired in-file reference block removed.
    // Active path already comes from `growthApi` destructuring above.

    // 05E: bootstrap record bridge
    // Retired in-file reference block removed.
    // Active path already comes from `bootstrapApi` destructuring above.

    // SECTION 06: active load / persistence runtime
    // Retired in-file reference block removed.
    // Active load/persistence path already comes from `bootstrapApi` and earlier runtime destructuring above.
    // SECTION 07: public module surface
    return {
      // storage / scope
      mergeCollectionState,
      fetchJSON,
      postJSON,
      loadLocal,
      saveLocal,
      getScopedStorageKey,
      getDataScope,
      getPlayerIdentityScope,
      getProjectRegistryScope,
      loadProjectRegistry,
      saveProjectRegistry,

      // player identity / profile / state
      getCurrentPlayerId,
      getPlayerApiUrl,
      ensurePlayerProfile,
      updatePlayerProfile,
      loadPlayerState,

      // story progress / inventory / instances
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
      getCardInstanceGrowth,
      getEquipmentInstanceGrowth,

      // event systems
      getEventItemCounts,
      getEventExchangeStatus,
      purchaseEventExchangeItem,
      getEventLoginBonusStatus,
      claimEventLoginBonus,

      // growth / evolve / convert
      getCardGrowth: growthGetCardGrowth,
      getEquipmentGrowth: growthGetEquipmentGrowth,
      getGrowthResources: growthGetGrowthResources,
      updateCardGrowth: growthUpdateCardGrowth,
      updateEquipmentGrowth: growthUpdateEquipmentGrowth,
      getAvailableCardDuplicates: growthGetAvailableCardDuplicates,
      getAvailableEquipmentDuplicates: growthGetAvailableEquipmentDuplicates,
      setCardLockedCopies: growthSetCardLockedCopies,
      setEquipmentLockedCopies: growthSetEquipmentLockedCopies,
      enhanceCard: growthEnhanceCard,
      enhanceCardInstance: growthEnhanceCardInstance,
      enhanceEquipment: growthEnhanceEquipment,
      enhanceEquipmentInstance: growthEnhanceEquipmentInstance,
      evolveCard: growthEvolveCard,
      evolveCardInstance: growthEvolveCardInstance,
      evolveEquipment: growthEvolveEquipment,
      evolveEquipmentInstance: growthEvolveEquipmentInstance,
      limitBreakCard: growthLimitBreakCard,
      limitBreakCardInstance: growthLimitBreakCardInstance,
      limitBreakEquipment: growthLimitBreakEquipment,
      limitBreakEquipmentInstance: growthLimitBreakEquipmentInstance,
      convertCardDuplicates: growthConvertCardDuplicates,
      convertEquipmentDuplicates: growthConvertEquipmentDuplicates,
      convertSelectedCharacterCards: growthConvertSelectedCharacterCards,
      convertSelectedEquipmentCards: growthConvertSelectedEquipmentCards,
      convertSelectedCharacterInstances: growthConvertSelectedCharacterInstances,
      convertSelectedEquipmentInstances: growthConvertSelectedEquipmentInstances,
      convertStaminaToGrowthPoints: growthConvertStaminaToGrowthPoints,

      // bootstrap
      recordGachaPulls: bootstrapRecordGachaPulls,
      loadAllData: bootstrapLoadAllData,

      // currency runtime
      syncRecoveredCurrenciesInMemory,
      getEffectivePlayerCurrency,
      getPlayerCurrencyAmount,
      ensureHomeCurrencyTimer
    };
  }

  window.AppDataLib = {
    create: createAppDataModule
  };
})();
