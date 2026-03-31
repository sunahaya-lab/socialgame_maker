/* Runtime script manifest
 * - This file is the load-order source of truth for browser boot.
 * - Keep group order stable unless the task is explicitly about boot/runtime sequencing.
 * - public/editor/ and public/core/ are mainline.
 * - public/screens/ still contains active compatibility adapters.
 * - Safe changes:
 *   - comments
 *   - ownership annotations
 *   - adding scripts to the correct existing group when the dependency order is clear
 * - Unsafe changes:
 *   - group reordering
 *   - moving adapter scripts ahead of their mainline implementations
 *   - removing compatibility groups without confirming app.js/bootstrap no longer reaches them
 */

/* Group 01
 * owner: shared runtime/state/auth work
 * danger: high shared blast radius; many later groups assume these globals exist
 */
const sharedLibrariesStateAuthGroup = {
  label: "shared-libraries-state-auth",
  scripts: [
    "lib/rarity.js",
    "lib/storage.js",
    "api/client.js",
    "lib/image.js",
    "lib/toast.js",
    "lib/ui-text.js",
    "lib/auth-ui-text.js",
    "lib/app-auth-panel-runtime.js",
    "lib/app-auth-lifecycle-runtime.js",
    "lib/app-auth-session-flow-runtime.js",
    "lib/app-auth-profile-ui-runtime.js",
    "lib/app-auth-profile-actions-runtime.js",
    "lib/app-auth-utils-runtime.js",
    "lib/profile-runtime.js",
    "lib/profile-actions.js",
    "lib/system-save-runtime.js",
    "lib/attribute.js",
    "lib/app-mode.js",
    "lib/title-system.js",
    "lib/app-state.js",
    "lib/player-state.js",
    "lib/app-project-runtime.js",
    "lib/app-navigation-runtime.js",
    "lib/app-runtime.js",
    "lib/app-data-storage.js",
    "lib/app-data-player.js",
    "lib/app-data-normalize.js",
      "lib/app-data-inventory.js",
      "lib/app-data-event.js",
      "lib/app-data-currency.js",
      "lib/app-data-bridge.js",
      "lib/app-data-growth.js",
      "lib/app-data-bootstrap.js",
      "lib/app-data.js",
    "lib/app-ui.js",
    "lib/app-home.js",
    "lib/app-editor.js",
    "lib/battle-controller.js",
    "lib/battle-engine.js",
    "lib/battle-state.js",
    "lib/battle-view.js",
    "lib/content-state.js",
    "lib/app-auth.js",
    "lib/editor-runtime.js",
    "lib/layout-bridge.js",
    "lib/layout-schema.js",
    "lib/layout-runtime.js",
    "lib/layout-renderer.js",
    "lib/layout-presets.js",
  ],
};

/* Group 02
 * owner: play-screen work
 * danger: medium; safe for local screen additions, unsafe for cross-screen reorder
 */
const playScreensGroup = {
  label: "play-screens",
  scripts: [
    "screens/collection-screen.js",
    "screens/collection-grid-runtime.js",
    "screens/collection-detail-runtime.js",
    "screens/collection-screen-runtime.js",
    "screens/formation-battle-entry.js",
    "screens/formation-card-list-runtime.js",
    "screens/formation-convert-runtime.js",
    "screens/formation-equipment-runtime.js",
    "screens/formation-growth-runtime.js",
    "screens/formation-party-runtime.js",
    "screens/formation-screen.js",
    "screens/formation-screen-runtime.js",
    "screens/gacha-screen.js",
    "screens/gacha-display-runtime.js",
    "screens/gacha-selection-runtime.js",
    "screens/gacha-screen-runtime.js",
    "screens/battle-screen.js",
    "screens/home-announcement-runtime.js",
    "screens/home-bgm-runtime.js",
    "screens/home-dialogue-runtime.js",
    "screens/home-event-banner-runtime.js",
    "screens/home-header-runtime.js",
    "screens/home-screen.js",
    "screens/home-layout-overlay.js",
    "screens/home-workspace-windows.js",
    "screens/home-workspace-assets.js",
    "screens/home-workspace-parts.js",
    "screens/home-edit-workspace.js",
    "screens/story-screen.js",
    "screens/story-screen-runtime.js",
    "screens/event-screen.js",
    "screens/event-screen-runtime.js",
    "screens/title-screen.js",
    "screens/home-config-audio-runtime.js",
    "screens/home-config-save-runtime.js",
    "screens/home-config-panel-runtime.js",
    "screens/home-config-stage-runtime.js",
    "screens/home-config.js",
  ],
};

