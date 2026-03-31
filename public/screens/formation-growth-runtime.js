(function () {
  function createFormationGrowthRuntime(deps) {
    const {
      getDetailTarget,
      setDetailTarget,
      getSelectedGrowthMaterialKey,
      setSelectedGrowthMaterialKey,
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
      closeGrowthDetailRef,
      setSuppressClickUntil,
      longPressMs,
      getConvertMode,
      getPressMoved,
      setPressMoved,
      getPressTimer,
      setPressTimer,
      enhanceCardInstance,
      enhanceEquipmentInstance,
      evolveCardInstance,
      evolveEquipmentInstance,
      limitBreakCardInstance,
      limitBreakEquipmentInstance,
      showToast,
      renderFormationScreen,
    } = deps;

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
            <h4 id="formation-growth-title">詳細</h4>
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
      setDetailTarget(target && (target.instanceId || target.id) ? target : null);
      setSelectedGrowthMaterialKey("");
      renderGrowthDetail();
    }

    function closeGrowthDetail() {
      setDetailTarget(null);
      setSelectedGrowthMaterialKey("");
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
        name: char.name || "キャラ",
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
        name: card.name || "装備",
        rarityLabel: getRarityLabel(card.rarity, mode),
        image: card.image || makeFallbackImage(card.name || "装備", card.rarity || "R", mode),
        instance,
        growth,
        materialInstances
      };
    }

    function renderGrowthMaterials(detail) {
      if (!detail?.materialInstances?.length) {
        return `
          <div class="formation-growth-materials-empty">
            <p>突破素材にできる同名カードがありません</p>
          </div>
        `;
      }

      const tiles = detail.materialInstances.map(material => {
        const copyKey = material.instanceId;
        const isSelected = getSelectedGrowthMaterialKey() === copyKey;
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
            <strong>突破素材</strong>
            <span>${detail.materialInstances.length}枚</span>
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
      if (!getDetailTarget()) {
        closeGrowthDetail();
        return;
      }

      const detail = getDetailTarget().kind === "equipment"
        ? resolveEquipmentDetail(getDetailTarget().instanceId || getDetailTarget().id)
        : resolveCharacterDetail(getDetailTarget().instanceId || getDetailTarget().id);
      if (!detail) {
        closeGrowthDetail();
        return;
      }

      title.textContent = detail.name;
      body.innerHTML = `
        <div class="formation-growth-card">
          <img src="${detail.image}" alt="${esc(detail.name)}">
          <div class="formation-growth-meta">
            <strong>${esc(detail.name)}</strong>
            <span>${esc(detail.rarityLabel)}</span>
            <span>Lv.${detail.growth.level}</span>
            <span>進化 ${detail.growth.evolveStage}</span>
            <span>突破 ${detail.growth.limitBreak}</span>
          </div>
        </div>
        ${renderGrowthMaterials(detail)}
      `;
      modal.hidden = false;
      modal.classList.add("active");
    }

    function handleDetailPointerDown(event, target) {
      if (getConvertMode()) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      clearPendingLongPress();
      setPressMoved(false);
      setPressTimer(window.setTimeout(() => {
        setPressTimer(null);
        if (!getPressMoved()) {
          setSuppressClickUntil(Date.now() + 450);
          openGrowthDetail(target);
        }
      }, longPressMs));
    }

    function clearPendingLongPress() {
      setPressMoved(true);
      if (getPressTimer()) {
        window.clearTimeout(getPressTimer());
        setPressTimer(null);
      }
    }

    function handleGrowthActionClick(event) {
      if (!getDetailTarget()) return;
      const materialButton = event.target.closest("[data-growth-material]");
      if (materialButton) {
        const copyKey = materialButton.dataset.growthMaterial || "";
        setSelectedGrowthMaterialKey(getSelectedGrowthMaterialKey() === copyKey ? "" : copyKey);
        renderGrowthDetail();
        return;
      }
      const button = event.target.closest("[data-growth-action]");
      if (!button) return;
      const action = button.dataset.growthAction;
      let result = null;
      const isEquipment = getDetailTarget().kind === "equipment";
      if (action === "enhance") {
        result = isEquipment ? enhanceEquipmentInstance(getDetailTarget().instanceId || getDetailTarget().id) : enhanceCardInstance(getDetailTarget().instanceId || getDetailTarget().id);
      } else if (action === "evolve") {
        result = isEquipment ? evolveEquipmentInstance(getDetailTarget().instanceId || getDetailTarget().id) : evolveCardInstance(getDetailTarget().instanceId || getDetailTarget().id);
      } else if (action === "limitBreak") {
        if (!getSelectedGrowthMaterialKey()) {
          handleGrowthResult({ ok: false, code: "material_not_selected" }, action);
          return;
        }
        result = isEquipment
          ? limitBreakEquipmentInstance(getDetailTarget().instanceId || getDetailTarget().id, getSelectedGrowthMaterialKey())
          : limitBreakCardInstance(getDetailTarget().instanceId || getDetailTarget().id, getSelectedGrowthMaterialKey());
      }
      handleGrowthResult(result, action);
    }

    function handleGrowthResult(result, action) {
      if (!result?.ok) {
        const code = result?.code;
        if (code === "duplicate_shortage") showToast?.("重複カードが足りません");
        else if (code === "material_not_selected") showToast?.("突破に使う同名カードを選んでください");
        else if (code === "limit_break_max") showToast?.("このカードは既に5突破です");
        else if (code === "material_shortage") showToast?.("進化素材が不足しています");
        else if (code === "evolve_max") showToast?.("このカードは既に最終進化済みです");
        else showToast?.("処理に失敗しました");
        return;
      }

      if (action === "enhance") showToast?.("強化しました");
      if (action === "evolve") showToast?.("進化しました");
      if (action === "limitBreak") {
        setSelectedGrowthMaterialKey("");
        showToast?.("突破を実行しました");
      }

      renderFormationScreen();
      renderGrowthDetail();
    }

    return {
      ensureGrowthDetailModal,
      openGrowthDetail,
      closeGrowthDetail,
      resolveCharacterDetail,
      resolveEquipmentDetail,
      renderGrowthMaterials,
      renderGrowthDetail,
      handleDetailPointerDown,
      clearPendingLongPress,
      handleGrowthActionClick,
      handleGrowthResult,
    };
  }

  window.FormationGrowthRuntime = {
    create: createFormationGrowthRuntime
  };
})();
