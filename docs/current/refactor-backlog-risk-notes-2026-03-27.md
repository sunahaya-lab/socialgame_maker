# Refactor Backlog Risk Notes

Date: 2026-03-27
Purpose:
- Record additional refactor candidates that are not in the immediate staged plan
- Preserve risk context so they are not forgotten later
- Highlight areas likely to cause future regressions if left oversized or structurally unclear

Important note:
- These items are backlog candidates.
- They are not higher priority than:
  - current player-state fixes
  - `docs/current/refactor-priority-instructions-2026-03-27.md`
  - `docs/refactor-commit-plan-2026-03-27.md`

## Priority Order

Recommended backlog order:

1. `public/lib/app-data.js`
2. `public/screens/editor-screen.js`
3. `public/screens/entry-editor.js`
4. `functions/api/projects.js`
5. UI text consolidation
6. `public/index.html` structure cleanup

## 1. `public/lib/app-data.js`

File:
- `public/lib/app-data.js`

Risk level:
- High

Why it is risky:
- This file currently mixes too many responsibilities:
  - content loading
  - local save/load behavior
  - remote merge behavior
  - player-state normalization
  - inventory/growth handling
  - party/equipment instance support
  - currency timing behavior
- It is already one of the largest frontend files in the repo.
- Bugs in this file are likely to affect multiple screens at once.

Likely future accident pattern:
- A change intended for one system breaks unrelated data flow elsewhere.
- Regression origin becomes hard to isolate because all state paths are centralized in one file.

Recommended refactor direction:
- Split by data domain rather than by generic helper count.
- Candidate modules:
  - content data load/save
  - player state merge/normalize
  - inventory and growth helpers
  - timed currency/state recovery

Do later when:
- Stage 1 bootstrap and major editor splits are stable.

## 2. `public/screens/editor-screen.js`

File:
- `public/screens/editor-screen.js`

Risk level:
- High

Why it is risky:
- This file combines:
  - editor shell behavior
  - floating window control
  - folder manager behavior
  - list rendering for multiple record types
  - UI asset/folder behavior
- It is acting as both screen container and feature hub.

Likely future accident pattern:
- A small UI change to one tab or folder flow breaks unrelated editor windows.
- Regressions are introduced while touching supposedly local rendering code.

Recommended refactor direction:
- Split into:
  - editor shell/window controller
  - folder manager module
  - record list renderer helpers
  - UI asset/folder submodule

Do later when:
- `system-editor.js` and `home-edit-workspace.js` are no longer monolithic.

## 3. `public/screens/entry-editor.js`

File:
- `public/screens/entry-editor.js`

Risk level:
- High

Why it is risky:
- This file now handles:
  - entry form editing
  - crop preset editing
  - crop image generation
  - SD image editing
  - battle kit editing
  - preview/render timing
- It is a feature-dense editor with several stateful sub-tools.

Likely future accident pattern:
- A card form change breaks crop generation.
- A crop editor change breaks battle-kit save handling.
- Large edits become difficult to review because unrelated concerns are tangled together.

Recommended refactor direction:
- Split into:
  - base entry form module
  - crop tooling module
  - SD image module
  - battle kit module

Do later when:
- shared content API behavior and core editor structure are more stable.

## 4. `functions/api/projects.js`

File:
- `functions/api/projects.js`

Risk level:
- Medium to High

Why it is risky:
- It still follows an older scope model based on `room` and `global`.
- It is structurally out of line with the newer shared content/share-aware APIs.
- It is likely to become a hidden exception that future work forgets to account for.

Likely future accident pattern:
- Project creation/listing follows a different rule set than the rest of the app.
- Share and permission assumptions become inconsistent across endpoints.

Recommended refactor direction:
- Align scope handling, permission handling, and helper structure with the modern shared-content API line.
- Reduce “special case” behavior in the API surface.

Do later when:
- current share/content API fixes are complete.

## 5. UI Text Consolidation

Files:
- `public/lib/ui-text.js`
- editor-related screen files
- other UI-heavy screen files as needed

Risk level:
- Medium

Why it is risky:
- User-facing strings are still scattered.
- Some areas already show encoding fragility and repeated text patterns.
- If text remains duplicated, UTF-8 repair and wording updates will keep being inconsistent.

Likely future accident pattern:
- One screen gets fixed text while another keeps mojibake or stale wording.
- Repeated labels drift apart unintentionally.

Recommended refactor direction:
- Expand shared text definitions gradually.
- Start with:
  - repeated editor empty states
  - confirmation messages
  - folder/action labels
  - common share/editor notices

Do later when:
- current API and editor structural fixes are stable enough that text extraction is not constantly being invalidated.

## 6. `public/index.html` Structure Cleanup

File:
- `public/index.html`

Risk level:
- Medium

Why it is risky:
- It contains a very large amount of static DOM across multiple screens.
- It also carries the runtime script-loading chain.
- This makes it easy to introduce accidental coupling between markup, screen modules, and bootstrap behavior.

Likely future accident pattern:
- A markup change intended for one screen interferes with another screen’s selectors.
- Script-loading edits and DOM edits become mixed together in review.

Recommended refactor direction:
- Do not rush into a full rewrite.
- First make the document easier to reason about:
  - clearer section boundaries
  - screen-level structure notes
  - eventual template extraction if the architecture supports it

Do later when:
- active runtime boundaries are clearer and stable.

## Backlog Handling Rule

When any of these files grows again during future work:

1. Check whether the new change is increasing scope creep
2. If yes, stop and consider doing the associated backlog refactor first
3. Do not keep expanding these files indefinitely just because they are already large

## Recommended Trigger Threshold

Treat backlog work as newly urgent if any of the following happens:

- the file becomes the repeated source of regressions
- one file starts owning more than one clear product subsystem
- a review becomes difficult because unrelated concerns cannot be separated
- a bug fix requires touching too many unrelated branches of the same file

## Intent

This backlog exists to prevent the project from drifting into “it works, but nobody can safely change it” territory.
