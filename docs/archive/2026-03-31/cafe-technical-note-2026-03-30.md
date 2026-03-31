# Cafe Technical Note 2026-03-30

> Priority Band: Dormant But Kept

## Purpose

This note records the implementation direction for `Cafe` if the goal is to
keep server load and operating cost under control.

It is a technical companion to:

- [`../specs/cafe-home-spec.md`](../specs/cafe-home-spec.md)

## Core Technical Conclusion

`Cafe` does not become server-heavy merely because SD characters move around.

The major cost risk comes from:

- real-time synchronization
- high-frequency polling
- large asset storage
- large asset delivery
- multi-room and multi-layer persistence growth

The safest initial implementation is:

- client-heavy animation
- low-frequency persistence
- strict asset/storage limits
- no real-time shared room state

## Recommended Runtime Model

### Client-side animation

Character movement, idle state, tap reaction, and simple arrival/departure
presentation should run on the client.

This means:

- movement paths are calculated locally
- idle timers are calculated locally
- touch reactions are resolved locally
- simple visitor appearances are rendered locally

The server should not be asked to simulate minute-by-minute room behavior.

### Persistence timing

The app should not save every small position update.

Initial save timing should be limited to:

- room entry bootstrap
- explicit layout save
- room exit or background save
- major setting changes only

Avoid constant autosave of every movement tick.

### Visitor logic

Visitor logic should be lightweight.

Preferred initial pattern:

- store the last meaningful visit timestamp
- compute elapsed time when the player opens `Cafe`
- derive whether a visit happened during absence
- render the result locally

This preserves the feeling of ambient activity without requiring live server
simulation.

## What Actually Increases Server Cost

### High-risk load drivers

These are the main server-cost multipliers:

- frequent polling for new visits
- real-time room state sync
- many uploaded assets per player
- large image files kept without strict normalization
- multiple rooms with many saved objects
- share/export features that render large snapshots or previews

### Lower-risk features

These are much less dangerous if implemented locally:

- idle walking
- tap reactions
- simple looping animation
- local arrival effects
- small client-side random behavior

## Asset and Storage Policy

### Storage must stay strict

Capacity should be treated as a first-class product constraint.

Recommended first principles:

- normalize uploaded images
- prefer compressed web assets
- impose per-user and per-room limits
- impose count limits, not just byte limits
- reject oversized assets early

### Why capacity is a valid billing boundary

Capacity-driven billing is technically justified because it directly affects:

- stored asset volume
- backup and retention volume
- content delivery volume
- player-state growth

This is a cleaner paid boundary than charging for simple baseline interaction.

## Recommended Gating from a Technical View

### Safe to keep free

These are technically safe to leave free in the first version:

- one room
- one default theme
- a small character cap
- basic local tap reactions
- simple local visitor behavior
- simple persistence

### Better as paid

These are better as paid because they are likely to increase cost or complexity:

- larger room count
- larger character placement cap
- more uploaded room assets
- free interior placement
- furniture/decor layers
- animated material support
- richer effect bundles
- creator-grade export and share presentation

## Anti-Patterns to Avoid

The first implementation should avoid:

- server-authoritative live pathing
- per-second sync APIs
- storing every tiny motion event
- mandatory online check for each tap interaction
- keeping original uploads plus derivatives plus multiple previews by default
- making `Cafe` depend on real-time multiplayer assumptions

## Initial Data Direction

The first version should keep `Cafe` state compact.

Preferred initial persisted state:

- current room theme id
- placed character ids
- coarse placement data
- last visit timestamp
- a small amount of room metadata

Avoid storing:

- full movement history
- per-frame coordinates
- large event logs
- detailed analytics for every interaction

## Operational Recommendation

The technical recommendation matches the product recommendation:

- keep `Cafe` in `home`
- keep the free baseline real but small
- monetize capacity and expressive depth
- avoid real-time sync unless there is a later proven need

This gives the feature room to grow without forcing expensive infrastructure
too early.
