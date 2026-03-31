/* Thin compatibility adapter.
 * Mainline source: public/editor/editor-bootstrap-factory.js
 */
(() => {
  const MAINLINE_GLOBAL = "SociaEditorBootstrapFactory";

  function create(deps = {}) {
    return window[MAINLINE_GLOBAL]?.create?.(deps) || null;
  }

  window.AppEditorBootstrapFactoryLib = {
    create
  };
})();
