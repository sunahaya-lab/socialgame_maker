(function () {
  function createEditorGachaHost(deps) {
    const {
      openSection
    } = deps;

    function open() {
      openSection?.("gacha");
    }

    return {
      open
    };
  }

  window.EditorGachaHost = {
    create: createEditorGachaHost
  };
})();
