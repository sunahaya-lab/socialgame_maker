# title-screen-spec

## Purpose

This document defines the initial product specification for a dedicated title
screen.

The intended pattern is the familiar mobile game flow:

- title screen is shown first
- a `Press Start` prompt is shown
- tapping or clicking proceeds into the app

## Product Role

The title screen is a presentation layer, not a progression feature.

Its job is to:

- establish first impression
- give the app a game-like startup feel
- let creators set the mood before the main `home` screen

It should remain lightweight and quick to load.

## Core UX

### Initial flow

The initial startup flow should be:

1. app loads
2. title screen is displayed
3. title image and `Press Start` prompt are visible
4. user taps or clicks
5. app transitions to `home`

### Input rule

The title screen should respond to:

- mouse click
- touch tap
- keyboard confirm when practical

The interaction should not require a tiny button target only.

The full title screen may accept the start action, while still visually
emphasizing the `Press Start` prompt.

## Initial Visual Elements

The first version should support:

- title background image
- optional title logo image
- `Press Start` text
- simple light animation or blinking on the start prompt

Initial non-goals:

- complex multi-step intro movie
- long blocking splash sequence
- character-heavy animation before entering the app

## Free/Paid Rule

### Core decision

The title screen image customization should be available in the free version.

This includes:

- uploading a title background image
- replacing that image later
- setting a simple logo image if supported

### Why it is free

This is a basic presentation feature, not a heavy capacity or advanced authoring
feature.

The product should let creators make the app feel like their own from the first
screen without requiring payment.

### What may become paid later

If the title screen grows deeper in the future, paid-only expansion may include:

- multiple title variants
- scheduled title swaps
- animated title layers
- video backgrounds
- advanced particle effects
- title screen music packs

Those are explicitly future options, not part of the initial free/paid split.

## Navigation and Screen Model

The title screen should exist before `home`.

The intended screen order is:

- `title`
- `home`
- `gacha`
- `story`
- `collection`
- `editor`

The title screen should not replace `home`.

It is a startup gate that hands off to `home`.

## State and Persistence Direction

The title screen should be configured at the shared project level.

Initial configuration candidates:

- `titleScreen.enabled`
- `titleScreen.backgroundImage`
- `titleScreen.logoImage`
- `titleScreen.pressStartText`
- `titleScreen.tapToStartEnabled`

The state should be part of project-level visual configuration, not per-player
state.

## Editing Direction

The initial editing surface should be simple.

Creators should be able to:

- enable or disable the title screen
- upload a background image
- optionally upload a logo image
- edit the `Press Start` text
- preview the result

This should be done without requiring a paid entitlement.

## Technical Direction

The initial title screen should stay lightweight.

Recommended implementation direction:

- static image-based rendering
- minimal animation on prompt text only
- no heavy runtime polling
- no special server process beyond normal image upload and config save

This keeps it cheap compared with more advanced real-time surfaces like a future
`Cafe`.

## Accessibility and Fallback Rules

The title screen should still work when custom assets are missing.

Fallback behavior should be:

- use default title background
- use app name as text if no custom logo exists
- use default `Press Start` text if no custom text is configured

The screen must remain operable with keyboard and pointer input where possible.

## Success Criteria

The first version is successful if:

- creators can freely swap title imagery
- users immediately understand how to proceed
- startup remains fast
- the screen feels game-like without becoming a burden

## Non-Goals for Initial Version

The initial title screen should avoid:

- story prologue playback
- account-selection complexity
- monetization prompts before entering the app
- multi-scene cinematic intros
- paid gating of basic image replacement
