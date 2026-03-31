(function () {
  function createStoryEditorSceneRuntime(deps) {
    const {
      text,
      esc,
      getBaseChars,
      getBaseCharById,
      getSystemConfig,
      readFileAsDataUrl,
      updateSceneCharacterOptions,
      refreshStoryFxUi
    } = deps;

    const PLAYER_CHARACTER_ID = "__player__";

    function addSceneInput(scene = null) {
      const list = document.getElementById("scene-list");
      const item = document.createElement("div");
      item.className = "scene-item";
      if (scene?.background) item.dataset.background = scene.background;
      const musicAssets = Array.isArray(getSystemConfig?.()?.musicAssets) ? getSystemConfig().musicAssets : [];

      const selectedChar = scene?.characterId && scene?.characterId !== PLAYER_CHARACTER_ID
        ? getBaseCharById(scene.characterId)
        : null;
      const baseCharOptions = getBaseChars().map(baseChar =>
        `<option value="${esc(baseChar.id)}"${scene?.characterId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`
      ).join("");
      const variantOptions = (selectedChar?.variants || []).map(variant =>
        `<option value="${esc(variant.name)}"${scene?.variantName === variant.name ? " selected" : ""}>${esc(variant.name)}</option>`
      ).join("");
      const expressionOptions = (selectedChar?.expressions || []).map(expression =>
        `<option value="${esc(expression.name)}"${scene?.expressionName === expression.name ? " selected" : ""}>${esc(expression.name)}</option>`
      ).join("");
      const bgmOptions = musicAssets.map(asset =>
        `<option value="${esc(asset.id)}"${String(scene?.bgmAssetId || "").trim() === String(asset.id || "").trim() ? " selected" : ""}>${esc(asset.name)}</option>`
      ).join("");

      item.innerHTML = `
        <label>
          ${text("character", "キャラ")}
          <select name="scene-character-id">
            <option value="">${text("noCharacter", "キャラなし")}</option>
            <option value="${PLAYER_CHARACTER_ID}"${scene?.characterId === PLAYER_CHARACTER_ID ? " selected" : ""}>${text("playerCharacterLabel", "プレイヤー")}</option>
            ${baseCharOptions}
          </select>
        </label>
        <label>
          ${text("variant", "イベント差分")}
          <select name="scene-variant">
            <option value="">${text("noSelection", "指定しない")}</option>
            ${variantOptions}
          </select>
        </label>
        <label>
          ${text("expression", "表情差分")}
          <select name="scene-expression">
            <option value="">${text("noSelection", "指定しない")}</option>
            ${expressionOptions}
          </select>
        </label>
        <label>
          ${text("line", "セリフ")}
          <textarea name="scene-text" maxlength="300" rows="2" placeholder="${esc(text("linePlaceholder", "セリフを入力（{name} でプレイヤー名）"))}">${esc(scene?.text || "")}</textarea>
        </label>
        <div class="scene-extras" ${scene?.bgm || scene?.bgmAssetId || scene?.background ? "" : "hidden"}>
          <label>
            BGM
            <select name="scene-bgm-asset-id">
              <option value="">${text("noBgm", "なし")}</option>
              ${bgmOptions}
            </select>
          </label>
          <label class="upload-field">
            ${text("backgroundImage", "背景画像")}
            <input name="scene-background" type="file" accept="image/*">
          </label>
          ${scene?.background ? `<p class="scene-bg-set">${esc(text("backgroundImageSet", "背景画像を設定済み"))}</p>` : ""}
        </div>
        <div class="scene-bottom-actions">
          <button type="button" class="scene-extras-toggle">${scene?.bgm || scene?.background ? text("extrasClose", "追加設定を閉じる") : text("extrasOpen", "+ 追加設定")}</button>
          <button type="button" class="scene-remove">${text("remove", "削除")}</button>
        </div>
      `;

      item.querySelector(".scene-remove").addEventListener("click", () => item.remove());
      if (scene?.bgmAssetId && !scene?.bgm && !scene?.background) {
        item.querySelector(".scene-extras-toggle").textContent = text("extrasClose", "追加設定を閉じる");
      }
      item.querySelector(".scene-extras-toggle").addEventListener("click", () => {
        const extras = item.querySelector(".scene-extras");
        const btn = item.querySelector(".scene-extras-toggle");
        extras.hidden = !extras.hidden;
        btn.textContent = extras.hidden
          ? text("extrasOpen", "+ 追加設定")
          : text("extrasClose", "追加設定を閉じる");
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
        label.textContent = text("backgroundImageSet", "背景画像を設定済み");
      });

      list.appendChild(item);
      void refreshStoryFxUi();
    }

    return {
      addSceneInput
    };
  }

  window.StoryEditorSceneRuntime = {
    create: createStoryEditorSceneRuntime
  };
})();
