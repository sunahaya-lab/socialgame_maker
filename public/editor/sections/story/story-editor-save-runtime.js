(function () {
  function createStoryEditorSaveRuntime(deps) {
    const {
      text,
      getStories,
      setStories,
      getEditState,
      getApi,
      saveLocal,
      postJSON,
      showToast,
      upsertItem,
      renderHome,
      renderEditorStoryList,
      resetStoryForm,
      collectStoryScenes,
      collectStoryVariantAssignments
    } = deps;

    function getStoryBillingErrorMessage(error, fallback) {
      const code = String(error?.data?.code || "");
      const requiredPack = String(error?.data?.requiredPack || "").trim();
      if (code !== "billing_feature_required" || !requiredPack) return fallback;
      if (requiredPack === "story_fx") {
        return text("storyFxRequired", "このストーリー演出を共有保存するには Story FX Pack が必要です。ローカルには保持されています。");
      }
      return `${requiredPack} が必要なため共有保存できませんでした。ローカルには保持されています。`;
    }

    async function handleStorySubmit(e) {
      e.preventDefault();
      const form = e.target;
      const stories = getStories();
      const existing = getEditState().storyId ? stories.find(item => item.id === getEditState().storyId) : null;
      const scenes = collectStoryScenes();

      if (scenes.length === 0) {
        showToast(text("requireScene", "シーンを1つ以上追加してください。"));
        return;
      }

      const story = {
        id: getEditState().storyId || crypto.randomUUID(),
        title: form.title.value.trim(),
        type: form.type.value,
        entryId: form.entryId.value || null,
        folderId: form.folderId.value || null,
        bgm: form.bgm?.value?.trim?.() || "",
        bgmAssetId: String(form.bgmAssetId?.value || "").trim() || null,
        sortOrder: Math.max(0, Number(form.sortOrder.value) || 0),
        variantAssignments: collectStoryVariantAssignments(),
        scenes
      };

      upsertItem(stories, story);
      setStories(stories);
      saveLocal("socia-stories", stories);
      try {
        await postJSON(getApi().stories, story);
      } catch (error) {
        console.error("Failed to save story:", error);
        showToast(getStoryBillingErrorMessage(
          error,
          text("saveFailed", "ストーリー保存に失敗しました。ローカルには保持されています。")
        ));
      }

      resetStoryForm();
      renderHome();
      renderEditorStoryList();
      showToast(`${story.title}を${existing ? "更新" : "登録"}しました。`);
    }

    async function persistStories(list) {
      setStories(list);
      saveLocal("socia-stories", list);
      renderEditorStoryList();
      renderHome();
      try {
        await Promise.all(list.map(story => postJSON(getApi().stories, story)));
      } catch (error) {
        console.error("Failed to save stories:", error);
        showToast(getStoryBillingErrorMessage(error, text("saveFailed", "ストーリー保存に失敗しました。ローカルには保持されています。")));
      }
    }

    async function moveStoryOrder(storyId, direction) {
      const stories = getStories().slice();
      const sorted = stories
        .slice()
        .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) || a.title.localeCompare(b.title, "ja"));
      const currentIndex = sorted.findIndex(story => story.id === storyId);
      if (currentIndex < 0) return;

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return;

      const [moved] = sorted.splice(currentIndex, 1);
      sorted.splice(targetIndex, 0, moved);
      sorted.forEach((story, index) => {
        story.sortOrder = index;
      });

      setStories(sorted);
      saveLocal("socia-stories", sorted);
      renderEditorStoryList();
      renderHome();

      try {
        await Promise.all(sorted.map(story => postJSON(getApi().stories, story)));
      } catch (error) {
        console.error("Failed to reorder stories:", error);
        showToast(text("reorderSaveFailed", "ストーリー順の保存に失敗しました。ローカルには保持されています。"));
      }
    }

    async function assignStoryFolder(storyId, folderId) {
      const list = getStories().slice();
      const story = list.find(item => item.id === storyId);
      if (!story) return;
      const previousFolderId = story.folderId || "";
      story.folderId = folderId || null;
      if ((story.folderId || "") !== previousFolderId) {
        const maxSortOrder = list
          .filter(item => (item.folderId || "") === (story.folderId || "") && item.id !== story.id)
          .reduce((max, item) => Math.max(max, Number(item.sortOrder) || 0), -1);
        story.sortOrder = maxSortOrder + 1;
      }
      await persistStories(list);
    }

    async function reorderStoriesInFolder(folderId, draggedId, beforeId = null) {
      const list = getStories().slice();
      const dragged = list.find(item => item.id === draggedId);
      if (!dragged) return;

      const nextFolderId = folderId || null;
      const previousFolderId = dragged.folderId || null;
      dragged.folderId = nextFolderId;

      const folderItems = list
        .filter(item => (item.folderId || null) === nextFolderId && item.id !== dragged.id)
        .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) || a.title.localeCompare(b.title, "ja"));

      const insertIndex = beforeId ? folderItems.findIndex(item => item.id === beforeId) : folderItems.length;
      const safeIndex = insertIndex < 0 ? folderItems.length : insertIndex;
      folderItems.splice(safeIndex, 0, dragged);
      folderItems.forEach((item, index) => {
        item.sortOrder = index;
      });

      if (previousFolderId !== nextFolderId) {
        list
          .filter(item => (item.folderId || null) === previousFolderId)
          .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) || a.title.localeCompare(b.title, "ja"))
          .forEach((item, index) => {
            item.sortOrder = index;
          });
      }

      await persistStories(list);
    }

    return {
      getStoryBillingErrorMessage,
      handleStorySubmit,
      persistStories,
      moveStoryOrder,
      assignStoryFolder,
      reorderStoriesInFolder
    };
  }

  window.StoryEditorSaveRuntime = {
    create: createStoryEditorSaveRuntime
  };
})();
