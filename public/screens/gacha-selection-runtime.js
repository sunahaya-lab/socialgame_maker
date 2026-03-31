(function () {
  function createGachaSelectionRuntime(deps) {
    const {
      getGachas,
      getActiveGacha,
      setActiveGacha,
      getSystemConfig,
      buildGachaRateSummary,
      normalizeRates,
      getDefaultRates,
      getRarityModeConfig,
      getRarityLabel,
      getGachaTypeLabel,
      normalizeHeroImages,
      renderGachaHero,
      renderGachaHistory,
      updateInfoPanel,
      esc
    } = deps;

    function renderGachaScreen() {
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

    return {
      renderGachaScreen,
      selectGacha,
      showActiveGacha,
      syncActiveBannerCard
    };
  }

  window.GachaSelectionRuntime = {
    create: createGachaSelectionRuntime
  };
})();
