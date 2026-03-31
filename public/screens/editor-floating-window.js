/* Thin compatibility adapter.
 * Mainline source: public/editor/shared/editor-floating-window.js
 * Keep only while callers still resolve window.EditorFloatingWindowLib.
 */
(function () {
  const MAINLINE_GLOBAL = "SociaEditorFloatingWindow";

  function createEditorFloatingWindow(deps) {
    return window[MAINLINE_GLOBAL]?.create?.(deps) || null;
  }

  window.EditorFloatingWindowLib = {
    create: createEditorFloatingWindow
  };
})();
