(function () {
  function createCardEditorRelationsRuntime(deps) {
    const {
      getBaseChars,
      renderVoiceLineFields,
      collectVoiceLineFields,
      baseCharVoiceLineDefs,
      baseCharHomeVoiceDefs,
      esc,
      text,
    } = deps;

    function clearCharacterRelationLists() {
      document.getElementById("card-home-opinion-list").innerHTML = "";
      document.getElementById("card-home-conversation-list").innerHTML = "";
      document.getElementById("card-home-birthday-list").innerHTML = "";
    }

    function renderCardVoiceLineFields(values = {}) {
      renderVoiceLineFields("card-voice-line-fields", "card-voice", baseCharVoiceLineDefs, values);
    }

    function collectCardVoiceLines() {
      return collectVoiceLineFields("card-voice-line-fields", "card-voice", baseCharVoiceLineDefs);
    }

    function renderCardHomeVoiceLineFields(values = {}) {
      renderVoiceLineFields("card-home-voice-line-fields", "card-home-voice", baseCharHomeVoiceDefs, values);
    }

    function collectCardHomeVoiceLines() {
      return collectVoiceLineFields("card-home-voice-line-fields", "card-home-voice", baseCharHomeVoiceDefs);
    }

    function createBaseCharOptions(selectedId = "") {
      return getBaseChars().map(baseChar => (
        `<option value="${esc(baseChar.id)}"${selectedId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`
      )).join("");
    }

    function addCardHomeOpinionInput(item = null) {
      const list = document.getElementById("card-home-opinion-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="card-home-opinion-target">
          <option value="">相手キャラを選択</option>
          ${createBaseCharOptions(item?.targetBaseCharId || "")}
        </select>
        <textarea name="card-home-opinion-text" rows="2" maxlength="200" placeholder="${esc(text("homeOpinionPlaceholder", "そのキャラについてのセリフ"))}">${esc(item?.text || "")}</textarea>
        <button type="button" class="expression-remove">${text("remove", "削除")}</button>
      `;
      row.querySelector(".expression-remove").addEventListener("click", () => row.remove());
      list.appendChild(row);
    }

    function addCardHomeConversationInput(item = null) {
      const list = document.getElementById("card-home-conversation-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="card-home-conversation-target">
          <option value="">相手キャラを選択</option>
          ${createBaseCharOptions(item?.targetBaseCharId || "")}
        </select>
        <textarea name="card-home-conversation-self" rows="2" maxlength="200" placeholder="${esc(text("homeConversationSelfPlaceholder", "自分のセリフ"))}">${esc(item?.selfText || "")}</textarea>
        <textarea name="card-home-conversation-partner" rows="2" maxlength="200" placeholder="${esc(text("homeConversationPartnerPlaceholder", "相手のセリフ"))}">${esc(item?.partnerText || "")}</textarea>
        <button type="button" class="expression-remove">${text("remove", "削除")}</button>
      `;
      row.querySelector(".expression-remove").addEventListener("click", () => row.remove());
      list.appendChild(row);
    }

    function addCardHomeBirthdayInput(item = null) {
      const list = document.getElementById("card-home-birthday-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="card-home-birthday-target">
          <option value="">対象キャラを選択</option>
          ${createBaseCharOptions(item?.targetBaseCharId || "")}
        </select>
        <textarea name="card-home-birthday-text" rows="2" maxlength="200" placeholder="${esc(text("homeBirthdayPlaceholder", "誕生日用のセリフ"))}">${esc(item?.text || "")}</textarea>
        <button type="button" class="expression-remove">${text("remove", "削除")}</button>
      `;
      row.querySelector(".expression-remove").addEventListener("click", () => row.remove());
      list.appendChild(row);
    }

    function collectCardHomeOpinions() {
      return Array.from(document.querySelectorAll("#card-home-opinion-list .relation-line-item")).map(row => ({
        targetBaseCharId: row.querySelector("[name='card-home-opinion-target']").value || null,
        text: row.querySelector("[name='card-home-opinion-text']").value.trim()
      })).filter(item => item.targetBaseCharId && item.text);
    }

    function collectCardHomeConversations() {
      return Array.from(document.querySelectorAll("#card-home-conversation-list .relation-line-item")).map(row => ({
        targetBaseCharId: row.querySelector("[name='card-home-conversation-target']").value || null,
        selfText: row.querySelector("[name='card-home-conversation-self']").value.trim(),
        partnerText: row.querySelector("[name='card-home-conversation-partner']").value.trim()
      })).filter(item => item.targetBaseCharId && (item.selfText || item.partnerText));
    }

    function collectCardHomeBirthdays() {
      return Array.from(document.querySelectorAll("#card-home-birthday-list .relation-line-item")).map(row => ({
        targetBaseCharId: row.querySelector("[name='card-home-birthday-target']").value || null,
        text: row.querySelector("[name='card-home-birthday-text']").value.trim()
      })).filter(item => item.targetBaseCharId && item.text);
    }

    function populateCharacterRelationFields(char) {
      clearCharacterRelationLists();
      (char?.homeOpinions || []).forEach(item => addCardHomeOpinionInput(item));
      (char?.homeConversations || []).forEach(item => addCardHomeConversationInput(item));
      (char?.homeBirthdays || []).forEach(item => addCardHomeBirthdayInput(item));
    }

    return {
      clearCharacterRelationLists,
      populateCharacterRelationFields,
      renderCardVoiceLineFields,
      collectCardVoiceLines,
      renderCardHomeVoiceLineFields,
      collectCardHomeVoiceLines,
      addCardHomeOpinionInput,
      addCardHomeConversationInput,
      addCardHomeBirthdayInput,
      collectCardHomeOpinions,
      collectCardHomeConversations,
      collectCardHomeBirthdays,
    };
  }

  window.CardEditorRelationsRuntime = {
    create: createCardEditorRelationsRuntime
  };
})();
