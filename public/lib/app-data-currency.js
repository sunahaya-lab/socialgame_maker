(function () {
  function createAppDataCurrencyModule(deps) {
    const {
      getPlayerState,
      setPlayerState,
      persistPlayerState,
      normalizePlayerCurrencies,
      getRecoveredCurrency,
      getCurrentScreen,
      renderHomeCurrencies,
    } = deps;

    let homeCurrencyTimer = null;

    function syncRecoveredCurrenciesInMemory(nowMs = Date.now()) {
      const playerState = getPlayerState();
      const current = normalizePlayerCurrencies(playerState?.currencies || []);
      let changed = false;
      const next = current.map(currency => {
        const recovered = getRecoveredCurrency(currency, nowMs);
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

    function ensureHomeCurrencyTimer() {
      if (homeCurrencyTimer) return;
      homeCurrencyTimer = window.setInterval(() => {
        const before = getPlayerCurrencyAmount("stamina");
        syncRecoveredCurrenciesInMemory();
        const after = getPlayerCurrencyAmount("stamina");
        if (before !== after && getCurrentScreen?.() === "home") {
          renderHomeCurrencies?.();
        }
      }, 1000);
    }

    return {
      syncRecoveredCurrenciesInMemory,
      getEffectivePlayerCurrency,
      getPlayerCurrencyAmount,
      ensureHomeCurrencyTimer,
    };
  }

  window.AppDataCurrencyLib = {
    create: createAppDataCurrencyModule
  };
})();
