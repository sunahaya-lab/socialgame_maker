/* Thin compatibility adapter.
 * Mainline source: public/editor/editor-section-runtime-factory.js
 */
(() => {
  const MAINLINE_GLOBAL = "SociaEditorSectionRuntimeFactory";

  function create(deps = {}) {
    return window[MAINLINE_GLOBAL]?.create?.(deps) || null;
  }

  window.AppEditorSectionRuntimeFactoryLib = {
    create
  };
})();
