(function () {
  function setupBaseCharEditor(deps) {
    const api = createBaseCharEditor(deps);

    document.getElementById("base-char-form").addEventListener("submit", api.handleBaseCharSubmit);
    document.getElementById("add-expression-btn").addEventListener("click", () => api.addExpressionInput());
    document.getElementById("add-variant-btn").addEventListener("click", () => api.addVariantInput());
    document.getElementById("add-home-opinion-btn").addEventListener("click", () => api.addHomeOpinionInput());
    document.getElementById("add-home-conversation-btn").addEventListener("click", () => api.addHomeConversationInput());
    document.getElementById("add-home-birthday-btn").addEventListener("click", () => api.addHomeBirthdayInput());

    return api;
  }

  function createBaseCharEditor(deps) {
    const {
      getBaseChars,
      setBaseChars,
      getEditState,
      getApi,
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

    async function resolveStaticImage(file, options = {}, fallback = "") {
      if (!file) return fallback;
      if (typeof uploadStaticImageAsset === "function") {
        try {
          const uploaded = await uploadStaticImageAsset(file, options);
          if (uploaded?.src) return uploaded.src;
        } catch (error) {
          console.error("Failed to upload normalized image, falling back to data URL:", error);
          showToast("画像アップロードに失敗したため、一時的にローカル画像を使用します。");
        }
      }
      return readFileAsDataUrl(file);
    }

    async function handleBaseCharSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const baseChars = getBaseChars();
      const existing = getEditState().baseCharId ? baseChars.find(item => item.id === getEditState().baseCharId) : null;
      const portraitFile = form.portrait.files[0];
      const portrait = portraitFile
        ? await resolveStaticImage(portraitFile, {
          usageType: "portrait",
          kind: "base-character-portrait"
        }, existing?.portrait || "")
        : (existing?.portrait || "");

      const baseChar = {
        id: getEditState().baseCharId || crypto.randomUUID(),
        name: form.name.value.trim(),
        description: form.description.value.trim(),
        birthday: normalizeBirthday(form.birthday.value),
        color: form.color.value || "#a29bfe",
        portrait: portrait || makeBaseCharFallback(form.name.value.trim(), form.color.value),
        voiceLines: collectBaseCharVoiceLines(),
        homeVoices: collectBaseCharHomeVoiceLines(),
        homeOpinions: collectHomeOpinions(),
        homeConversations: collectHomeConversations(),
        homeBirthdays: collectHomeBirthdays(),
        variants: await collectVariants(),
        expressions: await collectExpressions()
      };

      upsertItem(baseChars, baseChar);
      setBaseChars(baseChars);
      saveLocal("socia-base-chars", baseChars);
      try {
        await postJSON(getApi().baseChars, baseChar);
      } catch (error) {
        console.error("Failed to save base character:", error);
        showToast("ベースキャラの保存に失敗しました。ローカルには保持されています。");
      }

      resetBaseCharForm();
      renderBaseCharList();
      populateBaseCharSelects();
      showToast(`${baseChar.name}を${existing ? "更新" : "登録"}しました。`);
    }

    function beginBaseCharEdit(id) {
      const baseChar = getBaseChars().find(item => item.id === id);
      if (!baseChar) return;

      getEditState().baseCharId = id;
      const form = document.getElementById("base-char-form");
      form.name.value = baseChar.name || "";
      form.description.value = baseChar.description || "";
      form.birthday.value = baseChar.birthday || "";
      form.color.value = baseChar.color || "#a29bfe";

      document.getElementById("base-char-preview").hidden = false;
      document.getElementById("base-char-preview-img").src = baseChar.portrait;
      document.getElementById("expression-list").innerHTML = "";
      document.getElementById("variant-list").innerHTML = "";
      document.getElementById("home-opinion-list").innerHTML = "";
      document.getElementById("home-conversation-list").innerHTML = "";
      document.getElementById("home-birthday-list").innerHTML = "";

      renderBaseCharVoiceLineFields(baseChar.voiceLines || {});
      renderBaseCharHomeVoiceLineFields(baseChar.homeVoices || {});

      (baseChar.homeOpinions || []).forEach(item => addHomeOpinionInput(item));
      (baseChar.homeConversations || []).forEach(item => addHomeConversationInput(item));
      (baseChar.homeBirthdays || []).forEach(item => addHomeBirthdayInput(item));
      (baseChar.variants || []).forEach(item => addVariantInput(item));
      (baseChar.expressions || []).forEach(item => addExpressionInput(item));

      updateEditorSubmitLabels();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function resetBaseCharForm() {
      getEditState().baseCharId = null;
      const form = document.getElementById("base-char-form");
      form.reset();
      form.color.value = "#a29bfe";
      document.getElementById("base-char-preview").hidden = true;
      document.getElementById("expression-list").innerHTML = "";
      document.getElementById("variant-list").innerHTML = "";
      document.getElementById("home-opinion-list").innerHTML = "";
      document.getElementById("home-conversation-list").innerHTML = "";
      document.getElementById("home-birthday-list").innerHTML = "";
      renderBaseCharVoiceLineFields();
      renderBaseCharHomeVoiceLineFields();
      updateEditorSubmitLabels();
    }

    function deleteBaseChar(id) {
      const next = getBaseChars().filter(item => item.id !== id);
      setBaseChars(next);
      saveLocal("socia-base-chars", next);
      if (getEditState().baseCharId === id) resetBaseCharForm();
      renderBaseCharList();
      populateBaseCharSelects();
      showToast("ベースキャラを削除しました。");
    }

    function renderBaseCharVoiceLineFields(values = {}) {
      renderVoiceLineFields("voice-line-fields", "voice", baseCharVoiceLineDefs, values);
    }

    function collectBaseCharVoiceLines() {
      return collectVoiceLineFields("voice-line-fields", "voice", baseCharVoiceLineDefs);
    }

    function renderBaseCharHomeVoiceLineFields(values = {}) {
      renderVoiceLineFields("home-voice-line-fields", "home-voice", baseCharHomeVoiceDefs, values);
    }

    function collectBaseCharHomeVoiceLines() {
      return collectVoiceLineFields("home-voice-line-fields", "home-voice", baseCharHomeVoiceDefs);
    }

    function addExpressionInput(expr = null) {
      const list = document.getElementById("expression-list");
      const item = document.createElement("div");
      item.className = "expression-item";
      item.innerHTML = `
        <input name="expr-name" type="text" maxlength="30" placeholder="表情名" value="${esc(expr?.name || "")}">
        <label class="upload-field expression-upload">
          <input name="expr-image" type="file" accept="image/*">
        </label>
        ${expr?.image ? '<span class="expr-set">&#x2713;</span>' : ""}
        <button type="button" class="expression-remove">&#x2715;</button>
      `;

      if (expr?.image) item.dataset.exprImage = expr.image;
      const fileInput = item.querySelector("[name='expr-image']");
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;
        item.dataset.exprImage = await readFileAsDataUrl(file);
        ensureCheckMark(fileInput);
      });

      item.querySelector(".expression-remove").addEventListener("click", () => item.remove());
      list.appendChild(item);
    }

    function addVariantInput(variant = null) {
      const list = document.getElementById("variant-list");
      const item = document.createElement("div");
      item.className = "expression-item";
      item.innerHTML = `
        <input name="variant-name" type="text" maxlength="30" placeholder="差分名" value="${esc(variant?.name || "")}">
        <label class="upload-field expression-upload">
          <input name="variant-image" type="file" accept="image/*">
        </label>
        ${variant?.image ? '<span class="expr-set">&#x2713;</span>' : ""}
        <button type="button" class="expression-remove">&#x2715;</button>
      `;

      if (variant?.image) item.dataset.variantImage = variant.image;
      const fileInput = item.querySelector("[name='variant-image']");
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;
        item.dataset.variantImage = await readFileAsDataUrl(file);
        ensureCheckMark(fileInput);
      });

      item.querySelector(".expression-remove").addEventListener("click", () => item.remove());
      list.appendChild(item);
    }

    function addHomeOpinionInput(item = null) {
      const list = document.getElementById("home-opinion-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="home-opinion-target">
          <option value="">相手キャラを選択</option>
          ${getBaseChars().map(baseChar => `<option value="${esc(baseChar.id)}"${item?.targetBaseCharId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`).join("")}
        </select>
        <textarea name="home-opinion-text" rows="2" maxlength="200" placeholder="そのキャラについてのセリフ">${esc(item?.text || "")}</textarea>
        <button type="button" class="expression-remove">削除</button>
      `;
      row.querySelector(".expression-remove").addEventListener("click", () => row.remove());
      list.appendChild(row);
    }

    function addHomeConversationInput(item = null) {
      const list = document.getElementById("home-conversation-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="home-conversation-target">
          <option value="">相手キャラを選択</option>
          ${getBaseChars().map(baseChar => `<option value="${esc(baseChar.id)}"${item?.targetBaseCharId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`).join("")}
        </select>
        <textarea name="home-conversation-self" rows="2" maxlength="200" placeholder="自分のセリフ">${esc(item?.selfText || "")}</textarea>
        <textarea name="home-conversation-partner" rows="2" maxlength="200" placeholder="相手のセリフ">${esc(item?.partnerText || "")}</textarea>
        <button type="button" class="expression-remove">削除</button>
      `;
      row.querySelector(".expression-remove").addEventListener("click", () => row.remove());
      list.appendChild(row);
    }

    function addHomeBirthdayInput(item = null) {
      const list = document.getElementById("home-birthday-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="home-birthday-target">
          <option value="">対象キャラを選択</option>
          ${getBaseChars().map(baseChar => `<option value="${esc(baseChar.id)}"${item?.targetBaseCharId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`).join("")}
        </select>
        <textarea name="home-birthday-text" rows="2" maxlength="200" placeholder="誕生日用のセリフ">${esc(item?.text || "")}</textarea>
        <button type="button" class="expression-remove">削除</button>
      `;
      row.querySelector(".expression-remove").addEventListener("click", () => row.remove());
      list.appendChild(row);
    }

    async function collectExpressions() {
      const items = document.querySelectorAll("#expression-list .expression-item");
      const expressions = [];
      for (const item of items) {
        const name = item.querySelector("[name='expr-name']").value.trim();
        if (!name) continue;
        const fileInput = item.querySelector("[name='expr-image']");
        let image = item.dataset.exprImage || "";
        if (fileInput.files[0]) {
          image = await resolveStaticImage(fileInput.files[0], {
            usageType: "expression",
            kind: "base-character-expression"
          }, image);
        }
        expressions.push({ name, image });
      }
      return expressions;
    }

    async function collectVariants() {
      const items = document.querySelectorAll("#variant-list .expression-item");
      const variants = [];
      for (const item of items) {
        const name = item.querySelector("[name='variant-name']").value.trim();
        if (!name) continue;
        const fileInput = item.querySelector("[name='variant-image']");
        let image = item.dataset.variantImage || "";
        if (fileInput.files[0]) {
          image = await resolveStaticImage(fileInput.files[0], {
            usageType: "portrait",
            kind: "base-character-variant"
          }, image);
        }
        variants.push({ name, image });
      }
      return variants;
    }

    function collectHomeOpinions() {
      return Array.from(document.querySelectorAll("#home-opinion-list .relation-line-item")).map(item => ({
        targetBaseCharId: item.querySelector("[name='home-opinion-target']").value,
        text: item.querySelector("[name='home-opinion-text']").value.trim()
      })).filter(item => item.targetBaseCharId && item.text);
    }

    function collectHomeConversations() {
      return Array.from(document.querySelectorAll("#home-conversation-list .relation-line-item")).map(item => ({
        targetBaseCharId: item.querySelector("[name='home-conversation-target']").value,
        selfText: item.querySelector("[name='home-conversation-self']").value.trim(),
        partnerText: item.querySelector("[name='home-conversation-partner']").value.trim()
      })).filter(item => item.targetBaseCharId && (item.selfText || item.partnerText));
    }

    function collectHomeBirthdays() {
      return Array.from(document.querySelectorAll("#home-birthday-list .relation-line-item")).map(item => ({
        targetBaseCharId: item.querySelector("[name='home-birthday-target']").value,
        text: item.querySelector("[name='home-birthday-text']").value.trim()
      })).filter(item => item.targetBaseCharId && item.text);
    }

    function ensureCheckMark(fileInput) {
      if (fileInput.closest("div").querySelector(".expr-set")) return;
      const mark = document.createElement("span");
      mark.className = "expr-set";
      mark.textContent = "\u2713";
      fileInput.closest("label").after(mark);
    }

    return {
      handleBaseCharSubmit,
      beginBaseCharEdit,
      resetBaseCharForm,
      deleteBaseChar,
      renderBaseCharVoiceLineFields,
      collectBaseCharVoiceLines,
      renderBaseCharHomeVoiceLineFields,
      collectBaseCharHomeVoiceLines,
      collectExpressions,
      collectVariants,
      addExpressionInput,
      addVariantInput,
      addHomeOpinionInput,
      addHomeConversationInput,
      addHomeBirthdayInput,
      collectHomeOpinions,
      collectHomeConversations,
      collectHomeBirthdays
    };
  }

  window.BaseCharEditor = {
    setupBaseCharEditor,
    createBaseCharEditor
  };
})();
