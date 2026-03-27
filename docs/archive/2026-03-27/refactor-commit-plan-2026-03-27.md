# Refactor Commit Plan

Date: 2026-03-27
Based on:
- `docs/current/refactor-priority-instructions-2026-03-27.md`

Purpose:
- Break the refactor instructions into execution-ready tasks.
- Keep each task small enough to review and revert independently.
- Use a practical rule: one task equals one commit whenever possible.

## Working Rule

Use this as the default execution model:

1. Complete one task
2. Verify that only that concern changed
3. Commit that task alone
4. Move to the next task

Do not combine multiple structural refactors into one commit unless they are inseparable in practice.

## Stage 1 Commit Plan

These are the first tasks to run after the ongoing player-state fixes are complete.

### Commit 1. Bootstrap Entry Cleanup

Goal:
- Reduce `public/index.html` responsibility to loading the active runtime path cleanly.

Primary files:
- `public/index.html`

Allowed secondary files:
- `public/app.js`

Task:
- Remove any unnecessary ambiguity around the active runtime path.
- Make the bootstrap chain easier to read.
- Keep runtime behavior unchanged.

Commit message suggestion:
- `Clarify active frontend bootstrap path`

### Commit 2. App Bootstrap Surface Reduction

Goal:
- Make `public/app.js` thinner and more orchestration-focused.

Primary files:
- `public/app.js`

Allowed secondary files:
- `public/lib/app-runtime.js`
- `public/lib/app-data.js`
- `public/lib/app-ui.js`
- `public/lib/app-home.js`
- `public/lib/app-editor.js`

Task:
- Move orchestration-adjacent but non-bootstrap logic out of `app.js`.
- Keep only startup, wiring, and minimum global hooks.

Commit message suggestion:
- `Reduce app bootstrap responsibilities`

### Commit 3. Legacy Runtime Boundary Lock

Goal:
- Make it explicit that `public/app.legacy.js` is reference/backup, not the active line.

Primary files:
- `public/app.legacy.js`
- `public/app.js`
- `public/index.html`

Task:
- Remove ambiguity about whether legacy code is a live runtime path.
- Keep the legacy file as a recovery/reference asset if needed.

Commit message suggestion:
- `Isolate legacy app runtime from active bootstrap`

### Commit 4. System Editor Preview Split

Goal:
- Extract preview/layout interaction logic from `system-editor.js`.

Primary files:
- `public/screens/system-editor.js`

Possible new files:
- `public/screens/system-editor-preview.js`
- or `public/lib/system-layout-preview.js`

Task:
- Move layout preview rendering and pointer interaction into a dedicated module.
- Keep system form submission behavior unchanged.

Commit message suggestion:
- `Extract system editor layout preview controller`

### Commit 5. System Editor Asset/Folder Split

Goal:
- Extract asset library and folder manager logic from `system-editor.js`.

Primary files:
- `public/screens/system-editor.js`

Possible new files:
- `public/screens/system-editor-assets.js`
- `public/screens/system-editor-folders.js`

Task:
- Separate home asset library and folder handling from the rest of the system editor.

Commit message suggestion:
- `Extract system editor asset and folder management`

### Commit 6. Home Workspace Window Manager Split

Goal:
- Extract floating window state and drag handling from `home-edit-workspace.js`.

Primary files:
- `public/screens/home-edit-workspace.js`

Possible new files:
- `public/screens/home-workspace-windows.js`

Task:
- Isolate window shell behavior from content editing behavior.

Commit message suggestion:
- `Extract home workspace window manager`

### Commit 7. Home Workspace Asset/Folder Split

Goal:
- Extract folder and asset operations from `home-edit-workspace.js`.

Primary files:
- `public/screens/home-edit-workspace.js`

Possible new files:
- `public/screens/home-workspace-assets.js`
- `public/screens/home-workspace-folders.js`

Task:
- Move asset browsing, folder selection, folder creation, rename, delete, and upload handling into dedicated modules.

Commit message suggestion:
- `Extract home workspace asset and folder operations`

### Commit 8. Home Workspace Part/Props Split

Goal:
- Extract part editing and property editing logic from `home-edit-workspace.js`.

Primary files:
- `public/screens/home-edit-workspace.js`

Possible new files:
- `public/screens/home-workspace-parts.js`
- `public/screens/home-workspace-props.js`

Task:
- Separate custom part manipulation and property editing from workspace shell logic.

Commit message suggestion:
- `Extract home workspace part editing controls`

### Commit 9. Stage 1 Stabilization Pass

Goal:
- Clean up import/wiring edges introduced by the Stage 1 split.

Primary files:
- files touched by Stage 1

