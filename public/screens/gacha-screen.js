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

    function normalizeGachaType(value) {
      if (value === "equipment") return "equipment";
      if (value === "mixed") return "mixed";
      return "character";
    }

    function getGachaTypeLabel(value) {
      const type = normalizeGachaType(value);
      if (type === "equipment") return "\u88c5\u5099\u30ac\u30c1\u30e3";
      if (type === "mixed") return "\u6df7\u5408\u30ac\u30c1\u30e3";
      return "\u30ad\u30e3\u30e9\u30ac\u30c1\u30e3";
    }

    function renderGachaScreen() {
      const characters = getCharacters();
      const gachas = getGachas();
      const bannerList = document.getElementById("gacha-banner-list");
      const noBanner = document.getElementById("gacha-no-banner");
      const activeArea = document.getElementById("gacha-active-area");
      const results = document.getElementById("gacha-results");

      bannerList.innerHTML = "";
      results.hidden = true;

      if (gachas.length === 0) {
        noBanner.hidden = false;
        activeArea.hidden = true;
        return;
      }

      noBanner.hidden = true;
      document.getElementById("gacha-history-panel").hidden = true;
      document.getElementById("gacha-history-toggle").setAttribute("aria-expanded", "false");
      const infoPanel = document.getElementById("gacha-info-panel");
      const infoToggle = document.getElementById("gacha-info-toggle");
      if (infoPanel) infoPanel.hidden = true;
      if (infoToggle) infoToggle.setAttribute("aria-expanded", "false");
      gachas.forEach((gacha, index) => {
        const card = document.createElement("div");
        card.className = `gacha-banner-card${index === getActiveGacha() ? " is-active" : ""}`;
        const previewImage = normalizeHeroImages(gacha)[0] || gacha.bannerImage || "";
        if (previewImage) {
          card.style.backgroundImage = `linear-gradient(135deg, rgba(8,10,18,0.86), rgba(8,10,18,0.42)), url("${previewImage}")`;
          card.style.backgroundSize = "cover";
          card.style.backgroundPosition = "center";
        }
        card.innerHTML = `
          <h4>${esc(gacha.title)}</h4>
          <p>${esc(gacha.description || buildGachaRateSummary(gacha.rates))}</p>
          <span class="gacha-banner-tag">${esc(getGachaTypeLabel(gacha.gachaType))}</span>
        `;
        card.addEventListener("click", () => selectGacha(index));
        bannerList.appendChild(card);
      });

      if (getActiveGacha() === null || !gachas[getActiveGacha()]) {
        setActiveGacha(0);
      }
      showActiveGacha();
      renderGachaHistory();
      syncActiveBannerCard();
    }

    function selectGacha(index) {
      setActiveGacha(index);
      showActiveGacha();
      renderGachaHistory();
      syncActiveBannerCard();
    }

    function showActiveGacha() {
      const mode = getSystemConfig().rarityMode;
      const gacha = getGachas()[getActiveGacha()];
      if (!gacha) return;

      document.getElementById("gacha-active-area").hidden = false;
      document.getElementById("gacha-active-title").textContent = gacha.title;
      document.getElementById("gacha-active-desc").textContent = gacha.description || "";

      const rates = normalizeRates(gacha.rates || getDefaultRates(mode), mode);
      const rateMarkup = getRarityModeConfig(mode).tiers.map(tier =>
        `<span>${getRarityLabel(tier.value, mode)}: ${rates[tier.value] || 0}%</span>`
      ).join("");
      document.getElementById("gacha-rates").innerHTML = rateMarkup;
      updateInfoPanel(gacha, rateMarkup);

      renderGachaHero(gacha);
    }

    function syncActiveBannerCard() {
      document.querySelectorAll(".gacha-banner-card").forEach((card, index) => {
        card.classList.toggle("is-active", index === getActiveGacha());
      });
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
      if (normalizeGachaType(gacha?.gachaType) === "equipment") {
        return normalizeHeroImages(gacha).map((image, index) => ({
          id: `equipment-${index}`,
          name: gacha.title,
          image
        }));
      }

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
      const list = document.getElementById("gacha-info-history-list") || document.getElementById("gacha-history-list");
      const empty = document.getElementById("gacha-info-history-empty") || document.getElementById("gacha-history-empty");
      const meta = document.getElementById("gacha-info-history-meta") || document.getElementById("gacha-history-meta");
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
      const infoPanel = document.getElementById("gacha-info-panel");
      const infoToggle = document.getElementById("gacha-info-toggle");
      const panel = document.getElementById("gacha-history-panel");
      const toggle = document.getElementById("gacha-history-toggle");
      if (!panel || !toggle) return;
      if (infoPanel) infoPanel.hidden = true;
      if (infoToggle) infoToggle.setAttribute("aria-expanded", "false");
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(!panel.hidden));
    }

    function ensureInfoControls() {
      const subtools = document.querySelector(".gacha-subtools");
      if (!subtools || document.getElementById("gacha-info-toggle")) return;
      const historyToggle = document.getElementById("gacha-history-toggle");
      const historyPanel = document.getElementById("gacha-history-panel");
      if (historyToggle) historyToggle.hidden = true;
      if (historyPanel) historyPanel.hidden = true;

      const infoToggle = document.createElement("button");
      infoToggle.type = "button";
      infoToggle.className = "gacha-info-toggle";
      infoToggle.id = "gacha-info-toggle";
      infoToggle.setAttribute("aria-expanded", "false");
      infoToggle.setAttribute("aria-controls", "gacha-info-panel");
      infoToggle.textContent = "\u8a73\u7d30";
      subtools.prepend(infoToggle);

      const infoPanel = document.createElement("div");
      infoPanel.className = "gacha-info-panel";
      infoPanel.id = "gacha-info-panel";
      infoPanel.hidden = true;
      infoPanel.innerHTML = `
        <h4 class="gacha-info-title">ガチャ詳細</h4>
        <p class="gacha-info-desc" id="gacha-info-desc"></p>
        <div class="gacha-info-rates" id="gacha-info-rates"></div>
        <div class="gacha-info-history-head">
          <h5 class="gacha-info-history-label">履歴</h5>
          <span class="gacha-history-meta" id="gacha-info-history-meta">0件</span>
        </div>
        <div class="gacha-history-empty" id="gacha-info-history-empty">まだガチャ履歴はありません。</div>
        <div class="gacha-history-list" id="gacha-info-history-list" hidden></div>
      `;
      subtools.after(infoPanel);

      infoToggle.addEventListener("click", () => {
        if (historyPanel) historyPanel.hidden = true;
        if (historyToggle) historyToggle.setAttribute("aria-expanded", "false");
        infoPanel.hidden = !infoPanel.hidden;
        infoToggle.setAttribute("aria-expanded", String(!infoPanel.hidden));
      });
    }

    function updateInfoPanel(gacha, rateMarkup) {
      const desc = document.getElementById("gacha-info-desc");
      const rates = document.getElementById("gacha-info-rates");
      if (desc) desc.textContent = gacha.description || "詳細情報はここに表示されます。";
      if (rates) rates.innerHTML = rateMarkup;
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
      toggleHistory,
      ensureInfoControls
    };
  }

  window.GachaScreen = {
    setupGachaScreen,
    createGachaScreen
  };
})();
