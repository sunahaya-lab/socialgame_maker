# Stabilization Freeze Policy 2026-03-30

> Priority Band: Strongly Active

## Purpose

This memo defines the temporary freeze policy for the current stabilization phase.

The goal is not feature growth.

The goal is:

- reduce structural risk
- lower concentration in dangerous files
- stop adding new unstable paths before release

## Current Diagnosis

The repository is currently in a state where:

- local fixes still work
- the app is still runnable
- but several critical files are oversized and mixed-responsibility
- and repeated feature additions are outpacing cleanup

Because of that, the correct strategy is a temporary freeze on feature expansion.

## Effective Rule

Until the dangerous-file set is materially reduced:

- do not add new core features
- do not add new storage models
- do not add new runtime pathways
- do not add new editor subsystems

## Allowed Work

The following work is allowed during the freeze:

- refactors that reduce responsibility concentration
- splitting dangerous files
- moving logic out of `public/app.js`
- moving editor DOM out of `public/index.html`
- splitting `public/styles.css`
- bug fixes on existing features
- text cleanup
- UI cleanup for already existing features
- small asset additions for already existing features
- small sound additions for already existing feature hooks
- reconnecting already implemented functionality to existing UI

## Explicitly Allowed Small-Scope Additions

The following are still acceptable if they do not introduce new architecture:

- title screen sound effect
- gacha pull sound effect
- battle entry sound effect
- manual UI wiring for functionality that already exists in code
- replacing placeholder assets with real assets

These are acceptable because they are local presentation improvements, not system expansion.

## Forbidden Work During Freeze

The following work is frozen:

- new gameplay systems
- new shared data models
- new player-state branches unless required for bug fix
- new editor workflows
- new auth/account product scope
- new project/member system scope
- new battle system scope
- Battle Pack-related save/use expansion
- title system expansion and title editor stabilization work beyond emergency isolation
- new event system scope
- new monetization logic beyond already documented direction
- new premium gating flows
- any feature that requires scanning the whole repo just to be safely attached

## Especially Frozen Areas

The following areas should be treated as frozen until cleanup reaches a safer point:

- event feature expansion
- additional game systems
- new title-condition system expansion beyond current basics
- title editor runtime and title unlock editing surface
- new equipment system scope beyond already existing stored behavior
- new cafe runtime implementation
- new announcement capability beyond current baseline

## Current Temporary UI Retirements

The following UI surfaces are intentionally hidden or disconnected during stabilization:

- title editor / title tab in the editor dashboard

For these surfaces:

- keep the stored data shape on disk
- do not continue feature work
- do not spend release time on polish
- only revisit after the core save/runtime line is stable again

## Dangerous Files To Prioritize

- `public/app.js`
- `public/index.html`
- `public/styles.css`
- `public/lib/app-editor.js`
- `public/screens/entry-editor.js`
- `public/screens/formation-screen.js`

These files should be treated as the primary stabilization targets.

## Operating Rule For Tasks

Before starting a task, classify it into one of these buckets:

### Bucket A: Stabilization

- file split
- ownership cleanup
- state normalization cleanup
- bug fix caused by current structure

These tasks should proceed.

### Bucket B: Local Polish

- UI tweaks on existing features
- text cleanup
- sound effect additions on existing hooks
- asset swaps

These tasks may proceed if they touch a narrow scope.

### Bucket C: Expansion

- new feature
- new subsystem
- new persistent data shape
- new runtime mode
- new editor path

These tasks should stop unless explicitly re-approved after cleanup.

## Release-Phase Standard

The product is in release-priority mode.

That means:

- correctness is more important than breadth
- local predictability is more important than ambitious scope
- deleting confusion is more valuable than adding capability

## Reopen Conditions

Frozen feature expansion should not resume until at least the following are true:

1. `public/app.js` is reduced to bootstrap-orchestrator scale
2. `public/index.html` no longer carries giant editor DOM blocks
3. `public/styles.css` has been split into active smaller sources or equivalent structure
4. the editor execution path is explicitly fixed to one authoritative line
5. at least part of the dangerous-file set moves down into watchlist territory
6. a fresh code health review still produces the same ownership map

## Recommended Work Pattern

- keep diagnosis and architecture decisions in one main window
- use parallel or separate windows only for read-only surveys or isolated file groups
- avoid multi-window concurrent edits on any task that spans:
  - `public/app.js`
  - `public/index.html`
  - `public/styles.css`
  - editor host/runtime files

## Bottom Line

This phase is not “no progress.”

This phase is:

- stop expanding
- reduce danger
- recover ownership
- resume feature growth only after the codebase becomes predictably editable again
