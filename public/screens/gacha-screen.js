(function () {
  function setupGachaScreen(deps) {
    const api = createGachaScreen(deps);

    api.ensureInfoControls();
    document.getElementById("gacha-single").addEventListener("click", () => api.pullGacha(1));
    document.getElementById("gacha-ten").addEventListener("click", () => api.pullGacha(10));
    document.getElementById("gacha-history-toggle")?.addEventListener("click", () => api.toggleHistory());
    document.getElementById("gacha-results-ok").addEventListener("click", () => {
      document.getElementById("gacha-results").hidden = true;
      document.getElementById("gacha-active-area").hidden = false;
    });

    return api;
  }

  function createGachaScreen(deps) {
    const {
      getCharacters,
      getGachas,
      getPlayerState,
      getSystemConfig,
      getActiveGacha,
      setActiveGacha,
      buildGachaRateSummary,
      normalizeRates,
      getDefaultRates,
      getRarityModeConfig,
      getRarityRank,
      getRarityLabel,
      getRarityCssClass,
      normalizeRarityValue,
      makeFallbackImage,
      showCardDetail,
      getPlayerCurrencyAmount,
      recordGachaPulls,
      refreshPlayerState,
      showToast,
      esc
    } = deps;
    const displayApi = window.GachaDisplayRuntime?.create?.({
      getCharacters,
      getGachas,
      getPlayerState,
      getSystemConfig,
      getActiveGacha,
      setActiveGacha,
      getRarityCssClass,
      getRarityLabel,
      getRarityRank,
      normalizeRarityValue,
      makeFallbackImage,
      showCardDetail,
      esc
    }) || null;
    const selectionApi = window.GachaSelectionRuntime?.create?.({
      getGachas,
      getActiveGacha,
      setActiveGacha,
      getSystemConfig,
      buildGachaRateSummary,
      normalizeRates,
      getDefaultRates,
      getRarityModeConfig,
      getRarityLabel,
      getGachaTypeLabel: value => displayApi?.getGachaTypeLabel?.(value) || "??????",
      normalizeHeroImages: gacha => displayApi?.normalizeHeroImages?.(gacha) || [],
      renderGachaHero: gacha => displayApi?.renderGachaHero?.(gacha),
      renderGachaHistory: () => displayApi?.renderGachaHistory?.(),
      updateInfoPanel: (gacha, rateMarkup) => displayApi?.updateInfoPanel?.(gacha, rateMarkup),
      esc
    }) || null;

    function normalizeGachaType(value) {
      return displayApi?.normalizeGachaType?.(value) || "character";
    }

    function getGachaTypeLabel(value) {
      return displayApi?.getGachaTypeLabel?.(value) || "??????";
    }

    function renderGachaScreen() {
      return selectionApi?.renderGachaScreen?.();
    }

    function selectGacha(index) {
      return selectionApi?.selectGacha?.(index);
    }

    function showActiveGacha() {
      return selectionApi?.showActiveGacha?.();
    }

    function syncActiveBannerCard() {
      return selectionApi?.syncActiveBannerCard?.();
    }

    function renderGachaHero(gacha) {
      return displayApi?.renderGachaHero?.(gacha);
    }

    function renderGachaHistory() {
      return displayApi?.renderGachaHistory?.();
    }

    function toggleHistory() {
      return displayApi?.toggleHistory?.();
    }

    function ensureInfoControls() {
      return displayApi?.ensureInfoControls?.();
    }

    function updateInfoPanel(gacha, rateMarkup) {
      return displayApi?.updateInfoPanel?.(gacha, rateMarkup);
    }

    function pullGacha(count) {
      const characters = getCharacters();
      const gacha = getGachas()[getActiveGacha()];
      if (!gacha) return;
      if (normalizeGachaType(gacha.gachaType) === "equipment") {
        if (showToast) showToast("\u88c5\u5099\u30ac\u30c1\u30e3\u306e\u6392\u51fa\u51e6\u7406\u306f\u307e\u3060\u672a\u5b9f\u88c5\u3067\u3059");
        return;
      }
      if (normalizeGachaType(gacha.gachaType) === "mixed") {
        if (showToast) showToast("\u6df7\u5408\u30ac\u30c1\u30e3\u306e\u6392\u51fa\u51e6\u7406\u306f\u307e\u3060\u672a\u5b9f\u88c5\u3067\u3059");
        return;
      }
      if (characters.length === 0) {
        if (showToast) showToast("\u30ad\u30e3\u30e9\u30c7\u30fc\u30bf\u304c\u306a\u3044\u305f\u3081\u30ad\u30e3\u30e9\u30ac\u30c1\u30e3\u3092\u5f15\u3051\u307e\u305b\u3093");
        return;
      }

      const gemCost = count === 10 ? 300 : count * 30;
      if (getPlayerCurrencyAmount && getPlayerCurrencyAmount("gems") < gemCost) {
        if (showToast) showToast("\u30b8\u30a7\u30e0\u304c\u8db3\u308a\u307e\u305b\u3093");
        return;
      }

      document.getElementById("gacha-overlay").hidden = false;
      document.getElementById("gacha-active-area").hidden = true;

      setTimeout(async () => {
        document.getElementById("gacha-overlay").hidden = true;
        if (recordGachaPulls && gacha?.id) {
          try {
            const response = await recordGachaPulls(gacha.id, count);
            if (refreshPlayerState) await refreshPlayerState();
            renderGachaHistory();
            const results = (response?.results || []).map(result => {
              const char = characters.find(item => item.id === result.cardId);
              if (!char) {
                return {
                  id: result.cardId,
                  name: result.cardId,
                  rarity: result.rarityAtPull || "",
                  rolledRarity: result.rarityAtPull || "",
                  image: ""
                };
              }
              return {
                ...char,
                rolledRarity: result.rarityAtPull || char.rarity
              };
            });
            if (results.length !== count) {
              document.getElementById("gacha-active-area").hidden = false;
              if (showToast) showToast("\u30ac\u30c1\u30e3\u7d50\u679c\u306e\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
              return;
            }
            showGachaResults(results);
          } catch (error) {
            console.error("Failed to save gacha results:", error);
            document.getElementById("gacha-active-area").hidden = false;
            if (showToast) showToast("\u30ac\u30c1\u30e3\u306e\u5b9f\u884c\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
            return;
          }
        }
      }, 1500);
    }

    function showGachaResults(results) {
      return displayApi?.showGachaResults?.(results);
    }

    return {
      renderGachaScreen,
      selectGacha,
      showActiveGacha,
      pullGacha,
      toggleHistory,
      ensureInfoControls
    };
  }

  window.GachaScreen = {
    setupGachaScreen,
    createGachaScreen
  };
})();
