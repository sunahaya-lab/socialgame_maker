(function () {
  function setupGachaScreen(deps) {
    const api = createGachaScreen(deps);

    document.getElementById("gacha-single").addEventListener("click", () => api.pullGacha(1));
    document.getElementById("gacha-ten").addEventListener("click", () => api.pullGacha(10));
    document.getElementById("gacha-history-toggle").addEventListener("click", () => api.toggleHistory());
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
      document.getElementById("gacha-history-panel").hidden = true;
      document.getElementById("gacha-history-toggle").setAttribute("aria-expanded", "false");
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
      renderGachaHistory();
    }

    function selectGacha(index) {
      setActiveGacha(index);
      showActiveGacha();
      renderGachaHistory();
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

      renderGachaHero(gacha);
    }

    function renderGachaHero(gacha) {
      const backdrop = document.getElementById("gacha-hero-backdrop");
      const images = document.getElementById("gacha-hero-images");
      if (!backdrop || !images) return;

      const heroEntries = resolveHeroEntries(gacha);
      const backdropImage = heroEntries[0]?.image || gacha.bannerImage || "";
      backdrop.style.backgroundImage = backdropImage
        ? `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.22)), url("${backdropImage}")`
        : "";
      backdrop.style.backgroundSize = backdropImage ? "cover" : "";
      backdrop.style.backgroundPosition = backdropImage ? "center top" : "";

      if (heroEntries.length === 0) {
        images.innerHTML = `<div class="gacha-hero-empty">ピックアップ画像を表示できます。</div>`;
        return;
      }

      const classes = ["is-secondary-left", "is-primary", "is-secondary-right"];
      const orderedEntries = orderHeroEntries(heroEntries);
      images.innerHTML = orderedEntries.map((entry, index) => `
        <div class="gacha-hero-card ${classes[index] || ""}">
          <img src="${entry.image}" alt="${esc(entry.name || gacha.title)}">
        </div>
      `).join("");
    }

    function resolveHeroEntries(gacha) {
      if (gacha?.displayMode === "manualImages") {
        return normalizeHeroImages(gacha).map((image, index) => ({
          id: `manual-${index}`,
          name: gacha.title,
          image
        }));
      }

      const characters = getCharacters();
      const featuredIds = Array.isArray(gacha?.featured) ? gacha.featured : [];
      const featuredCards = featuredIds
        .map(id => characters.find(character => character.id === id))
        .filter(Boolean)
        .sort((a, b) => {
          const rarityDiff = getRarityRank(normalizeRarityValue(b.rarity, getSystemConfig().rarityMode))
            - getRarityRank(normalizeRarityValue(a.rarity, getSystemConfig().rarityMode));
          if (rarityDiff !== 0) return rarityDiff;
          return String(a.name || "").localeCompare(String(b.name || ""), "ja");
        });

      if (featuredCards.length === 0) {
        return normalizeHeroImages(gacha).map((image, index) => ({
          id: `fallback-${index}`,
          name: gacha.title,
          image
        }));
      }

      const topRank = getRarityRank(normalizeRarityValue(featuredCards[0].rarity, getSystemConfig().rarityMode));
      const topCards = featuredCards
        .filter(card => getRarityRank(normalizeRarityValue(card.rarity, getSystemConfig().rarityMode)) === topRank)
        .slice(0, 3);
      const fallbackCards = featuredCards.filter(card => !topCards.includes(card)).slice(0, Math.max(0, 3 - topCards.length));

      return [...topCards, ...fallbackCards]
        .slice(0, 3)
        .map(card => ({
          id: card.id,
          name: card.name,
          image: card.image || makeFallbackImage(card.name, card.rarity, getSystemConfig().rarityMode)
        }));
    }

    function normalizeHeroImages(gacha) {
      const source = Array.isArray(gacha?.heroImages) && gacha.heroImages.length > 0
        ? gacha.heroImages
        : [gacha?.bannerImage];
      return source.filter(Boolean).slice(0, 3);
    }

    function orderHeroEntries(entries) {
      if (entries.length <= 1) return entries;
      if (entries.length === 2) return [entries[1], entries[0]];
      return [entries[1], entries[0], entries[2]];
    }

    function renderGachaHistory() {
      const playerState = getPlayerState ? getPlayerState() : null;
      const activeGacha = getGachas()[getActiveGacha()];
      const history = Array.isArray(playerState?.gachaHistory)
        ? playerState.gachaHistory.filter(item => !activeGacha || item.gachaId === activeGacha.id).slice(0, 20)
        : [];
      const list = document.getElementById("gacha-history-list");
      const empty = document.getElementById("gacha-history-empty");
      const meta = document.getElementById("gacha-history-meta");
      const toggleMeta = document.getElementById("gacha-history-toggle-meta");

      if (!list || !empty) return;

      if (meta) meta.textContent = `${history.length}件`;
      if (toggleMeta) toggleMeta.textContent = `${history.length}件`;
      if (history.length === 0) {
        list.hidden = true;
        list.innerHTML = "";
        empty.hidden = false;
        return;
      }

      const gachas = getGachas();
      const characters = getCharacters();
      list.innerHTML = history.map(item => {
        const gacha = gachas.find(entry => entry.id === item.gachaId);
        const card = characters.find(entry => entry.id === item.cardId);
        const rarity = item.rarityAtPull || card?.rarity || "";
        return `
          <div class="gacha-history-item">
            <div class="gacha-history-time">${esc(formatHistoryTime(item.createdAt))}</div>
            <div class="gacha-history-main">
              <div class="gacha-history-gacha">${esc(gacha?.title || item.gachaId || "-")}</div>
              <div class="gacha-history-card">${esc(card?.name || item.cardId || "-")}</div>
            </div>
            <div class="gacha-history-rarity ${getRarityCssClass(rarity, getSystemConfig().rarityMode)}">${esc(getRarityLabel(rarity, getSystemConfig().rarityMode))}</div>
          </div>
        `;
      }).join("");
      empty.hidden = true;
      list.hidden = false;
    }

    function toggleHistory() {
      const panel = document.getElementById("gacha-history-panel");
      const toggle = document.getElementById("gacha-history-toggle");
      if (!panel || !toggle) return;
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(!panel.hidden));
    }

    function formatHistoryTime(value) {
      const date = value ? new Date(value) : null;
      if (!date || Number.isNaN(date.getTime())) return "--:--";
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${month}/${day} ${hours}:${minutes}`;
    }

    function pullGacha(count) {
      const characters = getCharacters();
      if (characters.length === 0) return;

      const gemCost = count === 10 ? 300 : count * 30;
      if (getPlayerCurrencyAmount && getPlayerCurrencyAmount("gems") < gemCost) {
        if (showToast) showToast("Not enough gems.");
        return;
      }

      const mode = getSystemConfig().rarityMode;
      const gacha = getGachas()[getActiveGacha()];
      const rates = normalizeRates(gacha?.rates || getDefaultRates(mode), mode);

      document.getElementById("gacha-overlay").hidden = false;
      document.getElementById("gacha-active-area").hidden = true;

      setTimeout(async () => {
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

        if (recordGachaPulls && gacha?.id) {
          try {
            await recordGachaPulls(gacha.id, results);
            if (refreshPlayerState) await refreshPlayerState();
            renderGachaHistory();
          } catch (error) {
            console.error("Failed to save gacha results:", error);
            document.getElementById("gacha-active-area").hidden = false;
            if (showToast) showToast("Gacha pull failed.");
            return;
          }
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
      pullGacha,
      toggleHistory
    };
  }

  window.GachaScreen = {
    setupGachaScreen,
    createGachaScreen
  };
})();
