(function () {
  function createEditorSystemHost(deps) {
    const {
      openSection,
      renderSystemForm
    } = deps;

    function open() {
      openSection?.("system");
      renderSystemForm?.();
    }

    return {
      open
    };
  }

  window.EditorSystemHost = {
    create: createEditorSystemHost
  };
})();
