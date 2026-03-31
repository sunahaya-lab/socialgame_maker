(function () {
  function createFormationEquipmentRuntime(deps) {
    const {
      getSystemConfig,
      getEquipmentInstances,
      getEquipmentCards,
      getEquipmentInstanceGrowth,
      makeFallbackImage,
      getRarityCssClass,
      getRarityLabel,
      attributeLib,
      selectedEquipmentCopies,
      isEquipmentVisibleInFormation,
      toggleCopySelection,
      handleDetailPointerDown,
      clearPendingLongPress,
      showToast,
      getEquipmentHintShown,
      setEquipmentHintShown,
      getConvertMode,
      getSuppressClickUntil,
    } = deps;

    function ensureEquipmentSection() {
      const panel = document.querySelector("#screen-formation .formation-panel");
      if (!panel) return null;
      let section = document.getElementById("formation-equipment-section");
      if (section) return section;

      section = document.createElement("section");
      section.id = "formation-equipment-section";
      section.className = "formation-equipment-section";
      section.innerHTML = `
        <h3 class="formation-subtitle">装備カード</h3>
        <p class="formation-subnote">長押しで詳細を開きます</p>
        <div class="formation-equipment-list" id="formation-equipment-list"></div>
      `;

      const empty = document.getElementById("formation-empty");
      if (empty) panel.insertBefore(section, empty);
      else panel.appendChild(section);
      return section;
    }

    function renderEquipmentList() {
      const section = ensureEquipmentSection();
      const list = document.getElementById("formation-equipment-list");
      if (!section || !list) return;
      if (!isEquipmentVisibleInFormation()) {
        section.hidden = true;
        list.innerHTML = "";
        return;
      }
      const mode = getSystemConfig().rarityMode;
      const ownedCopies = getEquipmentInstances()
        .map(instance => ({
          instance,
          card: (Array.isArray(getEquipmentCards?.()) ? getEquipmentCards() : []).find(item => item.id === instance.equipmentId)
        }))
        .filter(item => item.card)
        .sort((a, b) => String(a.card?.name || "").localeCompare(String(b.card?.name || ""), "ja"));

      section.hidden = ownedCopies.length === 0;
      list.innerHTML = "";
      if (!ownedCopies.length) return;

      ownedCopies.forEach(({ card, instance }) => {
        const image = card.image || makeFallbackImage(card.name || "装備", card.rarity || "R", mode);
        const copyKey = instance.instanceId;
        const growth = getEquipmentInstanceGrowth(instance.instanceId);
        const item = document.createElement("button");
        item.type = "button";
        item.className = `formation-equipment-card ${getRarityCssClass(card.rarity, mode)} is-owned${selectedEquipmentCopies.has(copyKey) ? " is-selected" : ""}`;
        item.dataset.instanceId = instance.instanceId;
        item.dataset.copyKey = copyKey;
        item.innerHTML = `
          <span class="formation-equipment-preview"><img src="${image}" alt="${card.name || "装備"}"></span>
          <span class="formation-card-badge formation-card-rarity-badge ${getRarityCssClass(card.rarity, mode)}">${getRarityLabel(card.rarity, mode)}</span>
          ${attributeLib ? attributeLib.renderAttributeChip(card.attribute, { compact: true, className: "formation-card-attribute-badge" }) : ""}
          <span class="formation-card-badge formation-card-evolve-badge">進化 ${growth.evolveStage}</span>
          <span class="formation-card-badge formation-card-limit-break-badge">突破 ${growth.limitBreak}</span>
          <span class="formation-card-badge formation-card-level-badge">Lv.${growth.level}</span>
          <span class="formation-card-check" aria-hidden="true"></span>
        `;
        item.setAttribute("aria-label", `${card.name || "装備"} ${instance.instanceId}`);
        item.addEventListener("click", () => {
          if (Date.now() < getSuppressClickUntil()) return;
          if (getConvertMode()) {
            toggleCopySelection("equipment", copyKey);
            return;
          }
          if (!getEquipmentHintShown()) {
            setEquipmentHintShown(true);
            showToast?.("装備詳細は長押しで開けます");
          }
        });
        item.addEventListener("pointerdown", event => handleDetailPointerDown(event, { kind: "equipment", id: card.id, instanceId: instance.instanceId }));
        item.addEventListener("pointermove", clearPendingLongPress);
        item.addEventListener("pointerup", clearPendingLongPress);
        item.addEventListener("pointercancel", clearPendingLongPress);
        item.addEventListener("contextmenu", event => event.preventDefault());
        list.appendChild(item);
      });
    }

    return {
      ensureEquipmentSection,
      renderEquipmentList,
    };
  }

  window.FormationEquipmentRuntime = {
    create: createFormationEquipmentRuntime
  };
})();
