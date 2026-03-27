(function () {
  function createEditorCharacterSection(deps) {
    const {
      openSection,
      onAfterOpen
    } = deps;

    function open() {
      openSection?.("character");
      onAfterOpen?.("character");
    }

    return {
      open
    };
  }

  window.EditorCharacterSection = {
    create: createEditorCharacterSection
  };
})();
