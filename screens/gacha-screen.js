(function () {
  function setupGachaScreen(deps) {
    const api = createGachaScreen(deps);

    document.getElementById("gacha-single").addEventListener("click", () => api.pullGacha(1));
    document.getElementById("gacha-ten").addEventListener("click", () => api.pullGacha(10));
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
      getSystemConfig,
      getActiveGacha,
      setActiveGacha,
      buildGachaRateSummary,
      normalizeRates,
      getDefaultRates,
      getRarityModeConfig,
      getRarityLabel,
      getRarityCssClass,
      normalizeRarityValue,
      makeFallbackImage,
      showCardDetail,
      esc
    } = deps;

    function renderGachaScreen() {
      const characters = getCharacters();
      const gachas = getGachas();
      const bannerList = document.getElementById("gacha-banner-list");
      const noBanner = document.getElementById("gacha-no-banner");
      const activeArea = document.getElementById("gacha-active-area");
      const results = document.getElementById("gacha-results");

      bannerList.innerHTML = "";
      results.hidden = true;

      if (characters.length === 0 || gachas.length === 0) {
        noBanner.hidden = false;
        activeArea.hidden = true;
        return;
      }

      noBanner.hidden = true;
      gachas.forEach((gacha, index) => {
        const card = document.createElement("div");
        card.className = "gacha-banner-card";
        card.innerHTML = `
          <h4>${esc(gacha.title)}</h4>
          <p>${esc(gacha.description || buildGachaRateSummary(gacha.rates))}</p>
          <span class="gacha-banner-tag">pickup</span>
        `;
        card.addEventListener("click", () => selectGacha(index));
        bannerList.appendChild(card);
      });

      if (getActiveGacha() === null || !gachas[getActiveGacha()]) {
        setActiveGacha(0);
      }
      showActiveGacha();
    }

    function selectGacha(index) {
      setActiveGacha(index);
      showActiveGacha();
    }

    function showActiveGacha() {
      const mode = getSystemConfig().rarityMode;
      const gacha = getGachas()[getActiveGacha()];
      if (!gacha) return;

      document.getElementById("gacha-active-area").hidden = false;
      document.getElementById("gacha-active-title").textContent = gacha.title;
      document.getElementById("gacha-active-desc").textContent = gacha.description || "";

      const rates = normalizeRates(gacha.rates || getDefaultRates(mode), mode);
      document.getElementById("gacha-rates").innerHTML =
        getRarityModeConfig(mode).tiers.map(tier =>
          `<span>${getRarityLabel(tier.value, mode)}: ${rates[tier.value] || 0}%</span>`
        ).join("");
    }

    function pullGacha(count) {
      const characters = getCharacters();
      if (characters.length === 0) return;

      const mode = getSystemConfig().rarityMode;
      const gacha = getGachas()[getActiveGacha()];
      const rates = normalizeRates(gacha?.rates || getDefaultRates(mode), mode);

      document.getElementById("gacha-overlay").hidden = false;
      document.getElementById("gacha-active-area").hidden = true;

      setTimeout(() => {
        document.getElementById("gacha-overlay").hidden = true;
        const results = [];

        for (let i = 0; i < count; i += 1) {
          const rarity = rollRarity(rates, mode);
          const pool = characters.filter(char => normalizeRarityValue(char.rarity, mode) === rarity);
          const char = pool.length > 0
            ? pool[Math.floor(Math.random() * pool.length)]
            : characters[Math.floor(Math.random() * characters.length)];
          results.push({ ...char, rolledRarity: rarity });
        }

        showGachaResults(results);
      }, 1500);
    }

    function rollRarity(rates, mode) {
      const roll = Math.random() * 100;
      let cumulative = 0;
      const tiers = [...getRarityModeConfig(mode).tiers].sort((a, b) => b.rank - a.rank);
      for (const tier of tiers) {
        cumulative += rates[tier.value] || 0;
        if (roll < cumulative) return tier.value;
      }
      return getRarityModeConfig(mode).tiers[0].value;
    }

    function showGachaResults(results) {
      const mode = getSystemConfig().rarityMode;
      const grid = document.getElementById("gacha-results-grid");
      grid.innerHTML = "";
      grid.style.gridTemplateColumns = results.length === 1 ? "1fr" : "repeat(5, 1fr)";

      results.forEach((char, index) => {
        const card = document.createElement("div");
        card.className = `gacha-result-card ${getRarityCssClass(char.rolledRarity || char.rarity, mode)}`;
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
          <img src="${char.image || makeFallbackImage(char.name, char.rarity, mode)}" alt="${esc(char.name)}">
          <div class="gacha-result-info">
            <p class="gacha-result-rarity">${esc(getRarityLabel(char.rolledRarity || char.rarity, mode))}</p>
            <p class="gacha-result-name">${esc(char.name)}</p>
          </div>
        `;
        card.addEventListener("click", () => showCardDetail(char));
        grid.appendChild(card);
      });

      document.getElementById("gacha-results").hidden = false;
    }

    return {
      renderGachaScreen,
      selectGacha,
      showActiveGacha,
      pullGacha
    };
  }

  window.GachaScreen = {
    setupGachaScreen,
    createGachaScreen
  };
})();
