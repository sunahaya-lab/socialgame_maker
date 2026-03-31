(function () {
  function createHomeScreenModule(deps) {
    const {
      getCharacters,
      getStories,
      getGachas,
      getAnnouncements,
      getSystemConfig,
      getPlayerState,
      getCurrentScreen,
      getHomeDialogueState,
      setHomeDialogueState,
      loadHomeConfig,
      getHomeLayoutPreset,
      getHomeCharacterBaseOffset,
      renderHomeLayoutOverlay,
      syncRecoveredCurrenciesInMemory,
      formatCurrencyBalance,
      makeFallbackImage,
      esc,
      buildGachaRateSummary,
      navigateTo,
      getBaseCharById,
      getEffectiveHomeVoices,
      getEffectiveHomeBirthdays,
      getEffectiveHomeOpinions,
      getEffectiveHomeConversations,
      isBaseCharBirthdayToday,
      isHomeEventActive
    } = deps;
    const announcementApi = window.HomeAnnouncementRuntime?.create?.({
      getAnnouncements,
      esc,
      navigateTo
    }) || null;
    const bgmApi = window.HomeBgmRuntime?.create?.({
      getSystemConfig,
      getPlayerState,
      getCurrentScreen
    }) || null;
    const dialogueApi = window.HomeDialogueRuntime?.create?.({
      getCurrentScreen,
      loadHomeConfig,
      getCharacters,
      getHomeDialogueState,
      setHomeDialogueState,
      getHomeLayoutPreset,
      renderHomeLayoutOverlay,
      getBaseCharById,
      getEffectiveHomeVoices,
      getEffectiveHomeBirthdays,
      getEffectiveHomeOpinions,
      getEffectiveHomeConversations,
      isBaseCharBirthdayToday,
      isHomeEventActive
    }) || null;
    const headerApi = window.HomeHeaderRuntime?.create?.({
      syncRecoveredCurrenciesInMemory,
      formatCurrencyBalance
    }) || null;
    const eventBannerApi = window.HomeEventBannerRuntime?.create?.({
      getSystemConfig,
      getStories,
      getGachas,
      getCharacters,
      buildGachaRateSummary
    }) || null;

    function renderHome(reason = "refresh") {
      const characters = getCharacters();
      const stories = getStories();
      const gachas = getGachas();
      const announcements = getAnnouncements();
      renderHomeHeader(characters, stories, gachas);

      const config = loadHomeConfig();
      const layoutPreset = getHomeLayoutPreset();
      const card1 = characters.find(card => card.id === config.card1) || characters[0] || null;
      const card2 = config.mode === 2 ? (characters.find(card => card.id === config.card2) || null) : null;

      const homeScreen = document.getElementById("screen-home");
      const homeBg = document.getElementById("home-bg");
      const el1 = document.getElementById("home-char-1");
      const el2 = document.getElementById("home-char-2");
      const speech1 = document.getElementById("home-speech");
      const speech2 = document.getElementById("home-speech-2");
      const eventBanner = document.getElementById("home-event-banner");
      const front = config.front === 1 ? 1 : 2;
      const back = front === 1 ? 2 : 1;

      homeScreen.classList.toggle("home-layout-single-focus", layoutPreset.layout === "single-focus");
      homeScreen.classList.toggle("home-layout-dual-stage", layoutPreset.layout === "dual-stage");
      homeScreen.classList.toggle("home-speech-right-bubble", layoutPreset.speech === "right-bubble");
      homeScreen.classList.toggle("home-speech-left-bubble", layoutPreset.speech === "left-bubble");
      homeScreen.classList.toggle("home-speech-hidden", layoutPreset.speech === "hidden");

      if (homeBg) {
        const backgroundUrl = String(config.backgroundImage || "").trim();
        homeBg.style.backgroundImage = backgroundUrl
          ? `radial-gradient(ellipse at 30% 40%, rgba(108,92,231,0.18), transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,212,71,0.08), transparent 50%), linear-gradient(180deg, rgba(8,10,18,0.2), rgba(8,10,18,0.42)), url("${backgroundUrl.replace(/"/g, '\\"')}")`
          : "";
        homeBg.style.backgroundSize = backgroundUrl ? "cover" : "";
        homeBg.style.backgroundPosition = backgroundUrl ? "center" : "";
        homeBg.style.backgroundRepeat = backgroundUrl ? "no-repeat" : "";
      }

      applyHomeBgm();

      el1.classList.toggle("is-front", front === 1);
      el1.classList.toggle("is-back", back === 1);
      el2.classList.toggle("is-front", front === 2);
      el2.classList.toggle("is-back", back === 2);

      if (card1) {
        const base1 = getHomeCharacterBaseOffset(layoutPreset, config, 1);
        el1.innerHTML = `<img src="${card1.image || makeFallbackImage(card1.name, card1.rarity)}" alt="${esc(card1.name)}">`;
        el1.style.transform = `translateX(${base1.x + Number(config.x1 || 0)}%) scale(${config.scale1 / 100})`;
        el1.style.bottom = `${base1.bottom + config.y1 * 3}px`;
      } else {
        el1.innerHTML = "";
      }

      if (card2) {
        const base2 = getHomeCharacterBaseOffset(layoutPreset, config, 2);
        el2.innerHTML = `<img src="${card2.image || makeFallbackImage(card2.name, card2.rarity)}" alt="${esc(card2.name)}">`;
        el2.style.transform = `translateX(${base2.x + Number(config.x2 || 0)}%) scale(${config.scale2 / 100})`;
        el2.style.bottom = `${base2.bottom + config.y2 * 3}px`;
        el2.style.display = "";
      } else {
        el2.innerHTML = "";
        el2.style.display = "none";
      }

      renderHomeEventBanner();

      syncHomeDialogue(card1, card2, reason);
      renderAnnouncements(announcements);
      speech1.hidden = layoutPreset.speech === "hidden" || !card1 || !getHomeDialogueState()?.primaryText;
      speech2.hidden = layoutPreset.speech === "hidden" || !card2 || !getHomeDialogueState()?.secondaryText;
      renderHomeLayoutOverlay(layoutPreset);
    }

    function renderHomeHeader(characters, stories, gachas) {
      return headerApi?.renderHomeHeader?.(characters, stories, gachas);
    }

    function renderHomeCurrencies() {
      return headerApi?.renderHomeCurrencies?.();
    }

    function renderHomeEventBanner() {
      return eventBannerApi?.renderHomeEventBanner?.();
    }

    function renderAnnouncements(items = getAnnouncements()) {
      return announcementApi?.renderAnnouncements?.(items);
    }
    function isAnnouncementVisible(item, nowMs) {
      return announcementApi?.isAnnouncementVisible?.(item, nowMs) || false;
    }
    function formatAnnouncementDate(value) {
      return announcementApi?.formatAnnouncementDate?.(value) || "???";
    }
    function applyHomeBgm() {
      return bgmApi?.applyHomeBgm?.();
    }

    function setupHomeInteractions() {
      return dialogueApi?.setupHomeInteractions?.();
    }

    function triggerHomeDialogue(index) {
      return dialogueApi?.triggerHomeDialogue?.(index);
    }

    function syncHomeDialogue(card1, card2, reason) {
      return dialogueApi?.syncHomeDialogue?.(card1, card2, reason);
    }

    function applyHomeDialogue() {
      return dialogueApi?.applyHomeDialogue?.();
    }

    return {
      renderHome,
      renderHomeCurrencies,
      renderAnnouncements,
      setupHomeInteractions,
      triggerHomeDialogue,
      syncHomeDialogue,
      applyHomeDialogue
    };
  }

  window.HomeScreenModule = {
    create: createHomeScreenModule
  };
})();
