(function () {
  function createCollectionGridRuntime(deps) {
    const {
      getCharacters,
      getSystemConfig,
      getOwnedCount,
      getCharacterImageForUsage,
      getRarityModeConfig,
      normalizeRarityValue,
      getRarityLabel,
      getRarityCssClass,
      makeFallbackImage,
      esc,
      showCardDetail
    } = deps;

    function renderCollectionFilters(active) {
      const wrap = document.getElementById("collection-filters");
      if (!wrap) return;
      const mode = getSystemConfig().rarityMode;
      const buttons = [{ value: "all", label: "すべて" }].concat(
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

    return {
      renderCollectionFilters,
      renderCollectionScreen
    };
  }

  window.CollectionGridRuntime = {
    create: createCollectionGridRuntime
  };
})();
