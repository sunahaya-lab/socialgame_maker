(function () {
  function setupFormationScreen(deps) {
    return createFormationScreen(deps);
  }

  function createFormationScreen(deps) {
    // Transitional formation screen.
    // Active behavior is mostly delegated to dedicated runtimes; this file is now
    // primarily the bridge that wires those runtimes together.

    // SECTION 01: dependency intake + runtime binding
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
      getDefaultBattleState,
      setBattleState,
      navigateTo,
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
    function setActiveSlotValue(value) {
      activeSlot = value;
    }

    function setDraggingCardIdValue(value) {
      draggingCardId = value;
    }

    function setDraggingFromSlotValue(value) {
      draggingFromSlot = value;
    }

    function getStaminaConvertAmountValue() {
      return staminaConvertAmount;
    }

    function setStaminaConvertAmountValue(value) {
      staminaConvertAmount = value;
    }

    function getSelectedCharacterCopiesValue() {
      return selectedCharacterCopies;
    }

    function getSelectedEquipmentCopiesValue() {
      return selectedEquipmentCopies;
    }

    function getConvertModeValue() {
      return convertMode;
    }

    function setConvertModeValue(value) {
      convertMode = value;
    }

    function getEquipmentHintShownValue() {
      return equipmentHintShown;
    }

    function setEquipmentHintShownValue(value) {
      equipmentHintShown = value;
    }

    function getDetailTargetValue() {
      return detailTarget;
    }

    function setDetailTargetValue(value) {
      detailTarget = value;
    }

    function getSelectedGrowthMaterialKeyValue() {
      return selectedGrowthMaterialKey;
    }

    function setSelectedGrowthMaterialKeyValue(value) {
      selectedGrowthMaterialKey = value;
    }

    function getSuppressClickUntilValue() {
      return suppressClickUntil;
    }

    function setSuppressClickUntilValue(value) {
      suppressClickUntil = value;
    }

    function getPressMovedValue() {
      return pressMoved;
    }

    function setPressMovedValue(value) {
      pressMoved = value;
    }

    function getPressTimerValue() {
      return pressTimer;
    }

    function setPressTimerValue(value) {
      pressTimer = value;
    }
    const battleEntryController = window.FormationBattleEntryLib?.create?.({
      getCharacters,
      getPartyFormation,
      getDefaultBattleState,
      setBattleState,
      navigateTo
    }) || null;
    const convertApi = window.FormationConvertRuntime?.create?.({
      getGrowthResources,
      getPlayerCurrencyAmount,
      getStaminaPerPoint: () => STAMINA_PER_POINT,
      getCardPointValue: () => CARD_POINT_VALUE,
      getStaminaConvertAmount: getStaminaConvertAmountValue,
      setStaminaConvertAmount: setStaminaConvertAmountValue,
      getSelectedCharacterCopies: getSelectedCharacterCopiesValue,
      getSelectedEquipmentCopies: getSelectedEquipmentCopiesValue,
      clearConvertSelection,
      getConvertMode: getConvertModeValue,
      setConvertMode: setConvertModeValue,
      convertSelectedCharacterInstances,
      convertSelectedEquipmentInstances,
      convertStaminaToGrowthPoints,
      showToast,
      renderFormationScreen,
    }) || null;
    const partyApi = window.FormationPartyRuntime?.create?.({
      getPartyFormation,
      setPartyFormation,
      getCharacters,
      getSystemConfig,
      getCharacterImageForUsage,
      makeFallbackImage,
      getRarityCssClass,
      getActiveSlot: () => activeSlot,
      setActiveSlot: setActiveSlotValue,
      renderFormationScreen,
      esc,
      getDraggingCardId: () => draggingCardId,
      setDraggingCardId: setDraggingCardIdValue,
      setDraggingFromSlot: setDraggingFromSlotValue,
      clearDragState,
    }) || null;
    const cardListApi = window.FormationCardListRuntime?.create?.({
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
      getSelectedCharacterCopies: getSelectedCharacterCopiesValue,
      getSuppressClickUntil: getSuppressClickUntilValue,
      getConvertMode: getConvertModeValue,
      toggleCopySelection,
      getNextAvailableSlotIndex,
      setActiveSlot: setActiveSlotValue,
      assignCardToActiveSlot,
      handleCardDragStart,
      clearDragState,
      handleDetailPointerDown,
      clearPendingLongPress,
      esc,
    }) || null;
    const equipmentApi = window.FormationEquipmentRuntime?.create?.({
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
      getEquipmentHintShown: getEquipmentHintShownValue,
      setEquipmentHintShown: setEquipmentHintShownValue,
      getConvertMode: getConvertModeValue,
      getSuppressClickUntil: getSuppressClickUntilValue,
    }) || null;
    const growthApi = window.FormationGrowthRuntime?.create?.({
      getDetailTarget: getDetailTargetValue,
      setDetailTarget: setDetailTargetValue,
      getSelectedGrowthMaterialKey: getSelectedGrowthMaterialKeyValue,
      setSelectedGrowthMaterialKey: setSelectedGrowthMaterialKeyValue,
      getCardInstance,
      getEquipmentInstance,
      getCharacters,
      getEquipmentCards,
      getSystemConfig,
      getCardInstanceGrowth,
      getEquipmentInstanceGrowth,
      getCardInstances,
      getEquipmentInstances,
      getCharacterImageForUsage,
      makeFallbackImage,
      getRarityLabel,
      esc,
      closeGrowthDetailRef: () => closeGrowthDetail(),
      handleGrowthActionClick,
      setSuppressClickUntil: setSuppressClickUntilValue,
      longPressMs: LONG_PRESS_MS,
      getConvertMode: getConvertModeValue,
      getPressMoved: getPressMovedValue,
      setPressMoved: setPressMovedValue,
      getPressTimer: getPressTimerValue,
      setPressTimer: setPressTimerValue,
      enhanceCardInstance,
      enhanceEquipmentInstance,
      evolveCardInstance,
      evolveEquipmentInstance,
      limitBreakCardInstance,
      limitBreakEquipmentInstance,
      showToast,
      renderFormationScreen,
    }) || null;

    // SECTION 02: top-level render entrypoints
    function syncFormationDetailVisibility() {
      if (!isEquipmentVisibleInFormation() && detailTarget?.kind === "equipment") {
        closeGrowthDetail();
      }
    }

    function renderFormationSections() {
      battleEntryController?.renderBattleEntryPanel?.();
      renderConvertControls();
      renderPartySlots();
      renderCardList();
      syncFormationDetailVisibility();
      renderEquipmentList();
    }

    function renderFormationScreen() {
      renderFormationSections();
      if (detailTarget) renderGrowthDetail();
    }

    // SECTION 03: party / card / equipment bridge helpers
    function getEquipmentMode() {
      const mode = getSystemConfig?.()?.equipmentMode;
      return ["disabled", "database_only", "enabled"].includes(mode) ? mode : "disabled";
    }

    function isEquipmentVisibleInFormation() {
      return getEquipmentMode() !== "disabled";
    }
    function ensureEquipmentSection() {
      return equipmentApi?.ensureEquipmentSection?.();
    }

    function renderEquipmentList() {
      return equipmentApi?.renderEquipmentList?.();
    }
    function handleCardDragStart(event, cardId) {
      draggingCardId = cardId;
      draggingFromSlot = null;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", cardId);
    }
    function clearDragState() {
      draggingCardId = "";
      draggingFromSlot = null;
      document.querySelectorAll(".formation-slot.is-drop-target").forEach(node => node.classList.remove("is-drop-target"));
    }

    function renderPartySlots() {
      return partyApi?.renderPartySlots?.();
    }

    function getFormationSlotRoleLabel(index) {
      return partyApi?.getFormationSlotRoleLabel?.(index);
    }

    function assignCardToActiveSlot(cardId) {
      return partyApi?.assignCardToActiveSlot?.(cardId);
    }

    function moveCardToSlot(cardId, targetSlotIndex) {
      return partyApi?.moveCardToSlot?.(cardId, targetSlotIndex);
    }

    function getNextAvailableSlotIndex() {
      return partyApi?.getNextAvailableSlotIndex?.();
    }

    function handleSlotDragStart(event, button) {
      return partyApi?.handleSlotDragStart?.(event, button);
    }

    function handleSlotDragOver(event, button) {
      return partyApi?.handleSlotDragOver?.(event, button);
    }

    function handleSlotDrop(event, button) {
      return partyApi?.handleSlotDrop?.(event, button);
    }

    function renderCardList() {
      return cardListApi?.renderCardList?.();
    }

    // SECTION 04: growth detail bridge helpers
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
    function handleDetailPointerDown(event, target) {
      return growthApi?.handleDetailPointerDown?.(event, target);
    }

    function clearPendingLongPress() {
      return growthApi?.clearPendingLongPress?.();
    }

    function ensureGrowthDetailModal() {
      return growthApi?.ensureGrowthDetailModal?.();
    }

    function openGrowthDetail(target) {
      return growthApi?.openGrowthDetail?.(target);
    }

    function closeGrowthDetail() {
      return growthApi?.closeGrowthDetail?.();
    }

    function resolveCharacterDetail(id) {
      return growthApi?.resolveCharacterDetail?.(id);
    }

    function resolveEquipmentDetail(id) {
      return growthApi?.resolveEquipmentDetail?.(id);
    }

    function renderGrowthMaterials(detail) {
      return growthApi?.renderGrowthMaterials?.(detail);
    }

    function renderGrowthDetail() {
      return growthApi?.renderGrowthDetail?.();
    }
    function handleGrowthActionClick(event) {
      return growthApi?.handleGrowthActionClick?.(event);
    }

    function handleGrowthResult(result, action) {
      return growthApi?.handleGrowthResult?.(result, action);
    }

    // SECTION 05: convert controls bridge helpers
    function ensureConvertControls() {
      return convertApi?.ensureConvertControls?.();
    }

    function renderConvertControls() {
      return convertApi?.renderConvertControls?.();
    }

    function clampNumberToStep(value, step, max) {
      return convertApi?.clampNumberToStep?.(value, step, max);
    }

    function handleConvertControlsInput(event) {
      return convertApi?.handleConvertControlsInput?.(event);
    }

    function handleConvertControlsClick(event) {
      return convertApi?.handleConvertControlsClick?.(event);
    }

    function handleSelectedCardConvert() {
      return convertApi?.handleSelectedCardConvert?.();
    }

    function handleSelectionConvertError(result) {
      return convertApi?.handleSelectionConvertError?.(result);
    }

    function handleStaminaConvert() {
      return convertApi?.handleStaminaConvert?.();
    }

    // SECTION 06: public screen surface
    return {
      renderFormationScreen
    };
  }

  window.FormationScreen = {
    setupFormationScreen,
    createFormationScreen
  };
})();
