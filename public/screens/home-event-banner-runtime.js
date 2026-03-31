(function () {
  function createHomeEventBannerRuntime(deps) {
    const {
      getSystemConfig,
      getStories,
      getGachas,
      getCharacters,
      buildGachaRateSummary
    } = deps;

    function renderHomeEventBanner() {
      const stories = getStories();
      const gachas = getGachas();
      const characters = getCharacters();
      const eventBanner = document.getElementById("home-event-banner");
      if (!eventBanner) return;

      const eventConfig = getSystemConfig?.()?.eventConfig || null;
      const eventStory = eventConfig?.storyId
        ? stories.find(story => story.id === eventConfig.storyId) || null
        : null;
      const eventCards = Array.isArray(eventConfig?.eventCardIds)
        ? eventConfig.eventCardIds.map(item => {
          const cardId = typeof item === "string" ? item : (item?.cardId || item?.id || "");
          const card = characters.find(entry => entry.id === cardId) || null;
          if (!card) return null;
          return {
            ...card,
            eventLabel: typeof item === "string" ? "" : String(item?.label || "").trim(),
            eventAcquireText: typeof item === "string" ? "" : String(item?.acquireText || "").trim()
          };
        }).filter(Boolean)
        : [];
      const hasManagedEventBanner = Boolean(
        eventConfig?.enabled &&
        (eventConfig?.title || eventConfig?.subtitle || eventStory || eventConfig?.exchangeEnabled || eventConfig?.loginBonusEnabled || eventCards.length > 0)
      );

      if (hasManagedEventBanner) {
        eventBanner.dataset.go = "event";
        document.getElementById("home-event-title").textContent = eventConfig.title || "イベント開催中";
        document.getElementById("home-event-sub").textContent =
          eventConfig.subtitle ||
          (eventCards.length > 0
            ? `${eventCards[0].name}${eventCards[0].eventAcquireText ? ` / ${eventCards[0].eventAcquireText}` : ""}${eventCards.length > 1 ? ` ほか${eventCards.length - 1}枚` : ""}`
            : "") ||
          eventStory?.title ||
          (eventConfig.exchangeEnabled
            ? (eventConfig.exchangeLabel || "交換所を公開中")
            : (eventConfig.loginBonusEnabled ? (eventConfig.loginBonusLabel || "ログインボーナス実施中") : "イベントを準備中"));
        eventBanner.style.display = "";
        return;
      }

      if (gachas.length > 0) {
        eventBanner.dataset.go = "gacha";
        document.getElementById("home-event-title").textContent = gachas[0].title;
        document.getElementById("home-event-sub").textContent = gachas[0].description || buildGachaRateSummary(gachas[0].rates);
        eventBanner.style.display = "";
        return;
      }

      if (stories.length > 0) {
        eventBanner.dataset.go = "story";
        document.getElementById("home-event-title").textContent = "最新ストーリー";
        document.getElementById("home-event-sub").textContent = stories[0].title;
        eventBanner.style.display = "";
        return;
      }

      eventBanner.removeAttribute("data-go");
      eventBanner.style.display = "none";
    }

    return {
      renderHomeEventBanner
    };
  }

  window.HomeEventBannerRuntime = {
    create: createHomeEventBannerRuntime
  };
})();
