- As of 2026-03-31, `public/lib/app-runtime.js` now has a dedicated split map at `docs/current/app-runtime-split-map-2026-03-31.md`, documenting the delegated-orchestrator status after project/navigation extraction.
- As of 2026-03-31, `public/lib/app-runtime.js` now delegates its project runtime band to `public/lib/app-project-runtime.js` and its navigation runtime band to `public/lib/app-navigation-runtime.js`, reducing the live file to about `12,476` chars / `337` lines.
- As of 2026-03-31, `public/screens/editor-screen.js` also wrapped its legacy editor window definition array in `buildEditorWindowDefs()`, making the remaining compatibility window/workspace map easier to scan without changing behavior.
- As of 2026-03-31, `functions/api/system.js` extracted its billing/feature gate band into `functions/api/_system-config-billing.js`, leaving `system.js` as a thinner endpoint-orchestration file over access control, read/write gating, sanitize, and storage calls.
- As of 2026-03-31, `functions/api/_system-config-billing.js` was sectionized into billing-gate entry, required-feature detection, and billing-error text bands, making the last live `system` endpoint support helper easier to review independently.
- As of 2026-03-31, `public/lib/app-runtime.js` moved `upsertProjectInState()` and `syncProjectRecordToRemote()` onto `public/lib/app-project-runtime.js`, further reducing the live project-lifecycle body in the transitional runtime shell.
- As of 2026-03-31, `public/lib/app-runtime.js` also moved `renderProjectControlsImpl()` onto `public/lib/app-project-runtime.js`, so the transitional app runtime shell now keeps less direct project-control DOM rendering.
- As of 2026-03-31, `public/lib/app-runtime.js` also moved `setupProjectControls()` support onto `public/lib/app-project-runtime.js`, leaving less direct project-control DOM setup in the transitional runtime shell.
- As of 2026-03-31, `public/lib/app-runtime.js` also moved default-project creation support onto `public/lib/app-project-runtime.js` via `ensureDefaultProject()`, reducing more of the live initialization body in the transitional runtime shell.
- As of 2026-03-31, `public/lib/app-runtime.js` also moved project local-state creation/rename support onto `public/lib/app-project-runtime.js` via `createProjectLocally()` and `renameProjectLocally()`, shrinking more of the live project mutation band in the transitional runtime shell.
# Code Health Check 2026-03-30

> Priority Band: Strongly Active

## Summary

- Current code size is large enough that local fixes can silently interfere with each other.
- The repository is not fully collapsed, but it is already in a partially unstable state.
- The main risk is not total line count by itself.
- The main risk is a small set of oversized, mixed-responsibility files that sit on critical paths.
- As of 2026-03-30, the following unused editor legacy host files were deleted from `public/screens/`:
  - `editor-legacy-host.js`
  - `editor-base-char-host.js`
  - `editor-character-host.js`
  - `editor-story-host.js`
  - `editor-gacha-host.js`
  - `editor-system-host.js`
  - `editor-project-sections.js`
  - `editor-section-host-registry.js`
- As of 2026-03-31, the boot entry path was annotated for safer staged teardown:
  - `public/index.html`
  - `public/bootstrap-script-manifest.js`
  - `public/bootstrap-dom-loader.js`
  - `public/bootstrap-script-loader.js`
- As of 2026-03-31, `public/bootstrap-script-manifest.js` was also reshaped into named load-order groups without changing runtime order.
- As of 2026-03-31, `public/bootstrap-dom-loader.js` and `public/bootstrap-script-loader.js` were reduced slightly by replacing boot-path magic strings with named constants/helpers.
- As of 2026-03-31, `public/styles.css` now contains section-level split target and sync annotations.
- As of 2026-03-31, `public/lib/app-data.js` now has a dedicated split map at `docs/current/app-data-split-map-2026-03-31.md`, with extraction order fixed before code movement.
- As of 2026-03-31, `public/lib/app-auth.js` now has a dedicated split map at `docs/current/app-auth-split-map-2026-03-31.md`, fixing extraction order before touching session flow.
- As of 2026-03-31, `public/lib/app-auth.js` also extracted its shared utility/helper band into `public/lib/app-auth-utils-runtime.js`.
- As of 2026-03-31, `public/lib/app-auth.js` also extracted its panel lifecycle / bind band into `public/lib/app-auth-lifecycle-runtime.js`.
- As of 2026-03-31, `public/lib/app-auth.js` also moved its profile UI / auth state render active path onto `public/lib/app-auth-profile-ui-runtime.js`, reducing the live file to thin wrapper/orchestration responsibility.
- As of 2026-03-31, `public/lib/app-auth.js` also moved its profile-save / active-title action path onto `public/lib/app-auth-profile-actions-runtime.js`, leaving `restoreSession / submitAuth / handleLogout` as the remaining live auth-session core.
- As of 2026-03-31, `public/lib/app-auth.js` also moved `restoreSession / submitAuth / handleLogin / handleRegister / handleLogout` active path onto `public/lib/app-auth-session-flow-runtime.js`, so the live file is now close to factory wiring and thin shell glue.
- As of 2026-03-31, `public/lib/app-auth.js` cleanup also removed the dead fallback auth/session/UI bodies, leaving the live file close to a thin auth shell over runtime modules.
- As of 2026-03-31, `public/lib/app-data.js` has also been partially hollowed out into delegated modules:
  - `public/lib/app-data-storage.js`
  - `public/lib/app-data-player.js`
  - `public/lib/app-data-normalize.js`
  - `public/lib/app-data-inventory.js`
  - `public/lib/app-data-event.js`
  - `public/lib/app-data-currency.js`
  - `public/lib/app-data-bridge.js`
  - `public/lib/app-data-growth.js`
  - `public/lib/app-data-bootstrap.js`
- As of 2026-03-31, `public/lib/app-data.js` now exposes growth/bootstrap through delegated module exports, while old in-file heavy bodies are explicitly marked as legacy bridges.
- As of 2026-03-31, `public/screens/gacha-screen.js` now delegates:
  - hero / candidate visuals
  - history / info panel
  - setup / selection
  onto:
  - `public/screens/gacha-display-runtime.js`
  - `public/screens/gacha-selection-runtime.js`
  leaving `pullGacha` as the main live danger core.
