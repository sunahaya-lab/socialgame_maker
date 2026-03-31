(function () {
  function createEditorFormSetupRuntime(deps = {}) {
    function setupForms() {
      document.getElementById("gacha-form")?.addEventListener("submit", deps.handleGachaSubmit);
      document.querySelector("#gacha-form select[name='gachaType']")?.addEventListener("change", deps.updateGachaFormMode);

      deps.getBaseCharEditor?.()?.renderBaseCharVoiceLineFields?.();
      deps.getBaseCharEditor?.()?.renderBaseCharHomeVoiceLineFields?.();
      deps.getEntryEditor?.()?.renderCardVoiceLineFields?.();
      deps.getEntryEditor?.()?.renderCardHomeVoiceLineFields?.();
      deps.getStoryEditor?.()?.renderStoryVariantDefaults?.();
      deps.getSystemEditor?.()?.renderSystemForm?.();
      const sceneList = document.getElementById("scene-list");
      if (sceneList) sceneList.innerHTML = "";
      deps.getStoryEditor?.()?.addSceneInput?.();

      deps.setupShareBindings?.();
    }

    return {
      setupForms
    };
  }

  window.SociaEditorFormSetupRuntime = {
    create: createEditorFormSetupRuntime
  };
})();
