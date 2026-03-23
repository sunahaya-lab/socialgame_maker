(function () {
  function setupFormationScreen(deps) {
    return createFormationScreen(deps);
  }

  function createFormationScreen(deps) {
    const {
      getCharacters,
      getOwnedCount,
      getPartyFormation,
      setPartyFormation,
      getSystemConfig,
      getRarityLabel,
      getRarityCssClass,
      makeFallbackImage,
      showCardDetail,
      esc
    } = deps;

    let activeSlot = 0;

    function renderFormationScreen() {
      renderPartySlots();
      renderCardList();
    }

    function renderPartySlots() {
      const wrap = document.getElementById("formation-party");
      if (!wrap) return;
      const formation = getPartyFormation();
      const characters = getCharacters();

      wrap.innerHTML = formation.map((cardId, index) => {
        const char = characters.find(item => item.id === cardId);
        const rarityClass = char ? getRarityCssClass(char.rarity, getSystemConfig().rarityMode) : "";
        return `
          <button type="button" class="formation-slot${index === activeSlot ? " active" : ""} ${rarityClass}" data-slot-index="${index}">
            ${char
              ? `<img src="${char.image || makeFallbackImage(char.name, char.rarity, getSystemConfig().rarityMode)}" alt="${esc(char.name)}">
                 <span class="formation-slot-name">${esc(char.name)}</span>`
              : `<span class="formation-slot-empty">SLOT ${index + 1}</span>`}
            <span class="formation-slot-order">${index + 1}</span>
          </button>
        `;
      }).join("");

      wrap.querySelectorAll("[data-slot-index]").forEach(button => {
        button.addEventListener("click", () => {
          activeSlot = Number(button.dataset.slotIndex) || 0;
          renderFormationScreen();
        });
      });
    }

    function renderCardList() {
      const list = document.getElementById("formation-card-list");
      const empty = document.getElementById("formation-empty");
      if (!list || !empty) return;

      const mode = getSystemConfig().rarityMode;
      const ownedCharacters = getCharacters()
        .filter(char => getOwnedCount(char.id) > 0)
        .sort((a, b) => getOwnedCount(b.id) - getOwnedCount(a.id) || String(a.name || "").localeCompare(String(b.name || ""), "ja"));

      list.innerHTML = "";
      empty.hidden = ownedCharacters.length > 0;
      list.hidden = ownedCharacters.length === 0;
      if (ownedCharacters.length === 0) return;

      const formation = getPartyFormation();

      ownedCharacters.forEach(char => {
        const card = document.createElement("div");
        card.className = `formation-card ${getRarityCssClass(char.rarity, mode)}${formation.includes(char.id) ? " is-assigned" : ""}`;
        card.innerHTML = `
          <div class="formation-card-preview">
            <img src="${char.image || makeFallbackImage(char.name, char.rarity, mode)}" alt="${esc(char.name)}">
          </div>
          <div class="formation-card-body">
            <div class="formation-card-top">
              <span class="formation-card-rarity ${getRarityCssClass(char.rarity, mode)}">${esc(getRarityLabel(char.rarity, mode))}</span>
              <span class="formation-card-owned">x${getOwnedCount(char.id)}</span>
            </div>
            <p class="formation-card-name">${esc(char.name)}</p>
            <p class="formation-card-catch">${esc(char.catch || "")}</p>
          </div>
          <div class="formation-card-actions">
            <button type="button" class="formation-assign-btn" data-assign-id="${esc(char.id)}">編成</button>
            <button type="button" class="formation-detail-btn" data-detail-id="${esc(char.id)}">詳細</button>
          </div>
        `;
        card.querySelector(".formation-assign-btn")?.addEventListener("click", event => {
          event.stopPropagation();
          assignCardToActiveSlot(char.id);
        });
        card.querySelector(".formation-detail-btn")?.addEventListener("click", event => {
          event.stopPropagation();
          showCardDetail(char);
        });
        list.appendChild(card);
      });
    }

    function assignCardToActiveSlot(cardId) {
      const next = getPartyFormation().slice(0, 5);
      next[activeSlot] = cardId;
      setPartyFormation(next);
      renderFormationScreen();
    }

    return {
      renderFormationScreen
    };
  }

  window.FormationScreen = {
    setupFormationScreen,
    createFormationScreen
  };
})();
