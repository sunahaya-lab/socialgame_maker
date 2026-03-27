(function () {
  function createEditorBaseCharHost(deps) {
    const {
      openSection
    } = deps;

    function open() {
      openSection?.("base-char");
    }

    return {
      open
    };
  }

  window.EditorBaseCharHost = {
    create: createEditorBaseCharHost
  };
})();
