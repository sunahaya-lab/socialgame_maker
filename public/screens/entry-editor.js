(function () {
  function setupEntryEditor(deps) {
    const api = createEntryEditor(deps);

    document.getElementById("character-form").addEventListener("submit", api.handleCharacterSubmit);
    document.getElementById("add-card-home-opinion-btn").addEventListener("click", () => api.addCardHomeOpinionInput());
    document.getElementById("add-card-home-conversation-btn").addEventListener("click", () => api.addCardHomeConversationInput());
    document.getElementById("add-card-home-birthday-btn").addEventListener("click", () => api.addCardHomeBirthdayInput());

    return api;
  }

  function createEntryEditor(deps) {
    const {
      getCharacters,
      setCharacters,
      getBaseChars,
      getEditState,
      getApi,
      getSystemApi,
      readFileAsDataUrl,
      makeFallbackImage,
      normalizeRarityValue,
      saveLocal,
      postJSON,
      showToast,
      upsertItem,
      updateEditorSubmitLabels,
      renderHome,
      renderEditorCharacterList,
      renderGachaPoolChars,
      getEditingFeaturedIds,
      renderVoiceLineFields,
      collectVoiceLineFields,
      baseCharVoiceLineDefs,
      baseCharHomeVoiceDefs,
      esc
    } = deps;

    async function handleCharacterSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const characters = getCharacters();
      const existing = getEditState().characterId ? characters.find(item => item.id === getEditState().characterId) : null;
      const imageFile = form.image.files[0];
      const image = imageFile ? await readFileAsDataUrl(imageFile) : (existing?.image || "");

      const char = {
        id: getEditState().characterId || crypto.randomUUID(),
        name: form.name.value.trim(),
        baseCharId: form.baseCharId.value || null,
        catch: form.catch.value.trim(),
        rarity: normalizeRarityValue(form.rarity.value),
        attribute: form.attribute.value.trim() || "",
        image: image || makeFallbackImage(form.name.value.trim(), form.rarity.value),
        lines: existing?.lines || [],
        voiceLines: collectCardVoiceLines(),
        homeVoices: collectCardHomeVoiceLines(),
        homeOpinions: collectCardHomeOpinions(),
        homeConversations: collectCardHomeConversations(),
        homeBirthdays: collectCardHomeBirthdays()
      };

      upsertItem(characters, char);
      setCharacters(characters);
      saveLocal("socia-characters", characters);
      try {
        await postJSON(getApi().characters, char);
      } catch (error) {
        console.error("Failed to save character:", error);
        showToast("カードの保存に失敗しました。ローカルには保持されています。");
      }

      resetCharacterForm();
      renderHome();
      renderEditorCharacterList();
      renderGachaPoolChars(getEditingFeaturedIds());
      showToast(`${char.name}を${existing ? "更新" : "登録"}しました。`);
    }

    function beginCharacterEdit(id) {
      const char = getCharacters().find(item => item.id === id);
      if (!char) return;

      getEditState().characterId = id;
      const form = document.getElementById("character-form");
      form.baseCharId.value = char.baseCharId || "";
      form.name.value = char.name || "";
      form.catch.value = char.catch || "";
      getSystemApi().renderCharacterRarityOptions(char.rarity || getSystemApi().getRarityFallback());
      form.attribute.value = char.attribute || "";

      renderCardVoiceLineFields(char.voiceLines || {});
      renderCardHomeVoiceLineFields(char.homeVoices || {});
      document.getElementById("card-home-opinion-list").innerHTML = "";
      document.getElementById("card-home-conversation-list").innerHTML = "";
      document.getElementById("card-home-birthday-list").innerHTML = "";
      (char.homeOpinions || []).forEach(item => addCardHomeOpinionInput(item));
      (char.homeConversations || []).forEach(item => addCardHomeConversationInput(item));
      (char.homeBirthdays || []).forEach(item => addCardHomeBirthdayInput(item));

      document.getElementById("char-preview").hidden = false;
      document.getElementById("char-preview-img").src = char.image || makeFallbackImage(char.name, char.rarity);
      updateEditorSubmitLabels();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function resetCharacterForm() {
      getEditState().characterId = null;
      const form = document.getElementById("character-form");
      form.reset();
      getSystemApi().renderCharacterRarityOptions(getSystemApi().getRarityFallback());
      renderCardVoiceLineFields();
      renderCardHomeVoiceLineFields();
      document.getElementById("card-home-opinion-list").innerHTML = "";
      document.getElementById("card-home-conversation-list").innerHTML = "";
      document.getElementById("card-home-birthday-list").innerHTML = "";
      document.getElementById("char-preview").hidden = true;
      updateEditorSubmitLabels();
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

    function addCardHomeOpinionInput(item = null) {
      const list = document.getElementById("card-home-opinion-list");
      const row = document.createElement("div");
      row.className = "relation-line-item";
      row.innerHTML = `
        <select name="card-home-opinion-target">
          <option value="">相手キャラを選択</option>
          ${getBaseChars().map(baseChar => `<option value="${esc(baseChar.id)}"${item?.targetBaseCharId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`).join("")}
        </select>
        <textarea name="card-home-opinion-text" rows="2" maxlength="200" placeholder="そのキャラについてのセリフ">${esc(item?.text || "")}</textarea>
        <button type="button" class="expression-remove">削除</button>
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
          ${getBaseChars().map(baseChar => `<option value="${esc(baseChar.id)}"${item?.targetBaseCharId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`).join("")}
        </select>
        <textarea name="card-home-conversation-self" rows="2" maxlength="200" placeholder="自分のセリフ">${esc(item?.selfText || "")}</textarea>
        <textarea name="card-home-conversation-partner" rows="2" maxlength="200" placeholder="相手のセリフ">${esc(item?.partnerText || "")}</textarea>
        <button type="button" class="expression-remove">削除</button>
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
          ${getBaseChars().map(baseChar => `<option value="${esc(baseChar.id)}"${item?.targetBaseCharId === baseChar.id ? " selected" : ""}>${esc(baseChar.name)}</option>`).join("")}
        </select>
        <textarea name="card-home-birthday-text" rows="2" maxlength="200" placeholder="誕生日用のセリフ">${esc(item?.text || "")}</textarea>
        <button type="button" class="expression-remove">削除</button>
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

    return {
      handleCharacterSubmit,
      beginCharacterEdit,
      resetCharacterForm,
      renderCardVoiceLineFields,
      collectCardVoiceLines,
      renderCardHomeVoiceLineFields,
      collectCardHomeVoiceLines,
      collectCardHomeOpinions,
      collectCardHomeConversations,
      collectCardHomeBirthdays,
      addCardHomeOpinionInput,
      addCardHomeConversationInput,
      addCardHomeBirthdayInput
    };
  }

  window.EntryEditor = {
    setupEntryEditor,
    createEntryEditor
  };
})();
