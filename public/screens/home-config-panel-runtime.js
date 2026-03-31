(function () {
  function createHomeConfigPanelRuntime(deps) {
    const {
      getHomeConfigDraft,
      setHomeConfigDraft,
      getActiveHomeConfigTarget,
      setActiveHomeConfigTarget,
      getCharacters,
      getSystemConfig,
      getDefaultHomeConfig,
      normalizeHomePreferences,
      loadLocal,
      saveHomeConfig,
      renderHome,
      showToast,
      esc
    } = deps;

    function loadHomeConfig() {
      const localConfig = loadLocal("socia-home-config", null);
      const playerState = deps.getPlayerState?.();
      if (playerState?.homePreferences || localConfig) {
        return normalizeHomePreferences({
          ...(playerState?.homePreferences || {}),
          ...(localConfig || {})
        });
      }
      return getDefaultHomeConfig();
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
      deps.syncHomeConfigScale?.();
      deps.renderHomeConfigStage?.();
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

    function setupHomeConfig() {
      const btn = document.getElementById("home-config-btn");
      const panel = document.getElementById("home-config-panel");
      const closeBtn = document.getElementById("home-config-close");
      const saveBtn = document.getElementById("home-config-save");
      const modeSelect = document.getElementById("home-mode-select");
      const backgroundSelect = document.getElementById("home-background-select");
      if (!btn || !panel || !closeBtn || !saveBtn || !modeSelect) return;

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
        deps.renderHomeConfigStage?.();
      });

      document.getElementById("home-card-2")?.addEventListener("change", event => {
        const draft = getHomeConfigDraft();
        if (!draft) return;
        draft.card2 = event.target.value;
        deps.renderHomeConfigStage?.();
      });

      backgroundSelect?.addEventListener("change", event => {
        const draft = getHomeConfigDraft();
        if (!draft) return;
        draft.backgroundImage = event.target.value || "";
        deps.renderHomeConfigStage?.();
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

      saveBtn.addEventListener("click", async () => {
        const draft = getHomeConfigDraft();
        if (!draft) return;
        await saveHomeConfig(draft);
        closeHomeConfigPanel();
        renderHome();
        showToast("ホーム設定を保存しました。");
      });
    }

    return {
      openHomeConfigPanel,
      closeHomeConfigPanel,
      setupHomeConfig,
      syncHomeConfigForm,
      populateHomeCardSelects,
      populateHomeBackgroundSelect
    };
  }

  window.HomeConfigPanelRuntime = {
    create: createHomeConfigPanelRuntime
  };
})();
