(() => {
  function create(deps = {}) {
    let editorRuntimeModuleApi = null;
    let layoutBridgeModuleApi = null;

    function ensureEditorRuntimeApi() {
      if (!editorRuntimeModuleApi) {
        editorRuntimeModuleApi = window.EditorRuntimeLib.create({
          getCurrentScreen: deps.getCurrentScreen,
          setCurrentScreen: deps.setCurrentScreen,
          getEditorScreen: deps.getEditorScreen,
          closeHomeEditMode: deps.closeHomeEditMode,
          renderHome: deps.renderHome,
          showToast: deps.showToast,
          canOpenEditorSurface: deps.canOpenEditorSurface,
          getEditorAccessDeniedMessage: deps.getEditorAccessDeniedMessage
        });
      }
      return editorRuntimeModuleApi;
    }

    function ensureLayoutBridgeApi() {
      if (!layoutBridgeModuleApi) {
        layoutBridgeModuleApi = window.LayoutBridgeLib.create({
          getCharacters: deps.getCharacters,
          getCurrentLayoutOwnerId: deps.getCurrentLayoutOwnerId,
          getHomeAssetFolders: deps.getHomeAssetFolders,
          resolveHomeAssetFolderAssets: deps.resolveHomeAssetFolderAssets,
          resolveSharedAssetFolderAssets: deps.resolveSharedAssetFolderAssets,
          upsertHomeLayoutAssetInConfig: deps.upsertHomeLayoutAssetInConfig,
          getHomeLayoutPreset: deps.getHomeLayoutPreset,
          buildLayoutRuntimeState: deps.buildLayoutRuntimeState,
          buildLayoutAssetMap: deps.buildLayoutAssetMap,
          navigateTo: deps.navigateTo,
          openEditorSurface: deps.openEditorSurface,
          openHomeConfigPanel: deps.openHomeConfigPanel,
          getCharacterImageForUsage: deps.getCharacterImageForUsage,
          makeFallbackImage: deps.makeFallbackImage
        });
      }
      return layoutBridgeModuleApi;
    }

    return {
      ensureEditorRuntimeApi,
      ensureLayoutBridgeApi
    };
  }

  window.AppLayoutEditorRuntimeFactoryLib = {
    create
  };
})();