- As of 2026-03-31, `functions/api/system.js` now has a dedicated split map at `docs/current/system-api-split-map-2026-03-31.md`, fixing extraction order before touching its request/write core.
- As of 2026-03-31, `functions/api/system.js` also extracted its defaults / enum helper band into `functions/api/_system-config-defaults.js`, reducing the live file to about `19,775` chars / `546` lines.
- As of 2026-03-31, `functions/api/system.js` also extracted its event sanitize cluster into `functions/api/_system-config-event-sanitize.js`, reducing the live file further to about `15,092` chars / `441` lines.
- As of 2026-03-31, `public/screens/home-config.js` now delegates its audio settings path to `public/screens/home-config-audio-runtime.js`.
- As of 2026-03-31, `functions/api/system.js` also extracted its layout / asset / folder sanitize cluster into `functions/api/_system-config-layout-sanitize.js`, reducing the live file further to about `10,144` chars / `305` lines.
- As of 2026-03-31, `functions/api/system.js` also extracted its shared persistence cluster into `functions/api/_system-config-storage.js`, reducing the live file further to about `8,312` chars / `239` lines.
- As of 2026-03-31, `functions/api/system.js` also extracted its core sanitize root into `functions/api/_system-config-core-sanitize.js`, leaving the live file close to request/access/billing orchestration only.
- As of 2026-03-31, `public/screens/home-config.js` also delegates panel lifecycle / form sync to `public/screens/home-config-panel-runtime.js`, reducing the live file to about `12,938` chars / `376` lines.
- As of 2026-03-31, `public/screens/home-config.js` also delegates its save path to `public/screens/home-config-save-runtime.js`, reducing the live file further to about `12,143` chars / `359` lines.
- As of 2026-03-31, `public/screens/home-config.js` also delegates its stage preview / drag path to `public/screens/home-config-stage-runtime.js`, reducing the live file further to about `8,098` chars / `272` lines.
- As of 2026-03-31, `public/screens/collection-screen.js` now delegates its grid/filter path onto `public/screens/collection-grid-runtime.js` and its card-detail path onto `public/screens/collection-detail-runtime.js`, leaving the live file close to a thin collection screen shell.
- As of 2026-03-31, `public/screens/story-editor.js` was sectionized into setup / creation / runtime-handle / save-collect / ui-lifecycle / public-surface bands, and its player-label mojibake constant was normalized while keeping the file as a thin story-editor shell.
- As of 2026-03-31, `public/screens/entry-editor.js` also moved its remaining battle-freeze pack-state helper onto `public/editor/sections/card/card-editor-battle-runtime.js`, leaving the live file closer to thin wrappers around a frozen battle boundary.
- As of 2026-03-31, `public/app.js` extracted its top runtime-factory dependency bundles into `buildAppEditorBootstrapFactoryDeps()`, `buildAppApiRuntimeFactoryDeps()`, and `buildAppSingleRuntimeFactoryDeps()`, reducing the live `ensure*FactoryApi` band to thin create wrappers.
- As of 2026-03-31, `public/app.js` also extracted the large `AppLegacyBridgeFactoryLib.create(...)` and `AppSharedFacadeFactoryLib.create(...)` dependency literals into `buildAppLegacyBridgeDeps()` and `buildAppSharedFacadeDeps()`, making the active bridge/facade band easier to scan without changing runtime behavior.
- As of 2026-03-31, `public/app.js` also extracted `buildAppScreenRuntimeFactoryDeps()` and `buildAppInitContentRuntimeFactoryDeps()`, reducing the live `ensureAppScreenRuntimeFactoryApi()` and `ensureAppInitContentRuntimeFactoryApi()` bodies to thin create wrappers.
- As of 2026-03-31, `public/app.js` also wrapped the longest `AppFactoryDepsBuilderLib.create(...)` argument into `buildAppFactoryDepsBuilderDeps()`, so the remaining `ensureAppFactoryDepsBuilderApi()` path is now a thin create wrapper instead of a mixed giant literal.
- As of 2026-03-31, `public/app.js` also extracted `buildAppBootstrapHelperFactoryDeps()`, so the factory/bridge zone now uses named dependency bundle helpers across editor bootstrap, API runtime, single runtime, legacy bridge, shared facade, screen runtime, init-content runtime, factory deps builder, and bootstrap helper bands.
- As of 2026-03-31, `public/app.js` also grouped the remaining `ensureApp*RuntimeFactoryApi()` wrappers into an explicit thin runtime-factory cluster, clarifying that these stay as orchestration entrypoints while their dependency bundles live in named builders.
- As of 2026-03-31, `public/screens/home-screen.js` now delegates:
  - announcements list / visibility / action handling
  - home BGM volume / apply logic
  - dialogue state / relation choice / interaction binding
  - currency / header display
  onto:
  - `public/screens/home-announcement-runtime.js`
  - `public/screens/home-bgm-runtime.js`
  - `public/screens/home-dialogue-runtime.js`
  - `public/screens/home-header-runtime.js`
  - `public/screens/home-event-banner-runtime.js`
  reducing the live danger so that `public/screens/home-screen.js` is now close to a thin orchestrator.
- As of 2026-03-31, the final identified `styles.css` danger core also received local safety hardening:
  - `02D-c draggable character layer` now has explicit base/drag stacking and non-interactive labels
  - `07A-a overlay shell` now stays pointer-transparent while `.home-edit-window` explicitly owns pointer input
- As of 2026-03-31, split CSS references under `public/styles/` have been resynced to the current runtime source for:
  - `SECTION 01`
  - `SECTION 02`
  - `SECTION 03-04`
  - `SECTION 05`
  - `SECTION 06`
  - `SECTION 07`
  - `SECTION 08A`
- Runtime CSS is still single-file on `public/styles.css`; split files remain reference-only.
- As of 2026-03-31, release-focused manual regression coverage and first automation targets are now documented in `docs/current/release-regression-test-playbook-2026-03-31.md`.

## Test Map 2026-03-31

This test map follows the repository `test-strategy` rule:

- use the smallest test type that meaningfully reduces regression risk
- prefer integration checks for boundary-crossing changes
- always include auth / ownership checks when mutation rules change

Current practical limitation:

- there is no established automated browser or API test runner in `package.json`
- current evidence is therefore a mix of:
  - targeted manual integration checks in the browser
  - security-focused reasoning against the active auth/save path
  - `node --check` syntax verification for touched files

### Current Highest-Value Checks

- Integration: auth session restore on reload
  - target files:
    - `public/lib/auth-session-runtime.js`
    - `public/lib/app-auth-session-flow-runtime.js`
    - `public/lib/app-auth.js`
    - `public/app.js`
  - risk:
    - UI shows guest while server still uses owner session
    - stale tab state lets the user misread authority
  - current result:
    - manually verified `2026-03-31`
    - reload after logout returns `authenticated: false`
    - reload while logged in restores owner session to the frontend

