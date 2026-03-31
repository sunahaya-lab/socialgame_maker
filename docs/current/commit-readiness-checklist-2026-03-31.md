# Commit Readiness Checklist 2026-03-31

> Priority Band: Strongly Active

Date: 2026-03-31

## Purpose

This checklist defines the minimum commit-prep routine for the current refactor phase.
It is intentionally lighter than a full health check, but stricter than "it seems to work."

Use this before creating a commit that touches:

- `Dangerous` files
- `Watchlist` files
- auth / ownership / save boundaries
- boot/runtime wiring
- inventory / story gating

## Rule Of Thumb

- small focused fix:
  - run syntax checks on touched files
  - run the smallest matching manual check
- watchlist refactor:
  - confirm responsibility did not spread
  - run syntax checks
  - run the nearest integration flow
- dangerous-file reduction batch:
  - update `code-health-check-2026-03-30.md`
  - update split map / active docs when boundaries changed
  - run the nearest regression playbook items

## Commit-Prep Checklist

### 1. Scope

- the commit has one primary purpose
- unrelated local edits are not silently mixed into the same commit
- file placement still matches `AGENTS.md` and the nearest folder `README.md`

### 2. Boundary Check

- no casual new cross-layer dependency was introduced
- `public/lib/` did not absorb screen-local or section-local behavior by accident
- `functions/api/<endpoint>.js` stayed thin if touched
- compatibility adapter vs behavior-carrying file status is still accurate

### 3. Syntax Check

Run `node --check` on each touched JS file that is on an active runtime or API path.

Minimum high-risk set for recent auth/save work:

- `public/app.js`
- `public/lib/app-data.js`
- `public/lib/app-auth.js`
- `public/lib/app-auth-session-flow-runtime.js`
- `public/lib/auth-session-runtime.js`
- `public/lib/system-save-runtime.js`
- `functions/api/_share-auth.js`
- `functions/api/projects.js`
- `functions/api/project-members.js`

### 4. Smallest Matching Manual Check

Pick only the nearest relevant flow:

- auth/session changes:
  - login or logout
  - reload
  - confirm frontend state matches session
- owner/save changes:
  - owner shared save
  - logout and guest denial
- inventory/gating changes:
  - collection / story / formation navigation
  - owned-card-dependent rendering
- boot/runtime wiring changes:
  - first load
  - one screen transition
  - one editor transition

### 5. Doc Sync

Update docs in the same commit when any of these changed:

- runtime ownership
- compatibility status
- deletion safety
- danger/watchlist classification
- release regression playbook path

Usually this means updating one or more of:

- `docs/current/code-health-check-2026-03-30.md`
- relevant split map under `docs/current/`
- `docs/current/release-regression-test-playbook-2026-03-31.md`
- nearest folder `README.md`

### 6. Security Check

Always ask these before commit when mutations changed:

- does auth come from session, not caller-supplied identity?
- can guest/non-owner still reach a shared mutation path?
- can local-only fallback be mistaken for remote save success?
- is stale tab state now able to misrepresent authority?

## When To Run A Full Health Check

Do a broader health-check update only when:

- a dangerous file meaningfully changed classification
- active responsibility moved between folders
- boot/load order changed
- a large refactor batch changed deletion safety

Do not require a full health-check rewrite for every small bug fix.

## Current Commit Advice For This Repository State

The current worktree is too broad for one clean commit.
Prefer splitting by purpose.

Recommended order:

1. docs / boundary-definition batch
   - `AGENTS.md`
   - folder `README.md`
   - `docs/current/*`

2. backend auth / project / system boundary batch
   - `functions/api/_share-auth.js`
   - `functions/api/projects.js`
   - `functions/api/project-members.js`
   - related auth/session endpoints if part of the same story

3. frontend auth / system-save stabilization batch
   - `public/lib/app-auth.js`
   - `public/lib/app-auth-session-flow-runtime.js`
   - `public/lib/auth-session-runtime.js`
   - `public/lib/system-save-runtime.js`
   - `public/app.js`

4. inventory/navigation recursion and screen stabilization batch
   - `public/lib/app-data.js`
   - `public/lib/app-data-inventory.js`
   - `public/lib/app-legacy-bridge-factory.js`
   - any directly related screen files only

5. larger refactor batches after the stabilization commits above
   - editor runtime extraction
   - screen split-map reductions
   - CSS split/reference sync

## Stop Conditions

Do not commit yet if:

- the commit message would need "and also" more than once
- touched files belong to multiple unrelated purposes
- syntax has not been checked on active JS files
- auth/save work was changed without at least one matching manual check
- docs clearly lag runtime reality

## Suggested Commit Message Shape

- `docs: document current refactor boundaries and health checks`
- `api: enforce session-based project and member ownership`
- `auth: restore frontend session sync on reload and tab focus`
- `data: stop owned-card bridge recursion in navigation path`
