# styles.css Split Map 2026-03-30

> Priority Band: Strongly Active

## Purpose

- This document is the working split map for [`public/styles.css`](../../public/styles.css).
- The active runtime stylesheet is still [`public/styles.css`](../../public/styles.css).
- Files under [`public/styles/`](../../public/styles/) remain reference-only until `index.html` gets an explicit assembly path.
- The immediate goal is not runtime switching.
- The immediate goal is to make parallel extraction safe and predictable.

## Current Rule

- Edit live styling in [`public/styles.css`](../../public/styles.css) first.
- When extracting, copy a bounded section into `public/styles/*.css` without changing runtime.
- Do not remove the source block from `public/styles.css` until:
  - the target split file exists
  - the ownership is clear
  - the extraction boundary is reviewed
  - a later task explicitly removes the duplicated source

## Current Section Map

## Current Practical Priority 2026-03-31

- Active runtime source of truth remains [`public/styles.css`](../../public/styles.css).
- The next goal is not a runtime switch.
- The next goal is to narrow the real danger core inside the monolith.

### Current safe frontier

- `SECTION 03`
  - gacha
- `SECTION 04`
  - battle
  - collection
  - card detail
- `SECTION 02`
  - title/home core now has a much thinner JS owner, so CSS changes there are safer than before when kept local

### Current watchlist

- `SECTION 02`
  - home overlay / home config related bands
- `SECTION 04A`
  - story reader vs editor-story tooling boundary
- `SECTION 04C formation`
  - only after splitting by sub-band, not as one unit

### Current danger core

- `SECTION 05`
  - legacy editor core
- `SECTION 06`
  - responsive / orientation / scale overrides
- `SECTION 08B`
  - post-stage additions that still layer onto multiple older sections

### Practical next order

1. keep `SECTION 03` and the safe `SECTION 04` bands as reference-stable
2. continue narrowing `SECTION 02` by sub-band, not as one unit
3. treat `SECTION 05 / SECTION 06 / SECTION 08B` as the real high-risk core
4. do not mix visual redesign with split synchronization

### Section 01

- Name: `TOKENS / APP FRAME / GLOBAL BASE`
- Current range marker: `SECTION 01`
- Current sync status:
  - split-side reference sync completed on 2026-03-31
  - runtime is still [`public/styles.css`](../../public/styles.css)
  - split files are ready as extraction references, not active runtime sources
- Intended target files:
  - [`public/styles/tokens.css`](../../public/styles/tokens.css)
  - [`public/styles/base.css`](../../public/styles/base.css)
- Contains:
  - `:root`
  - `body`
  - `.app-shell`
  - `.screen`
  - `.bottom-nav`
  - shared button/base primitives
- Risk:
  - highest shared blast radius
  - do not mix with screen-local tweaks

#### Section 01 Completed Reference Sync

- [`public/styles/tokens.css`](../../public/styles/tokens.css)
  - synced to current `SECTION 01` token variables
- [`public/styles/base.css`](../../public/styles/base.css)
  - synced to current `SECTION 01` app frame / screen system / bottom nav / screen header blocks

### Section 02

- Name: `TITLE + HOME SCREEN`
- Current range marker: `SECTION 02`
- Current sync status:
  - split-side reference sync completed on 2026-03-30
  - runtime is still [`public/styles.css`](../../public/styles.css)
  - split file is ready as extraction reference, not active runtime source
- Subsections:
  - `02A title screen shell`
  - `02B home stage background + layout overlay`
  - `02C home characters + HUD`
  - `02D home config / placement panel`
  - `02E home ticker / announcements edge`
- Intended target files:
  - [`public/styles/home.css`](../../public/styles/home.css)
  - future split candidates if needed:
    - `home-title.css`
    - `home-overlay.css`
    - `home-config.css`
- Risk:
  - medium-high
  - `02B` and `02D` interact with direct-edit/home-edit work

#### Section 02 Completed Reference Sync

- [`public/styles/home.css`](../../public/styles/home.css)
  - synced to title/home core blocks from current `SECTION 02`
  - intentionally excludes `event-screen`
  - intentionally excludes post-stage additions such as `home-announcements`

