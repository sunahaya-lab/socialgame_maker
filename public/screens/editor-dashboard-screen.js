/* Thin compatibility adapter.
 * Mainline source: public/editor/editor-dashboard-screen-app.js
 * Keep only while callers still resolve window.EditorDashboardScreen.
 */
(function () {
  const MAINLINE_GLOBAL = "SociaEditorDashboardScreenApp";

  function createEditorDashboardScreen(deps) {
    return window[MAINLINE_GLOBAL]?.create?.(deps) || null;
  }

  window.EditorDashboardScreen = {
    create: createEditorDashboardScreen
  };
})();
