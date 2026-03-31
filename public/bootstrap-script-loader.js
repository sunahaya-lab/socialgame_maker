/* Script bootstrap loader
 * - owner: boot/runtime sequencing work only
 * - purpose: load bootstrap-script-manifest.js groups in declared order
 * - source of truth for order: window.SociaScriptManifest in bootstrap-script-manifest.js
 * - danger: very high; this is the runtime loader for the whole app
 * - safe changes:
 *   - comments
 *   - diagnostics around existing load order
 * - unsafe changes:
 *   - making loads parallel
 *   - reordering groups here instead of in the manifest
 *   - changing append target or async semantics without explicit boot review
 */
(() => {
  const MANIFEST_GLOBAL = "SociaScriptManifest";

  async function loadScript(src) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  }

  function getManifestGroups() {
    return Array.isArray(window[MANIFEST_GLOBAL]) ? window[MANIFEST_GLOBAL] : [];
  }

  async function run() {
    const manifestGroups = getManifestGroups();
    for (const group of manifestGroups) {
      const scripts = Array.isArray(group?.scripts) ? group.scripts : [];
      for (const src of scripts) {
        await loadScript(src);
      }
    }
  }

  run().catch(error => {
    console.error("[bootstrap-script-loader]", error);
  });
})();
