(function () {
  function createGachaDisplayRuntime(deps) {
    const {
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
    } = deps;

    function normalizeGachaType(value) {
      if (value === "equipment") return "equipment";
      if (value === "mixed") return "mixed";
      return "character";
    }

    function getGachaTypeLabel(value) {
      const type = normalizeGachaType(value);
      if (type === "equipment") return "装備ガチャ";
      if (type === "mixed") return "混合ガチャ";
      return "キャラガチャ";
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

    function formatHistoryTime(value) {
      const date = value ? new Date(value) : null;
      if (!date || Number.isNaN(date.getTime())) return "--:--";
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${month}/${day} ${hours}:${minutes}`;
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
      infoToggle.textContent = "詳細";
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
      normalizeGachaType,
      getGachaTypeLabel,
      normalizeHeroImages,
      renderGachaHero,
      renderGachaHistory,
      toggleHistory,
      ensureInfoControls,
      updateInfoPanel,
      showGachaResults
    };
  }

  window.GachaDisplayRuntime = {
    create: createGachaDisplayRuntime
  };
})();
