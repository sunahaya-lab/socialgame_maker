(function () {
  function createStoryEditorUiRuntime(deps) {
    const {
      text,
      esc,
      getBaseChars,
      getBaseCharById,
      getFeatureAccess,
      getSystemConfig
    } = deps;

    function ensureStoryFxPackNote() {
      const list = document.getElementById("story-variant-default-list");
      if (!list || document.getElementById("story-fx-pack-note")) return;
      const note = document.createElement("p");
      note.id = "story-fx-pack-note";
      note.className = "editor-pack-note";
      note.hidden = true;
      note.textContent = text("storyFxLocalOnly", "未所持の場合、Story FX 項目はローカル保存のみです");
      list.before(note);
    }

    async function refreshStoryFxUi() {
      if (typeof getFeatureAccess !== "function") return;
      const access = await getFeatureAccess();
      const hasStoryFx = Boolean(access?.storyFx);
      const note = document.getElementById("story-fx-pack-note");
      if (note) note.hidden = hasStoryFx;
      document.querySelectorAll("[name='story-default-variant']").forEach(select => {
        select.disabled = false;
      });
      document.querySelectorAll("[name='scene-bgm-asset-id']").forEach(select => {
        select.disabled = false;
      });
    }

    function renderStoryVariantDefaults(assignments = []) {
      const list = document.getElementById("story-variant-default-list");
      if (!list) return;
      list.innerHTML = "";
      ensureStoryFxPackNote();

      const candidates = getBaseChars().filter(baseChar => baseChar.variants?.length);
      if (candidates.length === 0) {
        list.innerHTML = `<p class="editor-record-empty">${esc(text("emptyVariantCharacters", "イベント差分立ち絵を持つベースキャラがありません"))}</p>`;
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
            <option value="">${esc(text("noSelection", "指定しない"))}</option>
            ${baseChar.variants.map(variant => `<option value="${esc(variant.name)}"${assignmentMap.get(baseChar.id) === variant.name ? " selected" : ""}>${esc(variant.name)}</option>`).join("")}
          </select>
        `;
        list.appendChild(item);
      });
      void refreshStoryFxUi();
    }

    function handleStoryTypeChange() {
      const type = document.querySelector("#story-form select[name='type']").value;
      const wrap = document.getElementById("story-character-select-wrap");
      if (wrap) wrap.hidden = type !== "character";
    }

    function renderStoryBgmOptions(selectedValue = "") {
      const select = document.getElementById("story-bgm-select");
      if (!select) return;
      const musicAssets = Array.isArray(getSystemConfig?.()?.musicAssets) ? getSystemConfig().musicAssets : [];
      select.innerHTML = `<option value="">${text("noBgm", "なし")}</option>` + musicAssets.map(asset =>
        `<option value="${esc(asset.id)}">${esc(asset.name)}</option>`
      ).join("");
      select.value = selectedValue || "";
    }

    function updateSceneCharacterOptions(sceneItem) {
      const charId = sceneItem.querySelector("[name='scene-character-id']").value;
      const variantSelect = sceneItem.querySelector("[name='scene-variant']");
      const expressionSelect = sceneItem.querySelector("[name='scene-expression']");
      const baseChar = charId && charId !== "__player__" ? getBaseCharById(charId) : null;

      variantSelect.innerHTML = `<option value="">${text("noSelection", "指定しない")}</option>`;
      expressionSelect.innerHTML = `<option value="">${text("noSelection", "指定しない")}</option>`;

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
      ensureStoryFxPackNote,
      refreshStoryFxUi,
      renderStoryVariantDefaults,
      handleStoryTypeChange,
      renderStoryBgmOptions,
      updateSceneCharacterOptions
    };
  }

  window.StoryEditorUiRuntime = {
    create: createStoryEditorUiRuntime
  };
})();
