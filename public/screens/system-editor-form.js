(function () {
  function createSystemEditorFormController(deps) {
    return window.SociaSystemEditorFormApp?.create?.(deps) || null;
  }

  window.SystemEditorFormLib = {
    create: createSystemEditorFormController
  };
})();
