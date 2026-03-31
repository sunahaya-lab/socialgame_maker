(function () {
  function createHomeConfigSaveRuntime(deps) {
    const {
      getPlayerState,
      setPlayerState,
      getCurrentProjectId,
      normalizeHomePreferences,
      saveLocal,
      postJSON,
      getPlayerApiUrl,
      API,
      showToast
    } = deps;

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

    return {
      saveHomeConfig
    };
  }

  window.HomeConfigSaveRuntime = {
    create: createHomeConfigSaveRuntime
  };
})();
