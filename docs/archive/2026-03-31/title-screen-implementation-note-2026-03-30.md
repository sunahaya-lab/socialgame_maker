# Title Screen Implementation Note 2026-03-30

> Priority Band: Dormant But Kept

## Purpose

This note translates [`../specs/title-screen-spec.md`](../specs/title-screen-spec.md)
into a concrete first implementation plan for the current codebase.

It is intentionally scoped to the existing architecture:

- static screens in `public/index.html`
- startup orchestration in `public/app.js`
- shared project visual config in `systemConfig`
- system editing through `public/screens/system-editor.js`

## Implementation Summary

The first implementation should:

1. add a new `titleScreen` block to `systemConfig`
2. render a dedicated `screen-title` before `screen-home`
3. show a title background, optional logo, and `Press Start`
4. transition to `home` on tap/click
5. expose title-screen editing in the system editor
6. keep image upload free

## System Config Shape

The title screen should live in shared project config alongside other project UI
settings.

Recommended initial shape:

```js
titleScreen: {
  enabled: false,
  backgroundImage: "",
  logoImage: "",
  pressStartText: "Press Start",
  tapToStartEnabled: true
}
```

### Field notes

- `enabled`
  - whether the app shows the title screen before `home`
- `backgroundImage`
  - data URL or uploaded asset URL for the title background
- `logoImage`
  - optional title logo image
- `pressStartText`
  - visible start prompt text
- `tapToStartEnabled`
  - future-proof flag for alternate title interactions

## Default Config Update

The first code change should be in:

- [`public/lib/app-state.js`](../../public/lib/app-state.js)

`getDefaultSystemConfig()` should gain a `titleScreen` block with the default
shape above.

This keeps title screen state consistent with the current `systemConfig`
bootstrap model.

## HTML Structure Direction

The first DOM addition should be in:

- [`public/index.html`](../../public/index.html)

Recommended placement:

- add a new `.screen` before `#screen-home`
- id should be `screen-title`

Recommended structure:

```html
<div class="screen active" id="screen-title">
  <div class="title-screen-bg" id="title-screen-bg"></div>
  <img class="title-screen-logo" id="title-screen-logo" alt="" hidden>
  <div class="title-screen-overlay">
    <h1 class="title-screen-app-name" id="title-screen-app-name">Socia Maker</h1>
    <button type="button" class="title-screen-start" id="title-screen-start">
      Press Start
    </button>
  </div>
</div>
```

### DOM behavior rule

If `logoImage` exists:

- show the logo image
- the plain app-name text may be hidden or reduced

If `logoImage` does not exist:

- keep app-name text visible as fallback

## App Bootstrap Direction

The runtime entry work should be added in:

- [`public/app.js`](../../public/app.js)

### Initial responsibilities

Add title-screen runtime helpers with at least:

- `renderTitleScreen()`
- `openTitleScreen()`
- `closeTitleScreen()`
- `bindTitleScreenControls()`

### Initial startup rule

During `init()`:

- load `systemConfig` as usual
- if `systemConfig.titleScreen.enabled === true`, show `screen-title`
- otherwise go straight to `home`

### Start action rule

When the user activates the title screen:

- hide `screen-title`
- show `screen-home`
- proceed with normal app flow

The first version should not add extra loading gates after tapping start.

## Navigation Handling

The current app already tracks screen changes through `currentScreen`.

The title screen should integrate with this model as:

- `currentScreen = "title"` before entering home
- `currentScreen = "home"` after pressing start

The title screen is a startup screen, not a bottom-menu destination.

The bottom menu should still conceptually start from `home`.

## System Editor Integration

The title-screen editing UI should be added to:

- [`public/screens/system-editor.js`](../../public/screens/system-editor.js)

### Recommended first fields

The system editor should expose:

- title screen enabled checkbox
- title background image upload
- title logo image upload
- `Press Start` text input
- simple preview area

### Suggested form names

These names fit the current form-driven save flow:

- `titleScreenEnabled`
- `titleScreenBackgroundImage`
- `titleScreenLogoImage`
- `titleScreenPressStartText`

### Save behavior

`handleSystemSubmit()` should write:

```js
titleScreen: {
  enabled: form.titleScreenEnabled.checked,
  backgroundImage: "...",
  logoImage: "...",
  pressStartText: form.titleScreenPressStartText.value.trim() || "Press Start",
  tapToStartEnabled: true
}
```

The first version does not need a separate API.

It should continue saving through the existing system config save path.

## Preview Strategy

The first preview should stay lightweight.

Recommended preview behavior:

- show the current title background
- show the logo if present
- show the current `Press Start` text
- show a blinking or pulsing prompt style in preview if easy

Do not build a large dedicated preview editor first.

## Free/Paid Handling

The title-screen implementation should not be gated in the first version.

The following should remain free:

- enable title screen
- upload background image
- upload logo image
- change start text

No pack gate note is needed for the initial implementation.

## Minimal CSS Scope

The initial CSS can stay in:

- [`public/styles.css`](../../public/styles.css)

Recommended first classes:

- `.title-screen-bg`
- `.title-screen-overlay`
- `.title-screen-logo`
- `.title-screen-app-name`
- `.title-screen-start`

The first version only needs:

- centered composition
- readable overlay
- visible start prompt animation

## Fallback Rules

If config is incomplete:

- missing background image -> show default gradient or existing neutral background
- missing logo image -> show app-name text
- empty `pressStartText` -> show `Press Start`

The title screen must still be operable.

## First Implementation Checklist

1. extend `getDefaultSystemConfig()` with `titleScreen`
2. add `screen-title` to `public/index.html`
3. add title-screen CSS to `public/styles.css`
4. add title runtime functions in `public/app.js`
5. update system editor form and submit flow
6. verify project save/load preserves title-screen settings
7. verify title screen is skipped when disabled

## Non-Goals for First Pass

The first implementation should avoid:

- video backgrounds
- title BGM handling
- scheduled title variants
- multiple title presets
- pack gating
- cinematic intro flow