#### Section 02 Internal Severity Split

- `02A title screen shell`
  - selectors:
    - `.title-*`
  - severity:
    - `Safe`
  - note:
    - title shell is now owned by a much thinner JS path than before
    - low cross-screen blast radius when kept local
- `02B home stage background + layout overlay`
  - selectors:
    - `.home-stage*`
    - `.home-layout*`
    - `.home-bg*`
  - severity:
    - `Watchlist`
  - note:
    - still interacts with home placement and stage composition
    - safe only when treated as stage-only styling, not editor behavior
- `02C home characters + HUD`
  - selectors:
    - `.home-character*`
    - `.home-header*`
    - `.home-currency*`
    - `.home-dialogue*`
  - severity:
    - `Watchlist`
  - note:
    - JS owner is much safer now, but visible blast radius is still large
    - keep dialogue and header adjustments localized
- `02D home config / placement panel`
  - selectors:
    - `.home-config*`
    - `.home-edit*`
    - placement / drag handles
  - severity:
    - `Dangerous`
  - note:
    - this is the real danger core inside Section 02
    - home direct-edit, stage preview, drag, and control panels all overlap here
- `02E home ticker / announcements edge`
  - selectors:
    - `.home-announcement*`
    - `.home-ticker*`
  - severity:
    - `Safe`
  - note:
    - narrow visual scope
    - can be treated independently from stage placement

#### Section 02 Extraction Order

1. `02A title screen shell`
2. `02E home ticker / announcements edge`
3. `02C home characters + HUD`
4. `02B home stage background + layout overlay`
5. `02D home config / placement panel`

#### Section 02 Current Sync Notes

- `02A title screen shell`
  - split-side reference in [`public/styles/home.css`](../../public/styles/home.css) is aligned with the current runtime source
  - practical handling can now treat this as `safe frontier`
- `02C home characters + HUD`
  - split-side reference in [`public/styles/home.css`](../../public/styles/home.css) is aligned with the current runtime source for the main active band
  - one runtime-only duplicate selector pair in [`public/styles.css`](../../public/styles.css) was removed on 2026-03-31 as low-risk cleanup
  - practical handling can now treat this as `safe-to-watchlist frontier`, not as a danger core
- `02B home stage background + layout overlay`
  - split-side reference in [`public/styles/home.css`](../../public/styles/home.css) is aligned with the current runtime source at selector level
  - the practical risk here is not sync drift
  - the practical risk is that `.home-layout-overlay*` still sits on top of stage composition and direct-edit style concerns
  - treat this as `watchlist with overlay coupling`, not as a selector-mismatch zone
- `02E home ticker / announcements edge`
  - split-side reference in [`public/styles/home.css`](../../public/styles/home.css) is aligned with the current runtime source
  - this band only covers `.home-ticker*`
  - post-stage announcement cards such as `.home-announcements*` remain part of later `SECTION 08` work and must not be conflated with `02E`
- Practical implication:
  - `02A` and `02E` can be treated as reference-stable
  - `02C` can be treated as stabilized watchlist, not local danger core
  - `02B` is watchlist because of overlay coupling, not sync drift
  - the only true local danger core left inside `SECTION 02` is `02D`

#### Section 02D Internal Severity Split

- `02D-a panel shell / labels / inputs`
  - selectors:
    - `.home-config-panel*`
    - `.home-config-toolbar*`
    - `.home-config-target*`
    - `.home-config-scale-label*`
    - `.home-config-hint`
  - severity:
    - `Watchlist`
  - note:
    - selector band is stable against [`public/styles/home.css`](../../public/styles/home.css)
    - danger here is mostly visual spill, not behavioral coupling
- `02D-b stage preview shell`
  - selectors:
    - `.home-config-stage-wrap`
    - `.home-config-stage`
    - `.home-config-stage-floor`
    - `.home-config-stage-empty`
  - severity:
    - `Watchlist`
  - note:
    - tied to stage composition and preview framing
    - still safer than drag/selection itself
- `02D-c draggable character layer`
  - selectors:
    - `.home-config-stage-char*`
  - severity:
    - `Dangerous`
  - note:
    - this is the real local danger core inside `02D`
    - position, z-order, active state, dragging state, and hidden state all overlap here
    - one small runtime-only duplicate selector pair was removed on 2026-03-31 as low-risk cleanup
