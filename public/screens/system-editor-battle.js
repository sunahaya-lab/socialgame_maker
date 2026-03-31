(function () {
  function createSystemEditorBattleController(deps) {
    return window.SociaSystemEditorBattleApp?.create?.(deps) || null;
  }

  window.SystemEditorBattleLib = {
    create: createSystemEditorBattleController
  };
})();
