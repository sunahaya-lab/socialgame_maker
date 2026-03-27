(function () {
  function createEditorBaseCharSection(deps) {
    const {
      openSection,
      onAfterOpen
    } = deps;

    function open() {
      openSection?.("base-char");
      onAfterOpen?.("base-char");
    }

    return {
      open
    };
  }

  window.EditorBaseCharSection = {
    create: createEditorBaseCharSection
  };
})();
