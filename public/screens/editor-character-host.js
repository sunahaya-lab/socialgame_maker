(function () {
  function createEditorCharacterHost(deps) {
    const {
      openSection
    } = deps;

    function open() {
      openSection?.("character");
    }

    return {
      open
    };
  }

  window.EditorCharacterHost = {
    create: createEditorCharacterHost
  };
})();
