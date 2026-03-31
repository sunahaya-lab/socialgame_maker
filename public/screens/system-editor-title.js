(function () {
  function createSystemEditorTitleController(deps) {
    return window.SociaSystemEditorTitleApp?.create?.(deps) || null;
  }

  window.SystemEditorTitleLib = {
    create: createSystemEditorTitleController
  };
})();
