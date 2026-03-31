(() => {
  function create(deps = {}) {
    let appAuthModuleApi = null;
    let profileRuntimeModuleApi = null;

    function ensureAppAuthApi() {
      if (!appAuthModuleApi) {
        appAuthModuleApi = window.AppAuthLib.create({
          apiGet: deps.apiGet,
          apiPost: deps.apiPost,
          getCurrentProjectId: deps.getCurrentProjectId,
          getPlayerState: deps.getPlayerState,
          updatePlayerProfile: deps.updatePlayerProfile,
          persistProfileMeta: deps.persistProfileMeta,
          createProfileActions: deps.createProfileActions,
          createAuthSessionRuntime: deps.createAuthSessionRuntime,
          createAuthPanelUi: deps.createAuthPanelUi,
          showToast: deps.showToast
        });
      }
      return appAuthModuleApi;
    }

    function ensureProfileRuntimeApi() {
      if (!profileRuntimeModuleApi) {
        profileRuntimeModuleApi = window.ProfileRuntimeLib.create({
          getPlayerState: deps.getPlayerState,
          setPlayerState: deps.setPlayerState,
          saveLocal: deps.saveLocal,
          getSystemConfig: deps.getSystemConfig,
          getProjects: deps.getProjects,
          getAuthenticatedUserId: deps.getAuthenticatedUserId,
          getCurrentPlayerId: deps.getCurrentPlayerId,
          getPartyFormation: deps.getPartyFormation,
          getCharacters: deps.getCharacters,
          getBaseChars: deps.getBaseChars,
          syncProfileUi: deps.syncProfileUi,
          renderHome: deps.renderHome,
          showToast: deps.showToastForProfile,
          syncProfileTitles: deps.syncProfileTitles
        });
      }
      return profileRuntimeModuleApi;
    }

    return {
      ensureAppAuthApi,
      ensureProfileRuntimeApi
    };
  }

  window.AppAuthProfileRuntimeFactoryLib = {
    create
  };
})();
