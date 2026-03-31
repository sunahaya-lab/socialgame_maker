(function () {
  function createEditorProjectContext(deps) {
    const {
      getCurrentProjectId,
      getCurrentProjectName
    } = deps;

    function getProjectId() {
      return String(getCurrentProjectId?.() || "").trim();
    }

    function getProjectName() {
      return String(getCurrentProjectName?.() || "無題のプロジェクト").trim() || "無題のプロジェクト";
    }

    return {
      getProjectId,
      getProjectName
    };
  }

  window.SociaEditorProjectContext = {
    create: createEditorProjectContext
  };
})();
