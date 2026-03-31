/* Active compatibility implementation.
 * Role: legacy project-context helper still consumed by editor share/member compatibility screens.
 * Mainline counterpart: public/editor/shared/editor-project-context.js
 * Removal condition: only after compatibility screens stop resolving window.EditorProjectContextLib.
 */
(function () {
  const MAINLINE_GLOBAL = "SociaEditorProjectContext";

  function createEditorProjectContext(deps) {
    const mainlineContext = window[MAINLINE_GLOBAL]?.create?.(deps);
    if (mainlineContext) return mainlineContext;

    const {
      getCurrentProjectId,
      getCurrentProjectName
    } = deps;

    function getProjectName() {
      return String(getCurrentProjectName?.() || "無題のプロジェクト").trim() || "無題のプロジェクト";
    }

    function getProjectId() {
      return String(getCurrentProjectId?.() || "").trim();
    }

    return {
      getProjectName,
      getProjectId
    };
  }

  window.EditorProjectContextLib = {
    create: createEditorProjectContext
  };
})();
