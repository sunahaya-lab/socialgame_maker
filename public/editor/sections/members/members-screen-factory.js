(function () {
  function createMembersScreenFactory() {
    function createScreen(deps) {
      return window.EditorMemberScreen?.create?.(deps) || null;
    }

    return {
      createScreen
    };
  }

  window.SociaMembersScreenFactory = {
    create: createMembersScreenFactory
  };
})();