- `02D-d cross-section overlap with SECTION 07`
  - selectors:
    - practical overlap with `.home-edit-*`
  - severity:
    - `Dangerous`
  - note:
    - `02D` cannot be treated as isolated config CSS
    - its behavior is coupled to later `SECTION 07` window/edit overlay bands

#### Section 02D Practical Order

1. `02D-a panel shell / labels / inputs`
2. `02D-b stage preview shell`
3. `02D-c draggable character layer`
4. `02D-d cross-section overlap with SECTION 07`

#### Section 02D Current Sync Notes

- `02D-a panel shell / labels / inputs`
  - split-side reference in [`public/styles/home.css`](../../public/styles/home.css) is aligned with the current runtime source
  - practical handling can now treat this as stabilized watchlist, not local danger core
- `02D-b stage preview shell`
  - split-side reference in [`public/styles/home.css`](../../public/styles/home.css) is aligned with the current runtime source
  - practical handling can now treat this as stabilized watchlist, not local danger core
- `02D-c draggable character layer`
  - dedicated reference split now exists at:
    - [`public/styles/home-config-stage.css`](../../public/styles/home-config-stage.css)
  - runtime source of truth still remains [`public/styles.css`](../../public/styles.css)
  - 2026-03-31 safety hardening:
    - default stacking was made explicit with a base `z-index`
    - dragging state now raises above front/back variants explicitly
    - label pseudo-elements now ignore pointer events
- Practical implication:
  - the real remaining local danger inside `02D` is now concentrated in:
    - `02D-c draggable character layer`
    - `02D-d cross-section overlap with SECTION 07`

### Section 03

- Name: `GACHA SCREEN`
- Current range marker: `SECTION 03`
- Current sync status:
  - split-side reference sync completed on 2026-03-30
  - runtime is still [`public/styles.css`](../../public/styles.css)
  - split file is ready as extraction reference, not active runtime source
- Subsections:
  - `03A banner list + hero display`
  - `03B draw overlay + results`
- Intended target files:
  - [`public/styles/gameplay.css`](../../public/styles/gameplay.css)
  - or later:
    - `gacha.css`
    - `gacha-overlay.css`
- Risk:
  - medium
  - `03B` shares modal surface constraints with story/card detail

### Section 04

- Name: `STORY / BATTLE / COLLECTION / FORMATION`
- Current range marker: `SECTION 04`
- Current sync status:
  - split-side reference sync completed on 2026-03-30
  - runtime is still [`public/styles.css`](../../public/styles.css)
  - split file is ready as extraction reference, not active runtime source
- Subsections:
  - `04A story tabs / list / reader`
  - `04B battle screen`
  - `04C collection + formation + growth detail`
  - `04D card detail modal`
- Intended target files:
  - [`public/styles/gameplay.css`](../../public/styles/gameplay.css)
  - later candidates:
    - `story.css`
    - `battle.css`
    - `collection.css`
    - `formation.css`
- Risk:
  - medium-high
  - `04D` shares modal assumptions with `03B`

#### Section 04 Internal Severity Split

- `04A story`
  - selectors:
    - `.story-*`
  - severity:
    - `Watchlist`
  - note:
    - reader/modal surface still interacts with overlay sizing rules
- `04B battle`
  - selectors:
    - `.battle-*`
  - severity:
    - `Watchlist`
  - note:
    - mostly self-contained, but still gameplay-runtime coupled
- `04C collection`
  - selectors:
    - `.collection-*`
  - severity:
    - `Safe`
  - note:
    - low cross-screen blast radius compared with the rest of Section 04
- `04C formation`
  - selectors:
    - `.formation-*`
  - severity:
    - `Dangerous`
  - note:
    - do not treat this as part of generic gameplay extraction
    - formation currently mixes:
      - party layout
      - battle entry panel
      - convert sheet / FAB
      - growth detail modal
      - equipment list
      - selection state visuals
- `04D card detail modal`
  - selectors:
    - `.card-detail-*`
  - severity:
    - `Watchlist`
  - note:
    - modal sizing assumptions are still shared with story/gacha overlays

