(function () {
  function createStoryEditorRuntime(deps) {
    const {
      getStories,
      setStories,
      getBaseChars,
      getCharacters,
      getSystemConfig,
      getStoryFolders,
      getEditState,
      getStoriesApiUrl,
      readFileAsDataUrl,
      saveLocal,
      postJSON,
      showToast,
      getFeatureAccess,
      upsertItem,
      updateEditorSubmitLabels,
      renderHome,
      renderEditorStoryList,
      createContentFolder,
      getBaseCharById,
      esc
    } = deps;

    function setup() {
      return window.StoryEditor?.setupStoryEditor?.({
        getStories,
        setStories,
        getBaseChars,
        getCharacters,
        getSystemConfig,
        getStoryFolders,
        getEditState,
        getApi: () => ({ stories: getStoriesApiUrl() }),
        readFileAsDataUrl,
        saveLocal,
        postJSON,
        showToast,
        getFeatureAccess,
        upsertItem,
        updateEditorSubmitLabels,
        renderHome,
        renderEditorStoryList,
        createContentFolder,
        getBaseCharById,
        esc
      }) || null;
    }

    return {
      setup
    };
  }

  window.SociaStoryEditorRuntime = {
    create: createStoryEditorRuntime
  };
})();