- Integration: editor entry and system save permission boundary
  - target files:
    - `public/lib/system-save-runtime.js`
    - `public/editor/sections/system/system-editor-form-app.js`
    - `functions/api/_share-auth.js`
    - `functions/api/system.js`
  - risk:
    - guest/member can mutate shared system config
    - local-only save can be misreported as shared success
  - current result:
    - manually verified `2026-03-31`
    - owner session can enter editor and save
    - after logout and reload, frontend auth state becomes guest
    - guest shared `system` save no longer remains silently authorized via stale frontend state
  - still needed:
    - explicit non-owner member account pass, separate from guest

- Integration: project/member APIs must ignore self-asserted `userId`
  - target files:
    - `functions/api/projects.js`
    - `functions/api/project-members.js`
    - `functions/api/_share-auth.js`
  - risk:
    - owner/member authority can be forged via query/body parameters
  - current result:
    - code path updated to session-based checks only
    - syntax verified `2026-03-31`
  - still needed:
    - live request pass that proves spoofed `userId` is ignored

- Integration: inventory-owned count and navigation path
  - target files:
    - `public/app.js`
    - `public/lib/app-data.js`
    - `public/lib/app-data-inventory.js`
    - `public/lib/app-data-storage.js`
    - `public/lib/app-data-normalize.js`
    - `public/lib/app-legacy-bridge-factory.js`
  - risk:
    - bridge recursion causes `navigateTo` render failure
    - old/new inventory helpers can loop through compatibility surfaces
    - player-owned card data can disappear when local storage scope changes or when `inventory` and `cardInstances` disagree
  - current result:
    - recursive ownership-count delegation was reduced to direct inventory reads
    - compatibility load for legacy `socia-player-state` storage keys was added
    - read-time protection was added so empty `inventory` can be rebuilt from existing `cardInstances`
    - syntax verified `2026-03-31`
    - user reported that visible breakages were reduced after the fix batch
  - still needed:
    - dedicated post-fix browser pass for collection / formation / story lock flows
    - explicit canonical-source decision for `inventory` vs `cardInstances`

### Recommended Smallest Ongoing Coverage

- Unit-level candidates when helpers stabilize:
  - auth-session response normalization
  - owned-card / owned-equipment count from player inventory
  - project ownership resolution from project record + session user

- Integration checks that should be repeated after any auth/save refactor:
  - owner login -> reload -> editor entry -> `system` save -> reload
  - owner logout -> reload -> guest `system` save denied
  - second tab login/logout -> first tab focus -> auth state resync
  - forged `user` query/body value does not change owner/member authority

- E2E path worth keeping as the first future browser automation target:
  - login as owner
  - open project
  - open editor
  - save shared system config
  - reload and confirm persistence
  - logout
  - reload and confirm guest cannot perform the same shared save

### Syntax Verification Completed 2026-03-31

- `public/app.js`
- `public/lib/app-data.js`
- `public/lib/app-auth.js`
- `public/lib/app-auth-session-flow-runtime.js`
- `public/lib/auth-session-runtime.js`
- `public/lib/system-save-runtime.js`
- `functions/api/_share-auth.js`
- `functions/api/projects.js`
- `functions/api/project-members.js`

### Current Test Gaps

- no automated integration or E2E harness is wired into the repository scripts yet
- no dedicated non-owner member regression pass is recorded yet
- no repeatable API-level spoof test is recorded yet for `projects` / `project-members`
- no full post-fix journey pass is recorded yet for:
  - `collection`
  - `formation`
  - character-story ownership gating
- player-owned card state still has a structural watchpoint:
  - `collection` reads `inventory`
  - `formation` reads `cardInstances`
  - long-term canonical source is not fixed yet, so this area should not be treated as fully stable

## Current Measured Size

### Runtime Code

- Files counted: `198`
- Characters counted: `1,372,380`
- Lines counted: `37,090`

### Docs

- Files counted: `58`
- Characters counted: `3,200,223`
- Lines counted: `12,317`

## Large Files

- `public/styles.css`
  - `125,979` chars
  - `5,112` lines
- `public/lib/app-data.js`
  - `61,836` chars
  - `1,571` lines
- `public/app.js`
  - `65,614` chars
  - `1,468` lines
- `public/index.html`
  - `61,501` chars
  - `1,113` lines
- `public/app.legacy.js`
  - `41,902` chars
  - `901` lines
- `public/screens/entry-editor.js`
  - `39,611` chars
  - `835` lines
- `public/screens/formation-screen.js`
  - `34,308` chars
  - `748` lines
- `public/lib/app-editor.js`
  - `30,367` chars
  - `684` lines
- `functions/api/system.js`
  - `23,023` chars
  - `602` lines
- `public/screens/story-editor.js`
  - `20,085` chars
  - `433` lines

## Severity Bands

### Healthy

- Screen or API files with one clear responsibility and under roughly `15,000` chars.
- Small UI/runtime helpers in `public/lib/` that do not rebuild unrelated UI.
- Most single-purpose API files under `functions/api/`.

### Watchlist

- Files in the `15,000` to `30,000` char range.
- Files that merge data normalization, persistence, and fallback logic.
- Files that redraw or mutate DOM owned by another module.

Additional note for `public/lib/app-data.js`:

- This file is still large, but its risk is no longer evenly spread across every subsystem it once owned.
- The remaining danger is now concentrated in:
  - legacy growth / convert bodies
  - legacy bootstrap bodies
  - bridge glue that still keeps old and new paths together

### Dangerous

- Files above `30,000` chars on active feature paths.
- Files above `20,000` chars when they also own multiple responsibilities.
- Files that act as both orchestrator and implementation.
- Files that still coexist with legacy or alternate implementations.

## Current Classification

### Healthy

- `public/screens/story-screen.js`
- `public/screens/base-char-editor.js`
- `public/screens/collection-screen.js`
- `public/screens/story-editor.js`
- `public/screens/gacha-screen.js`
- many small `functions/api/*.js` endpoints outside `system.js`

These are still serviceable because they are screen-local or endpoint-local.

### Watchlist

- `public/lib/app-data.js`
- `public/lib/app-auth.js`
- `public/app.js`
- `public/index.html`
- `public/lib/app-editor.js`
- `public/screens/entry-editor.js`
- `public/screens/home-screen.js`
- `public/screens/home-config.js`
- `public/screens/formation-screen.js`
- `functions/api/system.js`
- `public/lib/app-runtime.js`

These still work, but they are close to the point where small fix becomes cross-feature regression.

Additional note for `public/screens/home-screen.js`:

- This file is still on the watchlist, but it is now close to a thin orchestrator.
- Most former active danger zones have moved into dedicated runtimes:
  - announcements
  - homeBgm
  - dialogue
  - header / currency
  - event banner
- Remaining risk is mainly wrapper drift rather than mixed business logic.

### Dangerous

- `public/styles.css`
- the editor layer overall because `legacy / v1 / current` paths still overlap

Current practical core danger is now concentrated in:

- `public/styles.css`
- the remaining editor compatibility overlap

