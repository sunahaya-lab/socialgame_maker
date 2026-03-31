(function () {
  function createCardEditorFormRuntime(deps) {
    const {
      getCharacterForm,
      getCharacterFolderSelect,
      getEditState,
      getSystemApi,
      normalizeAttributeValue,
      renderCardVoiceLineFields,
      renderCardHomeVoiceLineFields,
      populateCharacterRelationFields,
      makeFallbackImage,
      setCharacterCropEditorState,
      normalizeCharacterCropPresets,
      normalizeCharacterCropImages,
      populateCharacterSdEditor,
      resetCharacterSdEditor,
      normalizeCharacterSdImages,
      populateCharacterBattleEditor,
      resetCharacterBattleEditor,
      normalizeCharacterBattleKit,
      updateEditorSubmitLabels,
      setCharacterImageCleared,
      clearCharacterRelationLists,
      clearCharacterCropEditorState,
      getAttributeFallback,
      normalizeAttributeFallback,
      clearCropEditorRenderTimer,
    } = deps;

    function applyCharacterToForm(char) {
      const form = getCharacterForm();
      if (!form || !char) return;
      const folderSelect = getCharacterFolderSelect(form);
      getEditState().characterId = char.id;
      form.baseCharId.value = char.baseCharId || "";
      if (folderSelect) folderSelect.value = char.folderId || "";
      form.name.value = char.name || "";
      form.catch.value = char.catch || "";
      getSystemApi().renderCharacterRarityOptions(char.rarity || getSystemApi().getRarityFallback());
      form.attribute.value = normalizeAttributeValue(char.attribute);
      renderCardVoiceLineFields(char.voiceLines || {});
      renderCardHomeVoiceLineFields(char.homeVoices || {});
      populateCharacterRelationFields(char);
      document.getElementById("char-preview").hidden = false;
      document.getElementById("char-preview-img").src = char.image || makeFallbackImage(char.name, char.rarity);
      setCharacterCropEditorState(
        char.image || "",
        normalizeCharacterCropPresets(char.cropPresets),
        normalizeCharacterCropImages(char.cropImages)
      );
      populateCharacterSdEditor(normalizeCharacterSdImages(char.sdImages));
      populateCharacterBattleEditor(normalizeCharacterBattleKit(char.battleKit));
      updateEditorSubmitLabels();
      setCharacterImageCleared(form, false);
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function beginCharacterEdit(id, getCharacters) {
      const char = typeof getCharacters === "function"
        ? getCharacters().find(item => item.id === id)
        : null;
      if (!char) return;
      applyCharacterToForm(char);
    }

    function resetCharacterForm() {
      getEditState().characterId = null;
      clearCropEditorRenderTimer();
      const nextForm = getCharacterForm();
      const nextFolderSelect = getCharacterFolderSelect(nextForm);
      nextForm.reset();
      getSystemApi().renderCharacterRarityOptions(getSystemApi().getRarityFallback());
      if (nextFolderSelect) nextFolderSelect.value = "";
      nextForm.attribute.value = normalizeAttributeFallback(getAttributeFallback());
      renderCardVoiceLineFields();
      renderCardHomeVoiceLineFields();
      clearCharacterRelationLists();
      document.getElementById("char-preview").hidden = true;
      clearCharacterCropEditorState();
      resetCharacterSdEditor();
      resetCharacterBattleEditor();
      updateEditorSubmitLabels();
      setCharacterImageCleared(nextForm, false);
    }

    return {
      applyCharacterToForm,
      beginCharacterEdit,
      resetCharacterForm,
    };
  }

  window.CardEditorFormRuntime = {
    create: createCardEditorFormRuntime
  };
})();
