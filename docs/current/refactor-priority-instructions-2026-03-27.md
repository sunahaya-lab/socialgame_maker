# Refactor Priority Instructions

Date: 2026-03-27
Purpose:
- Organize the current refactoring candidates into a practical execution order.
- Provide a staged instruction sheet that can be followed after the ongoing `player-state` fixes.

Important note:
- `docs/current/player-state-api-fix-notes-2026-03-27.md` is currently being handled separately.
- This document excludes that work and focuses on the remaining refactor debt.

## Overall Rule

Proceed in order.

1. Finish Stage 1 first
2. Only move to Stage 2 after Stage 1 is stable
3. Only move to Stage 3 after Stage 2 is stable

Do not parallelize large structural refactors across multiple unstable areas at the same time.

## Stage 1: Do Next

These are the refactors that should be done first, because they reduce the highest ongoing maintenance risk and affect too many later changes.

### 1. Bootstrap Boundary Cleanup

Target files:
- `public/app.js`
- `public/app.legacy.js`
- `public/index.html`
- `public/lib/app-runtime.js`
- `public/lib/app-data.js`
- `public/lib/app-ui.js`
- `public/lib/app-home.js`
- `public/lib/app-editor.js`

Why now:
- `app.js` and `app.legacy.js` still duplicate orchestration responsibility.
- `index.html` still depends on a long script-load chain and `window.*` globals.
- This makes every later screen/module refactor harder and riskier.

Required direction:
- Define one active bootstrap path.
- Treat `app.legacy.js` as backup/reference only, not a parallel runtime path.
- Reduce boot-time responsibility in `app.js` to orchestration only:
  - state initialization
  - module wiring
  - startup
  - minimal `window.*` exposure
- Make script loading and dependency order easier to reason about.

Completion condition:
- The active runtime has one clear bootstrap path.
- `app.js` is thinner than it is now.
- Legacy code remains clearly separated from the active execution line.

### 2. Split `system-editor.js`

Target files:
- `public/screens/system-editor.js`
- possible new helpers under `public/screens/` or `public/lib/`

Why now:
- This file currently mixes:
  - system form rendering
  - layout preview generation
  - pointer interaction logic
  - home asset library management
  - home folder management
  - free-part editing
  - save handling
- It is already large enough to block safe iteration.

Required direction:
- Split by responsibility, not by arbitrary line count.
- Suggested separation:
  - system form/controller
  - home layout preview/controller
  - asset library and folder manager
  - free/custom parts editor

Completion condition:
- The main `system-editor.js` file becomes an orchestrator, not a monolith.
- Preview interaction logic is isolated from form submission logic.

### 3. Split `home-edit-workspace.js`

Target files:
- `public/screens/home-edit-workspace.js`
- possible new helpers under `public/screens/` or `public/lib/`

Why now:
- This file currently mixes:
  - workspace shell
  - floating window state
  - drag handling
  - folder management
  - asset management
  - part editing
  - render functions
  - persistence scheduling
- It is a high-change area and likely to keep growing.

Required direction:
- Separate:
  - workspace shell/window manager
  - asset/folder operations
  - part/property editing
  - render helpers
  - persistence/sync behavior

Completion condition:
- The file is no longer the single owner of every home editing concern.
- UI window management and content editing logic are no longer tightly interleaved.

## Stage 2: Do After Stage 1 Stabilizes

These are important, but they should wait until the runtime/bootstrap and biggest editor modules are less fragile.

### 4. Shared API Sanitizer Consolidation

Target files:
- `functions/api/base-chars.js`
- `functions/api/entries.js`
- `functions/api/gachas.js`
- `functions/api/stories.js`
- `functions/api/equipment-cards.js`
- possible new helper such as `functions/api/_content-sanitize.js`

Why later:
- The API fixes should remain readable while the authorization/content issues are still being corrected.
- Once behavior is stable, duplicated sanitizer logic should be consolidated.

Current duplication examples:
- text trimming helpers
- image source sanitization
- relation list sanitization
- repeated record/object normalization

Required direction:
- Extract shared sanitizers without changing endpoint behavior.
- Keep endpoint files focused on:
  - request handling
  - access control
  - persistence

Completion condition:
- Shared content endpoints stop re-implementing the same sanitizer primitives.
- Behavioral compatibility is preserved.

### 5. API Transport Helper Consolidation

Target files:
- `functions/api/_share-auth.js`
- `functions/api/_player-state.js`
- possible new shared helper file

Why later:
- There are already separate helper clusters for:
  - `createCorsHeaders`
  - `json`
  - `readJson`
- This is worth consolidating, but it should not be mixed into the active security/behavior fixes unless needed.

Required direction:
- Create one shared API utility layer for common response/request helpers.
- Keep domain-specific helpers separate from generic transport helpers.

Completion condition:
- Response/CORS helper behavior is defined in one place.
- Shared helpers do not duplicate trivial infrastructure logic.

## Stage 3: Can Wait

These should be cleaned up, but they are less urgent than the runtime and editor structure problems.

### 6. CSS Source-Of-Truth Resolution

Target files:
- `public/styles.css`
- `public/styles/`
- `public/index.html`

Why later:
- The current stabilization rule is to keep `public/styles.css` as the trusted runtime file.
- Split CSS already exists, but is not the active runtime source.
- This is important, but not before the runtime/editor structure is safer.

Required direction:
- Decide one source of truth.
- Either:
  - keep single-file CSS as the authoritative source for now, or
  - adopt split CSS as source of truth with an explicit assembly path
- Avoid long-term dual maintenance.

Completion condition:
- The team can answer clearly which CSS files are authoritative.
- No future styling work needs to be duplicated across both paths.

### 7. Global `window.*` Surface Reduction

Target files:
- `public/index.html`
- `public/app.js`
- `public/lib/*.js`
- `public/screens/*.js`

Why later:
- This is valuable, but it overlaps with the Stage 1 bootstrap work.
- It should be handled incrementally after the app’s active initialization flow is clearer.

Required direction:
- Reduce unnecessary global exposure.
- Keep only the small set of runtime hooks that truly need to be globally reachable.
- Prefer passing dependencies explicitly where the current architecture allows it.

Completion condition:
- New modules do not automatically add new `window.*` exports unless justified.
- The global namespace shrinks over time instead of continuing to expand.

## Recommended Execution Order

Follow this exact order unless a blocking bug forces reprioritization.

1. Finish current `player-state` fixes
2. Stage 1.1 Bootstrap boundary cleanup
3. Stage 1.2 Split `system-editor.js`
4. Stage 1.3 Split `home-edit-workspace.js`
5. Re-check runtime stability
6. Stage 2.4 Shared API sanitizer consolidation
7. Stage 2.5 API transport helper consolidation
8. Re-check API behavior and editor flow
9. Stage 3.6 CSS source-of-truth cleanup
10. Stage 3.7 Global `window.*` surface reduction

## Guardrails

- Do not mix large refactors with unrelated feature additions.
- Do not re-expand `public/app.js` while trying to thin it.
- Do not reintroduce the old giant editor model while splitting editor files.
- Do not switch CSS source-of-truth mid-refactor without making that decision explicit.
- Prefer “stabilize and isolate” over “rewrite everywhere at once.”

## Done Criteria For This Instruction Sheet

This instruction sheet can be considered fully executed when:

- Stage 1 items are complete and the app still opens cleanly
- Stage 2 items are complete without changing API behavior unexpectedly
- Stage 3 items leave one clearer source of truth for styling and globals
- The project is easier to review because large runtime/editor responsibilities are no longer piled into a few oversized files
