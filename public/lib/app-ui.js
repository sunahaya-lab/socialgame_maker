(function () {
  function createAppUiModule(deps) {
    const {
      getCollectionScreen,
      getFormationScreen,
      getEditorScreen,
      populateFolderSelects,
      refreshTitleScreen,
      renderHome,
      renderBattleScreen,
      readFileAsDataUrl,
      makeBaseCharFallback,
      makeFallbackImage,
      esc,
      showToast,
      getSystemConfig,
      baseCharVoiceLineDefs,
      baseCharHomeVoiceDefs
    } = deps;

    function getEditorApiMethod(name) {
      const editorScreen = getEditorScreen?.();
      const method = editorScreen?.[name];
      if (typeof method === "function") return method.bind(editorScreen);
      return null;
    }

    function renderAll() {
      getCollectionScreen()?.renderCollectionFilters?.("all");
      getFormationScreen()?.renderFormationScreen?.();
      populateFolderSelects();
      refreshTitleScreen?.();
      renderHome("refresh");
      renderBattleScreen();
      getEditorApiMethod("renderEditorScreen")?.();
    }

    function renderBaseCharList() {
      getEditorApiMethod("renderBaseCharList")?.();
    }

    function renderEditorCharacterList() {
      getEditorApiMethod("renderEditorCharacterList")?.();
    }

    function renderEditorStoryList() {
      getEditorApiMethod("renderEditorStoryList")?.();
    }

    function renderEditorGachaList() {
      getEditorApiMethod("renderEditorGachaList")?.();
    }

    function renderGachaPoolChars(selectedIds) {
      getEditorApiMethod("renderGachaPoolChars")?.(selectedIds);
    }

    function pickLine(card) {
      if (card.lines?.length) return card.lines[Math.floor(Math.random() * card.lines.length)];
      return card.catch || "No catch copy set.";
    }

    function getEffectiveVoiceLines(card, baseChar) {
      const voiceLines = {};
      baseCharVoiceLineDefs.forEach(([key]) => {
        voiceLines[key] = card?.voiceLines?.[key] || baseChar?.voiceLines?.[key] || "";
      });
      return voiceLines;
    }

    function getEffectiveHomeVoices(card, baseChar) {
      const homeVoices = {};
      baseCharHomeVoiceDefs.forEach(([key]) => {
        homeVoices[key] = card?.homeVoices?.[key] || baseChar?.homeVoices?.[key] || "";
      });
      return homeVoices;
    }

    function getEffectiveHomeOpinions(card, baseChar) {
      return (card?.homeOpinions || []).length > 0 ? (card.homeOpinions || []) : (baseChar?.homeOpinions || []);
    }

    function getEffectiveHomeConversations(card, baseChar) {
      return (card?.homeConversations || []).length > 0 ? (card.homeConversations || []) : (baseChar?.homeConversations || []);
    }

    function getEffectiveHomeBirthdays(card, baseChar) {
      return (card?.homeBirthdays || []).length > 0 ? (card.homeBirthdays || []) : (baseChar?.homeBirthdays || []);
    }

    function renderVoiceLineFields(containerId, prefix, defs, values = {}) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = defs.map(([key, label]) => `
        <label>
          ${label}
          <textarea name="${prefix}-${key}" rows="2" maxlength="200" placeholder="${label}">${esc(values[key] || "")}</textarea>
        </label>
      `).join("");
    }

    function collectVoiceLineFields(containerId, prefix, defs) {
      const voiceLines = {};
      defs.forEach(([key]) => {
        const input = document.querySelector(`#${containerId} [name="${prefix}-${key}"]`);
        voiceLines[key] = input ? input.value.trim() : "";
      });
      return voiceLines;
    }

    function collectRelationLines(listSelector, fieldMap) {
      return Array.from(document.querySelectorAll(`${listSelector} .relation-line-item`)).map(item => {
        const entry = {};
        Object.entries(fieldMap).forEach(([key, selector]) => {
          entry[key] = item.querySelector(selector).value.trim();
        });
        return entry;
      });
    }

    function upsertItem(collection, nextItem) {
      const index = collection.findIndex(item => item.id === nextItem.id);
      if (index >= 0) collection[index] = nextItem;
      else collection.unshift(nextItem);
    }

    function clamp(value, min, max) {
      return Math.min(Math.max(Number(value) || 0, min), max);
    }

    return {
      renderAll,
      renderBaseCharList,
      renderEditorCharacterList,
      renderEditorStoryList,
      renderEditorGachaList,
      renderGachaPoolChars,
      pickLine,
      getEffectiveVoiceLines,
      getEffectiveHomeVoices,
      getEffectiveHomeOpinions,
      getEffectiveHomeConversations,
      getEffectiveHomeBirthdays,
      renderVoiceLineFields,
      collectVoiceLineFields,
      collectRelationLines,
      upsertItem,
      readFileAsDataUrl,
      makeBaseCharFallback,
      makeFallbackImage: (name, rarity) => makeFallbackImage(name, rarity, getSystemConfig?.()?.rarityMode),
      clamp,
      esc,
      showToast
    };
  }

  window.AppUiLib = {
    create: createAppUiModule
  };
})();
