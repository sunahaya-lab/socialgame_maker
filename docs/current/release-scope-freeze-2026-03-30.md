# Release Scope Freeze 2026-03-30

> Priority Band: Strongly Active

## Purpose

This note freezes the near-term implementation scope for release.
The current priority is to ship a stable core product rather than continue adding optional gameplay systems.

## Current Release Priority

The release line should focus on these areas only:

- authentication
- project creation / switching / ownership
- shared editor save/load
- home
- story
- gacha
- collection
- base character editing
- card editing
- story editing
- system settings required for launch
- announcement delivery
- profile and in-game name

## Frozen / Deferred Systems

The following systems are now treated as deferred:

- event system
- other additional gameplay systems beyond the core loop
- optional expansion systems that are not required for first release
- title editor / custom title authoring

Deferred means:

- no new implementation work unless it unblocks release
- hide the UI when practical
- avoid sending related config in shared save flows
- keep existing data structures intact where possible
- do not spend release time polishing these systems

## Specific Handling Agreed On

### Event System

Event editing is now treated as out of scope for release.

- system editor should not expose event editing UI for now
- shared system save should not require event-related billing access
- existing `eventConfig` data can remain on disk / in DB
- event implementation can resume later from the preserved data model

### Additional Systems

If a system is not necessary for the first playable release, it should be considered paused by default.

Examples:

- extra progression layers
- optional battle-side extensions
- advanced pack-gated system controls
- nonessential meta systems
- custom title editing and title-condition authoring

### Title System Handling

The title system is not part of the current release line.

- shared `titleMasters` data may remain in storage
- the title editing UI should stay hidden
- no new title-condition work should proceed during stabilization
- revisit only after runtime/save stability work is complete

## Implementation Rule

For new work, prefer this decision order:

1. does this directly improve the first release?
2. does this reduce breakage or confusion in the current core flow?
3. if neither is true, defer it

## Practical Engineering Rule

When a deferred system already exists partially in code:

- keep the data shape if it helps future recovery
- remove or hide the editing surface
- avoid cross-coupling it into core save flows
- do not let it block ownership, auth, editor, or save stability

## Next Stable Focus

The next implementation focus should stay inside:

- auth stability
- owner/member behavior
- system save stability
- editor text cleanup
- title/profile polish
- home / story / gacha / collection release quality
- announcement workflow