For `public/styles.css`, the current practical danger is no longer evenly spread across all sections.
It is now concentrated mainly in:

- `SECTION 02D`
- `SECTION 05`
- `SECTION 06`
- `SECTION 08B`

while `SECTION 03` and the safer `SECTION 04` bands are already much closer to reference-stable extraction.

Inside `SECTION 02`, the current practical split is:

- `02A title screen shell`
  - `Safe`
- `02B home stage background + layout overlay`
  - `Watchlist`
- `02C home characters + HUD`
  - `Watchlist`
- `02D home config / placement panel`
  - `Dangerous`
- `02E home ticker / announcements edge`
  - `Safe`

Current practical implication for the `SECTION 02` safe frontier:

- `02A` and `02E` are already reference-stable against [`public/styles/home.css`](../../public/styles/home.css)
- `02C` is now close to reference-stable as well, after removing a small runtime-only duplicate selector pair from [`public/styles.css`](../../public/styles.css)
- `02B` remains watchlist because of overlay/direct-edit coupling, not because of selector drift
- `02D home config / placement panel` is the real local danger core inside `SECTION 02`

Inside `02D`, the practical split is now:

- `02D-a panel shell / labels / inputs`
  - `Stabilized Watchlist`
- `02D-b stage preview shell`
  - `Stabilized Watchlist`
- `02D-c draggable character layer`
  - `Dangerous`
- `02D-d cross-section overlap with SECTION 07`
  - `Dangerous`

The matching `SECTION 07` split is now:

- `07A overlay + floating windows`
  - `Dangerous`
- `07B folder manager + edit panels`
  - `Watchlist`

Inside `07A`, the practical split is now:

- `07A-a overlay shell / pointer-events / z-order`
  - `Dangerous`
- `07A-b floating window geometry / header chrome / menu body`
  - `Watchlist`

This means the real combined CSS danger band is now very specific:

- `02D-c draggable character layer`
- `07A-a overlay shell / pointer-events / z-order`

Reference-only isolation files now exist for both bands:

- [`public/styles/home-config-stage.css`](../../public/styles/home-config-stage.css)
- [`public/styles/home-edit-overlay-core.css`](../../public/styles/home-edit-overlay-core.css)

`public/app.js` is no longer in the same risk band as the monolithic CSS and the old large editor screens.

Note:

- Some legacy editor overlap was reduced by deleting the unused legacy host files listed in the Summary section.
- Compatibility adapters under `public/screens/` still remain on active runtime paths and should not be treated as removable yet.
- `public/index.html` is still dangerous, but runtime-order ownership is now documented in:
  - `public/index.html`
  - `public/bootstrap-script-manifest.js`
  - `public/bootstrap-dom-loader.js`
  - `public/bootstrap-script-loader.js`
- `public/styles.css` is still dangerous, but section ownership and split sync status are now visible in-file and mirrored in `public/styles/`.
- `compatibility-adapters` is no longer one undifferentiated bucket:
  - thin adapters:
    - `public/screens/editor-dashboard-config.js`
    - `public/screens/editor-dashboard-screen.js`
    - `public/screens/editor-v1-host.js`
    - `public/screens/editor-project-context.js`
    - `public/screens/editor-floating-window.js`
  - active compatibility implementations still carrying behavior:
    - `public/screens/editor-screen.js`
    - `public/screens/editor-share-screen.js`
    - `public/screens/editor-member-screen.js`
- As of 2026-03-31, the three thin adapter files above now declare their mainline source in-file and use named mainline globals for easier removal later.
- As of 2026-03-31, `public/screens/editor-project-context.js` now prefers the mainline helper, and `public/screens/editor-floating-window.js` now delegates to a new mainline helper at `public/editor/shared/editor-floating-window.js`.
- As of 2026-03-31, `share/member` compatibility screen creation is no longer referenced directly from `public/editor/shared/editor-special-sections.js`; it now goes through:
  - `public/editor/sections/share/share-screen-factory.js`
  - `public/editor/sections/members/members-screen-factory.js`
