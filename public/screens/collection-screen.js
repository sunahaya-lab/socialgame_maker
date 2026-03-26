(function () {
  function setupCollectionScreen(deps) {
    const api = createCollectionScreen(deps);

    const wrap = document.getElementById("collection-filters");
    if (wrap) {
      wrap.addEventListener("click", e => {
        const btn = e.target.closest(".collection-filter");
        if (!btn) return;
        document.querySelectorAll(".collection-filter").forEach(item => item.classList.remove("active"));
        btn.classList.add("active");
        api.renderCollectionScreen(btn.dataset.rarity);
      });
    }

    const closeBtn = document.getElementById("card-detail-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        document.getElementById("card-detail").hidden = true;
      });
    }

    const detail = document.getElementById("card-detail");
    if (detail) {
      detail.addEventListener("click", e => {
        if (e.target === detail) {
          detail.hidden = true;
        }
      });
    }

    return api;
  }

  function createCollectionScreen(deps) {
    const attributeLib = window.AttributeLib;
    const {
      getCharacters,
      getStories,
      getSystemConfig,
      getOwnedCount,
      getCharacterImageForUsage,
      baseCharVoiceLineDefs,
      getBaseCharById,
      getEffectiveVoiceLines,
      openStoryReader,
      getRarityModeConfig,
      normalizeRarityValue,
      getRarityLabel,
      getRarityCssClass,
      makeFallbackImage,
      esc
    } = deps;

    function renderCollectionFilters(active) {
      const wrap = document.getElementById("collection-filters");
      if (!wrap) return;
      const mode = getSystemConfig().rarityMode;
      const buttons = [{ value: "all", label: "\u3059\u3079\u3066" }].concat(
        getRarityModeConfig(mode).tiers.slice().sort((a, b) => b.rank - a.rank).map(tier => ({
          value: tier.value,
          label: getRarityLabel(tier.value, mode)
        }))
      );
      wrap.innerHTML = buttons.map(item =>
        `<button class="collection-filter${item.value === active ? " active" : ""}" data-rarity="${item.value}">${esc(item.label)}</button>`
      ).join("");
    }

    function renderCollectionScreen(filterRarity) {
      const mode = getSystemConfig().rarityMode;
      const characters = getCharacters();
      const grid = document.getElementById("collection-grid");
      const empty = document.getElementById("collection-empty");
      const requestedFilter = filterRarity || document.querySelector(".collection-filter.active")?.dataset.rarity || "all";
      const activeFilter = requestedFilter === "all" ? "all" : normalizeRarityValue(requestedFilter, mode);

      renderCollectionFilters(activeFilter);

      const ownedCharacters = characters.filter(char => getOwnedCount(char.id) > 0);
      const filtered = activeFilter === "all"
        ? ownedCharacters
        : ownedCharacters.filter(char => normalizeRarityValue(char.rarity, mode) === activeFilter);

      grid.innerHTML = "";
      if (ownedCharacters.length === 0) {
        empty.hidden = false;
        empty.querySelector("p").textContent = "まだ所持しているカードがありません。ガチャを引くとここに追加されます。";
        return;
      }

      empty.hidden = true;
      filtered.forEach(char => {
        const ownedCount = getOwnedCount(char.id);
        const card = document.createElement("div");
        card.className = `collection-card ${getRarityCssClass(char.rarity, mode)}`;
        card.innerHTML = `
          <img src="${getCharacterImageForUsage(char, "icon") || makeFallbackImage(char.name, char.rarity, mode)}" alt="${esc(char.name)}">
          <div class="collection-card-info">
            <span class="collection-card-rarity ${getRarityCssClass(char.rarity, mode)}">${esc(getRarityLabel(char.rarity, mode))}</span>
            <p class="collection-card-name">${esc(char.name)}</p>
            <p class="collection-card-owned">x${ownedCount}</p>
          </div>
        `;
        card.addEventListener("click", () => showCardDetail(char));
        grid.appendChild(card);
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
      renderCollectionFilters,
      renderCollectionScreen,
      showCardDetail
    };
  }

  window.CollectionScreen = {
    setupCollectionScreen,
    createCollectionScreen
  };
})();
