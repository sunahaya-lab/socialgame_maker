# app-runtime Split Map 2026-03-31

## Current Role

- Target file:
  - `public/lib/app-runtime.js`
- Current status:
  - active-path de-risking in progress
  - now close to app-level orchestration instead of mixed project/navigation implementation

## Current Size

- `public/lib/app-runtime.js`
  - about `12,476` chars
  - about `337` lines

## Responsibility Bands

### 1. Project Runtime Delegation

- `persistProjectSelection`
- `reloadProjectRuntime`
- `bindProjectControls`
- `upsertProjectInState`
- `syncProjectRecordToRemote`
- `setupProjectControls`
- `renderProjectControlsImpl`

Status:
- delegated to `public/lib/app-project-runtime.js`
- live file keeps only thin wrappers

Risk:
- `Watchlist`

### 2. Project Lifecycle Orchestration

- `initializeProjects`
- `handleCreateProject`
- `renameProject`
- `switchProject`

Status:
- still live in `app-runtime.js`
- but now composed mostly from delegated project-runtime helpers

Risk:
- `Watchlist`

### 3. Navigation Runtime Delegation

- `bindGoButton`
- `setActiveScreenElement`
- `setActiveBottomNav`
- `pauseInactiveScreenAudio`
- `renderActiveScreen`
- `syncBattleLoopForScreen`
- `setupNavigation`
- `navigateTo`

Status:
- delegated to `public/lib/app-navigation-runtime.js`
- live file keeps only thin wrappers

Risk:
- `Watchlist`

### 4. App Shell Helpers

- `applyOrientation`
- `configurePrimaryNavigation`
- `ensureBattleEntryButton`

Status:
- still appropriate in app-level shell

Risk:
- `Safe-to-Watchlist`

### 5. Stable Public Surface

- `getCurrentProject`
- `normalizeProjectRecord`
- `makeProjectRecord`
- `resetEditState`
- `syncProjectQuery`

Status:
- intentionally preserved as explicit public surface

Risk:
- `Safe`

## Current Assessment

`app-runtime.js` is no longer a primary danger file.

The file used to mix:
- project registry logic
- project persistence
- navigation behavior
- DOM wiring
- app-level shell helpers

Now the active implementation is largely split into:
- `public/lib/app-project-runtime.js`
- `public/lib/app-navigation-runtime.js`

The remaining live risk is concentrated in:
- project lifecycle orchestration
- any compatibility surface that still expects `app-runtime.js` to own project/navigation directly

## Next Safe Moves

1. Keep `app-runtime.js` as orchestration-only.
2. Avoid adding new project or navigation bodies back into this file.
3. If further cleanup is needed, target only:
   - project lifecycle orchestration
   - dead compatibility wrappers

## Do Not Do

- Do not re-expand `app-runtime.js` with project CRUD helpers.
- Do not move navigation implementation back from `app-navigation-runtime.js`.
- Do not fold screen-specific rendering logic back into this file.
