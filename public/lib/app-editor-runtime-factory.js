/* Thin compatibility adapter.
 * Mainline source: public/editor/editor-runtime-factory.js
 * Keep only while callers still resolve window.AppEditorRuntimeFactoryLib.
 */
(function () {
  const MAINLINE_GLOBAL = "SociaEditorRuntimeFactory";

  function create(deps = {}) {
    return window[MAINLINE_GLOBAL]?.create?.(deps) || null;
  }

  window.AppEditorRuntimeFactoryLib = {
    create
  };
})();
