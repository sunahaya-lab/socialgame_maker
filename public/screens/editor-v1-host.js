/* Thin compatibility adapter.
 * Mainline source: public/editor/editor-v1-host-app.js
 * Keep only while callers still resolve window.EditorV1Host.
 */
(function () {
  const MAINLINE_GLOBAL = "SociaEditorV1HostApp";

  function createEditorV1Host(deps) {
    return window[MAINLINE_GLOBAL]?.create?.(deps) || null;
  }

  window.EditorV1Host = {
    create: createEditorV1Host
  };
})();
