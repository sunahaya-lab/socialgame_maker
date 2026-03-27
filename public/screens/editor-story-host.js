(function () {
  function createEditorStoryHost(deps) {
    const {
      openSection
    } = deps;

    function open() {
      openSection?.("story");
    }

    return {
      open
    };
  }

  window.EditorStoryHost = {
    create: createEditorStoryHost
  };
})();
