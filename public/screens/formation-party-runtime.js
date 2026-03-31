(function () {
  function createFormationPartyRuntime(deps) {
    const {
      getPartyFormation,
      getCharacters,
      getSystemConfig,
      getCharacterImageForUsage,
      makeFallbackImage,
      getRarityCssClass,
      getActiveSlot,
      setActiveSlot,
      renderFormationScreen,
      esc,
      getDraggingCardId,
      setDraggingCardId,
      setDraggingFromSlot,
      clearDragState,
    } = deps;

    function getFormationSlotRoleLabel(index) {
      if (index === 0) return "LEADER";
      if (index === 1) return "SUB";
      return `MEMBER ${index - 1}`;
    }

    function renderPartySlots() {
      const wrap = document.getElementById("formation-party");
      if (!wrap) return;
      const formation = getPartyFormation();
      const characters = getCharacters();
      const mode = getSystemConfig().rarityMode;

      wrap.innerHTML = formation.map((cardId, index) => {
        const char = characters.find(item => item.id === cardId);
        const rarityClass = char ? getRarityCssClass(char.rarity, mode) : "";
        const image = char
          ? (getCharacterImageForUsage(char, "formationPortrait") || makeFallbackImage(char.name, char.rarity, mode))
          : "";
        const roleLabel = getFormationSlotRoleLabel(index);
        return `
          <button
            type="button"
            class="formation-slot${index === getActiveSlot() ? " active" : ""}${cardId ? " is-filled" : ""} ${rarityClass}"
            data-slot-index="${index}"
            data-slot-card-id="${esc(cardId || "")}"
            draggable="${cardId ? "true" : "false"}"
          >
            ${char
              ? `<img src="${image}" alt="${esc(char.name)}">`
              : `<span class="formation-slot-empty">SLOT</span>`}
            <span class="formation-slot-order">${index + 1}</span>
            <span class="formation-slot-role">${roleLabel}</span>
          </button>
        `;
      }).join("");

      wrap.querySelectorAll("[data-slot-index]").forEach(button => {
        button.addEventListener("click", () => {
          setActiveSlot(Number(button.dataset.slotIndex) || 0);
          renderFormationScreen();
        });
        button.addEventListener("dragstart", event => handleSlotDragStart(event, button));
        button.addEventListener("dragend", clearDragState);
        button.addEventListener("dragover", event => handleSlotDragOver(event, button));
        button.addEventListener("dragleave", () => button.classList.remove("is-drop-target"));
        button.addEventListener("drop", event => handleSlotDrop(event, button));
      });
    }

    function assignCardToActiveSlot(cardId) {
      const next = getPartyFormation().slice(0, 5);
      next[getActiveSlot()] = cardId;
      deps.setPartyFormation(next);
      renderFormationScreen();
    }

    function moveCardToSlot(cardId, targetSlotIndex) {
      const next = getPartyFormation().slice(0, 5);
      const previousIndex = next.findIndex(id => id === cardId);
      const targetCardId = next[targetSlotIndex] || "";

      if (previousIndex >= 0) {
        next[previousIndex] = targetCardId;
      }
      next[targetSlotIndex] = cardId;

      deps.setPartyFormation(next);
      setActiveSlot(targetSlotIndex);
      renderFormationScreen();
    }

    function getNextAvailableSlotIndex() {
      const formation = getPartyFormation();
      const emptyIndex = formation.findIndex(cardId => !cardId);
      return emptyIndex >= 0 ? emptyIndex : getActiveSlot();
    }

    function handleSlotDragStart(event, button) {
      const cardId = button.dataset.slotCardId || "";
      if (!cardId) {
        event.preventDefault();
        return;
      }
      setDraggingCardId(cardId);
      setDraggingFromSlot(Number(button.dataset.slotIndex));
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", cardId);
    }

    function handleSlotDragOver(event, button) {
      if (!getDraggingCardId()) return;
      event.preventDefault();
      button.classList.add("is-drop-target");
      event.dataTransfer.dropEffect = "move";
    }

    function handleSlotDrop(event, button) {
      event.preventDefault();
      button.classList.remove("is-drop-target");
      const cardId = getDraggingCardId();
      const targetSlotIndex = Number(button.dataset.slotIndex);
      if (!cardId || Number.isNaN(targetSlotIndex)) return;
      moveCardToSlot(cardId, targetSlotIndex);
      clearDragState();
    }

    return {
      renderPartySlots,
      getFormationSlotRoleLabel,
      assignCardToActiveSlot,
      moveCardToSlot,
      getNextAvailableSlotIndex,
      handleSlotDragStart,
      handleSlotDragOver,
      handleSlotDrop,
    };
  }

  window.FormationPartyRuntime = {
    create: createFormationPartyRuntime
  };
})();
