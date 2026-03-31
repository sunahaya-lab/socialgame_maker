(function () {
  function createCollectionDetailRuntime(deps) {
    const {
      getStories,
      getSystemConfig,
      getPlayerState,
      getOwnedCount,
      baseCharVoiceLineDefs,
      getBaseCharById,
      getEffectiveVoiceLines,
      openStoryReader,
      getRarityLabel,
      makeFallbackImage,
      esc,
      attributeLib
    } = deps;

    function getVoiceSeVolume() {
      const volume = Number(getPlayerState?.()?.audioSettings?.voiceVolume);
      if (Number.isFinite(volume)) {
        return Math.min(100, Math.max(0, volume)) / 100;
      }
      return 1;
    }

    function playCardSpeechSound(baseChar, hasVoiceEntries) {
      const soundId = String(baseChar?.speechSoundId || "").trim();
      if (!soundId || !hasVoiceEntries) return;
      window.BaseCharEditor?.playCharacterSpeechSound?.(soundId, {
        volume: getVoiceSeVolume()
      });
    }

    function showCardDetail(char) {
      const mode = getSystemConfig().rarityMode;
      document.getElementById("card-detail-image").innerHTML =
        `<img src="${char.image || makeFallbackImage(char.name, char.rarity, mode)}" alt="${esc(char.name)}">`;
      document.getElementById("card-detail-rarity").textContent = getRarityLabel(char.rarity, mode);
      const ownedCount = getOwnedCount(char.id);
      document.getElementById("card-detail-name").textContent = ownedCount > 0 ? `${char.name} x${ownedCount}` : char.name;
      document.getElementById("card-detail-catch").textContent = char.catch || "";
      document.getElementById("card-detail-attr").innerHTML = attributeLib
        ? attributeLib.renderAttributeChip(char.attribute)
        : esc(char.attribute || "");
      renderCardDetailVoices(char);
      renderCardDetailStories(char);
      document.getElementById("card-detail").hidden = false;
    }

    function renderCardDetailVoices(char) {
      const wrap = document.getElementById("card-detail-voices");
      const list = document.getElementById("card-detail-voice-list");
      const baseChar = char.baseCharId ? getBaseCharById(char.baseCharId) : null;
      const mergedVoiceLines = getEffectiveVoiceLines(char, baseChar);
      const voiceEntries = baseCharVoiceLineDefs
        .map(([key, label]) => ({ label, text: mergedVoiceLines[key] || "" }))
        .filter(item => item.text);
      playCardSpeechSound(baseChar, voiceEntries.length > 0);

      list.innerHTML = "";
      if (voiceEntries.length === 0) {
        wrap.hidden = true;
        return;
      }

      wrap.hidden = false;
      voiceEntries.forEach(item => {
        const row = document.createElement("div");
        row.className = "card-detail-voice-item";
        row.innerHTML = `
          <span class="card-detail-voice-label">${esc(item.label)}</span>
          <p class="card-detail-voice-text">${esc(item.text)}</p>
        `;
        list.appendChild(row);
      });
    }

    function renderCardDetailStories(char) {
      const wrap = document.getElementById("card-detail-stories");
      const list = document.getElementById("card-detail-story-list");
      const linkedStories = getStories().filter(story => story.type === "character" && story.entryId === char.id);
      list.innerHTML = "";

      if (linkedStories.length === 0) {
        wrap.hidden = true;
        return;
      }

      wrap.hidden = false;
      linkedStories.forEach(story => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "card-detail-story-btn";
        button.textContent = story.title;
        button.addEventListener("click", () => {
          document.getElementById("card-detail").hidden = true;
          openStoryReader(story);
        });
        list.appendChild(button);
      });
    }

    return {
      showCardDetail
    };
  }

  window.CollectionDetailRuntime = {
    create: createCollectionDetailRuntime
  };
})();
