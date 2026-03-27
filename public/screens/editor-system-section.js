(function () {
  function createEditorSystemSection(deps) {
    const {
      openSection,
      onAfterOpen
    } = deps;

    function open() {
      openSection?.("system");
      onAfterOpen?.("system");
    }

    return {
      open
    };
  }

  window.EditorSystemSection = {
    create: createEditorSystemSection
  };
})();
