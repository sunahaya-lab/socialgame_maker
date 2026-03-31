(function () {
  function createHomeDialogueRuntime(deps) {
    const {
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
    } = deps;

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
      setupHomeInteractions,
      triggerHomeDialogue,
      syncHomeDialogue,
      applyHomeDialogue
    };
  }

  window.HomeDialogueRuntime = {
    create: createHomeDialogueRuntime
  };
})();
