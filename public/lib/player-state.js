(function () {
  function normalizePartyFormation(formation) {
    const list = Array.isArray(formation) ? formation.slice(0, 5) : [];
    while (list.length < 5) list.push("");
    return list.map(item => String(item || ""));
  }

  function mergeByKey(primary, secondary, key, resolver) {
    const map = new Map();
    [...(Array.isArray(secondary) ? secondary : []), ...(Array.isArray(primary) ? primary : [])].forEach(item => {
      if (!item || item[key] === undefined || item[key] === null) return;
      const id = item[key];
      if (!map.has(id)) {
        map.set(id, item);
        return;
      }
      map.set(id, resolver ? resolver(map.get(id), item) : item);
    });
    return [...map.values()];
  }

  function mergeInventoryItem(a, b) {
    return {
      ...(a || {}),
      ...(b || {}),
      quantity: Math.max(Number(a?.quantity || 0), Number(b?.quantity || 0))
    };
  }

  function mergeStoryProgressItem(a, b) {
    const rank = {
      locked: 0,
      unlocked: 1,
      in_progress: 2,
      completed: 3
    };
    const aRank = rank[a?.status] ?? 0;
    const bRank = rank[b?.status] ?? 0;
    return aRank >= bRank ? a : b;
  }

  function normalizePlayerCurrencies(currencies, defaultCurrencies) {
    const map = new Map();
    (Array.isArray(defaultCurrencies) ? defaultCurrencies : []).forEach(currency => {
      map.set(currency.key, { ...currency });
    });

    (Array.isArray(currencies) ? currencies : []).forEach(currency => {
      const key = String(currency?.key || "").trim();
      if (!key) return;
      map.set(key, {
        ...(map.get(key) || {}),
        key,
        amount: Math.max(0, Number(currency?.amount || 0)),
        maxAmount: currency?.maxAmount === null || currency?.maxAmount === undefined
          ? null
          : Math.max(0, Number(currency.maxAmount || 0)),
        updatedAt: currency?.updatedAt || map.get(key)?.updatedAt || null
      });
    });

    return Array.from(map.values());
  }

  function getRecoveredCurrency(currency, nowMs = Date.now()) {
    if (currency?.key !== "stamina") return currency;

    const maxAmount = currency?.maxAmount === null || currency?.maxAmount === undefined
      ? null
      : Math.max(0, Number(currency.maxAmount || 0));
    const amount = Math.max(0, Number(currency?.amount || 0));
    if (maxAmount === null || amount >= maxAmount) return currency;

    const updatedAtMs = Date.parse(currency?.updatedAt || "");
    if (!Number.isFinite(updatedAtMs) || nowMs <= updatedAtMs) return currency;

    const recoveredUnits = Math.floor((nowMs - updatedAtMs) / 60000);
    if (recoveredUnits <= 0) return currency;

    const nextAmount = Math.min(maxAmount, amount + recoveredUnits);
    const nextUpdatedAt = nextAmount >= maxAmount
      ? new Date(nowMs).toISOString()
      : new Date(updatedAtMs + recoveredUnits * 60000).toISOString();

    return {
      ...currency,
      amount: nextAmount,
      updatedAt: nextUpdatedAt
    };
  }

  function normalizeHomePreferences(config, defaultHomeConfig, clampFn) {
    const toNumber = (value, fallback) => {
      const next = Number(value);
      return Number.isNaN(next) ? fallback : next;
    };
    return {
      ...defaultHomeConfig,
      ...(config || {}),
      mode: Number(config?.mode) === 2 ? 2 : 1,
      backgroundImage: String(config?.backgroundImage || "").trim().slice(0, 2_000_000),
      front: Number(config?.front) === 1 ? 1 : 2,
      scale1: Math.round(clampFn(toNumber(config?.scale1, 100), 50, 200)),
      x1: clampFn(toNumber(config?.x1, -10), -60, 60),
      y1: clampFn(toNumber(config?.y1, 0), -30, 50),
      scale2: Math.round(clampFn(toNumber(config?.scale2, 100), 50, 200)),
      x2: clampFn(toNumber(config?.x2, 10), -60, 60),
      y2: clampFn(toNumber(config?.y2, 0), -30, 50)
    };
  }

  function mergePlayerState(remoteState, localState, defaults) {
    const merged = {
      ...(defaults || {}),
      ...(localState || {}),
      ...(remoteState || {})
    };

    merged.profile = remoteState?.profile?.id
      ? remoteState.profile
      : (localState?.profile || merged.profile);
    merged.inventory = mergeByKey(remoteState?.inventory, localState?.inventory, "cardId", mergeInventoryItem);
    merged.storyProgress = mergeByKey(remoteState?.storyProgress, localState?.storyProgress, "storyId", mergeStoryProgressItem);
    merged.gachaHistory = mergeByKey(remoteState?.gachaHistory, localState?.gachaHistory, "id");
    merged.currencies = normalizePlayerCurrencies(
      Array.isArray(remoteState?.currencies) && remoteState.currencies.length > 0
        ? remoteState.currencies
        : (localState?.currencies || []),
      defaults?.currencies || []
    );
    merged.homePreferences = remoteState?.homePreferences || localState?.homePreferences || null;
    merged.loginBonuses = remoteState?.loginBonuses && typeof remoteState.loginBonuses === "object"
      ? remoteState.loginBonuses
      : (localState?.loginBonuses || {});
    merged.eventExchangePurchases = remoteState?.eventExchangePurchases && typeof remoteState.eventExchangePurchases === "object"
      ? remoteState.eventExchangePurchases
      : (localState?.eventExchangePurchases || {});
    merged.eventItems = remoteState?.eventItems && typeof remoteState.eventItems === "object"
      ? remoteState.eventItems
      : (localState?.eventItems || {});
    return merged;
  }

  function formatCurrencyBalance(currency, includeMax = false) {
    const amount = Math.max(0, Number(currency?.amount || 0));
    const maxAmount = currency?.maxAmount === null || currency?.maxAmount === undefined
      ? null
      : Math.max(0, Number(currency.maxAmount || 0));

    if (includeMax && maxAmount !== null) {
      return `${amount.toLocaleString()}/${maxAmount.toLocaleString()}`;
    }

    return amount.toLocaleString();
  }

  window.PlayerStateLib = {
    normalizePartyFormation,
    mergeByKey,
    mergeInventoryItem,
    mergeStoryProgressItem,
    normalizePlayerCurrencies,
    getRecoveredCurrency,
    normalizeHomePreferences,
    mergePlayerState,
    formatCurrencyBalance
  };
})();