/* Group 03
 * owner: system/card/notices editor mainline migration
 * mainline + adapters mixed intentionally during transition
 * danger: high; do not move screens/* adapters ahead of editor/sections/* app files
 */
const systemEditorMainlineAdaptersGroup = {
  label: "system-editor-mainline-adapters",
  scripts: [
    "editor/sections/system/system-editor-title-app.js",
    "screens/system-editor-title.js",
    "editor/sections/system/system-editor-battle-app.js",
    "screens/system-editor-battle.js",
    "editor/sections/system/title-editor-runtime.js",
    "editor/sections/system/system-editor-form-app.js",
    "screens/system-editor-form.js",
    "editor/sections/system/system-editor-app.js",
    "editor/sections/system/system-editor-runtime.js",
    "screens/system-editor.js",
    "editor/sections/card/card-editor-relations-runtime.js",
    "editor/sections/card/card-editor-crop-runtime.js",
    "editor/sections/card/card-editor-sd-runtime.js",
    "editor/sections/card/card-editor-battle-runtime.js",
    "editor/sections/card/card-editor-form-runtime.js",
    "editor/sections/card/card-editor-save-runtime.js",
    "editor/sections/card/entry-editor-runtime.js",
    "editor/sections/card/equipment-card-editor-runtime.js",
    "screens/entry-editor-text.js",
    "screens/entry-editor.js",
    "screens/equipment-card-editor.js",
    "editor/sections/base-char/base-char-editor-fields-runtime.js",
    "editor/sections/base-char/base-char-editor-expression-runtime.js",
    "editor/sections/base-char/base-char-editor-save-runtime.js",
    "editor/sections/base-char/base-char-editor-runtime.js",
    "screens/base-char-editor-text.js",
    "screens/base-char-editor.js",
    "screens/music-editor-text.js",
    "screens/music-editor.js",
    "editor/sections/notices/announcement-editor-text.js",
    "editor/sections/notices/announcement-editor-app.js",
    "editor/sections/notices/announcement-editor-runtime.js",
    "screens/announcement-editor.js",
    "screens/title-editor-text.js",
    "screens/title-editor.js",
    "screens/story-editor-text.js",
    "editor/sections/story/story-editor-ui-runtime.js",
    "editor/sections/story/story-editor-lifecycle-runtime.js",
    "editor/sections/story/story-editor-scene-runtime.js",
    "editor/sections/story/story-editor-save-runtime.js",
    "screens/story-editor.js",
  ],
};

/* Group 04
 * owner: editor runtime mainline
 * mainline only
 * danger: high; later helpers and adapters expect these globals
 */
const editorMainlineGroup = {
  label: "editor-mainline",
  scripts: [
    "editor/editor-dashboard-config.js",
    "editor/editor-dashboard.js",
    "editor/editor-dashboard-screen-app.js",
    "editor/editor-app.js",
    "editor/editor-bootstrap-factory.js",
    "editor/editor-section-runtime-factory.js",
    "editor/editor-runtime-factory.js",
    "editor/editor-screen-deps.js",
    "editor/editor-runtime-bridge.js",
    "editor/editor-v1-host-app.js",
  ],
};

/* Group 05
 * owner: editor shared helper work
 * danger: high; these are bridge layers between mainline editor and compatibility adapters
 */
const editorSharedHelpersGroup = {
  label: "editor-shared-helpers",
  scripts: [
    "editor/shared/editor-base-char-option-sync-runtime.js",
    "editor/shared/editor-form-setup-runtime.js",
    "editor/shared/editor-form-sync-runtime.js",
    "editor/shared/editor-preview-runtime.js",
    "editor/shared/editor-floating-window.js",
    "editor/shared/editor-host-ui.js",
    "editor/shared/editor-close-restore.js",
    "editor/shared/editor-dashboard-factory.js",
    "editor/shared/editor-folder-runtime.js",
    "editor/shared/editor-legacy-bridge.js",
    "editor/shared/editor-legacy-workspace.js",
    "editor/shared/editor-managed-sections.js",
    "editor/shared/editor-section-orchestrator.js",
    "editor/shared/editor-window-manager-callbacks.js",
    "editor/shared/editor-project-context.js",
    "editor/shared/editor-managed-section.js",
    "editor/shared/editor-special-sections.js",
    "editor/shared/editor-window-manager.js",
  ],
};

