/* DOM bootstrap loader
 * - owner: shell/dom boot work only
 * - purpose: replace the editor mount placeholder with editor-screen.partial.html before script boot
 * - danger: high; changing timing or target id can break the editor shell before any runtime JS loads
 * - safe changes:
 *   - comments
 *   - clearer error messages
 * - unsafe changes:
 *   - switching away from the current mount id without coordinated HTML changes
 *   - making this async without reviewing downstream boot assumptions
 */
(() => {
  const MOUNT_ID = "editor-screen-mount";
  const PARTIAL_PATH = "editor-screen.partial.html";

  const mount = document.getElementById(MOUNT_ID);
  if (!mount) return;

  const request = new XMLHttpRequest();
  request.open("GET", PARTIAL_PATH, false);

  try {
    request.send(null);
  } catch (error) {
    console.error("[bootstrap-dom-loader] Failed to load editor partial:", error);
    return;
  }

  if (request.status !== 0 && (request.status < 200 || request.status >= 300)) {
    console.error("[bootstrap-dom-loader] Failed to load editor partial:", request.status);
    return;
  }

  mount.outerHTML = request.responseText;
})();
