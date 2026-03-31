(function () {
  function createHomeConfigAudioRuntime(deps) {
    const {
      getPlayerState,
      setPlayerState,
      saveLocal,
      clamp
    } = deps;

    function normalizeAudioSettings(settings) {
      const source = settings && typeof settings === "object" ? settings : {};
      return {
        bgmVolume: Math.round(clamp(Number(source.bgmVolume), 0, 100) || 0),
        sfxVolume: Math.round(clamp(Number(source.sfxVolume), 0, 100) || 0),
        voiceVolume: Math.round(clamp(Number(source.voiceVolume), 0, 100) || 0)
      };
    }

    function getAudioSettings() {
      return normalizeAudioSettings(getPlayerState()?.audioSettings);
    }

    function applyAudioSettings(settings = null) {
      const normalized = normalizeAudioSettings(settings || getAudioSettings());
      const bgmVolume = normalized.bgmVolume / 100;
      const storyAudio = document.getElementById("story-bgm");
      const homeAudio = document.getElementById("home-bgm");
      const battleAudio = document.getElementById("battle-bgm");
      if (storyAudio) storyAudio.volume = bgmVolume;
      if (homeAudio) homeAudio.volume = bgmVolume;
      if (battleAudio) battleAudio.volume = bgmVolume;
    }

    function saveAudioSettings(partialSettings = {}) {
      const playerState = getPlayerState();
      playerState.audioSettings = normalizeAudioSettings({
        ...playerState?.audioSettings,
        ...partialSettings
      });
      setPlayerState(playerState);
      saveLocal("socia-player-state", playerState);
      applyAudioSettings(playerState.audioSettings);
      return playerState.audioSettings;
    }

    function syncAudioSettingsForm() {
      const settings = getAudioSettings();
      const fields = [
        ["bgm", settings.bgmVolume],
        ["sfx", settings.sfxVolume],
        ["voice", settings.voiceVolume]
      ];

      fields.forEach(([key, value]) => {
        const input = document.getElementById(`home-audio-${key}`);
        const label = document.getElementById(`home-audio-${key}-val`);
        if (input) input.value = String(value);
        if (label) label.textContent = `${value}%`;
      });
    }

    function openAudioSettingsPanel() {
      const panel = document.getElementById("home-audio-settings-panel");
      if (!panel) return;
      syncAudioSettingsForm();
      panel.hidden = false;
    }

    function closeAudioSettingsPanel() {
      const panel = document.getElementById("home-audio-settings-panel");
      if (!panel) return;
      panel.hidden = true;
    }

    return {
      normalizeAudioSettings,
      getAudioSettings,
      saveAudioSettings,
      applyAudioSettings,
      syncAudioSettingsForm,
      openAudioSettingsPanel,
      closeAudioSettingsPanel
    };
  }

  window.HomeConfigAudioRuntime = {
    create: createHomeConfigAudioRuntime
  };
})();
