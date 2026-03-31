(function () {
  function createBaseCharEditorRuntime(deps) {
    const {
      getBaseChars,
      setBaseChars,
      getEditState,
      getBaseCharsApiUrl,
      readFileAsDataUrl,
      uploadStaticImageAsset,
      makeBaseCharFallback,
      normalizeBirthday,
      saveLocal,
      postJSON,
      showToast,
      upsertItem,
      updateEditorSubmitLabels,
      renderBaseCharList,
      populateBaseCharSelects,
      renderVoiceLineFields,
      collectVoiceLineFields,
      baseCharVoiceLineDefs,
      baseCharHomeVoiceDefs,
      esc
    } = deps;

    function setup() {
      return window.BaseCharEditor?.setupBaseCharEditor?.({
        getBaseChars,
        setBaseChars,
        getEditState,
        getApi: () => ({ baseChars: getBaseCharsApiUrl() }),
        readFileAsDataUrl,
        uploadStaticImageAsset,
        makeBaseCharFallback,
        normalizeBirthday,
        saveLocal,
        postJSON,
        showToast,
        upsertItem,
        updateEditorSubmitLabels,
        renderBaseCharList,
        populateBaseCharSelects,
        renderVoiceLineFields,
        collectVoiceLineFields,
        baseCharVoiceLineDefs,
        baseCharHomeVoiceDefs,
        esc
      }) || null;
    }

    return {
      setup
    };
  }

  window.SociaBaseCharEditorRuntime = {
    create: createBaseCharEditorRuntime
  };
})();
