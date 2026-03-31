(function () {
  function createStoryEditorLifecycleRuntime(deps) {
    const {
      getStories,
      getEditState,
      updateEditorSubmitLabels,
      renderStoryBgmOptions,
      handleStoryTypeChange,
      renderStoryVariantDefaults,
      addSceneInput,
      refreshStoryFxUi
    } = deps;

    function beginStoryEdit(id) {
      const story = getStories().find(item => item.id === id);
      if (!story) return;

      getEditState().storyId = id;
      const form = document.getElementById("story-form");
      form.title.value = story.title || "";
      form.type.value = story.type || "main";
      form.entryId.value = story.entryId || "";
      form.folderId.value = story.folderId || "";
      if (form.bgm) form.bgm.value = story.bgm || "";
      renderStoryBgmOptions(story.bgmAssetId || "");
      form.sortOrder.value = String(Math.max(0, Number(story.sortOrder) || 0));

      handleStoryTypeChange();
      renderStoryVariantDefaults(story.variantAssignments || []);

      const sceneList = document.getElementById("scene-list");
      sceneList.innerHTML = "";
      if (story.scenes?.length) story.scenes.forEach(scene => addSceneInput(scene));
      else addSceneInput();

      void refreshStoryFxUi();
      updateEditorSubmitLabels();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function resetStoryForm() {
      getEditState().storyId = null;
      const form = document.getElementById("story-form");
      form.reset();
      renderStoryBgmOptions();
      form.folderId.value = "";
      form.sortOrder.value = "0";
      handleStoryTypeChange();
      renderStoryVariantDefaults();
      const sceneList = document.getElementById("scene-list");
      sceneList.innerHTML = "";
      addSceneInput();
      void refreshStoryFxUi();
      updateEditorSubmitLabels();
    }

    return {
      beginStoryEdit,
      resetStoryForm
    };
  }

  window.StoryEditorLifecycleRuntime = {
    create: createStoryEditorLifecycleRuntime
  };
})();
