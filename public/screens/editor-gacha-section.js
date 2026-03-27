(function () {
  function createEditorGachaSection(deps) {
    const {
      openSection,
      onAfterOpen
    } = deps;

    function open() {
      openSection?.("gacha");
      onAfterOpen?.("gacha");
    }

    return {
      open
    };
  }

  window.EditorGachaSection = {
    create: createEditorGachaSection
  };
})();
