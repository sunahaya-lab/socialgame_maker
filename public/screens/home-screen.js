(function () {
  function createHomeScreenModule(deps) {
    const {
      getCharacters,
      getStories,
      getGachas,
      getSystemConfig,
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
      getBaseCharById,
      getEffectiveHomeVoices,
      getEffectiveHomeBirthdays,
      getEffectiveHomeOpinions,
      getEffectiveHomeConversations,
      isBaseCharBirthdayToday,
      isHomeEventActive
    } = deps;

    function renderHome(reason = "refresh") {
      const characters = getCharacters();
      const stories = getStories();
      const gachas = getGachas();
      document.getElementById("home-char-count").textContent = String(characters.length);
      document.getElementById("home-story-count").textContent = String(stories.length);
      document.getElementById("home-gacha-count").textContent = String(gachas.length);

      const level = Math.max(1, characters.length + stories.length * 2 + gachas.length * 3);
      document.getElementById("home-lv").textContent = String(level);
      renderHomeCurrencies();

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
      } else if (gachas.length > 0) {
        eventBanner.dataset.go = "gacha";
        document.getElementById("home-event-title").textContent = gachas[0].title;
        document.getElementById("home-event-sub").textContent = gachas[0].description || buildGachaRateSummary(gachas[0].rates);
        eventBanner.style.display = "";
      } else if (stories.length > 0) {
        eventBanner.dataset.go = "story";
        document.getElementById("home-event-title").textContent = "\u6700\u65b0\u30b9\u30c8\u30fc\u30ea\u30fc";
        document.getElementById("home-event-sub").textContent = stories[0].title;
        eventBanner.style.display = "";
      } else {
        eventBanner.removeAttribute("data-go");
        eventBanner.style.display = "none";
      }

      syncHomeDialogue(card1, card2, reason);
      speech1.hidden = layoutPreset.speech === "hidden" || !card1 || !getHomeDialogueState()?.primaryText;
      speech2.hidden = layoutPreset.speech === "hidden" || !card2 || !getHomeDialogueState()?.secondaryText;
      renderHomeLayoutOverlay(layoutPreset);
    }

    function renderHomeCurrencies() {
      const currencies = syncRecoveredCurrenciesInMemory();
      const stamina = currencies.find(item => item.key === "stamina");
      const gems = currencies.find(item => item.key === "gems");
      const gold = currencies.find(item => item.key === "gold");
      document.getElementById("home-stamina").textContent = formatCurrencyBalance(stamina, true);
      document.getElementById("home-gems").textContent = formatCurrencyBalance(gems);
      document.getElementById("home-gold").textContent = formatCurrencyBalance(gold);
    }

    function setupHomeInteractions() {
      ["home-char-1", "home-speech"].forEach(id => {
        document.getElementById(id)?.addEventListener("click", () => triggerHomeDialogue(1));
      });
      ["home-char-2", "home-speech-2"].forEach(id => {
        document.getElementById(id)?.addEventListener("click", () => triggerHomeDialogue(2));
      });
    }

    function triggerHomeDialogue(index) {
      if (getCurrentScreen() !== "home") return;
      const config = loadHomeConfig();
      const { card1, card2 } = resolveHomeCards(config);
      chooseHomeDialogue(card1, card2, "tap", index);
      applyHomeDialogue();
    }

    function resolveHomeCards(config) {
      const characters = getCharacters();
      return {
        card1: characters.find(card => card.id === config.card1) || characters[0] || null,
        card2: config.mode === 2 ? (characters.find(card => card.id === config.card2) || null) : null
      };
    }

    function syncHomeDialogue(card1, card2, reason) {
      const state = getHomeDialogueState();
      const cardIdsMatch = state && state.card1Id === (card1?.id || null) && state.card2Id === (card2?.id || null);
      if (!card1) {
        setHomeDialogueState({
          card1Id: null,
          card2Id: null,
          primaryName: "",
          primaryText: "カードを登録してホームセリフを設定すると、ここに表示されます。",
          secondaryName: "",
          secondaryText: ""
        });
        applyHomeDialogue();
        return;
      }

      if (!cardIdsMatch || reason === "enter" || !state) {
        chooseHomeDialogue(card1, card2, reason);
      }
      applyHomeDialogue();
    }

    function chooseHomeDialogue(card1, card2, reason = "refresh", tappedIndex = 1) {
      const baseChar1 = card1?.baseCharId ? getBaseCharById(card1.baseCharId) : null;
      const baseChar2 = card2?.baseCharId ? getBaseCharById(card2.baseCharId) : null;
      const eventActive = isHomeEventActive();

      let primaryName = card1?.name || "";
      let primaryText = pickHomeVoice(baseChar1, card1, reason, eventActive);
      let secondaryName = card2?.name || "";
      let secondaryText = card2 ? pickHomeVoice(baseChar2, card2, reason, eventActive) : "";

      if (reason === "tap" && card1 && tappedIndex) {
        const actorCard = tappedIndex === 1 ? card1 : card2;
        const actorBaseChar = tappedIndex === 1 ? baseChar1 : baseChar2;
        const partnerCard = tappedIndex === 1 ? card2 : card1;
        const partnerBaseChar = tappedIndex === 1 ? baseChar2 : baseChar1;
        const relationResult = pickHomeRelationDialogue(actorCard, actorBaseChar, partnerCard, partnerBaseChar);
        if (relationResult) {
          if (tappedIndex === 1) {
            primaryName = relationResult.primaryName;
            primaryText = relationResult.primaryText;
            secondaryName = relationResult.secondaryName;
            secondaryText = relationResult.secondaryText;
          } else {
            primaryName = relationResult.secondaryName || primaryName;
            primaryText = relationResult.secondaryText || primaryText;
            secondaryName = relationResult.primaryName;
            secondaryText = relationResult.primaryText;
          }
        } else if (tappedIndex === 2 && actorCard) {
          primaryName = actorCard.name;
          primaryText = pickHomeVoice(actorBaseChar, actorCard, "tap", eventActive);
          secondaryName = card1?.name || "";
          secondaryText = card1 ? pickHomeVoice(baseChar1, card1, "refresh", eventActive) : "";
        }
      }

      setHomeDialogueState({
        card1Id: card1?.id || null,
        card2Id: card2?.id || null,
        primaryName,
        primaryText,
        secondaryName,
        secondaryText
      });
    }

    function pickHomeVoice(baseChar, card, reason, eventActive) {
      const homeVoices = getEffectiveHomeVoices(card, baseChar);
      if (reason === "enter" && eventActive && homeVoices.eventActive) return homeVoices.eventActive;
      if (baseChar && isBaseCharBirthdayToday(baseChar)) {
        const birthdayLines = getEffectiveHomeBirthdays(card, baseChar)
          .filter(item => item.targetBaseCharId === baseChar.id)
          .map(item => item.text)
          .filter(Boolean);
        if (birthdayLines.length > 0) return birthdayLines[Math.floor(Math.random() * birthdayLines.length)];
      }
      if (reason === "enter" && homeVoices.homeEnter) return homeVoices.homeEnter;

      const pool = Object.values(homeVoices).filter(Boolean);
      if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
      return pickLine(card);
    }

    function pickHomeRelationDialogue(actorCard, actorBaseChar, partnerCard, partnerBaseChar) {
      if (!actorCard || !actorBaseChar || !partnerCard || !partnerBaseChar) return null;
      const targetId = partnerBaseChar.id;
      const birthdays = isBaseCharBirthdayToday(partnerBaseChar)
        ? getEffectiveHomeBirthdays(actorCard, actorBaseChar)
          .filter(item => item.targetBaseCharId === targetId)
          .map(item => ({
            primaryName: actorCard.name,
            primaryText: item.text,
            secondaryName: partnerCard.name,
            secondaryText: ""
          }))
        : [];
      const opinions = getEffectiveHomeOpinions(actorCard, actorBaseChar)
        .filter(item => item.targetBaseCharId === targetId)
        .map(item => ({
          primaryName: actorCard.name,
          primaryText: item.text,
          secondaryName: partnerCard.name,
          secondaryText: ""
        }));
      const conversations = getEffectiveHomeConversations(actorCard, actorBaseChar)
        .filter(item => item.targetBaseCharId === targetId)
        .map(item => ({
          primaryName: actorCard.name,
          primaryText: item.selfText || "",
          secondaryName: partnerCard.name,
          secondaryText: item.partnerText || ""
        }));
      const pool = [...birthdays, ...opinions, ...conversations].filter(item => item.primaryText || item.secondaryText);
      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function applyHomeDialogue() {
      const layoutPreset = getHomeLayoutPreset();
      const state = getHomeDialogueState();
      document.getElementById("home-speech-name").textContent = state?.primaryName || "";
      document.getElementById("home-speech-text").textContent = state?.primaryText || "";
      document.getElementById("home-speech-name-2").textContent = state?.secondaryName || "";
      document.getElementById("home-speech-text-2").textContent = state?.secondaryText || "";
      document.getElementById("home-speech").hidden = layoutPreset.speech === "hidden" || !state?.primaryText;
      document.getElementById("home-speech-2").hidden = layoutPreset.speech === "hidden" || !state?.secondaryText;
      renderHomeLayoutOverlay(layoutPreset);
    }

    function pickLine(card) {
      if (card.lines?.length) return card.lines[Math.floor(Math.random() * card.lines.length)];
      return card.catch || "No catch copy set.";
    }

    return {
      renderHome,
      renderHomeCurrencies,
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
