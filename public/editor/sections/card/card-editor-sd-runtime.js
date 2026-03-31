(function () {
  function createCardEditorSdRuntime(deps) {
    const {
      text,
      esc,
      readFileAsDataUrl,
      normalizeCharacterSdImages,
      refreshBattlePackUi,
    } = deps;

    function ensureCharacterSdEditor() {
      if (document.getElementById("character-sd-editor")) return;
      const anchor = document.getElementById("character-crop-editor") || document.getElementById("char-preview");
      if (!anchor) return;
      const section = document.createElement("section");
      section.id = "character-sd-editor";
      section.className = "character-sd-editor";
      section.innerHTML = `
        <details class="editor-collapsible character-collapsible">
          <summary>バトルSD</summary>
          <div class="character-sd-body">
            <div class="character-sd-header">
              <div>
                <p class="character-sd-help">${esc(text("sdHelp", "戦闘用の SD 画像を任意で登録できます。Idle が基本姿勢で、Attack と Damaged は登録されている場合に上書きします。"))}</p>
              </div>
            </div>
            <div class="character-sd-grid">
              ${[
                ["idle", "待機"],
                ["attack", "攻撃"],
                ["damaged", "被ダメージ"]
              ].map(([key, label]) => `
                <label class="character-sd-card">
                  <span class="character-sd-label">${label}</span>
                  <span class="character-sd-preview"><img id="character-sd-preview-${key}" alt="${label}"></span>
                  <input type="file" accept="image/*" data-sd-slot="${key}">
                </label>
              `).join("")}
            </div>
          </div>
        </details>
      `;
      anchor.after(section);
      section.querySelector(".character-battle-header > div")?.insertAdjacentHTML(
        "beforeend",
        `<p class="editor-pack-note" id="character-battle-pack-note" hidden>${esc(text("battlePackNote", "Battle Pack が必要です。未所持の場合、この項目はローカル保存のみです。"))}</p>`
      );
      void refreshBattlePackUi?.();

      section.querySelectorAll("[data-sd-slot]").forEach(input => {
        input.addEventListener("change", event => handleCharacterSdImageChange(event));
      });
    }

    async function handleCharacterSdImageChange(event) {
      const input = event.target;
      const slot = input.dataset.sdSlot;
      const file = input.files?.[0];
      const preview = document.getElementById(`character-sd-preview-${slot}`);
      if (!preview) return;
      if (!file) {
        preview.removeAttribute("src");
        return;
      }
      preview.src = await readFileAsDataUrl(file);
    }

    async function collectCharacterSdImages(existingSdImages) {
      const next = normalizeCharacterSdImages(existingSdImages);
      const inputs = document.querySelectorAll("#character-sd-editor [data-sd-slot]");
      for (const input of inputs) {
        const slot = input.dataset.sdSlot;
        const file = input.files?.[0];
        if (file) {
          next[slot] = await readFileAsDataUrl(file);
        }
      }
      return next;
    }

    function populateCharacterSdEditor(sdImages) {
      ensureCharacterSdEditor();
      const normalized = normalizeCharacterSdImages(sdImages);
      Object.entries(normalized).forEach(([key, value]) => {
        const preview = document.getElementById(`character-sd-preview-${key}`);
        if (!preview) return;
        if (value) preview.src = value;
        else preview.removeAttribute("src");
      });
    }

    function resetCharacterSdEditor() {
      document.querySelectorAll("#character-sd-editor [data-sd-slot]").forEach(input => {
        input.value = "";
      });
      populateCharacterSdEditor(null);
    }

    return {
      ensureCharacterSdEditor,
      handleCharacterSdImageChange,
      collectCharacterSdImages,
      populateCharacterSdEditor,
      resetCharacterSdEditor,
    };
  }

  window.CardEditorSdRuntime = {
    create: createCardEditorSdRuntime
  };
})();
