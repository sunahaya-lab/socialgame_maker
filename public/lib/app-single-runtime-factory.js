(() => {
  function create(deps = {}) {
    let titleScreenApi = null;
    let systemSaveRuntimeApi = null;

    function ensureTitleScreenApi() {
      if (!titleScreenApi) {
        titleScreenApi = window.TitleScreenLib.create({
          getSystemConfig: deps.getSystemConfig,
          getProjectName: deps.getProjectName,
          navigateToHome: deps.navigateToHome
        });
      }
      return titleScreenApi;
    }

    function ensureSystemSaveRuntimeApi() {
      if (!systemSaveRuntimeApi) {
        systemSaveRuntimeApi = window.SystemSaveRuntimeLib?.create?.({
          saveLocal: deps.saveLocal,
          postJSON: deps.postJSON,
          getSystemApiUrl: deps.getSystemApiUrl,
          getCurrentPlayerId: deps.getCurrentPlayerId,
          showToast: deps.showToast
        }) || null;
      }
      return systemSaveRuntimeApi;
    }

    return {
      ensureTitleScreenApi,
      ensureSystemSaveRuntimeApi
    };
  }

  window.AppSingleRuntimeFactoryLib = {
    create
  };
})();
