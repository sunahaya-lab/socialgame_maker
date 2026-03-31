# Dangerous Code Handling Policy 2026-03-31

> Priority Band: Strongly Active

## Goal

- Define how to treat dangerous code that still exists inside large active files.
- Avoid mixing together:
  - code that must be extracted
  - code that is already legacy and should later be deleted
  - glue code that may remain in small form

## Three Classes

### 01. Dangerous Active Core

Definition:

- Code that is still on the active runtime path.
- Code that still owns meaningful behavior.
- Code that is large, mixed-responsibility, or regression-prone.

Examples in the current repo:

- `public/screens/entry-editor.js`
  - save / refresh / billing guard
  - image / crop editor
- `public/styles.css`
  - `formation-convert`
  - `formation-growth-detail`
- `public/lib/app-data.js`
  - remaining legacy growth/bootstrap bodies while bridge coupling still exists

Required treatment:

- split by runtime responsibility
- avoid behavior changes during extraction
- move one sub-band at a time

### 02. Legacy Deletion Candidates

Definition:

- Code that is no longer the public path.
- Code that remains only as a parked fallback or migration bridge.
- Code that should not be treated as normal implementation.

Examples in the current repo:

- `_legacyRecordGachaPulls`
- `_legacyLoadAllData`
- `_legacyGetCardGrowth`
- `_legacyUpdateCardGrowth`
- `_legacyEnhanceCard`
- `_legacyEvolveCard`
- `_legacyConvertSelectedCharacterCards`
- `_legacyConvertSelectedEquipmentCards`
- `_legacyConvertStaminaToGrowthPoints`

Required treatment:

1. mark clearly as legacy
2. confirm no external references
3. remove only after runtime confidence is high

### 03. Allowed Glue

Definition:

- Small bridge/orchestrator code that still has a legitimate role.
- Code that connects modules but should not own deep business logic.

Examples in the current repo:

- thin bootstrap/orchestrator paths
- compatibility adapters that still carry required runtime routing
- small bridge helpers shared across two split modules

Required treatment:

- keep small
- keep chapterized
- keep ownership explicit
- do not let new business logic accumulate there

## Repository Rule

When touching a dangerous file, classify the target code first:

1. dangerous active core
2. legacy deletion candidate
3. allowed glue

Do not proceed without deciding which one it is.

## What To Do Next

### If It Is Dangerous Active Core

- extract by responsibility
- preserve runtime behavior
- test the smallest realistic path

### If It Is Legacy Deletion Candidate

- check whether the public/export path already bypasses it
- check whether repo-wide references still exist
- if not, treat it as a future deletion block

### If It Is Allowed Glue

- minimize it
- document it
- avoid adding unrelated helpers into it

## Current Application

### app-data.js

- dangerous active core:
  - remaining bridge glue around old/new data flow
- legacy deletion candidate:
  - `_legacy...` growth/bootstrap bodies
- allowed glue:
  - delegated module wiring and small bridge helpers

### entry-editor.js

- dangerous active core:
  - save / refresh / billing guard
  - image / crop editor
- safer extraction candidates:
  - relation / voice helpers
  - SD editor

### styles.css

- dangerous active core:
  - `formation-convert`
  - `formation-growth-detail`
- allowed glue:
  - section headers / sync annotations

## Rule Of Thumb

- active dangerous core -> split
- legacy candidate -> verify, then delete later
- glue -> shrink and constrain