#### Section 04 Extraction Order

1. `04C collection`
2. `04A story`
3. `04B battle`
4. `04D card detail modal`
5. `04C formation`

#### Section 04 Important Rule

- Do not refer to `04C` as one extraction unit during stabilization.
- Treat `collection` and `formation` as different risk bands even though both still live under the same source section.
- If a task touches `.formation-*`, classify it as `Dangerous` work regardless of the broader `gameplay.css` grouping.

#### Section 04 Sync Check 2026-03-31

- `04C collection`
  - status:
    - reference sync looks exact
    - safe to treat as isolated gameplay extraction
  - selector diff:
    - `styles.css` only: `0`
    - `gameplay.css` only: `0`
- `04B battle`
  - status:
    - reference sync looks exact
    - safe to treat as isolated gameplay extraction
  - selector diff:
    - `styles.css` only: `0`
    - `gameplay.css` only: `0`
- `04D card detail modal`
  - status:
    - reference sync looks exact at the selector level
    - safe to treat as isolated gameplay extraction, but keep modal-size assumptions in mind
  - selector diff:
    - `styles.css` only: `0`
    - `gameplay.css` only: `0`
- `04A story`
  - status:
    - mostly synced, and runtime-story boundary is now much clearer
  - selector diff:
    - `styles.css` only: `5`
    - `gameplay.css` only: `0`
  - current `styles.css`-only selectors:
    - `.story-scenes-editor`
    - `.story-variant-default-item`
    - `.story-variant-default-list`
    - `.story-variant-default-name`
    - `.story-variant-defaults`
  - interpretation:
    - the remaining unsynced selectors are editor-story tooling only
    - runtime story reader helpers are now reference-synced into `gameplay.css`
    - `04A` can now be treated as:
      - runtime story reader/list styles in `gameplay.css`
      - editor-story tooling styles in `editor-story-tools.css`

#### Section 04 Immediate Safe Work

- Safe to continue syncing/checking without runtime switch:
  - `04C collection`
  - `04B battle`
  - `04D card detail modal`
- Needs boundary cleanup before treating as isolated:
  - `04A story`
- Must stay as its own danger track:
  - `04C formation`

#### Section 04 Current Split Reality

- `public/styles/gameplay.css` is now effectively trustworthy for:
  - `battle`
  - `collection`
  - `card detail`
- `story` is close, but still intentionally split across:
  - runtime story reader/list rules in `gameplay.css`
  - editor-story tooling in `editor-story-tools.css`
- `formation` remains intentionally bundled in `gameplay.css` only as a reference mirror, not as a safe extraction candidate yet

#### Section 04C Formation Internal Map

- `formation-party`
  - selectors:
    - `.formation-panel`
    - `.formation-party`
    - `.formation-slot*`
    - `.formation-card-list`
    - `.formation-card*`
    - `.formation-empty`
  - runtime responsibilities:
    - active slot selection
    - card assignment
    - drag/drop
    - selected state visuals
  - severity:
    - `Watchlist` inside the broader formation danger area
  - sync state:
    - selector-level reference sync confirmed on 2026-03-31
    - `styles.css` only: `0`
    - `gameplay.css` only: `0`
  - interpretation:
    - safe to inspect and mirror independently before convert/growth-detail work
- `formation-battle-entry`
  - selectors:
    - `.formation-battle-entry*`
  - runtime responsibilities:
    - battle entry panel only
  - severity:
    - `Watchlist`
  - sync state:
    - selector-level reference sync confirmed on 2026-03-31
    - `styles.css` only: `0`
    - `gameplay.css` only: `0`
  - interpretation:
    - safe to inspect and mirror independently before the rest of formation
- `formation-convert`
  - selectors:
    - `.formation-convert-*`
  - runtime responsibilities:
    - convert sheet
    - floating FAB
    - stamina conversion
    - selected-card conversion
  - severity:
    - `Dangerous`
  - note:
    - this is the most interference-prone formation block because it is fixed-position and overlaps the list surface
  - sync state:
    - selector-level reference sync confirmed on 2026-03-31
    - `styles.css` only: `0`
    - `gameplay.css` only: `0`
  - interpretation:
    - danger comes from fixed-position interaction behavior, not split drift
