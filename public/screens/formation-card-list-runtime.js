(function () {
  function createFormationCardListRuntime(deps) {
    const {
      getSystemConfig,
      getCardInstances,
      getCharacters,
      getCharacterImageForUsage,
      makeFallbackImage,
      getCardInstanceGrowth,
      getRarityCssClass,
      getRarityLabel,
      attributeLib,
      getPartyFormation,
      getSelectedCharacterCopies,
      getSuppressClickUntil,
      getConvertMode,
      toggleCopySelection,
      getNextAvailableSlotIndex,
      setActiveSlot,
      assignCardToActiveSlot,
      handleCardDragStart,
      clearDragState,
      handleDetailPointerDown,
      clearPendingLongPress,
      esc,
    } = deps;

    function renderCardList() {
      const list = document.getElementById("formation-card-list");
      const empty = document.getElementById("formation-empty");
      if (!list || !empty) return;

      const mode = getSystemConfig().rarityMode;
      const ownedCopies = getCardInstances()
        .map(instance => ({
          instance,
          char: getCharacters().find(item => item.id === instance.cardId)
        }))
        .filter(item => item.char)
        .sort((a, b) => String(a.char?.name || "").localeCompare(String(b.char?.name || ""), "ja"));

      list.innerHTML = "";
      empty.hidden = ownedCopies.length > 0;
      list.hidden = ownedCopies.length === 0;
      if (ownedCopies.length === 0) return;

      const formation = getPartyFormation();

      ownedCopies.forEach(({ char, instance }) => {
        const image = getCharacterImageForUsage(char, "icon") || makeFallbackImage(char.name, char.rarity, mode);
        const copyKey = instance.instanceId;
        const growth = getCardInstanceGrowth(instance.instanceId);
        const item = document.createElement("button");
        item.type = "button";
        item.className = `formation-card ${getRarityCssClass(char.rarity, mode)}${formation.includes(char.id) ? " is-assigned" : ""}${getSelectedCharacterCopies().has(copyKey) ? " is-selected" : ""}`;
        item.dataset.cardId = char.id;
        item.dataset.instanceId = instance.instanceId;
        item.dataset.copyKey = copyKey;
        item.draggable = true;
        item.innerHTML = `
          <span class="formation-card-preview">
            <img src="${image}" alt="${esc(char.name || "キャラ")}">
          </span>
          <span class="formation-card-badge formation-card-rarity-badge ${getRarityCssClass(char.rarity, mode)}">${esc(getRarityLabel(char.rarity, mode))}</span>
          ${attributeLib ? attributeLib.renderAttributeChip(char.attribute, { compact: true, className: "formation-card-attribute-badge" }) : ""}
          <span class="formation-card-badge formation-card-evolve-badge">進化 ${growth.evolveStage}</span>
          <span class="formation-card-badge formation-card-limit-break-badge">突破 ${growth.limitBreak}</span>
          <span class="formation-card-badge formation-card-level-badge">Lv.${growth.level}</span>
          <span class="formation-card-check" aria-hidden="true"></span>
        `;
        item.setAttribute("aria-label", `${char.name || "キャラ"} ${instance.instanceId}`);

        item.addEventListener("click", () => {
          if (Date.now() < getSuppressClickUntil()) return;
          if (getConvertMode()) {
            toggleCopySelection("character", copyKey);
            return;
          }
          setActiveSlot(getNextAvailableSlotIndex());
          assignCardToActiveSlot(char.id);
        });
        item.addEventListener("dragstart", event => handleCardDragStart(event, char.id));
        item.addEventListener("dragend", clearDragState);
        item.addEventListener("pointerdown", event => handleDetailPointerDown(event, { kind: "character", id: char.id, instanceId: instance.instanceId }));
        item.addEventListener("pointermove", clearPendingLongPress);
        item.addEventListener("pointerup", clearPendingLongPress);
        item.addEventListener("pointercancel", clearPendingLongPress);
        item.addEventListener("contextmenu", event => event.preventDefault());
        list.appendChild(item);
      });
    }

    return {
      renderCardList,
    };
  }

  window.FormationCardListRuntime = {
    create: createFormationCardListRuntime
  };
})();
