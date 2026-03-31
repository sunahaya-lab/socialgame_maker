# cafe-home-spec

## Purpose

This document defines the initial product and UX specification for the
provisional `Cafe` feature.

It exists to settle three decisions early:

1. whether `Cafe` belongs in the bottom menu
2. how `Cafe` should connect to the current `home` screen
3. how free vs paid access should be split

## Decision Summary

The initial decision is:

- keep the bottom menu fixed to the existing 5 items
- do not add `Cafe` as a sixth persistent bottom-menu tab at first
- place `Cafe` as an additional home feature entered from the `home` screen
- treat `Cafe` as a home-adjacent play space, not as a core navigation pillar
- make the basic `Cafe` loop available for free
- gate capacity, freedom, and production-heavy expression behind paid
  entitlements

## Why This Direction

### Navigation reason

The bottom menu should remain simple and stable.

At this stage the product should treat the main navigation as:

- `home`
- `gacha`
- `story`
- `collection`
- `editor`

These are always-relevant product pillars.

`Cafe` is expected to be attractive and retention-friendly, but it is not part
of the minimum core navigation needed to understand the app.

### Implementation reason

Putting `Cafe` inside `home` is cheaper and safer than introducing a new global
navigation item.

If `Cafe` becomes a bottom-menu item too early, the app must also settle:

- non-owner visibility rules
- empty-state rules before setup
- locked-state UI for unpaid users
- tab icon design
- menu overflow and responsive behavior
- public-view behavior

Avoiding those decisions in the first pass keeps implementation lighter.

## Product Positioning

`Cafe` is a light-touch interactive room where uploaded 2D characters can:

- appear
- idle
- be tapped
- react
- occasionally visit
- be collected as momentary presence or ambient activity

The intended emotional position is:

- home-like
- soft
- collectible
- low-pressure
- retention-friendly

It is closer to an ambient side space than to battle or story progression.

## Entry Point and Navigation Rules

### Initial navigation rule

The app should keep the bottom menu at 5 fixed items only.

`Cafe` should be opened from `home` through one of these entry patterns:

- a dedicated `Cafe` button on home
- a home panel card
- an event-style floating shortcut on home

The first implementation should prefer a simple explicit entry button or card,
not a hidden gesture.

### Promotion rule

If later usage data shows that `Cafe` becomes one of the most frequently used
surfaces, it may be promoted to a dedicated main-tab item in a future version.

That promotion is explicitly out of scope for the first implementation.

## Core User Experience

### Initial player loop

The minimum `Cafe` play loop should be:

1. open `Cafe` from `home`
2. see a room with one or more 2D characters
3. tap a character
4. receive a reaction such as line, motion, or small feedback
5. occasionally see a character appear or wander in
6. leave and return without losing the placed state

### Interaction tone

`Cafe` should feel:

- immediate
- readable
- low-friction
- toy-like

It should not require heavy setup before the first satisfying interaction.

## Initial Feature Scope

### Free baseline features

The free version should include the minimum loop necessary for the feature to
feel real:

- enter `Cafe`
- place at least one character
- basic room background
- idle presence of placed characters
- tap reaction on characters
- occasional spontaneous visit behavior
- simple save and restore of the room state
- simple per-player `Cafe` state

### Initial optional free polish

These may also belong in free if implementation remains light:

- one ambient effect layer
- one free room theme
- simple speech bubble reaction
- one simple arrival animation

## Paid Expansion Strategy

### Core rule

Do not paywall the entire `Cafe` feature at launch.

The feature is too useful as an emotional hook and too likely to become an
expected baseline retention loop.

Instead, the monetization should gate:

- storage impact
- placement scale
- expressive freedom
- features that are expensive to build and maintain

The product should avoid charging for the mere existence of `Cafe`.

It should charge when the user starts consuming more capacity or wants deeper
creative control.

### Paid feature categories

The paid line should be organized around these categories:

- capacity
- expression
- build depth

### Capacity-gated features

These are natural paid targets because they consume storage or increase state
complexity:

- higher placement cap
- more saved characters per room
- more room slots
- more saved room layouts
- more uploaded `Cafe`-specific assets
- larger total asset/storage allowance

### Expression-gated features

These are natural paid targets because they increase implementation cost and UI
surface complexity:

- additional room themes
- animated or moving material support
- advanced ambient effects
- richer arrival and departure behaviors
- special interaction animations
- reaction variation packs
- advanced reaction authoring

### Build-depth-gated features

