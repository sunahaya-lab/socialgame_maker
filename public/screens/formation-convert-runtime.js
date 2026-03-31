(function () {
  function createFormationConvertRuntime(deps) {
    const {
      getGrowthResources,
      getPlayerCurrencyAmount,
      getStaminaPerPoint,
      getCardPointValue,
      getStaminaConvertAmount,
      setStaminaConvertAmount,
      getSelectedCharacterCopies,
      getSelectedEquipmentCopies,
      clearConvertSelection,
      getConvertMode,
      setConvertMode,
      convertSelectedCharacterInstances,
      convertSelectedEquipmentInstances,
      convertStaminaToGrowthPoints,
      showToast,
      renderFormationScreen,
    } = deps;

    function ensureConvertControls() {
      const screen = document.getElementById("screen-formation");
      const panel = screen?.querySelector(".formation-panel");
      if (!screen || !panel) return null;

      let controls = document.getElementById("formation-convert-controls");
      if (controls) return controls;

      const staminaPerPoint = getStaminaPerPoint();
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
              <input type="number" min="${staminaPerPoint}" step="${staminaPerPoint}" value="${staminaPerPoint}" data-stamina-convert-input>
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

    function clampNumberToStep(value, step, max) {
      const safeStep = Math.max(1, Number(step || 1));
      const safeMax = Math.max(0, Number(max || 0));
      const numeric = Math.max(0, Math.floor(Number(value || 0)));
      const aligned = Math.floor(numeric / safeStep) * safeStep;
      if (safeMax < safeStep) return 0;
      const maxAligned = Math.floor(safeMax / safeStep) * safeStep;
      return Math.max(safeStep, Math.min(maxAligned, aligned || safeStep));
    }

    function renderConvertControls() {
      const controls = ensureConvertControls();
      if (!controls) return;
      const resources = getGrowthResources();
      const stamina = getPlayerCurrencyAmount("stamina");
      const staminaPerPoint = getStaminaPerPoint();
      setStaminaConvertAmount(clampNumberToStep(getStaminaConvertAmount(), staminaPerPoint, stamina));

      const selectedCardCount = getSelectedCharacterCopies().size + getSelectedEquipmentCopies().size;
      const pointPreview = selectedCardCount * getCardPointValue();
      const summary = controls.querySelector("#formation-convert-summary");
      const pointInfo = controls.querySelector("#formation-convert-points");
      const staminaSummary = controls.querySelector("#formation-stamina-summary");
      const staminaInput = controls.querySelector("[data-stamina-convert-input]");
      const convertButton = controls.querySelector("[data-convert-selected]");
      const staminaButton = controls.querySelector("[data-convert-stamina]");
      const sheet = controls.querySelector("#formation-convert-sheet");
      const fab = controls.querySelector("#formation-convert-fab");

      sheet.hidden = !getConvertMode();
      fab.classList.toggle("is-active", getConvertMode());
      fab.textContent = getConvertMode() ? "閉じる" : "変換";

      if (summary) {
        summary.textContent = getConvertMode()
          ? `選択中 ${selectedCardCount}枚`
          : "カードを選んで育成ポイントに変換";
      }
      if (pointInfo) {
        pointInfo.textContent = `所持 育成ポイント ${resources.resonance} / 選択変換 +${pointPreview}`;
      }
      if (staminaSummary) {
        const staminaPreview = Math.floor(getStaminaConvertAmount() / staminaPerPoint);
        staminaSummary.textContent = `所持スタミナ ${stamina} / ${staminaPerPoint}スタミナ → 育成ポイント1 / 今回 +${staminaPreview}`;
      }
      if (staminaInput) {
        staminaInput.max = String(Math.max(0, stamina));
        staminaInput.value = String(getStaminaConvertAmount());
      }
      if (convertButton) {
        convertButton.disabled = selectedCardCount <= 0;
      }
      if (staminaButton) {
        staminaButton.disabled = getStaminaConvertAmount() < staminaPerPoint;
      }
    }

    function handleConvertControlsInput(event) {
      const staminaInput = event.target.closest("[data-stamina-convert-input]");
      if (!staminaInput) return;
      setStaminaConvertAmount(Math.max(0, Math.floor(Number(staminaInput.value || 0))));
      renderConvertControls();
    }

    function handleConvertControlsClick(event) {
      const toggleButton = event.target.closest("[data-convert-toggle]");
      if (toggleButton) {
        setConvertMode(!getConvertMode());
        if (!getConvertMode()) clearConvertSelection();
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
      const characterSelection = Array.from(getSelectedCharacterCopies());
      const equipmentSelection = Array.from(getSelectedEquipmentCopies());
      const characterCount = characterSelection.length;
      const equipmentCount = equipmentSelection.length;
      if (characterCount + equipmentCount <= 0) {
        showToast?.("変換するカードを選んでください");
        return;
      }

      const characterResult = characterCount > 0
        ? convertSelectedCharacterInstances(characterSelection, { pointPerCard: getCardPointValue() })
        : { ok: true, pointGain: 0 };
      if (!characterResult?.ok) {
        handleSelectionConvertError(characterResult);
        return;
      }

      const equipmentResult = equipmentCount > 0
        ? convertSelectedEquipmentInstances(equipmentSelection, { pointPerCard: getCardPointValue() })
        : { ok: true, pointGain: 0 };
      if (!equipmentResult?.ok) {
        handleSelectionConvertError(equipmentResult);
        return;
      }

      const totalConverted = characterCount + equipmentCount;
      const totalPoints = Number(characterResult.pointGain || 0) + Number(equipmentResult.pointGain || 0);
      clearConvertSelection();
      setConvertMode(false);
      showToast?.(`${totalConverted}枚を変換して育成ポイント${totalPoints}を獲得しました`);
      renderFormationScreen();
    }

    function handleSelectionConvertError(result) {
      if (result?.code === "selection_shortage") {
        showToast?.("変換対象の所持数が足りません");
        return;
      }
      if (result?.code === "empty_selection") {
        showToast?.("変換するカードを選んでください");
        return;
      }
      showToast?.("カードの変換に失敗しました");
    }

    function handleStaminaConvert() {
      const staminaPerPoint = getStaminaPerPoint();
      const amount = clampNumberToStep(getStaminaConvertAmount(), staminaPerPoint, getPlayerCurrencyAmount("stamina"));
      setStaminaConvertAmount(amount);
      const result = convertStaminaToGrowthPoints(amount, { staminaPerPoint });
      if (!result?.ok) {
        if (result?.code === "stamina_shortage") showToast?.("スタミナが足りません");
        else if (result?.code === "stamina_rate_shortage") showToast?.(`最低${staminaPerPoint}スタミナから変換できます`);
        else showToast?.("スタミナ変換に失敗しました");
        renderConvertControls();
        return;
      }
      showToast?.(`スタミナ${result.spentStamina}を育成ポイント${result.pointGain}に変換しました`);
      renderFormationScreen();
    }

    return {
      ensureConvertControls,
      renderConvertControls,
      clampNumberToStep,
      handleConvertControlsInput,
      handleConvertControlsClick,
      handleSelectedCardConvert,
      handleSelectionConvertError,
      handleStaminaConvert,
    };
  }

  window.FormationConvertRuntime = {
    create: createFormationConvertRuntime
  };
})();