- As of 2026-03-31, `public/screens/editor-share-screen.js` and `public/screens/editor-member-screen.js` now prefer mainline project-context and floating-window helpers while retaining compatibility fallbacks.
- As of 2026-03-31, the remaining active compatibility implementation files above now declare in-file that they are still behavior-carrying compatibility layers and should not be deleted like thin adapters.
- As of 2026-03-31, `public/screens/editor-screen.js` was chapterized into dependency intake, compatibility state, render entrypoints, floating window manager, list renderers, and public API, with renderer-level subheadings for safer parallel teardown.
- As of 2026-03-31, `public/screens/editor-screen.js` further sub-divides the floating window manager into `04A window lifecycle` and `04B drag state/pointer bindings`, and centralizes window lookup through `getEditorWindowEl(...)`.
- As of 2026-03-31, `public/screens/editor-screen.js` also extracts `getEditorOverlay(...)`, `prepareEditorWindowMode(...)`, and `createEditorWindowEl(...)`, shrinking the in-function lifecycle blast radius inside `ensureEditorWindow(...)`.
- As of 2026-03-31, `public/screens/editor-screen.js` now uses shared in-file renderer helpers for empty-state rendering and action binding across `05A-05E`, reducing repeated list-render boilerplate.
- As of 2026-03-31, folder-level `README.md` boundaries were added across active frontend/editor/API/current-doc folders, and `AGENTS.md` now treats those folder READMEs as required placement rules during refactor.
- As of 2026-03-31, `public/screens/README.md` now defines explicit criteria for `thin adapter` vs `active compatibility implementation`, plus allowed and rejected change types for screen-side refactor.
- As of 2026-03-31, `public/editor/README.md` and `public/editor/shared/README.md` now define mainline placement rules, shared-helper escape criteria, and rejected change types for editor-side refactor.
- As of 2026-03-31, `public/editor/sections/README.md` now defines section-local vs shared boundaries, required section-folder contents, and the allowed refactor unit inside section folders.
- As of 2026-03-31, section-specific README rules were strengthened for `system`, `notices`, `members`, and `share`, including freeze/ownership boundaries and rejected change types.
- As of 2026-03-31, the remaining section READMEs for `base-char`, `card`, `story`, `music`, `title`, and `gacha` were also upgraded to define section-local boundaries and rejected change types.
- As of 2026-03-31, `public/lib/README.md`, `public/core/README.md`, `functions/api/README.md`, and `docs/current/README.md` were also upgraded to define allowed placement and rejected change types.
- As of 2026-03-31, `public/README.md`, `public/api/README.md`, and `public/styles/README.md` were also upgraded to define placement rules and rejected change types, completing the main folder-boundary pass.
- As of 2026-03-31, `docs/current/README.md` now classifies current docs into `Strongly Active`, `Context / Secondary`, and `Dormant But Kept`, and `docs/README.md` points to that priority scheme.
- As of 2026-03-31, the individual docs under `docs/current/` also now self-label their priority band so they remain classifiable even when opened directly.
- As of 2026-03-31, docs entry was compressed again so that daily work starts from `docs/current/active-doc-shortlist-2026-03-31.md`, while `docs/README.md` no longer acts as a giant flat reading list and `docs/current/README.md` now defines a stricter daily-reading boundary plus next archive candidates.
- As of 2026-03-31, the first docs compression archive pass was completed by moving dormant notes out of `docs/current/` into `docs/archive/2026-03-31/`, including billing/payment links, equipment revival, cafe technical note, title screen implementation note, the `rebuild-v1-*` outline set, and the older `runtime-refactor-priority-list-2026-03-28.md`.
- As of 2026-03-31, docs compression also moved `pages-migration-runbook-2026-03-28.md` into `docs/archive/2026-03-31/`, and moved `audio-asset-guidelines-2026-03-30.md`, `ui-asset-spec-for-figma-2026-03-29.md`, and `ui-asset-size-guide-2026-03-29.md` out of `docs/current/` into `docs/reference/`.
- As of 2026-03-31, `AGENTS.md` now defines explicit repo-wide hooks for refactor, docs updates, UTF-8/text changes, CSS changes, and boot/runtime changes.
- As of 2026-03-31, those hooks also explicitly forbid casual cross-layer imports and defaulting new feature styling into the monolithic `public/styles.css`.
- As of 2026-03-31, `AGENTS.md` and `public/README.md` also define an explicit allowed dependency direction for frontend/backend layers.
- As of 2026-03-31, `public/lib/app-editor-section-runtime-factory.js` was explicitly marked and chapterized as a transitional shared editor-runtime wiring layer, clarifying that it is not the intended long-term mainline location.
- As of 2026-03-31, `public/lib/app-editor-bootstrap-factory.js` and `public/lib/app-editor-runtime-factory.js` were also marked and chapterized as transitional editor bootstrap/runtime wiring layers under `public/lib/`.
- As of 2026-03-31, `public/lib/README.md` also now documents those editor wiring files as explicit transitional exceptions and forbids adding new section-local editor wiring to `public/lib/`.
- As of 2026-03-31, `public/editor/README.md` also now names `public/editor/` and `public/editor/shared/` as the future receiving side for those transitional editor wiring layers.
- As of 2026-03-31, `public/editor/editor-runtime-factory.js` was promoted to mainline, `public/lib/app-editor-runtime-factory.js` was reduced to a thin compatibility adapter, and the manifest now loads the mainline file before the adapter.
- As of 2026-03-31, `public/editor/editor-bootstrap-factory.js` was also promoted to mainline, `public/lib/app-editor-bootstrap-factory.js` was reduced to a thin compatibility adapter, and the manifest now loads the mainline file before the adapter.
- As of 2026-03-31, `public/editor/editor-section-runtime-factory.js` was also promoted to mainline, `public/lib/app-editor-section-runtime-factory.js` was reduced to a thin compatibility adapter, and the manifest now loads the mainline file before the adapter.
- As of 2026-03-31, `public/lib/app-editor.js` was explicitly marked and chapterized as a transitional shared editor module, with sections for shared setup, share panel runtime, gacha helpers, shared editor wiring helpers, config persistence/folder controls, and public surface.
- As of 2026-03-31, the share-panel/project-member runtime portion of `public/lib/app-editor.js` was extracted into `public/editor/sections/share/share-panel-runtime.js`, and `app-editor.js` now delegates that behavior to the section-local helper.
- As of 2026-03-31, the gacha form helper portion of `public/lib/app-editor.js` was also moved onto a section-local active path via `public/editor/sections/gacha/gacha-editor-form-runtime.js`; legacy in-file bodies remain for later cleanup, but the active helper delegation now lives in the gacha section folder.
- As of 2026-03-31, the remaining large `SECTION 04` functions in `public/lib/app-editor.js` (`handleGachaSubmit`, `beginGachaEdit`, `resetGachaForm`) were also made inert via immediate helper delegation, so the leftover legacy body is now unreachable even before full physical deletion.
- As of 2026-03-31, the old `SECTION 04` gacha bodies are now wrapped as retired blocks, and the old `SECTION 06A` folder-helper block is also wrapped as a retired comment block. The active path is now visually concentrated in `SECTION 04B` and `SECTION 06B`.
- As of 2026-03-31, `public/lib/app-editor.js` now also sub-divides `SECTION 05` into active shared-wiring helpers (`05A submit-label sync`, `05B gacha featured bridge`, `05C base-character option sync`), clarifying that this section is still live shared behavior rather than legacy cleanup residue.
- As of 2026-03-31, the `SECTION 05A` submit-label sync portion of `public/lib/app-editor.js` now delegates onto `public/editor/shared/editor-form-sync-runtime.js`, so the thinnest shared helper in that section has started moving into the editor mainline shared layer.
- As of 2026-03-31, the `SECTION 05B` gacha featured-selection bridge in `public/lib/app-editor.js` now delegates onto `public/editor/sections/gacha/gacha-selection-runtime.js`, reducing another small section-local helper from the mixed transitional module.
- As of 2026-03-31, the `SECTION 05C` base-character option sync in `public/lib/app-editor.js` now delegates onto `public/editor/shared/editor-base-char-option-sync-runtime.js`, moving another cross-form shared helper into the editor mainline shared layer.
- As of 2026-03-31, the old `SECTION 05A` and `SECTION 05C` bodies in `public/lib/app-editor.js` are now wrapped as retired blocks, so the active path in that section is visually concentrated in the thin delegations to editor mainline helpers.
- As of 2026-03-31, the standalone legacy `populateFolderSelects` body in `public/lib/app-editor.js` was also wrapped as a retired block, further shrinking the live surface left in `SECTION 06A`.
- As of 2026-03-31, the folder-controls/shared-persistence portion of `public/lib/app-editor.js` was also moved onto a shared active path via `public/editor/shared/editor-folder-runtime.js`; legacy in-file bodies remain for later cleanup, but the active helper delegation now lives in the editor shared layer.
- As of 2026-03-31, `public/lib/app-editor.js` now explicitly marks `SECTION 06A` as legacy folder-helper bodies and `SECTION 06B` as the active delegated path, so byte-safe incremental cleanup can continue without ambiguity.
- As of 2026-03-31, the remaining large `SECTION 06A` functions in `public/lib/app-editor.js` (`persistSystemConfigState`, `createContentFolder`, `ensureEditorFolderControls`, `ensureFolderControlRow`) were made inert via immediate helper delegation, so the leftover legacy body is now unreachable even before full physical deletion.

