(function () {
  function createBaseCharEditorFieldsRuntime(deps) {
    const {
      getBaseChars,
      getEditState,
      normalizeCharacterSpeechSoundId,
      getCharacterSpeechSoundOptions,
      renderVoiceLineFields,
      collectVoiceLineFields,
      baseCharVoiceLineDefs,
      baseCharHomeVoiceDefs,
      text,
      esc
    } = deps;

    function renderBaseCharVoiceLineFields(values = {}) {
      renderVoiceLineFields("voice-line-fields", "voice", baseCharVoiceLineDefs, values);
    }

    function renderCharacterSpeechSoundOptions(selectedValue = "") {
      const select = document.getElementById("base-char-speech-sound");
      if (!select) return;
      const normalizedValue = normalizeCharacterSpeechSoundId(selectedValue);
      select.innerHTML = getCharacterSpeechSoundOptions()
        .map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`)
        .join("");
      select.value = normalizedValue;
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

    function addHomeOpinionInput(item = null) {
      const list = document.getElementById("home-opinion-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="home-opinion-target">
          <option value="">${esc(text("targetCharacterPlaceholder", "相手キャラを選択"))}</option>
          ${getBaseChars().map(baseChar => `<option value="${esc(baseChar.id)}"${item?.targetBaseCharId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`).join("")}
        </select>
        <textarea name="home-opinion-text" rows="2" maxlength="200" placeholder="${esc(text("homeOpinionPlaceholder", "そのキャラについてのセリフ"))}">${esc(item?.text || "")}</textarea>
        <button type="button" class="expression-remove">${text("remove", "削除")}</button>
      `;
      row.querySelector(".expression-remove")?.addEventListener("click", () => row.remove());
      list?.appendChild(row);
    }

    function addHomeConversationInput(item = null) {
      const list = document.getElementById("home-conversation-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="home-conversation-target">
          <option value="">${esc(text("targetCharacterPlaceholder", "相手キャラを選択"))}</option>
          ${getBaseChars().map(baseChar => `<option value="${esc(baseChar.id)}"${item?.targetBaseCharId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`).join("")}
        </select>
        <textarea name="home-conversation-self" rows="2" maxlength="200" placeholder="${esc(text("homeConversationSelfPlaceholder", "自分のセリフ"))}">${esc(item?.selfText || "")}</textarea>
        <textarea name="home-conversation-partner" rows="2" maxlength="200" placeholder="${esc(text("homeConversationPartnerPlaceholder", "相手のセリフ"))}">${esc(item?.partnerText || "")}</textarea>
        <button type="button" class="expression-remove">${text("remove", "削除")}</button>
      `;
      row.querySelector(".expression-remove")?.addEventListener("click", () => row.remove());
      list?.appendChild(row);
    }

    function addHomeBirthdayInput(item = null) {
      const list = document.getElementById("home-birthday-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="home-birthday-target">
          <option value="">${esc(text("birthdayTargetPlaceholder", "対象キャラを選択"))}</option>
          ${getBaseChars().map(baseChar => `<option value="${esc(baseChar.id)}"${item?.targetBaseCharId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`).join("")}
        </select>
        <textarea name="home-birthday-text" rows="2" maxlength="200" placeholder="${esc(text("homeBirthdayPlaceholder", "誕生日用のセリフ"))}">${esc(item?.text || "")}</textarea>
        <button type="button" class="expression-remove">${text("remove", "削除")}</button>
      `;
      row.querySelector(".expression-remove")?.addEventListener("click", () => row.remove());
      list?.appendChild(row);
    }

    function collectHomeOpinions() {
      return Array.from(document.querySelectorAll("#home-opinion-list .relation-line-item")).map(item => ({
        targetBaseCharId: item.querySelector("[name='home-opinion-target']")?.value || "",
        text: item.querySelector("[name='home-opinion-text']")?.value.trim() || ""
      })).filter(item => item.targetBaseCharId && item.text);
    }

    function collectHomeConversations() {
      return Array.from(document.querySelectorAll("#home-conversation-list .relation-line-item")).map(item => ({
        targetBaseCharId: item.querySelector("[name='home-conversation-target']")?.value || "",
        selfText: item.querySelector("[name='home-conversation-self']")?.value.trim() || "",
        partnerText: item.querySelector("[name='home-conversation-partner']")?.value.trim() || ""
      })).filter(item => item.targetBaseCharId && (item.selfText || item.partnerText));
    }

    function collectHomeBirthdays() {
      return Array.from(document.querySelectorAll("#home-birthday-list .relation-line-item")).map(item => ({
        targetBaseCharId: item.querySelector("[name='home-birthday-target']")?.value || "",
        text: item.querySelector("[name='home-birthday-text']")?.value.trim() || ""
      })).filter(item => item.targetBaseCharId && item.text);
    }

    function beginBaseCharEdit(id, next = {}) {
      const baseChar = getBaseChars().find(item => item.id === id);
      if (!baseChar) return;

      getEditState().baseCharId = id;
      const form = document.getElementById("base-char-form");
      form.name.value = baseChar.name || "";
      form.description.value = baseChar.description || "";
      form.birthday.value = baseChar.birthday || "";
      form.color.value = baseChar.color || "#a29bfe";
      renderCharacterSpeechSoundOptions(baseChar.speechSoundId || "");

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

      next.addVariantInput && (baseChar.variants || []).forEach(item => next.addVariantInput(item));
      next.addExpressionInput && (baseChar.expressions || []).forEach(item => next.addExpressionInput(item));

      next.updateEditorSubmitLabels && next.updateEditorSubmitLabels();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function resetBaseCharForm(next = {}) {
      getEditState().baseCharId = null;
      const form = document.getElementById("base-char-form");
      form.reset();
      form.color.value = "#a29bfe";
      renderCharacterSpeechSoundOptions();
      document.getElementById("base-char-preview").hidden = true;
      document.getElementById("expression-list").innerHTML = "";
      document.getElementById("variant-list").innerHTML = "";
      document.getElementById("home-opinion-list").innerHTML = "";
      document.getElementById("home-conversation-list").innerHTML = "";
      document.getElementById("home-birthday-list").innerHTML = "";
      renderBaseCharVoiceLineFields();
      renderBaseCharHomeVoiceLineFields();
      next.updateEditorSubmitLabels && next.updateEditorSubmitLabels();
    }

    return {
      renderBaseCharVoiceLineFields,
      renderCharacterSpeechSoundOptions,
      collectBaseCharVoiceLines,
      renderBaseCharHomeVoiceLineFields,
      collectBaseCharHomeVoiceLines,
      addHomeOpinionInput,
      addHomeConversationInput,
      addHomeBirthdayInput,
      collectHomeOpinions,
      collectHomeConversations,
      collectHomeBirthdays,
      beginBaseCharEdit,
      resetBaseCharForm,
    };
  }

  window.BaseCharEditorFieldsRuntime = {
    create: createBaseCharEditorFieldsRuntime
  };
})();