These are natural paid targets because they move `Cafe` from a simple toy space
into a creator tool:

- multi-room support
- room furniture or decorative object support
- free placement of interior objects
- furniture layers and decorative layers
- theme presets and room duplication
- export/share-oriented `Cafe` presentation options

### Features that should stay free

These should not be paid-only in the first version:

- opening `Cafe`
- seeing a room at all
- placing the first character
- basic tapping and reaction
- basic random visit behavior

If all of the above are locked, `Cafe` becomes a concept instead of a feature.

### Billing philosophy

The billing philosophy for `Cafe` should be:

- do not charge because the feature exists
- do charge when the user consumes more capacity
- do charge when the user asks for more expressive freedom
- do charge when the feature requires notably higher implementation effort

This keeps the baseline toy value intact while making the paid line feel fair.

## Recommended Entitlement Boundary

The cleanest first split is a layered model:

- free: `Cafe Base`
- paid: `Cafe Capacity`
- paid: `Cafe Expression`
- paid: `Cafe Studio`

### Cafe Base

`Cafe Base` should include:

- 1 room
- 1 default theme
- small character capacity
- basic tap reactions
- basic random visit system
- basic persistence
- minimal storage allowance

### Cafe Capacity

`Cafe Capacity` should include:

- more character slots
- more room slots
- more saved room states
- larger storage allowance
- future high-capacity limits for heavy users

### Cafe Expression

`Cafe Expression` should include:

- more room themes
- animated or moving materials
- more interaction patterns
- more ambient effects
- premium arrival and reaction presentation
- future premium effect bundles

### Cafe Studio

`Cafe Studio` should include:

- free interior placement
- furniture and decorative objects
- multi-layer room composition
- multiple room management
- creator-oriented presentation depth
- future export/share presentation enhancements

## Menu Bar Rule

The bottom menu should remain a fixed 5-item set for the current product line.

The current intended fixed set is:

- `home`
- `gacha`
- `story`
- `collection`
- `editor`

This should be treated as the default UI-set rule for initial production.

`Cafe` should be represented on `home`, not in the bottom menu, until a later
promotion decision is explicitly made.

## Home Integration Rule

`Cafe` is a `home` extension.

This means:

- home owns the primary entry point
- `Cafe` state is conceptually part of player-side home life
- the home screen may surface `Cafe` notices, arrivals, or shortcuts
- `Cafe` should reuse home-adjacent art direction where useful

This does not mean `Cafe` must share the exact same layout data model as home.

Implementation may store `Cafe` separately if that keeps the code cleaner.

## Data Model Direction

The first version should assume player-scoped `Cafe` state, not project-shared
editor content.

Initial state candidates:

- `playerCafeState`
- `placedCharacters[]`
- `roomThemeId`
- `lastVisitAt`
- `visitorHistory[]`
- `interactionState`

The feature should be designed so that:

- creators define characters and assets at the project layer
- players experience and personalize `Cafe` at the player layer

## Editing Direction

Initial `Cafe` setup should be lightweight.

The first version should avoid building a large separate editor just for `Cafe`.

Preferred first setup pattern:

- choose characters from owned or allowed set
- place them in a simple room
- save automatically or with one explicit save action

Detailed furniture layout and advanced room authoring should be deferred.

Those deeper creation features belong to the paid expansion line, not to the
first free baseline.

## Non-Goals for Initial Version

The first implementation should explicitly avoid:

- a dedicated sixth bottom-menu tab
- full furniture simulation
- pathfinding-heavy free walking AI
- multiplayer real-time shared room behavior
- battle/resource loops inside `Cafe`
- complicated economy requirements just to use the room
- creator-side giant `Cafe` editor before the basic loop proves useful

## Public/Share Behavior

Initial share behavior may be one of:

- not supported at first
- view-only presentation later under paid expansion

Do not block the base feature waiting for public share support.

## Success Criteria

The initial `Cafe` direction is considered correct if:

- the bottom menu remains clean and stable
- users can discover `Cafe` from `home` without confusion
- the first interaction is satisfying in under one minute
- the free version feels real, not fake-locked
- the paid version expands depth without harming the baseline toy value

## Follow-Up Specs Needed Later

This document does not yet define:

- exact visitor spawn logic
- exact interaction animation system
- exact room layout schema
- exact entitlement IDs and billing copy
- exact public-share behavior
- exact storage limits

Those should be specified later only after the product decision in this document
is accepted as the baseline.
