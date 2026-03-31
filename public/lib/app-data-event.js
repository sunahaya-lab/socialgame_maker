(function () {
  function createAppDataEventModule(deps) {
    const {
      API,
      getPlayerState,
      setPlayerState,
      getCurrentProjectId,
      normalizePlayerCurrencies,
      getPlayerCurrencyAmount,
      persistPlayerState,
      postJSON,
      getPlayerApiUrl,
      addGrowthResources,
      upsertInventoryRecord,
    } = deps;

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

      if (!additions.length) return current;

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
      if (!item) return { ok: false, code: "exchange_item_not_found" };
      if (item.remainingStock <= 0) return { ok: false, code: "exchange_out_of_stock", item };
      if (item.ownedCurrency < Number(item.costAmount || 0)) return { ok: false, code: "exchange_currency_shortage", item };
      if (!getCurrentProjectId()) return { ok: false, code: "project_required", item };

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

    return {
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
    };
  }

  window.AppDataEventLib = {
    create: createAppDataEventModule
  };
})();