- `formation-equipment`
  - selectors:
    - `.formation-equipment-*`
    - `.formation-subtitle`
    - `.formation-subnote`
  - runtime responsibilities:
    - equipment list visibility
    - equipment owned-state display
  - severity:
    - `Watchlist`
  - sync state:
    - selector-level reference sync confirmed on 2026-03-31
    - `styles.css` only: `0`
    - `gameplay.css` only: `0`
  - interpretation:
    - safe to inspect and mirror independently before convert/growth-detail work
- `formation-growth-detail`
  - selectors:
    - `.formation-growth-*`
  - runtime responsibilities:
    - long-press detail modal
    - growth/evolve/limit-break actions
    - material selection tiles
  - severity:
    - `Dangerous`
  - note:
    - modal and action-state coupling make this a separate danger track from party/list rendering
  - sync state:
    - selector-level reference sync confirmed on 2026-03-31
    - `styles.css` only: `0`
    - `gameplay.css` only: `0`
  - interpretation:
    - danger comes from modal/action coupling, not split drift

#### Formation Extraction Order

1. `formation-battle-entry`
2. `formation-party`
3. `formation-equipment`
4. `formation-convert`
5. `formation-growth-detail`

#### Formation Important Rule

- Do not treat `.formation-*` as one refactor unit anymore.
- During stabilization, classify `formation-convert` and `formation-growth-detail` as the two highest-risk subareas.
- `formation-party`, `formation-battle-entry`, and `formation-equipment` can be inspected and mirrored first without touching the modal/overlay behavior.

#### How To Make Formation Safer

Without changing runtime source yet, the safest rules are:

1. keep `formation-convert` and `formation-growth-detail` on separate review tracks
2. do not mix visual redesign with sync/extraction work on these two blocks
3. if touching `formation-convert`, always verify:
   - card-list access is not blocked
   - fixed-position placement does not cover bottom interaction zones
   - FAB and sheet still behave as one unit
4. if touching `formation-growth-detail`, always verify:
   - modal open/close
   - long-press entry assumptions
   - internal scroll/overflow containment
5. prefer changing one danger block at a time, never both in one pass

#### Formation Current Safe Frontier

- Already safe to treat as independently mirrored:
  - `formation-battle-entry`
- Now also safe to treat as independently mirrored:
  - `formation-party`
- Also safe to treat as independently mirrored:
  - `formation-equipment`
- Remaining danger core:
  - `formation-convert`
  - `formation-growth-detail`

#### Section 03-04 Completed Reference Sync

- [`public/styles/gameplay.css`](../../public/styles/gameplay.css)
  - synced to current `SECTION 03-04`
  - intentionally excludes editor launcher / auth / share / member spillover from stale split history
  - intentionally excludes responsive/orientation overrides from `SECTION 06`
  - intentionally excludes post-stage additions from `SECTION 08`

### Section 05

- Name: `LEGACY EDITOR CORE`
- Current range marker: `SECTION 05`
- Current sync status:
  - split-side reference sync completed on 2026-03-30
  - runtime is still [`public/styles.css`](../../public/styles.css)
  - split files are ready as extraction references, not active runtime sources
- Subsections:
  - `05A editor lists / records / forms`
  - `05B editor scene / gacha / expression extras`
  - `05C editor utilities / toast anchor`
- Intended target files:
  - [`public/styles/editor-shared.css`](../../public/styles/editor-shared.css)
  - [`public/styles/editor-core.css`](../../public/styles/editor-core.css)
  - [`public/styles/editor-forms.css`](../../public/styles/editor-forms.css)
  - [`public/styles/editor-folders.css`](../../public/styles/editor-folders.css)
  - [`public/styles/editor-story-tools.css`](../../public/styles/editor-story-tools.css)
- Risk:
  - high churn
  - but lower global blast radius than Sections 01/06/08A

#### Section 05 Current Target Mapping

- `public/styles/editor-shared.css`
  - shared utility styles used across editor surfaces
  - current candidates:
    - rarity color helpers under `05C`
    - `.toast` and toast keyframes under `05C`
    - generic `.editor-note` class if reused across multiple editor surfaces