These are the files most likely to produce:

- fixes that appear not to apply
- UI that changes in one path but is overwritten by another
- repeated regressions after unrelated edits
- increased dependence on manual human spotting rather than reliable local reasoning

## Why The App Still Works

- The app still has a simple top-level product shape.
- Shared content and player state are still conceptually separated.
- API boundaries still exist.
- Many failures have been corrected immediately after discovery instead of being left to accumulate.
- Legacy code has often been bypassed rather than fully deleted, which avoided some total breakages.
- Human review has been catching visible failures quickly.

In short:

- The app is still standing because active repair has compensated for structural drift.
- The app is not standing because the current structure is robust.

## Is 1.37M Characters Appropriate?

For a product with this many surfaces:

- home
- story
- gacha
- collection
- formation
- editor
- auth
- projects
- shared/player persistence

the total repo size is not shocking by itself.

What is not appropriate is this concentration:

- `app.js` over `65k`
- `index.html` over `61k`
- `styles.css` over `125k`
- several editor files over `20k` to `40k`

So the conclusion is:

- total size is not the real red flag
- concentration and overlap are the real red flags

## Practical Thresholds

- under `10,000` chars
  - usually safe for local changes
- `10,000` to `20,000` chars
  - should be monitored
- `20,000` to `40,000` chars
  - risky unless single-purpose
- above `40,000` chars
  - should be treated as a refactor target

For this repo, these thresholds matter more on:

- active UI files
- orchestration files
- shared state normalization files
- editor host files

## Immediate Priorities

1. Split `public/app.js`
   - keep only bootstrap, wiring, init order, and thin `window.*` bridges
2. Split `public/index.html`
   - especially the giant editor DOM blocks
3. Split `public/styles.css`
   - tokens/base/layout/component/screen level
4. Freeze the editor execution line
   - explicitly decide which editor path is authoritative
5. Split `public/lib/app-data.js`
   - start with storage/scope helpers and player identity/profile persistence
   - do not begin with `loadAllData`
   - do not begin with growth/convert logic
5. Reduce “cross-owner redraw”
   - one module should not rebuild another module’s select/input DOM

## Recommended Refactor Order

1. `public/app.js`
2. `public/lib/app-data.js`
3. `public/lib/app-editor.js`
4. `public/index.html`
5. `public/styles.css`
6. large editor screens

## Multi-Window vs Single-Window Work

### Prefer This Single Window For

- design and architecture decisions
- health diagnosis
- deciding responsibility boundaries
- changes that touch one critical path end-to-end
- fixes where multiple files must stay mentally aligned

This window is better when the task depends on preserving one coherent mental model.

### Prefer Multiple Windows Or Parallel Workers For

- independent read-only surveys
- counting, cataloging, or ranking files
- isolated refactors with disjoint write sets
- one file per worker when those files do not depend on the same unfinished local rewrite

Parallel work is useful only when the output boundaries are strict.

### Do Not Split Across Multiple Windows When

- the same feature spans `app.js`, `index.html`, `styles.css`, and a screen module
- there is known legacy overlap
- UI and data ownership are still unclear
- one worker might “fix” markup while another “fixes” runtime assumptions

That is exactly how duplicated or conflicting fixes happen.

## Recommendation For Current Phase

- Keep diagnosis, scope decisions, and refactor planning in one window.
- Use parallel work only for narrow read-only inspection or clearly isolated file groups.
- Do not split active runtime surgery across multiple windows until the editor path and bootstrap path are cleaner.

## Release-Phase Rule

Until release stabilization is complete:

- avoid adding new core runtime abstractions unless they remove existing complexity
- avoid touching `public/app.js`, `public/index.html`, and `public/styles.css` in the same task unless strictly necessary
- when a fix starts failing repeatedly, stop and classify whether it is:
  - a local bug
  - a hidden ownership conflict
  - a structural refactor trigger

## Current Progress Against The Dangerous Files

### `public/index.html`

- Still dangerous as a runtime entry point.
- Safer than before for multi-window work because:
  - active CSS source-of-truth is annotated in-file
  - boot entry danger/safe rules are annotated in-file
  - runtime order is explicitly delegated to `bootstrap-script-manifest.js`

### `public/styles.css`

- Still dangerous as the active runtime stylesheet.
- Safer than before for staged extraction because:
  - `SECTION 01-08` markers exist
  - ownership and danger notes exist
  - split targets and sync status now exist in-file
  - reference split files now mirror the current runtime source

### `public/styles/`

- `tokens.css`, `base.css`, `home.css`, `gameplay.css`, `editor-*.css`, `home-edit*.css`, and `responsive.css`
  now reflect current runtime truth as reference files.
- `responsive.css` now mirrors `SECTION 06A-06E` and `08A`.
- `08B` remains intentionally local to `public/styles.css`.

## Bottom Line

- The codebase is not beyond recovery.
- It is already beyond the “keep adding features casually” stage.
- The next wins should come from concentration reduction, not feature growth.

## 2026-03-31 Recheck

### Current Measured Size Snapshot

- Runtime code
  - Files counted: `221`
  - Characters counted: `1,493,513`
  - Lines counted: `44,421`
- Docs
  - Files counted: `61`
  - Characters counted: `389,895`
  - Lines counted: `17,861`

Note:

- The docs total above was re-counted with a narrower file filter than the original top-of-file count.
- Use it as a same-day snapshot, not as a strict apples-to-apples comparison with the first 2026-03-30 docs number.

### High-Risk File Delta Since The First Check

- `public/app.js`
  - then: `65,614` chars / `1,468` lines
  - now: `51,953` chars / `1,043` lines
  - status: improved from `Dangerous` to `Watchlist`
- `public/index.html`
  - then: `61,501` chars / `1,113` lines
  - now: `25,939` chars / `514` lines
  - status: improved from `Dangerous` to strong `Watchlist` / near-healthy bootstrap entry
- `public/styles.css`
  - then: `125,979` chars / `5,112` lines
  - now: `133,329` chars / `5,427` lines
  - status: still `Dangerous`
- `public/lib/app-data.js`
  - then: `66,199` chars / `1,521` lines
  - now: `69,527` chars / `1,743` lines
  - status: moved from `Watchlist` toward `Dangerous`
- `public/screens/entry-editor.js`
  - then: `39,611` chars / `835` lines
  - now: `44,290` chars / `1,084` lines
  - status: size still large, but active-path danger is now significantly reduced through section-local runtime delegation
- `public/screens/formation-screen.js`
  - then: `34,308` chars / `748` lines
  - now: `34,308` chars / `825` lines
  - status: still `Dangerous`
