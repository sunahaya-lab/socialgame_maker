(function () {
  function createEditorFormSyncRuntime(deps) {
    const { getEditState } = deps;

    function setSubmitLabel(formId, label) {
      const button = document.querySelector(`#${formId} button[type="submit"]`);
      if (button) button.textContent = label;
    }

    function updateEditorSubmitLabels() {
      const editState = getEditState?.() || {};
      setSubmitLabel("base-char-form", editState.baseCharId ? "更新" : "追加");
      setSubmitLabel("character-form", editState.characterId ? "更新" : "追加");
      setSubmitLabel("story-form", editState.storyId ? "更新" : "追加");
      setSubmitLabel("gacha-form", editState.gachaId ? "更新" : "追加");
    }

    return {
      updateEditorSubmitLabels,
      setSubmitLabel
    };
  }

  window.SociaEditorFormSyncRuntime = {
    create: createEditorFormSyncRuntime
  };
})();
