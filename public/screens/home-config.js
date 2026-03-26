(function () {
  function createHomeConfigModule(deps) {
    const {
      getPlayerState,
      setPlayerState,
      getCurrentProjectId,
      getHomeConfigDraft,
      setHomeConfigDraft,
      getActiveHomeConfigTarget,
      setActiveHomeConfigTarget,
      getHomeConfigDrag,
      setHomeConfigDrag,
      getCharacters,
      getSystemConfig,
      getDefaultHomeConfig,
      normalizeHomePreferences,
      loadLocal,
      saveLocal,
      postJSON,
      getPlayerApiUrl,
      API,
      renderHome,
      showToast,
      esc,
      makeFallbackImage,
      clamp
    } = deps;

    function loadHomeConfig() {
      const playerState = getPlayerState();
      const localConfig = loadLocal("socia-home-config", null);
      if (playerState?.homePreferences || localConfig) {
        return normalizeHomePreferences({
          ...(playerState?.homePreferences || {}),
          ...(localConfig || {})
        });
      }

      try {
        const raw = localStorage.getItem("socia-home-config");
        if (raw) {
          const parsed = normalizeHomePreferences(JSON.parse(raw));
          saveLocal("socia-home-config", parsed);
          return parsed;
        }
      } catch {}

      return getDefaultHomeConfig();
    }

    async function saveHomeConfig(config) {
      const normalized = normalizeHomePreferences(config);
      const playerState = getPlayerState();
      playerState.homePreferences = normalized;
      setPlayerState(playerState);
      saveLocal("socia-player-state", playerState);
      saveLocal("socia-home-config", normalized);
      try {
        localStorage.setItem("socia-home-config", JSON.stringify(normalized));
      } catch {}

      if (!getCurrentProjectId()) return normalized;

      try {
        const response = await postJSON(getPlayerApiUrl(API.playerHomePreferences), normalized);
        if (response?.homePreferences) {
          const nextPlayerState = getPlayerState();
          nextPlayerState.homePreferences = normalizeHomePreferences({
            ...response.homePreferences,
            backgroundImage: normalized.backgroundImage
          });
          setPlayerState(nextPlayerState);
          saveLocal("socia-player-state", nextPlayerState);
        }
      } catch (error) {
        console.error("Failed to save home config:", error);
        showToast("ホーム設定の保存に失敗しました。");
      }

      return normalized;
    }

    function openHomeConfigPanel() {
      const panel = document.getElementById("home-config-panel");
      if (!panel) return;
      populateHomeCardSelects();
      populateHomeBackgroundSelect();
      setHomeConfigDraft({ ...loadHomeConfig() });
      setActiveHomeConfigTarget(1);
      syncHomeConfigForm();
      panel.hidden = false;
    }

    function closeHomeConfigPanel() {
      const panel = document.getElementById("home-config-panel");
      if (!panel) return;
      panel.hidden = true;
    }

    function setupHomeConfig() {
      const btn = document.getElementById("home-config-btn");
      const panel = document.getElementById("home-config-panel");
      const closeBtn = document.getElementById("home-config-close");
      const saveBtn = document.getElementById("home-config-save");
      const modeSelect = document.getElementById("home-mode-select");
      const backgroundSelect = document.getElementById("home-background-select");
      const scaleInput = document.getElementById("home-active-scale");
      const resetBtn = document.getElementById("home-config-reset-char");
      const swapDepthBtn = document.getElementById("home-config-swap-depth");
      const stage = document.getElementById("home-config-stage");
      if (!btn || !panel || !closeBtn || !saveBtn || !modeSelect || !scaleInput || !resetBtn || !swapDepthBtn || !stage) {
        return;
      }

      window.openHomeConfigPanel = openHomeConfigPanel;
      window.closeHomeConfigPanel = closeHomeConfigPanel;

      btn.addEventListener("click", openHomeConfigPanel);
      closeBtn.addEventListener("click", closeHomeConfigPanel);

      modeSelect.addEventListener("change", () => {
        const draft = getHomeConfigDraft();
        if (!draft) return;
        draft.mode = Number(modeSelect.value);
        if (draft.mode !== 2) setActiveHomeConfigTarget(1);
        syncHomeConfigForm();
      });

      document.getElementById("home-card-1")?.addEventListener("change", event => {
        const draft = getHomeConfigDraft();
        if (!draft) return;
        draft.card1 = event.target.value;
        renderHomeConfigStage();
      });

      document.getElementById("home-card-2")?.addEventListener("change", event => {
        const draft = getHomeConfigDraft();
        if (!draft) return;
        draft.card2 = event.target.value;
        renderHomeConfigStage();
      });

      backgroundSelect?.addEventListener("change", event => {
        const draft = getHomeConfigDraft();
        if (!draft) return;
        draft.backgroundImage = event.target.value || "";
        renderHomeConfigStage();
      });

      document.getElementById("home-config-target-1")?.addEventListener("click", () => {
        setActiveHomeConfigTarget(1);
        syncHomeConfigForm();
      });
      document.getElementById("home-config-target-2")?.addEventListener("click", () => {
        const draft = getHomeConfigDraft();
        if (!draft || draft.mode !== 2) return;
        setActiveHomeConfigTarget(2);
        syncHomeConfigForm();
      });

      scaleInput.addEventListener("input", event => {
        const draft = getHomeConfigDraft();
        if (!draft) return;
        draft[`scale${getActiveHomeConfigTarget()}`] = Number(event.target.value);
        syncHomeConfigScale();
        renderHomeConfigStage();
      });

      resetBtn.addEventListener("click", () => {
        const draft = getHomeConfigDraft();
        if (!draft) return;
        const target = getActiveHomeConfigTarget();
        draft[`scale${target}`] = 100;
        draft[`x${target}`] = target === 1 ? -10 : 10;
        draft[`y${target}`] = 0;
        syncHomeConfigForm();
      });

      swapDepthBtn.addEventListener("click", () => {
        const draft = getHomeConfigDraft();
        if (!draft || draft.mode !== 2) return;
        draft.front = draft.front === 1 ? 2 : 1;
        renderHomeConfigStage();
      });

      stage.addEventListener("pointermove", updateHomeConfigDrag);
      stage.addEventListener("pointerup", endHomeConfigDrag);
      stage.addEventListener("pointercancel", endHomeConfigDrag);
      stage.addEventListener("pointerleave", endHomeConfigDrag);

      saveBtn.addEventListener("click", async () => {
        const draft = getHomeConfigDraft();
        if (!draft) return;
        await saveHomeConfig(draft);
        closeHomeConfigPanel();
        renderHome();
        showToast("ホーム設定を保存しました。");
      });
    }

    function syncHomeConfigForm() {
      const draft = getHomeConfigDraft();
      if (!draft) return;
      document.getElementById("home-mode-select").value = String(draft.mode);
      document.getElementById("home-card-1").value = draft.card1;
      document.getElementById("home-card-2").value = draft.card2;
      const backgroundSelect = document.getElementById("home-background-select");
      if (backgroundSelect) {
        populateHomeBackgroundSelect();
        backgroundSelect.value = draft.backgroundImage || "";
      }
      document.getElementById("home-char-2-settings").hidden = draft.mode !== 2;
      document.getElementById("home-config-target-1").classList.toggle("active", getActiveHomeConfigTarget() === 1);
      document.getElementById("home-config-target-2").classList.toggle("active", getActiveHomeConfigTarget() === 2);
      document.getElementById("home-config-target-2").disabled = draft.mode !== 2;
      document.getElementById("home-config-swap-depth").disabled = draft.mode !== 2;
      syncHomeConfigScale();
      renderHomeConfigStage();
    }

    function syncHomeConfigScale() {
      const draft = getHomeConfigDraft();
      if (!draft) return;
      const target = getActiveHomeConfigTarget();
      const scaleInput = document.getElementById("home-active-scale");
      const value = draft[`scale${target}`];
      scaleInput.value = value;
      document.getElementById("home-active-scale-val").textContent = `${value}%`;
    }

    function populateHomeCardSelects() {
      const cards = getCharacters();
      ["home-card-1", "home-card-2"].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const current = select.value;
        select.innerHTML = '<option value="">Select a card</option>' +
          cards.map(card => `<option value="${esc(card.id)}">${esc(card.rarity)} ${esc(card.name)}</option>`).join("");
        select.value = current;
      });
    }

    function populateHomeBackgroundSelect() {
      const select = document.getElementById("home-background-select");
      if (!select) return;
      const current = select.value;
      const assets = Array.isArray(getSystemConfig()?.layoutAssets?.home) ? getSystemConfig().layoutAssets.home : [];
      select.innerHTML = '<option value="">Default Background</option>' +
        assets.map(asset => `<option value="${esc(asset.src)}">${esc(asset.name || asset.id)}</option>`).join("");
      select.value = current;
    }

    function renderHomeConfigStage() {
      const draft = getHomeConfigDraft();
      if (!draft) return;
      const stage = document.getElementById("home-config-stage");
      if (stage) {
        stage.style.backgroundImage = draft.backgroundImage
          ? `linear-gradient(180deg, rgba(8,10,18,0.16), rgba(8,10,18,0.3)), url("${String(draft.backgroundImage).replace(/"/g, '\\"')}")`
          : "";
        stage.style.backgroundSize = draft.backgroundImage ? "cover" : "";
        stage.style.backgroundPosition = draft.backgroundImage ? "center" : "";
      }
      renderHomeConfigStageChar(1);
      renderHomeConfigStageChar(2);
    }

    function renderHomeConfigStageChar(index) {
      const draft = getHomeConfigDraft();
      if (!draft) return;
      const stageChar = document.getElementById(`home-config-stage-char-${index}`);
      if (!stageChar) return;
      const isVisible = index === 1 || draft.mode === 2;
      if (!isVisible) {
        stageChar.innerHTML = "";
        stageChar.classList.add("is-hidden");
        return;
      }

      const cardId = draft[`card${index}`];
      const cards = getCharacters();
      const card = cards.find(item => item.id === cardId) || (index === 1 ? cards[0] : null);
      if (!card) {
        stageChar.innerHTML = '<div class="home-config-stage-empty">No card selected</div>';
      } else {
        stageChar.innerHTML = `<img src="${card.image || makeFallbackImage(card.name, card.rarity)}" alt="${esc(card.name)}">`;
      }

      stageChar.classList.remove("is-hidden");
      stageChar.classList.toggle("is-active", getActiveHomeConfigTarget() === index);
      stageChar.classList.toggle("is-front", draft.front === index);
      stageChar.classList.toggle("is-back", draft.front !== index);
      stageChar.dataset.label = `Character ${index}`;
      stageChar.style.transform = `translateX(${draft[`x${index}`]}%) scale(${draft[`scale${index}`] / 100})`;
      stageChar.style.bottom = `${32 + draft[`y${index}`] * 2.2}px`;
      stageChar.onpointerdown = event => beginHomeConfigDrag(event, index);
    }

    function beginHomeConfigDrag(event, index) {
      const draft = getHomeConfigDraft();
      if (!draft) return;
      setActiveHomeConfigTarget(index);
      syncHomeConfigForm();
      const stage = document.getElementById("home-config-stage");
      setHomeConfigDrag({
        index,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        initialX: draft[`x${index}`],
        initialY: draft[`y${index}`],
        initialScale: draft[`scale${index}`],
        width: stage.clientWidth,
        height: stage.clientHeight,
        pointers: new Map([[event.pointerId, { x: event.clientX, y: event.clientY }]]),
        pinchDistance: null
      });
      event.currentTarget.classList.add("is-dragging");
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    function updateHomeConfigDrag(event) {
      const drag = getHomeConfigDrag();
      const draft = getHomeConfigDraft();
      if (!drag || !draft) return;
      drag.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (drag.pointers.size >= 2) {
        const [a, b] = [...drag.pointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (!drag.pinchDistance) {
          drag.pinchDistance = distance;
          drag.initialScale = draft[`scale${drag.index}`];
          return;
        }
        const nextScale = drag.initialScale * (distance / drag.pinchDistance);
        draft[`scale${drag.index}`] = Math.round(clamp(nextScale, 50, 200));
        syncHomeConfigScale();
        renderHomeConfigStage();
        return;
      }
      if (drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      const nextX = drag.initialX + (dx / drag.width) * 100;
      const nextY = drag.initialY - (dy / drag.height) * 90;
      draft[`x${drag.index}`] = clamp(nextX, -60, 60);
      draft[`y${drag.index}`] = clamp(nextY, -30, 50);
      renderHomeConfigStage();
    }

    function endHomeConfigDrag(event) {
      const drag = getHomeConfigDrag();
      const draft = getHomeConfigDraft();
      if (!drag) return;
      if (event) {
        drag.pointers.delete(event.pointerId);
        if (drag.pointers.size > 0 && event.pointerId !== drag.pointerId) return;
        if (drag.pointers.size > 0 && event.pointerId === drag.pointerId) {
          const [remaining] = drag.pointers.values();
          drag.startX = remaining.x;
          drag.startY = remaining.y;
          drag.initialX = draft[`x${drag.index}`];
          drag.initialY = draft[`y${drag.index}`];
          drag.initialScale = draft[`scale${drag.index}`];
          drag.pinchDistance = null;
          return;
        }
      }
      const el = document.getElementById(`home-config-stage-char-${drag.index}`);
      el?.classList.remove("is-dragging");
      setHomeConfigDrag(null);
    }

    return {
      loadHomeConfig,
      saveHomeConfig,
      openHomeConfigPanel,
      closeHomeConfigPanel,
      setupHomeConfig,
      syncHomeConfigForm,
      syncHomeConfigScale,
      populateHomeCardSelects,
      populateHomeBackgroundSelect,
      renderHomeConfigStage,
      renderHomeConfigStageChar,
      beginHomeConfigDrag,
      updateHomeConfigDrag,
      endHomeConfigDrag
    };
  }

  window.HomeConfigModule = {
    create: createHomeConfigModule
  };
})();
