(function () {
  function createEntryEditorRuntime(deps) {
    const {
      getCharacters,
      setCharacters,
      getBaseChars,
      getCardFolders,
      getEditState,
      getCharactersApiUrl,
      getSystemApi,
      readFileAsDataUrl,
      generateCharacterCropAssets,
      normalizeCharacterCropImages,
      normalizeCharacterCropPresets,
      normalizeCharacterSdImages,
      normalizeCharacterBattleKit,
      makeFallbackImage,
      normalizeRarityValue,
      saveLocal,
      postJSON,
      showToast,
      getFeatureAccess,
      upsertItem,
      updateEditorSubmitLabels,
      renderHome,
      renderEditorCharacterList,
      renderGachaPoolChars,
      getEditingFeaturedIds,
      createContentFolder,
      uploadStaticImageAsset,
      renderVoiceLineFields,
      collectVoiceLineFields,
      baseCharVoiceLineDefs,
      baseCharHomeVoiceDefs,
      esc
    } = deps;

    function setup() {
      return window.EntryEditor?.setupEntryEditor?.({
        getCharacters,
        setCharacters,
        getBaseChars,
        getCardFolders,
        getEditState,
        getApi: () => ({ characters: getCharactersApiUrl() }),
        getSystemApi,
        readFileAsDataUrl,
        generateCharacterCropAssets,
        normalizeCharacterCropImages,
        normalizeCharacterCropPresets,
        normalizeCharacterSdImages,
        normalizeCharacterBattleKit,
        makeFallbackImage,
        normalizeRarityValue,
        saveLocal,
        postJSON,
        showToast,
        getFeatureAccess,
        upsertItem,
        updateEditorSubmitLabels,
        renderHome,
        renderEditorCharacterList,
        renderGachaPoolChars,
        getEditingFeaturedIds,
        createContentFolder,
        uploadStaticImageAsset,
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

  window.SociaEntryEditorRuntime = {
    create: createEntryEditorRuntime
  };
})();