/* Group 06
 * owner: bootstrap/runtime factory work
 * danger: very high; app.js setup order depends on these factories being present
 */
const bootstrapRuntimeFactoriesGroup = {
  label: "bootstrap-runtime-factories",
  scripts: [
    "lib/auth-panel-ui.js",
    "lib/auth-session-runtime.js",
    "core/app-init-runtime.js",
    "lib/app-core-runtime-factory.js",
    "lib/app-auth-profile-runtime-factory.js",
    "lib/app-factory-deps-builder.js",
    "lib/app-api-runtime-factory.js",
    "lib/app-single-runtime-factory.js",
    "lib/app-shared-facade-factory.js",
    "lib/app-editor-bootstrap-factory.js",
    "lib/app-legacy-bridge-factory.js",
    "lib/app-editor-runtime-factory.js",
    "lib/app-editor-section-runtime-factory.js",
    "lib/app-layout-editor-runtime-factory.js",
    "lib/app-init-content-runtime-factory.js",
    "lib/app-bootstrap-helper-factory.js",
    "lib/app-ui-home-runtime-factory.js",
    "lib/app-screen-runtime-factory.js",
    "lib/project-members-runtime.js",
  ],
};

/* Group 07
 * owner: editor section wrapper work
 * danger: medium; safe if kept after mainline/shared helpers and before compatibility adapters
 */
const editorSectionWrappersGroup = {
  label: "editor-section-wrappers",
  scripts: [
    "editor/sections/share/share-panel-runtime.js",
    "editor/sections/base-char/base-char-section.js",
    "editor/sections/card/card-section.js",
    "editor/sections/story/story-section.js",
    "editor/sections/story/story-editor-runtime.js",
    "editor/sections/gacha/gacha-section.js",
    "editor/sections/gacha/gacha-editor-form-runtime.js",
    "editor/sections/gacha/gacha-selection-runtime.js",
    "editor/sections/music/music-section.js",
    "editor/sections/music/music-editor-runtime.js",
    "editor/sections/title/title-section.js",
    "editor/sections/system/system-section.js",
    "editor/sections/notices/notices-section.js",
    "editor/sections/share/share-screen-factory.js",
    "editor/sections/share/share-section.js",
    "editor/sections/members/members-screen-factory.js",
    "editor/sections/members/members-section.js",
  ],
};

/* Group 08
 * owner: compatibility cleanup work
 * adapters only; remove only after mainline callers stop depending on them
 * danger: very high during transition
 * current split:
 *   - thin adapters:
 *     - screens/editor-dashboard-config.js
 *     - screens/editor-dashboard-screen.js
 *     - screens/editor-v1-host.js
 *     - screens/editor-project-context.js
 *     - screens/editor-floating-window.js
 *   - active compatibility implementations still carrying behavior:
 *     - screens/editor-screen.js
 *     - screens/editor-share-screen.js
 *     - screens/editor-member-screen.js
 */
const compatibilityAdaptersGroup = {
  label: "compatibility-adapters",
  scripts: [
    "screens/editor-screen.js",
    "screens/editor-project-context.js",
    "screens/editor-floating-window.js",
    "screens/editor-dashboard-config.js",
    "screens/editor-dashboard-screen.js",
    "screens/editor-share-screen.js",
    "screens/editor-member-screen.js",
    "screens/editor-v1-host.js",
  ],
};

/* Group 09
 * owner: app bootstrap work only
 * app.js must remain last
 */
const activeBootstrapGroup = {
  label: "active-bootstrap",
  scripts: [
    "app.js",
  ],
};

window.SociaScriptManifest = [
  sharedLibrariesStateAuthGroup,
  playScreensGroup,
  systemEditorMainlineAdaptersGroup,
  editorMainlineGroup,
  editorSharedHelpersGroup,
  bootstrapRuntimeFactoriesGroup,
  editorSectionWrappersGroup,
  compatibilityAdaptersGroup,
  activeBootstrapGroup,
];