Task:
- Remove leftover dead wiring
- normalize module boundaries
- keep behavior unchanged

This commit should not introduce new features.

Commit message suggestion:
- `Stabilize editor and bootstrap module boundaries`

## Stage 2 Commit Plan

Run these only after Stage 1 is stable.

### Commit 10. Shared API Primitive Sanitizers

Goal:
- Extract the lowest-level sanitizer primitives used across shared content endpoints.

Primary files:
- `functions/api/base-chars.js`
- `functions/api/entries.js`
- `functions/api/gachas.js`
- `functions/api/stories.js`
- `functions/api/equipment-cards.js`

Possible new file:
- `functions/api/_content-sanitize.js`

Task:
- Move reusable primitives such as:
  - trimmed text helpers
  - image source validation
  - common number clamps

Commit message suggestion:
- `Extract shared content sanitizer primitives`

### Commit 11. Shared API Domain Sanitizers

Goal:
- Extract higher-level content sanitizers after primitives are stable.

Primary files:
- `functions/api/base-chars.js`
- `functions/api/entries.js`
- `functions/api/gachas.js`
- `functions/api/stories.js`
- `functions/api/equipment-cards.js`
- `functions/api/system.js`

Possible new files:
- `functions/api/_content-sanitize-base-char.js`
- `functions/api/_content-sanitize-entry.js`
- similar domain helpers if needed

Task:
- Move repeated domain structures into clearer reusable helpers without changing request/response semantics.

Commit message suggestion:
- `Extract shared content domain sanitizers`

### Commit 12. API Transport Helper Unification

Goal:
- Consolidate generic response/request helpers used by `_share-auth.js` and `_player-state.js`.

Primary files:
- `functions/api/_share-auth.js`
- `functions/api/_player-state.js`

Possible new file:
- `functions/api/_http.js`

Task:
- Unify:
  - `createCorsHeaders`
  - `json`
  - `readJson`
- Keep domain logic where it is.

Commit message suggestion:
- `Unify shared API transport helpers`

## Stage 3 Commit Plan

These can wait until the higher-risk structural work is done.

### Commit 13. CSS Source-Of-Truth Decision

Goal:
- Make the active styling source explicit.

Decision recorded:
- `public/styles.css` remains the active runtime source of truth for now.
- `public/styles/` stays reference-only until an explicit assembly/load path is adopted.

Primary files:
- `public/styles.css`
- `public/styles/`
- `public/index.html`

Task:
- Decide whether:
  - single-file CSS remains authoritative, or
  - split CSS becomes the real source with a defined assembly path

Commit message suggestion:
- `Define active frontend style source of truth`

### Commit 14. CSS Structure Follow-Through

Goal:
- Align files with the chosen CSS source-of-truth strategy.

Primary files:
- styling files affected by Commit 13

Task:
- Remove ambiguity left by the previous styling split.
- Do not mix visual redesign into this commit.

Commit message suggestion:
- `Align frontend styles with chosen source of truth`

### Commit 15. Global Surface Reduction

Goal:
- Reduce unnecessary `window.*` exposure after bootstrap boundaries are stable.

Primary files:
- `public/app.js`
- `public/lib/*.js`
- `public/screens/*.js`

Task:
- Remove avoidable global exports
- keep only required runtime hooks
- prefer explicit dependency passing where the current architecture supports it

Commit message suggestion:
- `Reduce unnecessary global frontend exports`

## Recommended Execution Sequence

Follow this order unless a blocking regression forces a stop:

1. Finish current player-state fixes
2. Commit 1
3. Commit 2
4. Commit 3
5. Verify app boot and navigation
6. Commit 4
7. Commit 5
8. Commit 6
9. Commit 7
10. Commit 8
11. Commit 9
12. Verify editor/home flows
13. Commit 10
14. Commit 11
15. Commit 12
16. Verify APIs
17. Commit 13
18. Commit 14
19. Commit 15

## Per-Commit Review Rule

Before each commit, confirm:

- only one concern was changed
- no unrelated files were dragged in
- the commit message describes a structural change, not a vague cleanup
- the result is easier to review than the pre-refactor state

## Stop Conditions

Stop and stabilize before continuing if any of the following happens:

- app boot becomes ambiguous again
- legacy and active runtime paths start diverging in behavior
- system editor preview behavior regresses
- home workspace editing behavior regresses
- API behavior changes while only doing sanitizer/helper extraction

## Final Goal

At the end of this plan:

- the bootstrap path should be easier to reason about
- the largest editor files should no longer be monoliths
- API helper duplication should be lower
- CSS ownership should be explicit
- the global namespace should be smaller and more intentional
