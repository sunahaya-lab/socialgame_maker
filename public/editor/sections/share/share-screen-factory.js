(function () {
  function createShareScreenFactory() {
    function createScreen(deps) {
      return window.EditorShareScreen?.create?.(deps) || null;
    }

    return {
      createScreen
    };
  }

  window.SociaShareScreenFactory = {
    create: createShareScreenFactory
  };
})();
