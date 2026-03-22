(function () {
  function setupStoryEditor(deps) {
    const api = createStoryEditor(deps);

    document.getElementById("story-form").addEventListener("submit", api.handleStorySubmit);
    document.getElementById("add-scene-btn").addEventListener("click", () => api.addSceneInput());
    document.querySelector("#story-form select[name='type']").addEventListener("change", api.handleStoryTypeChange);

    return api;
  }

  function createStoryEditor(deps) {
    const {
      getStories,
      setStories,
      getBaseChars,
      getCharacters,
      getEditState,
      getApi,
      readFileAsDataUrl,
      saveLocal,
      postJSON,
      showToast,
      upsertItem,
      updateEditorSubmitLabels,
      renderHome,
      renderEditorStoryList,
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
        showToast("シーンを1つ以上追加してください。");
        return;
      }

      const story = {
        id: getEditState().storyId || crypto.randomUUID(),
        title: form.title.value.trim(),
        type: form.type.value,
        entryId: form.entryId.value || null,
        bgm: form.bgm.value.trim(),
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
        showToast("ストーリーの保存に失敗しました。ローカルには保持されています。");
      }

      resetStoryForm();
      renderHome();
      renderEditorStoryList();
      showToast(`${story.title}を${existing ? "更新" : "登録"}しました。`);
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

    function renderStoryVariantDefaults(assignments = []) {
      const list = document.getElementById("story-variant-default-list");
      if (!list) return;
      list.innerHTML = "";

      const candidates = getBaseChars().filter(baseChar => baseChar.variants?.length);
      if (candidates.length === 0) {
        list.innerHTML = '<p class="editor-record-empty">イベント差分立ち絵を持つベースキャラがありません。</p>';
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
            <option value="">指定しない</option>
            ${baseChar.variants.map(variant => `<option value="${esc(variant.name)}"${assignmentMap.get(baseChar.id) === variant.name ? " selected" : ""}>${esc(variant.name)}</option>`).join("")}
          </select>
        `;
        list.appendChild(item);
      });
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
          キャラ
          <select name="scene-character-id">
            <option value="">キャラなし</option>
            ${baseCharOptions}
          </select>
        </label>
        <label>
          イベント差分
          <select name="scene-variant">
            <option value="">指定しない</option>
            ${variantOptions}
          </select>
        </label>
        <label>
          表情差分
          <select name="scene-expression">
            <option value="">指定しない</option>
            ${expressionOptions}
          </select>
        </label>
        <label>
          セリフ
          <textarea name="scene-text" maxlength="300" rows="2" placeholder="セリフを入力">${esc(scene?.text || "")}</textarea>
        </label>
        <div class="scene-extras" ${scene?.bgm || scene?.background ? "" : "hidden"}>
          <label>
            BGM URL
            <input name="scene-bgm" type="url" placeholder="https://..." value="${esc(scene?.bgm || "")}">
          </label>
          <label class="upload-field">
            背景画像
            <input name="scene-background" type="file" accept="image/*">
          </label>
          ${scene?.background ? '<p class="scene-bg-set">背景画像を設定済み</p>' : ""}
        </div>
        <div class="scene-bottom-actions">
          <button type="button" class="scene-extras-toggle">${scene?.bgm || scene?.background ? "追加設定を閉じる" : "+ 追加設定"}</button>
          <button type="button" class="scene-remove">削除</button>
        </div>
      `;

      item.querySelector(".scene-remove").addEventListener("click", () => item.remove());
      item.querySelector(".scene-extras-toggle").addEventListener("click", () => {
        const extras = item.querySelector(".scene-extras");
        const btn = item.querySelector(".scene-extras-toggle");
        extras.hidden = !extras.hidden;
        btn.textContent = extras.hidden ? "+ 追加設定" : "追加設定を閉じる";
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
        label.textContent = "背景画像を設定済み";
      });

      list.appendChild(item);
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
      form.bgm.value = story.bgm || "";

      handleStoryTypeChange();
      renderStoryVariantDefaults(story.variantAssignments || []);

      const sceneList = document.getElementById("scene-list");
      sceneList.innerHTML = "";
      if (story.scenes?.length) story.scenes.forEach(scene => addSceneInput(scene));
      else addSceneInput();

      updateEditorSubmitLabels();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function resetStoryForm() {
      getEditState().storyId = null;
      const form = document.getElementById("story-form");
      form.reset();
      handleStoryTypeChange();
      renderStoryVariantDefaults();
      const sceneList = document.getElementById("scene-list");
      sceneList.innerHTML = "";
      addSceneInput();
      updateEditorSubmitLabels();
    }

    function updateSceneCharacterOptions(sceneItem) {
      const charId = sceneItem.querySelector("[name='scene-character-id']").value;
      const variantSelect = sceneItem.querySelector("[name='scene-variant']");
      const expressionSelect = sceneItem.querySelector("[name='scene-expression']");
      const baseChar = charId ? getBaseCharById(charId) : null;

      variantSelect.innerHTML = '<option value="">指定しない</option>';
      expressionSelect.innerHTML = '<option value="">指定しない</option>';

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
      updateSceneCharacterOptions
    };
  }

  window.StoryEditor = {
    setupStoryEditor,
    createStoryEditor
  };
})();
