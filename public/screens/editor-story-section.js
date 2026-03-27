(function () {
  function createEditorStorySection(deps) {
    const {
      openSection,
      onAfterOpen
    } = deps;

    function open() {
      openSection?.("story");
      onAfterOpen?.("story");
    }

    return {
      open
    };
  }

  window.EditorStorySection = {
    create: createEditorStorySection
  };
})();
