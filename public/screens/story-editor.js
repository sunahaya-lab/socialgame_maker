(function () {
  function setupStoryEditor(deps) {
    const api = createStoryEditor(deps);

    document.getElementById("story-form").addEventListener("submit", api.handleStorySubmit);
    document.getElementById("add-scene-btn").addEventListener("click", () => api.addSceneInput());
    document.querySelector("#story-form select[name='type']").addEventListener("change", api.handleStoryTypeChange);
    document.getElementById("create-story-folder-btn")?.addEventListener("click", () => api.handleCreateStoryFolder());

    return api;
  }

  function createStoryEditor(deps) {
    const {
      getStories,
      setStories,
      getBaseChars,
      getCharacters,
      getStoryFolders,
      getEditState,
      getApi,
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

    async function handleStorySubmit(e) {
      e.preventDefault();
      const form = e.target;
      const stories = getStories();
      const existing = getEditState().storyId ? stories.find(item => item.id === getEditState().storyId) : null;
      const scenes = collectStoryScenes();

      if (scenes.length === 0) {
        showToast("ã‚·ãƒ¼ãƒ³ã‚’1ã¤ä»¥ä¸Šè¿½åŠ ã—ã¦ãã ã•ã„ã€‚");
        return;
      }

      const story = {
        id: getEditState().storyId || crypto.randomUUID(),
        title: form.title.value.trim(),
        type: form.type.value,
        entryId: form.entryId.value || null,
        folderId: form.folderId.value || null,
        bgm: form.bgm.value.trim(),
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
          "ã‚¹ãƒˆãƒ¼ãƒªãƒ¼ã®ä¿å­˜ã«å¤±æ•—ã—ã¾ã—ãŸã€‚ãƒ­ãƒ¼ã‚«ãƒ«ã«ã¯ä¿æŒã•ã‚Œã¦ã„ã¾ã™ã€‚"
        ));
      }

      resetStoryForm();
      renderHome();
      renderEditorStoryList();
      showToast(`${story.title}ã‚’${existing ? "æ›´æ–°" : "ç™»éŒ²"}ã—ã¾ã—ãŸã€‚`);
    }

    function collectStoryScenes() {
      const scenes = [];
      document.querySelectorAll(".scene-item").forEach(item => {
        const charId = item.querySelector("[name='scene-character-id']").value;
        const text = item.querySelector("[name='scene-text']").value.trim();
        if (!text) return;
        const baseChar = charId ? getBaseCharById(charId) : null;

        scenes.push({
          characterId: charId || null,
          character: baseChar ? baseChar.name : null,
          variantName: item.querySelector("[name='scene-variant']")?.value || null,
          expressionName: item.querySelector("[name='scene-expression']")?.value || null,
          text,
          bgm: item.querySelector("[name='scene-bgm']")?.value.trim() || null,
          background: item.dataset.background || null
        });
      });
      return scenes;
    }

    function collectStoryVariantAssignments() {
      return Array.from(document.querySelectorAll(".story-variant-default-item")).map(item => ({
        characterId: item.dataset.characterId,
        variantName: item.querySelector("[name='story-default-variant']").value
      })).filter(item => item.characterId && item.variantName);
    }

    function getStoryBillingErrorMessage(error, fallback) {
      const code = String(error?.data?.code || "");
      const requiredPack = String(error?.data?.requiredPack || "").trim();
      if (code !== "billing_feature_required" || !requiredPack) return fallback;
      if (requiredPack === "story_fx") {
        return "このストーリー演出を保存するには Story FX Pack が必要です。ローカルには保持されています。";
      }
      return `${requiredPack} が必要なため保存できませんでした。ローカルには保持されています。`;
    }

    function renderStoryVariantDefaults(assignments = []) {
      const list = document.getElementById("story-variant-default-list");
      if (!list) return;
      list.innerHTML = "";
      ensureStoryFxPackNote();

      const candidates = getBaseChars().filter(baseChar => baseChar.variants?.length);
      if (candidates.length === 0) {
        list.innerHTML = '<p class="editor-record-empty">ã‚¤ãƒ™ãƒ³ãƒˆå·®åˆ†ç«‹ã¡çµµã‚’æŒã¤ãƒ™ãƒ¼ã‚¹ã‚­ãƒ£ãƒ©ãŒã‚ã‚Šã¾ã›ã‚“</p>';
        void refreshStoryFxUi();
        return;
      }

      const assignmentMap = new Map(assignments.map(item => [item.characterId, item.variantName]));
      candidates.forEach(baseChar => {
        const item = document.createElement("div");
        item.className = "story-variant-default-item";
        item.dataset.characterId = baseChar.id;
        item.innerHTML = `
          <span class="story-variant-default-name">${esc(baseChar.name)}</span>
          <select name="story-default-variant">
            <option value="">æŒ‡å®šã—ãªã„</option>
            ${baseChar.variants.map(variant => `<option value="${esc(variant.name)}"${assignmentMap.get(baseChar.id) === variant.name ? " selected" : ""}>${esc(variant.name)}</option>`).join("")}
          </select>
        `;
        list.appendChild(item);
      });
      void refreshStoryFxUi();
    }

    function addSceneInput(scene = null) {
      const list = document.getElementById("scene-list");
      const item = document.createElement("div");
      item.className = "scene-item";
      if (scene?.background) item.dataset.background = scene.background;

      const selectedChar = scene?.characterId ? getBaseCharById(scene.characterId) : null;
      const baseCharOptions = getBaseChars().map(baseChar =>
        `<option value="${esc(baseChar.id)}"${scene?.characterId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`
      ).join("");
      const variantOptions = (selectedChar?.variants || []).map(variant =>
        `<option value="${esc(variant.name)}"${scene?.variantName === variant.name ? " selected" : ""}>${esc(variant.name)}</option>`
      ).join("");
      const expressionOptions = (selectedChar?.expressions || []).map(expression =>
        `<option value="${esc(expression.name)}"${scene?.expressionName === expression.name ? " selected" : ""}>${esc(expression.name)}</option>`
      ).join("");

      item.innerHTML = `
        <label>
          ã‚­ãƒ£ãƒ©
          <select name="scene-character-id">
            <option value="">ã‚­ãƒ£ãƒ©ãªã—</option>
            ${baseCharOptions}
          </select>
        </label>
        <label>
          ã‚¤ãƒ™ãƒ³ãƒˆå·®åˆ†
          <select name="scene-variant">
            <option value="">æŒ‡å®šã—ãªã„</option>
            ${variantOptions}
          </select>
        </label>
        <label>
          è¡¨æƒ…å·®åˆ†
          <select name="scene-expression">
            <option value="">æŒ‡å®šã—ãªã„</option>
            ${expressionOptions}
          </select>
        </label>
        <label>
          ã‚»ãƒªãƒ•
          <textarea name="scene-text" maxlength="300" rows="2" placeholder="ã‚»ãƒªãƒ•ã‚’å…¥åŠ›">${esc(scene?.text || "")}</textarea>
        </label>
        <div class="scene-extras" ${scene?.bgm || scene?.background ? "" : "hidden"}>
          <label>
            BGM URL
            <input name="scene-bgm" type="url" placeholder="https://..." value="${esc(scene?.bgm || "")}">
          </label>
          <label class="upload-field">
            èƒŒæ™¯ç”»åƒ
            <input name="scene-background" type="file" accept="image/*">
          </label>
          ${scene?.background ? '<p class="scene-bg-set">èƒŒæ™¯ç”»åƒã‚’è¨­å®šæ¸ˆã¿</p>' : ""}
        </div>
        <div class="scene-bottom-actions">
          <button type="button" class="scene-extras-toggle">${scene?.bgm || scene?.background ? "è¿½åŠ è¨­å®šã‚’é–‰ã˜ã‚‹" : "+ è¿½åŠ è¨­å®š"}</button>
          <button type="button" class="scene-remove">å‰Šé™¤</button>
        </div>
      `;

      item.querySelector(".scene-remove").addEventListener("click", () => item.remove());
      item.querySelector(".scene-extras-toggle").addEventListener("click", () => {
        const extras = item.querySelector(".scene-extras");
        const btn = item.querySelector(".scene-extras-toggle");
        extras.hidden = !extras.hidden;
        btn.textContent = extras.hidden ? "+ è¿½åŠ è¨­å®š" : "è¿½åŠ è¨­å®šã‚’é–‰ã˜ã‚‹";
      });
      item.querySelector("[name='scene-character-id']").addEventListener("change", () => updateSceneCharacterOptions(item));
      item.querySelector("[name='scene-background']").addEventListener("change", async e => {
        const file = e.target.files[0];
        if (!file) return;
        item.dataset.background = await readFileAsDataUrl(file);
        let label = item.querySelector(".scene-bg-set");
        if (!label) {
          label = document.createElement("p");
          label.className = "scene-bg-set";
          e.target.closest("label").after(label);
        }
        label.textContent = "èƒŒæ™¯ç”»åƒã‚’è¨­å®šæ¸ˆã¿";
      });

      list.appendChild(item);
      void refreshStoryFxUi();
    }

    function ensureStoryFxPackNote() {
      const list = document.getElementById("story-variant-default-list");
      if (!list || document.getElementById("story-fx-pack-note")) return;
      const note = document.createElement("p");
      note.id = "story-fx-pack-note";
      note.className = "editor-pack-note";
      note.hidden = true;
      note.textContent = "Story FX Pack がない場合、デフォルト差分とシーン別 BGM は保存できません。";
      list.before(note);
    }

    function handleStoryTypeChange() {
      const type = document.querySelector("#story-form select[name='type']").value;
      const wrap = document.getElementById("story-character-select-wrap");
      if (wrap) wrap.hidden = type !== "character";
    }

    function beginStoryEdit(id) {
      const story = getStories().find(item => item.id === id);
      if (!story) return;

      getEditState().storyId = id;
      const form = document.getElementById("story-form");
      form.title.value = story.title || "";
      form.type.value = story.type || "main";
      form.entryId.value = story.entryId || "";
      form.folderId.value = story.folderId || "";
      form.bgm.value = story.bgm || "";
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

    async function refreshStoryFxUi() {
      if (typeof getFeatureAccess !== "function") return;
      const access = await getFeatureAccess();
      const hasStoryFx = Boolean(access?.storyFx);
      const note = document.getElementById("story-fx-pack-note");
      if (note) note.hidden = hasStoryFx;
      document.querySelectorAll("[name='story-default-variant']").forEach(select => {
        select.disabled = !hasStoryFx;
      });
      document.querySelectorAll("[name='scene-bgm']").forEach(input => {
        input.disabled = !hasStoryFx;
      });
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
        showToast("ã‚¹ãƒˆãƒ¼ãƒªãƒ¼é †ã®ä¿å­˜ã«å¤±æ•—ã—ã¾ã—ãŸã€‚ãƒ­ãƒ¼ã‚«ãƒ«ã«ã¯ä¿æŒã•ã‚Œã¦ã„ã¾ã™ã€‚");
      }
    }

    async function handleCreateStoryFolder() {
      const folder = await createContentFolder("story");
      if (!folder) return;
      const select = document.querySelector("#story-form select[name='folderId']");
      if (select) select.value = folder.id;
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

    async function persistStories(list) {
      setStories(list);
      saveLocal("socia-stories", list);
      renderEditorStoryList();
      renderHome();
      try {
        await Promise.all(list.map(story => postJSON(getApi().stories, story)));
      } catch (error) {
        console.error("Failed to save stories:", error);
        showToast(getStoryBillingErrorMessage(error, "ã‚¹ãƒˆãƒ¼ãƒªãƒ¼ä¿å­˜ã«å¤±æ•—ã—ã¾ã—ãŸã€‚ãƒ­ãƒ¼ã‚«ãƒ«ã«ã¯ä¿æŒã•ã‚Œã¦ã„ã¾ã™ã€‚"));
      }
    }

    function updateSceneCharacterOptions(sceneItem) {
      const charId = sceneItem.querySelector("[name='scene-character-id']").value;
      const variantSelect = sceneItem.querySelector("[name='scene-variant']");
      const expressionSelect = sceneItem.querySelector("[name='scene-expression']");
      const baseChar = charId ? getBaseCharById(charId) : null;

      variantSelect.innerHTML = '<option value="">æŒ‡å®šã—ãªã„</option>';
      expressionSelect.innerHTML = '<option value="">æŒ‡å®šã—ãªã„</option>';

      (baseChar?.variants || []).forEach(variant => {
        const option = document.createElement("option");
        option.value = variant.name;
        option.textContent = variant.name;
        variantSelect.appendChild(option);
      });

      (baseChar?.expressions || []).forEach(expression => {
        const option = document.createElement("option");
        option.value = expression.name;
        option.textContent = expression.name;
        expressionSelect.appendChild(option);
      });
    }

    return {
      handleStorySubmit,
      collectStoryScenes,
      collectStoryVariantAssignments,
      renderStoryVariantDefaults,
      addSceneInput,
      handleStoryTypeChange,
      beginStoryEdit,
      resetStoryForm,
      refreshStoryFxUi,
      handleCreateStoryFolder,
      moveStoryOrder,
      assignStoryFolder,
      reorderStoriesInFolder,
      updateSceneCharacterOptions
    };
  }

  window.StoryEditor = {
    setupStoryEditor,
    createStoryEditor
  };
})();
