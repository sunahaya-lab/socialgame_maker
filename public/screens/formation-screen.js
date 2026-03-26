(function () {
  function setupFormationScreen(deps) {
    return createFormationScreen(deps);
  }

  function createFormationScreen(deps) {
    const attributeLib = window.AttributeLib;
    const {
      getCharacters,
      getEquipmentCards,
      getOwnedCount,
      getOwnedEquipmentCount,
      getCardInstances,
      getEquipmentInstances,
      getCardInstance,
      getEquipmentInstance,
      getCardInstanceGrowth,
      getEquipmentInstanceGrowth,
      getPartyFormation,
      setPartyFormation,
      getSystemConfig,
      getCharacterImageForUsage,
      getRarityLabel,
      getRarityCssClass,
      makeFallbackImage,
      showCardDetail,
      getCardGrowth,
      getEquipmentGrowth,
      getGrowthResources,
      setCardLockedCopies,
      setEquipmentLockedCopies,
      enhanceCard,
      enhanceCardInstance,
      enhanceEquipment,
      enhanceEquipmentInstance,
      evolveCard,
      evolveCardInstance,
      evolveEquipment,
      evolveEquipmentInstance,
      limitBreakCard,
      limitBreakCardInstance,
      limitBreakEquipment,
      limitBreakEquipmentInstance,
      convertCardDuplicates,
      convertEquipmentDuplicates,
      convertSelectedCharacterCards,
      convertSelectedEquipmentCards,
      convertSelectedCharacterInstances,
      convertSelectedEquipmentInstances,
      convertStaminaToGrowthPoints,
      getPlayerCurrencyAmount,
      showToast,
      esc
    } = deps;

    const LONG_PRESS_MS = 420;
    const CARD_POINT_VALUE = 10;
    const STAMINA_PER_POINT = 10;
    let activeSlot = 0;
    let draggingCardId = "";
    let draggingFromSlot = null;
    let pressTimer = null;
    let pressMoved = false;
    let suppressClickUntil = 0;
    let detailTarget = null;
    let equipmentHintShown = false;
    let convertMode = false;
    let selectedCharacterCopies = new Set();
    let selectedEquipmentCopies = new Set();
    let selectedGrowthMaterialKey = "";
    let staminaConvertAmount = STAMINA_PER_POINT;

    function renderFormationScreen() {
      renderConvertControls();
      renderPartySlots();
      renderCardList();
      renderEquipmentList();
      if (detailTarget) renderGrowthDetail();
    }

    function ensureConvertControls() {
      const screen = document.getElementById("screen-formation");
      const panel = screen?.querySelector(".formation-panel");
      if (!screen || !panel) return null;

      let controls = document.getElementById("formation-convert-controls");
      if (controls) return controls;

      controls = document.createElement("div");
      controls.id = "formation-convert-controls";
      controls.className = "formation-convert-controls";
      controls.innerHTML = `
        <div class="formation-convert-window" id="formation-convert-sheet" hidden>
          <div class="formation-convert-head">
            <div>
              <strong>変換</strong>
              <p id="formation-convert-summary"></p>
            </div>
            <div class="formation-convert-head-actions">
              <button type="button" class="formation-convert-clear" data-convert-clear>解除</button>
              <button type="button" class="formation-convert-close" data-convert-toggle>&times;</button>
            </div>
          </div>
          <div class="formation-convert-points" id="formation-convert-points"></div>
          <div class="formation-convert-stamina">
            <label>
              <span>スタミナ変換</span>
              <input type="number" min="${STAMINA_PER_POINT}" step="${STAMINA_PER_POINT}" value="${STAMINA_PER_POINT}" data-stamina-convert-input>
            </label>
            <p id="formation-stamina-summary"></p>
            <button type="button" class="formation-convert-action secondary" data-convert-stamina>スタミナを変換</button>
          </div>
          <button type="button" class="formation-convert-action" data-convert-selected>選択したカードを変換</button>
        </div>
        <button type="button" class="formation-convert-fab" id="formation-convert-fab" data-convert-toggle>変換</button>
      `;
      controls.addEventListener("click", handleConvertControlsClick);
      controls.addEventListener("input", handleConvertControlsInput);
      screen.appendChild(controls);
      return controls;
    }

    function renderConvertControls() {
      const controls = ensureConvertControls();
      if (!controls) return;
      const resources = getGrowthResources();
      const stamina = getPlayerCurrencyAmount("stamina");
      staminaConvertAmount = clampNumberToStep(staminaConvertAmount, STAMINA_PER_POINT, stamina);

      const selectedCardCount = selectedCharacterCopies.size + selectedEquipmentCopies.size;
      const pointPreview = selectedCardCount * CARD_POINT_VALUE;

      const sheet = controls.querySelector("#formation-convert-sheet");
      const fab = controls.querySelector("#formation-convert-fab");
      const summary = controls.querySelector("#formation-convert-summary");
      const pointInfo = controls.querySelector("#formation-convert-points");
      const staminaSummary = controls.querySelector("#formation-stamina-summary");
      const staminaInput = controls.querySelector("[data-stamina-convert-input]");
      const convertButton = controls.querySelector("[data-convert-selected]");
      const staminaButton = controls.querySelector("[data-convert-stamina]");

      controls.classList.toggle("is-open", convertMode);
      sheet.hidden = !convertMode;
      fab.classList.toggle("is-active", convertMode);
      fab.textContent = convertMode ? "閉じる" : "変換";

      if (summary) {
        summary.textContent = convertMode
          ? `選択中 ${selectedCardCount}枚`
          : "カードを選んで育成ポイントに変換";
      }
      if (pointInfo) {
        pointInfo.textContent = `所持 育成ポイント ${resources.resonance} / 選択変換 +${pointPreview}`;
      }
      if (staminaSummary) {
        const staminaPreview = Math.floor(staminaConvertAmount / STAMINA_PER_POINT);
        staminaSummary.textContent = `所持スタミナ ${stamina} / ${STAMINA_PER_POINT}スタミナ → 育成ポイント1 / 今回 +${staminaPreview}`;
      }
      if (staminaInput) {
        staminaInput.max = String(Math.max(0, stamina));
        staminaInput.value = String(staminaConvertAmount);
      }
      if (convertButton) {
        convertButton.disabled = selectedCardCount <= 0;
      }
      if (staminaButton) {
        staminaButton.disabled = staminaConvertAmount < STAMINA_PER_POINT;
      }
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
        return `
          <button
            type="button"
            class="formation-slot${index === activeSlot ? " active" : ""}${cardId ? " is-filled" : ""} ${rarityClass}"
            data-slot-index="${index}"
            data-slot-card-id="${esc(cardId || "")}"
            draggable="${cardId ? "true" : "false"}"
          >
            ${char
              ? `<img src="${image}" alt="${esc(char.name)}">`
              : `<span class="formation-slot-empty">SLOT</span>`}
            <span class="formation-slot-order">${index + 1}</span>
          </button>
        `;
      }).join("");

      wrap.querySelectorAll("[data-slot-index]").forEach(button => {
        button.addEventListener("click", () => {
          activeSlot = Number(button.dataset.slotIndex) || 0;
          renderFormationScreen();
        });
        button.addEventListener("dragstart", event => handleSlotDragStart(event, button));
        button.addEventListener("dragend", clearDragState);
        button.addEventListener("dragover", event => handleSlotDragOver(event, button));
        button.addEventListener("dragleave", () => button.classList.remove("is-drop-target"));
        button.addEventListener("drop", event => handleSlotDrop(event, button));
      });
    }

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
        item.className = `formation-card ${getRarityCssClass(char.rarity, mode)}${formation.includes(char.id) ? " is-assigned" : ""}${selectedCharacterCopies.has(copyKey) ? " is-selected" : ""}`;
        item.dataset.cardId = char.id;
        item.dataset.instanceId = instance.instanceId;
        item.dataset.copyKey = copyKey;
        item.draggable = true;
        item.innerHTML = `
          <span class="formation-card-preview">
            <img src="${image}" alt="${esc(char.name || "\u30ad\u30e3\u30e9")}">
          </span>
          <span class="formation-card-badge formation-card-rarity-badge ${getRarityCssClass(char.rarity, mode)}">${esc(getRarityLabel(char.rarity, mode))}</span>
          ${attributeLib ? attributeLib.renderAttributeChip(char.attribute, { compact: true, className: "formation-card-attribute-badge" }) : ""}
          <span class="formation-card-badge formation-card-evolve-badge">進化 ${growth.evolveStage}</span>
          <span class="formation-card-badge formation-card-limit-break-badge">突破 ${growth.limitBreak}</span>
          <span class="formation-card-badge formation-card-level-badge">Lv.${growth.level}</span>
          <span class="formation-card-check" aria-hidden="true"></span>
        `;
        item.setAttribute("aria-label", `${char.name || "\u30ad\u30e3\u30e9"} ${instance.instanceId}`);

        item.addEventListener("click", () => {
          if (Date.now() < suppressClickUntil) return;
          if (convertMode) {
            toggleCopySelection("character", copyKey);
            return;
          }
          activeSlot = getNextAvailableSlotIndex();
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

    function ensureEquipmentSection() {
      const panel = document.querySelector("#screen-formation .formation-panel");
      if (!panel) return null;
      let section = document.getElementById("formation-equipment-section");
      if (section) return section;

      section = document.createElement("section");
      section.id = "formation-equipment-section";
      section.className = "formation-equipment-section";
      section.innerHTML = `
        <h3 class="formation-subtitle">\u88c5\u5099\u30ab\u30fc\u30c9</h3>
        <p class="formation-subnote">\u9577\u62bc\u3057\u3067\u8a73\u7d30\u3092\u958b\u304d\u307e\u3059</p>
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
        const image = card.image || makeFallbackImage(card.name || "\u88c5\u5099", card.rarity || "R", mode);
        const copyKey = instance.instanceId;
        const growth = getEquipmentInstanceGrowth(instance.instanceId);
        const item = document.createElement("button");
        item.type = "button";
        item.className = `formation-equipment-card ${getRarityCssClass(card.rarity, mode)} is-owned${selectedEquipmentCopies.has(copyKey) ? " is-selected" : ""}`;
        item.dataset.instanceId = instance.instanceId;
        item.dataset.copyKey = copyKey;
        item.innerHTML = `
          <span class="formation-equipment-preview"><img src="${image}" alt="${esc(card.name || "\u88c5\u5099")}"></span>
          <span class="formation-card-badge formation-card-rarity-badge ${getRarityCssClass(card.rarity, mode)}">${esc(getRarityLabel(card.rarity, mode))}</span>
          ${attributeLib ? attributeLib.renderAttributeChip(card.attribute, { compact: true, className: "formation-card-attribute-badge" }) : ""}
          <span class="formation-card-badge formation-card-evolve-badge">進化 ${growth.evolveStage}</span>
          <span class="formation-card-badge formation-card-limit-break-badge">突破 ${growth.limitBreak}</span>
          <span class="formation-card-badge formation-card-level-badge">Lv.${growth.level}</span>
          <span class="formation-card-check" aria-hidden="true"></span>
        `;
        item.setAttribute("aria-label", `${card.name || "\u88c5\u5099"} ${instance.instanceId}`);
        item.addEventListener("click", () => {
          if (Date.now() < suppressClickUntil) return;
          if (convertMode) {
            toggleCopySelection("equipment", copyKey);
            return;
          }
          if (!equipmentHintShown) {
            equipmentHintShown = true;
            showToast?.("\u88c5\u5099\u8a73\u7d30\u306f\u9577\u62bc\u3057\u3067\u958b\u3051\u307e\u3059");
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

    function assignCardToActiveSlot(cardId) {
      const next = getPartyFormation().slice(0, 5);
      next[activeSlot] = cardId;
      setPartyFormation(next);
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

      setPartyFormation(next);
      activeSlot = targetSlotIndex;
      renderFormationScreen();
    }

    function getNextAvailableSlotIndex() {
      const formation = getPartyFormation();
      const emptyIndex = formation.findIndex(cardId => !cardId);
      return emptyIndex >= 0 ? emptyIndex : activeSlot;
    }

    function handleCardDragStart(event, cardId) {
      draggingCardId = cardId;
      draggingFromSlot = null;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", cardId);
    }

    function handleSlotDragStart(event, button) {
      const cardId = button.dataset.slotCardId || "";
      if (!cardId) {
        event.preventDefault();
        return;
      }
      draggingCardId = cardId;
      draggingFromSlot = Number(button.dataset.slotIndex);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", cardId);
    }

    function handleSlotDragOver(event, button) {
      if (!draggingCardId) return;
      event.preventDefault();
      button.classList.add("is-drop-target");
      event.dataTransfer.dropEffect = "move";
    }

    function handleSlotDrop(event, button) {
      if (!draggingCardId) return;
      event.preventDefault();
      button.classList.remove("is-drop-target");
      const slotIndex = Number(button.dataset.slotIndex);
      if (!Number.isFinite(slotIndex)) return;
      moveCardToSlot(draggingCardId, slotIndex);
      clearDragState();
    }

    function clearDragState() {
      draggingCardId = "";
      draggingFromSlot = null;
      document.querySelectorAll(".formation-slot.is-drop-target").forEach(node => node.classList.remove("is-drop-target"));
    }

    function handleDetailPointerDown(event, target) {
      if (convertMode) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      clearPendingLongPress();
      pressMoved = false;
      pressTimer = window.setTimeout(() => {
        pressTimer = null;
        if (!pressMoved) {
          suppressClickUntil = Date.now() + 450;
          openGrowthDetail(target);
        }
      }, LONG_PRESS_MS);
    }

    function clearPendingLongPress() {
      pressMoved = true;
      if (pressTimer) {
        window.clearTimeout(pressTimer);
        pressTimer = null;
      }
    }

    function toggleCopySelection(kind, copyKey) {
      const bucket = kind === "equipment" ? selectedEquipmentCopies : selectedCharacterCopies;
      if (bucket.has(copyKey)) bucket.delete(copyKey);
      else bucket.add(copyKey);
      renderFormationScreen();
    }

    function clearConvertSelection() {
      selectedCharacterCopies = new Set();
      selectedEquipmentCopies = new Set();
    }

    function clampNumberToStep(value, step, max) {
      const safeStep = Math.max(1, Number(step || 1));
      const safeMax = Math.max(0, Number(max || 0));
      const numeric = Math.max(0, Math.floor(Number(value || 0)));
      const aligned = Math.floor(numeric / safeStep) * safeStep;
      if (safeMax < safeStep) return 0;
      const maxAligned = Math.floor(safeMax / safeStep) * safeStep;
      return Math.max(safeStep, Math.min(maxAligned, aligned || safeStep));
    }

    function handleConvertControlsInput(event) {
      const staminaInput = event.target.closest("[data-stamina-convert-input]");
      if (!staminaInput) return;
      staminaConvertAmount = Math.max(0, Math.floor(Number(staminaInput.value || 0)));
      renderConvertControls();
    }

    function handleConvertControlsClick(event) {
      const toggleButton = event.target.closest("[data-convert-toggle]");
      if (toggleButton) {
        convertMode = !convertMode;
        if (!convertMode) clearConvertSelection();
        renderFormationScreen();
        return;
      }

      if (event.target.closest("[data-convert-clear]")) {
        clearConvertSelection();
        renderFormationScreen();
        return;
      }

      if (event.target.closest("[data-convert-selected]")) {
        handleSelectedCardConvert();
        return;
      }

      if (event.target.closest("[data-convert-stamina]")) {
        handleStaminaConvert();
      }
    }

    function handleSelectedCardConvert() {
      const characterSelection = Array.from(selectedCharacterCopies);
      const equipmentSelection = Array.from(selectedEquipmentCopies);
      const characterCount = characterSelection.length;
      const equipmentCount = equipmentSelection.length;
      if (characterCount + equipmentCount <= 0) {
        showToast?.("\u5909\u63db\u3059\u308b\u30ab\u30fc\u30c9\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044");
        return;
      }

      const characterResult = characterCount > 0
        ? convertSelectedCharacterInstances(characterSelection, { pointPerCard: CARD_POINT_VALUE })
        : { ok: true, pointGain: 0 };
      if (!characterResult?.ok) {
        handleSelectionConvertError(characterResult);
        return;
      }

      const equipmentResult = equipmentCount > 0
        ? convertSelectedEquipmentInstances(equipmentSelection, { pointPerCard: CARD_POINT_VALUE })
        : { ok: true, pointGain: 0 };
      if (!equipmentResult?.ok) {
        handleSelectionConvertError(equipmentResult);
        return;
      }

      const totalConverted = characterCount + equipmentCount;
      const totalPoints = Number(characterResult.pointGain || 0) + Number(equipmentResult.pointGain || 0);
      clearConvertSelection();
      convertMode = false;
      showToast?.(`${totalConverted}\u679a\u3092\u5909\u63db\u3057\u3066\u80b2\u6210\u30dd\u30a4\u30f3\u30c8${totalPoints}\u3092\u7372\u5f97\u3057\u307e\u3057\u305f`);
      renderFormationScreen();
    }

    function handleSelectionConvertError(result) {
      if (result?.code === "selection_shortage") {
        showToast?.("\u5909\u63db\u5bfe\u8c61\u306e\u6240\u6301\u6570\u304c\u8db3\u308a\u307e\u305b\u3093");
        return;
      }
      if (result?.code === "empty_selection") {
        showToast?.("\u5909\u63db\u3059\u308b\u30ab\u30fc\u30c9\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044");
        return;
      }
      showToast?.("\u30ab\u30fc\u30c9\u306e\u5909\u63db\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
    }

    function handleStaminaConvert() {
      const amount = clampNumberToStep(staminaConvertAmount, STAMINA_PER_POINT, getPlayerCurrencyAmount("stamina"));
      staminaConvertAmount = amount;
      const result = convertStaminaToGrowthPoints(amount, { staminaPerPoint: STAMINA_PER_POINT });
      if (!result?.ok) {
        if (result?.code === "stamina_shortage") showToast?.("\u30b9\u30bf\u30df\u30ca\u304c\u8db3\u308a\u307e\u305b\u3093");
        else if (result?.code === "stamina_rate_shortage") showToast?.(`\u6700\u4f4e${STAMINA_PER_POINT}\u30b9\u30bf\u30df\u30ca\u304b\u3089\u5909\u63db\u3067\u304d\u307e\u3059`);
        else showToast?.("\u30b9\u30bf\u30df\u30ca\u5909\u63db\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
        renderConvertControls();
        return;
      }
      showToast?.(`\u30b9\u30bf\u30df\u30ca${result.spentStamina}\u3092\u80b2\u6210\u30dd\u30a4\u30f3\u30c8${result.pointGain}\u306b\u5909\u63db\u3057\u307e\u3057\u305f`);
      renderFormationScreen();
    }

    function ensureGrowthDetailModal() {
      let modal = document.getElementById("formation-growth-detail");
      if (modal) return modal;

      modal = document.createElement("div");
      modal.id = "formation-growth-detail";
      modal.className = "formation-growth-detail";
      modal.hidden = true;
      modal.innerHTML = `
        <div class="formation-growth-detail-inner">
          <div class="formation-growth-detail-head">
            <h4 id="formation-growth-title">\u8a73\u7d30</h4>
            <button type="button" class="formation-growth-close" data-growth-close>&times;</button>
          </div>
          <div class="formation-growth-body" id="formation-growth-body"></div>
        </div>
      `;

      modal.addEventListener("click", event => {
        if (event.target === modal) closeGrowthDetail();
      });
      modal.querySelector("[data-growth-close]")?.addEventListener("click", closeGrowthDetail);
      modal.querySelector("#formation-growth-body")?.addEventListener("click", handleGrowthActionClick);
      document.getElementById("screen-formation")?.appendChild(modal);
      return modal;
    }

    function openGrowthDetail(target) {
      detailTarget = target && (target.instanceId || target.id) ? target : null;
      selectedGrowthMaterialKey = "";
      renderGrowthDetail();
    }

    function closeGrowthDetail() {
      detailTarget = null;
      selectedGrowthMaterialKey = "";
      const modal = document.getElementById("formation-growth-detail");
      if (!modal) return;
      modal.hidden = true;
      modal.classList.remove("active");
    }

    function resolveCharacterDetail(id) {
      const instance = getCardInstance(id);
      const char = getCharacters().find(item => item.id === instance?.cardId);
      if (!char || !instance) return null;
      const mode = getSystemConfig().rarityMode;
      const growth = getCardInstanceGrowth(id);
      const materialInstances = getCardInstances(instance.cardId).filter(item => item.instanceId !== instance.instanceId);
      return {
        kind: "character",
        id: instance.instanceId,
        cardId: instance.cardId,
        name: char.name || "\u30ad\u30e3\u30e9",
        rarityLabel: getRarityLabel(char.rarity, mode),
        image: getCharacterImageForUsage(char, "icon") || makeFallbackImage(char.name, char.rarity, mode),
        instance,
        growth,
        materialInstances
      };
    }

    function resolveEquipmentDetail(id) {
      const instance = getEquipmentInstance(id);
      const card = (Array.isArray(getEquipmentCards?.()) ? getEquipmentCards() : []).find(item => item.id === instance?.equipmentId);
      if (!card || !instance) return null;
      const mode = getSystemConfig().rarityMode;
      const growth = getEquipmentInstanceGrowth(id);
      const materialInstances = getEquipmentInstances(instance.equipmentId).filter(item => item.instanceId !== instance.instanceId);
      return {
        kind: "equipment",
        id: instance.instanceId,
        equipmentId: instance.equipmentId,
        name: card.name || "\u88c5\u5099",
        rarityLabel: getRarityLabel(card.rarity, mode),
        image: card.image || makeFallbackImage(card.name || "\u88c5\u5099", card.rarity || "R", mode),
        instance,
        growth,
        materialInstances
      };
    }

    function renderGrowthMaterials(detail) {
      if (!detail?.materialInstances?.length) {
        return `
          <div class="formation-growth-materials-empty">
            <p>\u7a81\u7834\u7d20\u6750\u306b\u3067\u304d\u308b\u540c\u540d\u30ab\u30fc\u30c9\u304c\u3042\u308a\u307e\u305b\u3093</p>
          </div>
        `;
      }

      const tiles = detail.materialInstances.map(material => {
        const copyKey = material.instanceId;
        const isSelected = selectedGrowthMaterialKey === copyKey;
        return `
          <button
            type="button"
            class="formation-growth-material${isSelected ? " is-selected" : ""}"
            data-growth-material="${esc(copyKey)}"
          >
            <img src="${detail.image}" alt="${esc(detail.name)}">
          </button>
        `;
      }).join("");

      return `
        <div class="formation-growth-materials">
          <div class="formation-growth-materials-head">
            <strong>\u7a81\u7834\u7d20\u6750</strong>
            <span>${detail.materialInstances.length}\u679a</span>
          </div>
          <div class="formation-growth-material-grid">
            ${tiles}
          </div>
        </div>
      `;
    }

    function renderGrowthDetail() {
      const modal = ensureGrowthDetailModal();
      const title = document.getElementById("formation-growth-title");
      const body = document.getElementById("formation-growth-body");
      if (!modal || !title || !body) return;
      if (!detailTarget) {
        closeGrowthDetail();
        return;
      }

      const detail = detailTarget.kind === "equipment"
        ? resolveEquipmentDetail(detailTarget.instanceId || detailTarget.id)
        : resolveCharacterDetail(detailTarget.instanceId || detailTarget.id);

      if (!detail) {
        closeGrowthDetail();
        return;
      }

      const evolveCost = (detail.growth.evolveStage + 1) * 5;
      title.textContent = `${detail.rarityLabel} ${detail.name}`;
      body.innerHTML = `
        <div class="formation-growth-summary">
          <img src="${detail.image}" alt="${esc(detail.name)}">
          <div class="formation-growth-meta">
            <p class="formation-growth-rarity">${esc(detail.rarityLabel)}</p>
            <h5 class="formation-growth-card-name">${esc(detail.name)}</h5>
          </div>
        </div>
        <div class="formation-growth-stats">
          <span>\u30ec\u30d9\u30eb ${detail.growth.level}</span>
          <span>\u9032\u5316 ${detail.growth.evolveStage}</span>
          <span>\u7a81\u7834 ${detail.growth.limitBreak}/5</span>
        </div>
        <div class="formation-growth-actions">
          <button type="button" class="formation-growth-btn" data-growth-action="enhance">\u5f37\u5316 +1</button>
          <button type="button" class="formation-growth-btn" data-growth-action="evolve">\u9032\u5316 (\u7d20\u6750${evolveCost})</button>
          <button type="button" class="formation-growth-btn" data-growth-action="limitBreak">\u7a81\u7834\u5b9f\u884c</button>
        </div>
        ${renderGrowthMaterials(detail)}
      `;

      modal.hidden = false;
      modal.classList.add("active");
    }

    function handleGrowthActionClick(event) {
      if (!detailTarget) return;
      const materialButton = event.target.closest("[data-growth-material]");
      if (materialButton) {
        const copyKey = materialButton.dataset.growthMaterial || "";
        selectedGrowthMaterialKey = selectedGrowthMaterialKey === copyKey ? "" : copyKey;
        renderGrowthDetail();
        return;
      }
      const button = event.target.closest("[data-growth-action]");
      if (!button) return;
      const action = button.dataset.growthAction;
      let result = null;
      const isEquipment = detailTarget.kind === "equipment";
      if (action === "enhance") {
        result = isEquipment ? enhanceEquipmentInstance(detailTarget.instanceId || detailTarget.id) : enhanceCardInstance(detailTarget.instanceId || detailTarget.id);
      } else if (action === "evolve") {
        result = isEquipment ? evolveEquipmentInstance(detailTarget.instanceId || detailTarget.id) : evolveCardInstance(detailTarget.instanceId || detailTarget.id);
      } else if (action === "limitBreak") {
        if (!selectedGrowthMaterialKey) {
          handleGrowthResult({ ok: false, code: "material_not_selected" }, action);
          return;
        }
        result = isEquipment
          ? limitBreakEquipmentInstance(detailTarget.instanceId || detailTarget.id, selectedGrowthMaterialKey)
          : limitBreakCardInstance(detailTarget.instanceId || detailTarget.id, selectedGrowthMaterialKey);
      }
      handleGrowthResult(result, action);
    }

    function handleGrowthResult(result, action) {
      if (!result?.ok) {
        const code = result?.code;
        if (code === "duplicate_shortage") showToast?.("\u91cd\u8907\u30ab\u30fc\u30c9\u304c\u8db3\u308a\u307e\u305b\u3093");
        else if (code === "material_not_selected") showToast?.("\u7a81\u7834\u306b\u4f7f\u3046\u540c\u540d\u30ab\u30fc\u30c9\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044");
        else if (code === "limit_break_max") showToast?.("\u3053\u306e\u30ab\u30fc\u30c9\u306f\u65e2\u306b5\u7a81\u7834\u3067\u3059");
        else if (code === "material_shortage") showToast?.("\u9032\u5316\u7d20\u6750\u304c\u4e0d\u8db3\u3057\u3066\u3044\u307e\u3059");
        else if (code === "evolve_max") showToast?.("\u3053\u306e\u30ab\u30fc\u30c9\u306f\u65e2\u306b\u6700\u7d42\u9032\u5316\u6e08\u307f\u3067\u3059");
        else showToast?.("\u51e6\u7406\u306b\u5931\u6557\u3057\u307e\u3057\u305f");
        return;
      }

      if (action === "enhance") showToast?.("\u5f37\u5316\u3057\u307e\u3057\u305f");
      if (action === "evolve") showToast?.("\u9032\u5316\u3057\u307e\u3057\u305f");
      if (action === "limitBreak") {
        selectedGrowthMaterialKey = "";
        showToast?.("\u7a81\u7834\u3092\u5b9f\u884c\u3057\u307e\u3057\u305f");
      }

      renderFormationScreen();
      renderGrowthDetail();
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
