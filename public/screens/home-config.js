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
    const audioApi = window.HomeConfigAudioRuntime?.create?.({
      getPlayerState,
      setPlayerState,
      saveLocal,
      clamp
    }) || null;
    const panelApi = window.HomeConfigPanelRuntime?.create?.({
      getPlayerState,
      getHomeConfigDraft,
      setHomeConfigDraft,
      getActiveHomeConfigTarget,
      setActiveHomeConfigTarget,
      getCharacters,
      getSystemConfig,
      getDefaultHomeConfig,
      normalizeHomePreferences,
      loadLocal,
      saveHomeConfig: config => saveHomeConfig(config),
      renderHome,
      showToast,
      esc,
      syncHomeConfigScale: () => syncHomeConfigScale(),
      renderHomeConfigStage: () => renderHomeConfigStage()
    }) || null;
    const saveApi = window.HomeConfigSaveRuntime?.create?.({
      getPlayerState,
      setPlayerState,
      getCurrentProjectId,
      normalizeHomePreferences,
      saveLocal,
      postJSON,
      getPlayerApiUrl,
      API,
      showToast
    }) || null;
    const stageApi = window.HomeConfigStageRuntime?.create?.({
      getHomeConfigDraft,
      setActiveHomeConfigTarget,
      getActiveHomeConfigTarget,
      getHomeConfigDrag,
      setHomeConfigDrag,
      getCharacters,
      makeFallbackImage,
      esc,
      clamp,
      syncHomeConfigForm: () => syncHomeConfigForm(),
      syncHomeConfigScale: () => syncHomeConfigScale(),
      renderHomeConfigStage: () => renderHomeConfigStage()
    }) || null;

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
      return saveApi?.saveHomeConfig?.(config);
    }

    function normalizeAudioSettings(settings) {
      return audioApi?.normalizeAudioSettings?.(settings);
    }

    function getAudioSettings() {
      return audioApi?.getAudioSettings?.();
    }

    function saveAudioSettings(partialSettings = {}) {
      return audioApi?.saveAudioSettings?.(partialSettings);
    }

    function applyAudioSettings(settings = null) {
      return audioApi?.applyAudioSettings?.(settings);
    }

    function syncAudioSettingsForm() {
      return audioApi?.syncAudioSettingsForm?.();
    }

    function openAudioSettingsPanel() {
      return audioApi?.openAudioSettingsPanel?.();
    }

    function closeAudioSettingsPanel() {
      return audioApi?.closeAudioSettingsPanel?.();
    }

    function openHomeConfigPanel() {
      return panelApi?.openHomeConfigPanel?.();
    }

    function closeHomeConfigPanel() {
      return panelApi?.closeHomeConfigPanel?.();
    }

    function setupHomeConfig() {
      const audioBtn = document.getElementById("home-audio-settings-btn");
      const audioCloseBtn = document.getElementById("home-audio-settings-close");
      const scaleInput = document.getElementById("home-active-scale");
      const resetBtn = document.getElementById("home-config-reset-char");
      const swapDepthBtn = document.getElementById("home-config-swap-depth");
      const stage = document.getElementById("home-config-stage");
      if (!audioBtn || !audioCloseBtn || !scaleInput || !resetBtn || !swapDepthBtn || !stage) {
        return;
      }

      window.openHomeAudioSettingsPanel = openAudioSettingsPanel;
      window.closeHomeAudioSettingsPanel = closeAudioSettingsPanel;

      audioBtn.addEventListener("click", openAudioSettingsPanel);
      audioCloseBtn.addEventListener("click", closeAudioSettingsPanel);
      applyAudioSettings();
      syncAudioSettingsForm();
      panelApi?.setupHomeConfig?.();

      [
        ["bgm", "bgmVolume"],
        ["sfx", "sfxVolume"],
        ["voice", "voiceVolume"]
      ].forEach(([key, stateKey]) => {
        document.getElementById(`home-audio-${key}`)?.addEventListener("input", event => {
          const next = saveAudioSettings({ [stateKey]: Number(event.target.value) });
          document.getElementById(`home-audio-${key}-val`).textContent = `${next[stateKey]}%`;
        });
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
    }

    function syncHomeConfigForm() {
      return panelApi?.syncHomeConfigForm?.();
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
      return panelApi?.populateHomeCardSelects?.();
    }

    function populateHomeBackgroundSelect() {
      return panelApi?.populateHomeBackgroundSelect?.();
    }

    function renderHomeConfigStage() {
      return stageApi?.renderHomeConfigStage?.();
    }

    function renderHomeConfigStageChar(index) {
      return stageApi?.renderHomeConfigStageChar?.(index);
    }

    function beginHomeConfigDrag(event, index) {
      return stageApi?.beginHomeConfigDrag?.(event, index);
    }

    function updateHomeConfigDrag(event) {
      return stageApi?.updateHomeConfigDrag?.(event);
    }

    function endHomeConfigDrag(event) {
      return stageApi?.endHomeConfigDrag?.(event);
    }

    return {
      loadHomeConfig,
      saveHomeConfig,
      getAudioSettings,
      saveAudioSettings,
      applyAudioSettings,
      syncAudioSettingsForm,
      openAudioSettingsPanel,
      closeAudioSettingsPanel,
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