- `public/lib/app-editor.js`
  - then: `30,367` chars / `684` lines
  - now: `30,938` chars / `747` lines
  - status: still `Dangerous`
- `public/editor-screen.partial.html`
  - now: `29,845` chars / `583` lines
  - note: this is the displaced editor DOM mass that used to sit inside `public/index.html`

### What Actually Improved

- `public/app.js` is no longer the single largest active runtime bottleneck.
- `public/index.html` is much closer to a real entry file after:
  - script loading moved into bootstrap loader files
  - editor DOM moved into `public/editor-screen.partial.html`
- Refactor debugging confirmed that the main failure mode is now dependency wiring gaps, not one giant bootstrap file collapsing all by itself.

### What Became The Main Risk Instead

- `public/styles.css`
  - now the largest active frontend file by a wide margin
  - still the most likely place for “fix applied but visually overwritten elsewhere”
  - however, risk is now much better localized than on the first check
  - the following areas are now effectively reference-synced and classifiable as safer subzones:
    - `SECTION 03 gacha`
    - `SECTION 04 battle`
    - `SECTION 04 collection`
    - `SECTION 04 card detail`
    - `formation-battle-entry`
    - `formation-party`
    - `formation-equipment`
  - the main remaining CSS danger is no longer “all gameplay styling”
  - the main remaining CSS danger is concentrated in:
    - `formation-convert`
    - `formation-growth-detail`
    - `SECTION 06 responsive/orientation overrides`
    - `SECTION 08B tail additions`
- `public/lib/app-data.js`
  - grew while stabilizing runtime behavior
  - now carries too much normalization, merge, persistence, and fallback responsibility
- `public/screens/entry-editor.js`
  - still large on disk, but relation, SD, form apply/reset, crop, and save paths now run through section-local runtimes
  - remaining live danger is much more concentrated in frozen `battle editor` and in-file legacy bodies that have not been physically removed yet
- `public/screens/formation-screen.js`
  - still large on disk, but equipment, party, card-list, growth-detail, and convert paths now run through dedicated runtimes
  - internal split map is now documented in `docs/current/formation-screen-split-map-2026-03-31.md`
  - remaining risk is now more about legacy in-file bodies still remaining earlier in the file than about the active runtime path itself

### Updated Severity Summary

- Improved:
  - `public/app.js`
  - `public/index.html`
- Improved but still not yet safe:
  - `public/styles.css`
    - danger now localized rather than fully diffuse
- Still primary danger:
  - `public/lib/app-data.js`
  - `public/lib/app-editor.js`
- Watchlist with active-path de-risking completed:
  - `public/screens/entry-editor.js`
  - `public/screens/formation-screen.js`
    - active path now delegated and duplicate in-file live bodies trimmed
    - current size is down to about `10,872` chars / `332` lines
- `public/screens/base-char-editor.js`
  - voice / relation / lifecycle / expression / save paths are now delegated
  - current size is down to about `9,205` chars / `263` lines
- `public/screens/story-editor.js`
  - story-fx / type / bgm UI helper path is now delegated to `public/editor/sections/story/story-editor-ui-runtime.js`
  - edit lifecycle is now also delegated to `public/editor/sections/story/story-editor-lifecycle-runtime.js`
  - scene builder is now also delegated to `public/editor/sections/story/story-editor-scene-runtime.js`
  - save / billing / persistence is now also delegated to `public/editor/sections/story/story-editor-save-runtime.js`
  - current size is down to about `6,740` chars / `181` lines
  - active path is now orchestrator-level; remaining risk is mostly legacy residue rather than live logic concentration
- `public/screens/gacha-screen.js`
  - hero / candidate visuals and history / info panel are now delegated to `public/screens/gacha-display-runtime.js`
  - setup / selection is now also delegated to `public/screens/gacha-selection-runtime.js`
  - current size is down to about `6,521` chars / `202` lines
  - active danger is now largely concentrated in `pullGacha`

### Updated Recommendation

The next concentration-reduction targets should be:

1. `public/lib/app-data.js`
2. `public/styles.css` danger core only:
   - `formation-convert`
   - `formation-growth-detail`
   - `SECTION 06`
   - `SECTION 08B`
3. `public/screens/entry-editor.js`
4. `public/screens/formation-screen.js` legacy cleanup only if needed

The important shift since the first check is:

- The repo is still large.
- But the center of risk moved.
- `app.js` and `index.html` are no longer the first emergency targets.
- `styles.css` and `app-data.js` became the most important stabilization files.
- Since then, `styles.css` has been partially de-risked by section and sub-area mapping.
- The next dominant stabilization target is increasingly `public/lib/app-data.js`.
- `public/lib/app-editor.js`
  - retired blocks for `SECTION 04`, `SECTION 05A`, `SECTION 05C`, and the old `SECTION 06A` folder-helper bodies were physically removed
  - active path is now much more clearly concentrated in delegation wrappers and runtime helpers
  - `setupPreviews` / `previewImage` active path moved to `public/editor/shared/editor-preview-runtime.js`
  - share button binding and share-panel ensure path now flow through `public/editor/sections/share/share-panel-runtime.js`
  - `setupForms` active path moved to `public/editor/shared/editor-form-setup-runtime.js`
  - `getEditorApiMethod` remains in `app-editor.js` as an intentional thin compatibility bridge to the legacy editor screen surface
  - `SECTION 03` share/project-member wrappers were collapsed onto a single `callSharePanelRuntime(...)` bridge, making that section visibly thin

- `public/screens/editor-screen.js`
  - `SECTION 04` window lifecycle now flows through local helpers (`getEditorOverlay`, `prepareEditorWindowMode`, `createEditorWindowEl`) instead of repeated DOM lookup
  - `SECTION 05A-05F` now share in-file renderer helpers for empty-state rendering and action/toggle binding, so the list and picker renderers follow one pattern
  - `SECTION 06` now explicitly marks which tabs still depend on this compatibility implementation versus newer mainline runtimes

