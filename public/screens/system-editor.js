(function () {
  function setupSystemEditor(deps) {
    return window.SociaSystemEditorApp?.setup?.(deps) || null;
  }

  function createSystemEditor(deps) {
    return window.SociaSystemEditorApp?.create?.(deps) || null;
  }

  window.SystemEditor = {
    setupSystemEditor,
    createSystemEditor
  };
})();
