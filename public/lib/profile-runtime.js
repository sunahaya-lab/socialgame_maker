(function () {
  function createProfileRuntime(deps) {
    const {
      getPlayerState,
      setPlayerState,
      saveLocal,
      getSystemConfig,
      getProjects,
      getAuthenticatedUserId,
      getCurrentPlayerId,
      getPartyFormation,
      getCharacters,
      getBaseChars,
      syncProfileUi,
      renderHome,
      showToast,
      syncProfileTitles: syncProfileTitlesImpl
    } = deps;

    function persistProfileMeta(updater) {
      const playerState = getPlayerState?.();
      if (!playerState || !playerState.profile || typeof updater !== "function") return;
      const nextProfile = updater(playerState.profile);
      if (!nextProfile || typeof nextProfile !== "object") return;
      const nextPlayerState = {
        ...playerState,
        profile: nextProfile
      };
      setPlayerState?.(nextPlayerState);
      saveLocal?.("socia-player-state", nextPlayerState);
    }

    function syncTitles(options = {}) {
      const playerState = getPlayerState?.();
      if (!playerState?.profile) return [];

      const result = syncProfileTitlesImpl?.(playerState.profile, {
        titleMasters: getSystemConfig?.()?.titleMasters || [],
        projects: getProjects?.() || [],
        currentUserId: getAuthenticatedUserId?.() || getCurrentPlayerId?.(),
        formation: getPartyFormation?.(),
        characters: getCharacters?.() || [],
        baseChars: getBaseChars?.() || []
      });
      if (!result?.changed) return [];

      persistProfileMeta(() => result.profile);
      syncProfileUi?.();
      if (options.render !== false) renderHome?.("refresh");

      if (options.showToast !== false && result.addedTitles?.length) {
        const first = result.addedTitles[0];
        const extra = result.addedTitles.length > 1 ? ` ほか${result.addedTitles.length - 1}件` : "";
        showToast?.(`称号を獲得しました: ${first.label}${extra}`);
      }
      return result.addedTitles || [];
    }

    return {
      persistProfileMeta,
      syncTitles
    };
  }

  window.ProfileRuntimeLib = {
    create: createProfileRuntime
  };
})();