- `public/styles/editor-core.css`
  - list and panel skeleton, non-form editor surfaces
  - current candidates:
    - `.editor-desc`
    - `.editor-list-section`
    - `.editor-record-*`
    - `.editor-inline-btn`
    - `.editor-list-toolbar`
    - `.editor-panel`
    - `.base-char-*` list display blocks
    - `.editor-floating-window*`
- `public/styles/editor-forms.css`
  - inputs, preview blocks, form-only layout
  - current candidates:
    - `.editor-form*`
    - `.editor-preview*`
    - `.character-crop-*`
    - `.character-sd-*`
    - `.character-battle-*`
    - generic editor label/input/textarea/select styling
- `public/styles/editor-folders.css`
  - folder manager and foldable groups
  - current candidates:
    - `.editor-folder-*`
    - `.editor-inline-select*`
    - folder manager tabs/cards/thumb strips
- `public/styles/editor-story-tools.css`
  - story scene tools, expression editor, gacha pool helpers, system preview helpers
  - current candidates:
    - `.story-scenes-editor*`
    - `.story-variant-default-*`
    - `.scene-*`
    - `.gacha-pool-*`
    - `.rate-inputs*`
    - `.editor-collapsible*`
    - `.voice-line-fields`
    - `.relation-line-*`
    - `.expression-*`
    - `.scene-extras*`
    - `.system-preview*`
  - keep note:
    - old layout preset / asset library rules still exist inside Section 05 source
    - those should not be reactivated as runtime truth
    - if extracted, mark them as `inactive reference` or move them last

#### Section 05 Extraction Passes

1. `05C` into `editor-shared.css`
2. `05A` form-independent list and record rules into `editor-core.css`
3. `05A` form-only rules into `editor-forms.css`
4. folder manager blocks into `editor-folders.css`
5. `05B` scene/expression/gacha/system helpers into `editor-story-tools.css`
6. layout preset / asset library leftovers handled separately at the end

#### Section 05 Completed Reference Sync

- [`public/styles/editor-shared.css`](../../public/styles/editor-shared.css)
  - synced to current `05C`
- [`public/styles/editor-core.css`](../../public/styles/editor-core.css)
  - synced to current `05A` shell/list/record/floating-window rules
- [`public/styles/editor-forms.css`](../../public/styles/editor-forms.css)
  - synced to current `05A` form-only rules
- [`public/styles/editor-folders.css`](../../public/styles/editor-folders.css)
  - synced to current folder manager rules
- [`public/styles/editor-story-tools.css`](../../public/styles/editor-story-tools.css)
  - synced to current active `05B`
  - intentionally excludes inactive layout preset / asset library leftovers

### Section 06

- Name: `RESPONSIVE / ORIENTATION / SCALE OVERRIDES`
- Current range marker: `SECTION 06`
- Current sync status:
  - partial split-side reference sync completed on 2026-03-31
  - `06A-06E` now mirror current runtime truth in [`public/styles/responsive.css`](../../public/styles/responsive.css)
  - `08A` remains separate and unsynced
  - runtime remains fully on [`public/styles.css`](../../public/styles.css)
- Subsections:
  - `06A shared compact overrides`
  - `06B fullscreen mode`
  - `06C forced landscape mode`
  - `06D forced portrait mode`
  - `06E auto landscape media queries`
- Intended target files:
  - [`public/styles/responsive.css`](../../public/styles/responsive.css)
- Owner:
  - layout / orientation / fixed-ratio work only
- Risk:
  - highest after Section 01
  - do not patch casually for one screen

#### Section 06 Planned Mapping

- [`public/styles/responsive.css`](../../public/styles/responsive.css)
  - `06A`
    - shared compact overrides for `landscape-mode` and `fullscreen-mode`
    - includes small-size home/gacha/story/collection/editor compacting
  - `06B`
    - fullscreen-only shell width and modal max-width rules
  - `06C`
    - forced landscape boxed-shell behavior
    - includes landscape `.app-shell`, `.bottom-nav`, `.screen`, modal width overrides
  - `06D`
    - forced portrait shell and modal width overrides
  - `06E`
    - auto-landscape media queries
    - includes compact UI plus boxed-shell behavior when no forced portrait class is set

