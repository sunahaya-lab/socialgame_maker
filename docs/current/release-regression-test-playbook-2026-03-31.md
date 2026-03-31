# Release Regression Test Playbook 2026-03-31

> Priority Band: Strongly Active

Date: 2026-03-31

## Purpose

This playbook turns the current health-check test map into a repeatable release-focused test routine.
It is intentionally biased toward:

- auth and ownership correctness
- shared save safety
- reload and multi-tab consistency
- a small number of critical player-facing journeys

This document is for the current runtime reality.
It does not assume a stable automated browser harness exists yet.

## Current Constraints

- `package.json` does not currently provide an automated integration or E2E test runner
- browser checks are still required for the highest-risk flows
- API permission changes must be treated as security-sensitive even when UI symptoms appear fixed

## Test Types To Use

### Manual Integration

Use for:

- login / logout / reload behavior
- editor entry and shared save flows
- project switching
- visible navigation and render stability
- cross-tab session consistency

### Targeted Static Verification

Use for:

- touched frontend/bootstrap/auth/data files
- touched API permission files
- quick regression confirmation before manual browser passes

Current command:

```bash
node --check <file>
```

### First Future Automation Targets

Use automation first for:

- owner login -> shared save -> reload persistence
- logout -> guest denial on shared save
- spoofed `userId` ignored by project/member endpoints

## Manual Regression Matrix

### A. Auth And Ownership

#### A1. Owner login restore on reload

- Goal:
  - confirm the frontend auth state matches the server session after reload
- Preconditions:
  - owner account available
  - a project owned by that account exists
- Steps:
  1. log in as owner
  2. reload the page
  3. confirm the app still behaves as logged in
  4. enter editor
- Expected:
  - owner session is restored
  - editor entry remains available
- Current status:
  - passed manually on `2026-03-31`

#### A2. Logout restore on reload

- Goal:
  - confirm stale owner session is not visually retained after logout
- Steps:
  1. log out
  2. reload the page
  3. confirm the app behaves as guest
- Expected:
  - guest state after reload
  - no hidden owner authority remains in the UI state
- Current status:
  - passed manually on `2026-03-31`

#### A3. Cross-tab auth resync

- Goal:
  - confirm tab focus/visibility resync updates stale auth UI
- Steps:
  1. open two tabs on the same project
  2. log in or log out in one tab
  3. switch focus back to the other tab
  4. confirm the auth state updates without requiring guesswork from the user
- Expected:
  - tab state catches up after focus / visibility return
- Current status:
  - partially verified by the implemented fix path
  - dedicated repeat pass still recommended

### B. Shared Save And Permission Boundary

#### B1. Owner shared system save

- Goal:
  - confirm owner can perform shared `system` save
- Steps:
  1. log in as owner
  2. enter editor
  3. change a system setting
  4. save
  5. reload
- Expected:
  - save succeeds
  - value persists after reload
- Current status:
  - passed manually on `2026-03-31`

#### B2. Guest shared system save denial

- Goal:
  - confirm guest cannot perform the same shared save
- Steps:
  1. log out
  2. reload
  3. attempt the same `system` save flow
- Expected:
  - shared save is denied
  - no false success signal is shown for remote save
  - any local-only fallback must be clearly distinguishable
- Current status:
  - passed manually on `2026-03-31`

#### B3. Non-owner member denial

- Goal:
  - confirm non-owner collaborator cannot mutate owner-only shared settings
- Steps:
  1. log in as non-owner member
  2. open the same project
  3. attempt editor entry and `system` save
- Expected:
  - owner-only mutations are denied
- Current status:
  - not yet recorded
- Priority:
  - high

### C. Project And Member API Security

#### C1. Spoofed `userId` ignored by project APIs

- Goal:
  - confirm project/member authority is derived from session, not caller-supplied `userId`
- Suggested method:
  - perform request attempts while authenticated as one user but supplying another user's id in query/body
- Expected:
  - no privilege change
  - server uses session user only
- Current status:
  - code path updated
  - syntax verified
  - live request proof not yet recorded

### D. Navigation And Inventory Stability

#### D1. Navigation after owned-count bridge fixes

- Goal:
  - confirm inventory-owned count helpers no longer recurse through compatibility layers
  - confirm stored owned-card data is not lost by scope migration or read-time normalization
- Steps:
  1. open screens that depend on owned-card checks
  2. repeat navigation between relevant screens
  3. open collection / story / formation paths that read ownership
- Expected:
  - no `Maximum call stack size exceeded`
  - no blank render after navigation
- Current status:
  - fix applied
  - syntax verified
  - dedicated full browser pass still needed

#### D1 note: current structural watchpoint

- `collection` currently depends on `inventory`
- `formation` currently depends on `cardInstances`
- current read path contains compatibility recovery for:
  - legacy `socia-player-state` storage keys
  - empty `inventory` with surviving `cardInstances`
- this reduces recurrence risk, but the long-term canonical source is still not fixed

#### D2. Story ownership gating

- Goal:
  - confirm character-story lock logic still reflects owned card state after the inventory fix batch
- Expected:
  - owned cards unlock intended paths
  - unowned cards remain locked
- Current status:
  - not yet recorded

### E. Core Release Journey Smoke Pass

These should remain the smallest regular smoke pass before release-oriented changes are considered safe:

1. owner login
2. reload
3. project open / switch
4. editor open
5. shared `system` save
6. reload persistence confirmation
7. logout
8. reload
9. guest denial on the same shared save path
10. collection / story / formation navigation check

## Static Verification Completed During This Fix Batch

- `public/app.js`
- `public/lib/app-data.js`
- `public/lib/app-auth.js`
- `public/lib/app-auth-session-flow-runtime.js`
- `public/lib/auth-session-runtime.js`
- `public/lib/system-save-runtime.js`
- `functions/api/_share-auth.js`
- `functions/api/projects.js`
- `functions/api/project-members.js`

## Automation Backlog

### Highest Priority

- Browser automation for owner login -> system save -> reload persistence
- Browser automation for logout -> guest system save denial
- API integration check for spoofed `userId` on:
  - `projects`
  - `project-members`

### Good Next Candidates

- Browser automation for cross-tab session resync
- Browser automation for editor entry denial as non-owner member
- Browser automation for collection / formation / story ownership-dependent rendering

## Known Gaps

- no established browser automation harness is wired into repo scripts
- no non-owner member recorded pass yet
- no recorded live API spoof-resistance pass yet
- no fully documented smoke pass result yet for the inventory-related navigation fixes
- player-owned card persistence still needs one explicit design decision:
  - make `inventory` canonical and derive `cardInstances`
  - or make `cardInstances` canonical and derive `inventory`

## Update Rule

When auth, ownership, project membership, shared save, or inventory gating changes:

1. update this playbook if the critical path changed
2. update `code-health-check-2026-03-30.md` with the latest recorded result
3. record what was manually verified and what remains unverified
