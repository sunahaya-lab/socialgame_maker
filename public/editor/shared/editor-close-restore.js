(function () {
  function createEditorCloseRestore(deps) {
    const {
      onShowDashboard,
      onSetActiveKey
    } = deps;

    let bound = false;

    function bind() {
      if (bound) return;
      bound = true;
      window.addEventListener("socia:editor-window-closed", () => {
        onShowDashboard?.();
        onSetActiveKey?.("");
      });
    }

    return {
      bind
    };
  }

  window.SociaEditorCloseRestore = {
    create: createEditorCloseRestore
  };
})();