#### Section 06 Extraction Rule

- Do not normalize selector meaning during extraction.
- Copy runtime truth first, then document duplicates or cleanup candidates later.
- Keep `06A`, `06C`, and `06E` adjacent in the split file because they share selector families.
- Do not touch `SECTION 08A` in the same patch as `06C/06E`.

#### Section 06 Extraction Passes

1. `06A` only
   - completed on 2026-03-31
   - shared compact overrides for `landscape-mode` and `fullscreen-mode` now synced to [`public/styles/responsive.css`](../../public/styles/responsive.css)
2. `06B` only
   - completed on 2026-03-31
   - fullscreen-only shell width and modal max-width rules now synced to [`public/styles/responsive.css`](../../public/styles/responsive.css)
3. `06C` only
   - completed on 2026-03-31
   - forced landscape boxed-shell behavior now synced to [`public/styles/responsive.css`](../../public/styles/responsive.css)
4. `06D` only
   - completed on 2026-03-31
   - forced portrait shell and modal width constraints now synced to [`public/styles/responsive.css`](../../public/styles/responsive.css)
5. `06E` only
   - completed on 2026-03-31
   - auto-landscape media query block now synced to [`public/styles/responsive.css`](../../public/styles/responsive.css)
6. review pass
   - compare `06A`, `06C`, and `06E` for duplicate selector families
   - annotate overlap candidates but do not normalize yet

#### Section 06 Current Partial Reference Sync

- [`public/styles/responsive.css`](../../public/styles/responsive.css)
  - now mirrors current runtime `06A`
  - now mirrors current runtime `06B`
  - now mirrors current runtime `06C`
  - now mirrors current runtime `06D`
  - now mirrors current runtime `06E`
  - intentionally does not yet include `08A`

### Section 07

- Name: `HOME EDIT WORKSPACE`
- Current range marker: `SECTION 07`
- Current sync status:
  - split-side reference sync completed on 2026-03-30
  - runtime is still [`public/styles.css`](../../public/styles.css)
  - split files are ready as extraction references, not active runtime sources
- Subsections:
  - `07A overlay + floating windows`
  - `07B folder manager + edit panels`
- Intended target files:
  - [`public/styles/home-edit.css`](../../public/styles/home-edit.css)
  - [`public/styles/home-edit-folders.css`](../../public/styles/home-edit-folders.css)
- Risk:
  - medium-high
  - tied to direct edit and floating window behavior

#### Section 07 Completed Reference Sync

- [`public/styles/home-edit.css`](../../public/styles/home-edit.css)
  - synced to current `07A`
  - contains overlay + floating window shell + home edit menu/workspace
- [`public/styles/home-edit-folders.css`](../../public/styles/home-edit-folders.css)
  - synced to current `07B`
  - contains folder manager + edit panel blocks only

#### Section 07 Internal Severity Split

- `07A overlay + floating windows`
  - selectors:
    - `.home-edit-overlay*`
    - `.home-edit-window*`
    - `.home-edit-menu-*`
    - `.home-edit-builder`
    - `.home-edit-base-char-window`
  - severity:
    - `Dangerous`
  - note:
    - this is the main cross-section overlap partner for `02D-c draggable character layer`
    - dragging, hit area, z-order, and floating window geometry all meet here
- `07B folder manager + edit panels`
  - selectors:
    - `.home-edit-folder-*`
    - `.home-edit-window-body`
    - `.home-edit-window-panel`
    - `.home-edit-icon-btn`
  - severity:
    - `Watchlist`
  - note:
    - still broad, but more panel-local than `07A`

#### Section 07A Internal Severity Split

- `07A-a overlay shell / pointer-events / z-order`
  - selectors:
    - `.home-edit-overlay*`
  - severity:
    - `Dangerous`
  - note:
    - this is the direct collision surface with `02D-c draggable character layer`
    - hit area ownership, pointer-events, and overlay activation all meet here
  - 2026-03-31 safety hardening:
    - overlay shell now stays pointer-transparent even in active mode
    - floating windows explicitly own pointer input instead of the overlay root