- `public/lib/app-data.js`
  - the high-risk bootstrap head is now sectioned into dependency intake, storage/normalize bootstrap, player/inventory bootstrap, and event/currency/bridge/growth bootstrap
  - repeated TDZ crashes at module construction were reduced by deferring forward references (`getCurrentPlayerId`, `getPlayerCurrencyAmount`, `addGrowthResources`) through thin wrapper functions
  - the rest of the file is now also split into explicit zones for legacy bridge bodies, active load/persistence runtime, and the final public module surface
  - `SECTION 05` is now also subdivided into player/profile bootstrap, story/inventory bridge, instance bridge, growth bridge, and bootstrap-record bridge
  - `SECTION 05A` and `05B` are now explicitly marked as retained in-file reference bodies; active callers already use the earlier `playerApi` and `inventoryApi` surfaces
  - `SECTION 05C` is now also explicitly marked as retained in-file reference; active instance/inventory callers already use the earlier `inventoryApi` surface
  - `SECTION 05D` is now also explicitly marked as retained in-file reference; active growth/evolve/convert callers already use the earlier `growthApi` surface
  - `SECTION 05E` is now also explicitly marked as retained in-file reference; active bootstrap-record and bootstrap-load callers already use the earlier `bootstrapApi` surface
  - retained in-file reference bodies for `SECTION 05A` and `05B` were physically removed; those zones are now reduced to retirement notes because active callers already use `playerApi` and `inventoryApi`
  - retained in-file reference body for `SECTION 05C` was physically removed; that zone is now reduced to a retirement note because active instance/inventory callers already use `inventoryApi`
  - retained in-file reference body for `SECTION 05E` was physically removed; that zone is now reduced to a retirement note because active bootstrap callers already use `bootstrapApi`
  - the remaining heavy `SECTION 05D` growth bridge is now internally split into growth-state mutators, card operations, equipment operations, and bulk conversion helpers
  - `SECTION 05D-A` is now explicitly marked as a still-live low-level bridge because the retained `05D-B/05D-C/05D-D` operations still call it internally
  - retained in-file reference body for `SECTION 05D-D` was physically removed; bulk conversion callers already use the public `growthApi` surface
  - retained in-file reference body for `SECTION 05D-C` was physically removed; equipment growth/evolve/limit-break/convert callers already use the public `growthApi` surface
  - retained in-file reference body for `SECTION 05D-A` was also removed; after retiring `05D-B/05D-C/05D-D`, no higher-level callers remained and `growthApi` is the only active path
  - retained in-file reference body for `SECTION 06` (`_legacyLoadAllData`) was removed; active load/persistence already comes from `bootstrapApi`
  - `public/lib/app-core-runtime-factory.js` is now sectioned into dependency intake, app runtime bootstrap, app data bootstrap, and public factory surface so its remaining bootstrap-risk zones are visible before extraction
  - `public/lib/app-core-runtime-factory.js` now isolates its `AppRuntimeLib.create(...)` and `AppDataLib.create(...)` wiring objects into dedicated bundle helpers, making the remaining bootstrap dependency sets easier to extract safely
  - `public/lib/app-core-runtime-factory.js` now also self-documents the allowed boundary for each bundle helper so unrelated player/editor UI wiring is less likely to leak into the wrong create-set
  - `public/lib/app-runtime.js` is now sectioned into dependency intake, project lifecycle, primary navigation, app mode/orientation helpers, and public surface so its remaining active danger is localized before extraction
  - `public/lib/app-runtime.js` now isolates repeated project URL/selection/reload steps and navigation bind/activation steps into in-file helpers, reducing diffuse bootstrap logic inside `SECTION 02/03`
  - `public/lib/app-runtime.js` now also isolates screen-audio pause, active screen render dispatch, and battle-loop sync out of `navigateTo()`, making the remaining navigation core narrower
  - `public/lib/app-project-runtime.js` now holds the shared project-lifecycle support helper (`projects` API URL, selection persistence, project reload, project control bind), and `app-runtime.js` delegates to it first
  - `public/lib/app-runtime.js` now also isolates remote project sync and in-state upsert helpers, reducing repeated create/rename project mutation paths inside `SECTION 02`
  - `public/lib/app-navigation-runtime.js` now holds the shared navigation support helper (go-button bind, active screen/nav sync, audio pause, render dispatch, battle-loop sync), and `app-runtime.js` delegates to it first
  - `public/lib/app-auth.js` is now sectioned into dependency intake, auth panel lifecycle, session flow, profile actions, state sync, render helpers, and public surface so its mixed auth/UI danger is localized before extraction
  - `public/lib/app-auth-panel-runtime.js` now holds the fallback auth button/panel creation and ESC-close bind path, and `app-auth.js` delegates to it before using its in-file fallback
  - `public/lib/app-auth-session-flow-runtime.js` now holds auth session restore and submit flow, and `app-auth.js` delegates to it before using its in-file fallback
  - `public/lib/app-auth-profile-ui-runtime.js` now holds profile editor toggle, profile form sync, title select sync, and auth summary render helpers, and `app-auth.js` delegates to it before using its in-file fallback
  - `public/lib/app-auth-profile-actions-runtime.js` now holds profile save, active-title update, and logout flow, and `app-auth.js` delegates to it before using its in-file fallback
  - `public/screens/formation-screen.js` is now re-sectioned as a delegated bridge (`runtime binding`, `render entrypoints`, `party/card/equipment bridge`, `growth detail bridge`, `convert controls bridge`, `public surface`) so the remaining cleanup can target wrapper groups instead of the whole file
  - `public/screens/formation-screen.js` now also isolates top-level section render flow and shared slot/drag setters, making the remaining wrapper groups more uniform before further extraction
  - `public/screens/formation-screen.js` now uses named state accessors/setters for convert/growth/drag/detail bridge wiring, reducing ad-hoc inline closures and making wrapper groups more uniform
  - `public/screens/entry-editor.js` is now re-sectioned as a delegated bridge (`runtime binding`, `local DOM/state`, `apply/save flow`, `crop`, `SD`, `battle`, `relations`, `public surface`) so the remaining retained in-file bodies are localized before extraction
  - `public/screens/entry-editor.js` now also distinguishes retained crop/SD/battle/reference bodies from active delegation zones (`04A/04B`, `05A`, `06A/06B/06C`, `07A/07B`) so later cleanup can remove duplicated bodies in smaller passes without touching active save flow
  - `public/screens/entry-editor.js` retired and physically removed the old relation/home-voice retained body, so `SECTION 07` now reads as a retirement note plus the active `relationsApi` delegation path
  - `public/screens/entry-editor.js` also retired the duplicated battle pack/save helper copies that existed above the active save-path helpers, so `SECTION 06` now reads as one in-file battle implementation plus the active `06C` save/pack helper path instead of two overlapping helper layers
  - `public/screens/entry-editor.js` also retired the old in-file SD editor body, so `SECTION 05` now reads as a retirement note plus the active `sdApi` delegation path
  - `public/screens/entry-editor.js` also retired the old in-file crop editor body, so `SECTION 04` now reads as a retirement note plus the active `cropApi` delegation path
  - `public/editor/sections/card/card-editor-battle-runtime.js` now holds the battle editor implementation, and `public/screens/entry-editor.js` delegates its battle UI/body methods there, leaving `SECTION 06` as a retirement note plus active battle/save helper paths
  - `public/screens/entry-editor.js` also retired the old in-file save-path body, so `SECTION 03` now reads as a retirement note plus the active `saveApi` delegation path
