/* Thin compatibility adapter.
 * Mainline source: public/editor/editor-dashboard-config.js
 * Keep only while callers still resolve window.EditorDashboardConfigLib.
 */
(function () {
  const MAINLINE_GLOBAL = "SociaEditorDashboardConfig";

  function createEditorDashboardConfig(deps = {}) {
    const nextConfig = window[MAINLINE_GLOBAL]?.create?.(deps) || null;

    function getDashboardItems() {
      return nextConfig?.getItems?.() || [];
    }

    function getSummaryCards({ getBaseChars, getCharacters, getStories, getGachas }) {
      return nextConfig?.getSummaryCards?.({
        getBaseChars,
        getCharacters,
        getStories,
        getGachas
      }) || [];
    }

    return {
      getDashboardItems,
      getSummaryCards
    };
  }

  window.EditorDashboardConfigLib = {
    create: createEditorDashboardConfig
  };
})();