- `07A-b floating window geometry / header chrome / menu body`
  - selectors:
    - `.home-edit-window*`
    - `.home-edit-menu-*`
    - `.home-edit-builder`
    - `.home-edit-base-char-window`
  - severity:
    - `Watchlist`
  - note:
    - still broad and layout-sensitive
    - but safer than the overlay shell itself because its risk is geometry, not hit-area ownership

#### Section 07 Practical Implication

- the real combined danger band is:
  - `02D-c draggable character layer`
  - `07A-a overlay shell / pointer-events / z-order`
- `07B` should be treated separately so that folder/panel cleanup does not get blocked by drag-layer risk
- `07A-a` now also has a dedicated reference split at:
  - [`public/styles/home-edit-overlay-core.css`](../../public/styles/home-edit-overlay-core.css)
  - runtime source of truth still remains [`public/styles.css`](../../public/styles.css)

### Section 08

- Name: `POST-STAGE ADDITIONS / RELEASE FEATURES`
- Current range marker: `SECTION 08`
- Current sync status:
  - `08A` split-side reference sync completed on 2026-03-31
  - [`public/styles/responsive.css`](../../public/styles/responsive.css) now mirrors current runtime `08A`
  - `08B` stays local/additive and is not part of responsive extraction yet
- Subsections:
  - `08A app stage scaling`
  - `08B release additions kept at tail during transition`
- Intended target files:
  - [`public/styles/responsive.css`](../../public/styles/responsive.css) for `08A`
  - screen-local files for `08B`
- Owner:
  - `08A`: fixed-ratio / stage-scaling work only
  - `08B`: local feature owners
- Risk:
  - very high for `08A`
  - medium for `08B`

#### Section 08A Planned Mapping

- [`public/styles/responsive.css`](../../public/styles/responsive.css)
  - `body:not(.landscape-mode)` app stage variables
  - `body.landscape-mode` app stage variables
  - `.app-stage`
  - `.app-stage > .app-shell`
  - body-level centering/overflow rules that make fixed-ratio stage scaling work

#### Section 08A Extraction Rule

- Extract only after `Section 06` mapping is understood and documented.
- Keep `08A` at the tail of `responsive.css`.
- Do not mix `08A` with `08B` release additions.
- Do not runtime-switch to split CSS in the same change set.

#### Section 08A Extraction Passes

1. copy stage scale variables on `body:not(.landscape-mode)` and `body.landscape-mode`
   - completed on 2026-03-31
2. copy `.app-stage` and `.app-stage > .app-shell`
   - completed on 2026-03-31
3. copy body-level centering/overflow rules required by fixed-ratio stage scaling
   - completed on 2026-03-31
4. review pass
   - check whether `08A` references any selector families already touched by `06C`/`06E`
   - keep `08A` below all `06*` blocks in the split file

#### Section 08A Current Reference Sync

- [`public/styles/responsive.css`](../../public/styles/responsive.css)
  - now mirrors current runtime `08A`
  - intentionally does not include `08B`

## Recommended Extraction Order

1. Section 05 editor-only blocks into `public/styles/editor-*.css`
2. Section 02 home-local blocks into `public/styles/home.css`
3. Section 03 and Section 04 into `public/styles/gameplay.css`
4. Section 07 into new `home-edit*.css` files
5. Section 06 and `08A` last
6. Section 01 only after the rest are stable

## Parallel Work Rules

### Safe Parallel Pairings

- Section 02 with Section 05
- Section 03 with Section 07
- Section 04 with Section 05
- Section 08B with any screen-local section

### Unsafe Parallel Pairings

- Section 01 with anything else
- Section 06 with anything else
- Section `08A` with anything else
- `03B`, `04A story-reader`, and `04D` at the same time without coordination

## Definition Of Done For One Extraction

- Matching source block identified by section and subsection marker
- Target split file updated
- Source block in `public/styles.css` annotated or kept intentionally
- No selector reordering inside the source block during extraction
- [`scripts/check-mojibake.js`](../../scripts/check-mojibake.js) passes
- Browser-impacting runtime switch is explicitly deferred unless separately approved
