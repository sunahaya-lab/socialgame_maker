# formation-screen Split Map 2026-03-31

> Priority Band: Active Danger

## Goal

- `public/screens/formation-screen.js` is the next stabilization target outside `app-editor.js`.
- Do not split it by file size alone.
- Split it by gameplay responsibility so party UI, convert UI, growth detail, and equipment do not keep sharing one blast radius.

## Current File

- Target: [`public/screens/formation-screen.js`](../../public/screens/formation-screen.js)
- Current size:
  - about `10,872` chars
  - about `332` lines

## Current Internal Responsibility Bands

### 01. Screen Setup / Dependency Intake

Primary functions:

- `setupFormationScreen`
- `createFormationScreen`
- `renderFormationScreen`
- `getEquipmentMode`
- `isEquipmentVisibleInFormation`

Assessment:

- Watchlist.
- This is the module entry and screen-level orchestrator.

### 02. Convert Controls

Primary functions:

- `ensureConvertControls`
- `renderConvertControls`
- `toggleCopySelection`
- `clearConvertSelection`
- `clampNumberToStep`
- `handleConvertControlsInput`
- `handleConvertControlsClick`
- `handleSelectedCardConvert`
- `handleSelectionConvertError`
- `handleStaminaConvert`

Assessment:

- Dangerous.
- This area mixes:
  - fixed/floating panel behavior
  - multi-select state
  - conversion side effects
  - stamina growth exchange

Recommended destination:

- `public/screens/formation-convert-runtime.js`

### 03. Party / Slot UI

Primary functions:

- `renderPartySlots`
- `getFormationSlotRoleLabel`
- `assignCardToActiveSlot`
- `moveCardToSlot`
- `getNextAvailableSlotIndex`
- `handleCardDragStart`
- `handleSlotDragStart`
- `handleSlotDragOver`
- `handleSlotDrop`
- `clearDragState`

Assessment:

- Safe-watchlist.
- This is a coherent party placement slice and aligns with CSS `formation-party`.

Recommended destination:

- `public/screens/formation-party-runtime.js`

### 04. Card / Inventory List

Primary functions:

- `renderCardList`
- `handleDetailPointerDown`
- `clearPendingLongPress`

Assessment:

- Watchlist.
- Inventory rendering is central, but long-press detail coupling makes it slightly riskier than party slots alone.

Recommended destination:

- `public/screens/formation-card-list-runtime.js`

### 05. Equipment Section

Primary functions:

- `ensureEquipmentSection`
- `renderEquipmentList`

Assessment:

- Safe-watchlist.
- Equipment mode is already separately gated and visually distinct.

Recommended destination:

- `public/screens/formation-equipment-runtime.js`

### 06. Growth Detail Modal

Primary functions:

- `ensureGrowthDetailModal`
- `openGrowthDetail`
- `closeGrowthDetail`
- `resolveCharacterDetail`
- `resolveEquipmentDetail`
- `renderGrowthMaterials`
- `renderGrowthDetail`
- `handleGrowthActionClick`
- `handleGrowthResult`

Assessment:

- Dangerous.
- This is the other main danger core beside convert:
  - modal lifecycle
  - growth result handling
  - duplicate/material resolution
  - character/equipment branching

Recommended destination:

- `public/screens/formation-growth-runtime.js`

## Safe Extraction Order

1. `05. Equipment Section`
2. `03. Party / Slot UI`
3. `04. Card / Inventory List`
4. `02. Convert Controls`
5. `06. Growth Detail Modal`

## Current Recommendation

- Keep alignment with the CSS split map:
  - `formation-battle-entry`
  - `formation-party`
  - `formation-equipment`
  - `formation-convert`
  - `formation-growth-detail`
- Start with `equipment` or `party`, not with convert/growth.
- Treat `convert` and `growth-detail` as the true danger core.

## 2026-03-31 Progress Update

- Equipment section is now on an active delegated path via:
  - `public/screens/formation-equipment-runtime.js`
- `public/screens/formation-screen.js` now routes the following active calls through that runtime:
  - `ensureEquipmentSection`
  - `renderEquipmentList`
- Party / slot UI is now also on an active delegated path via:
  - `public/screens/formation-party-runtime.js`
- `public/screens/formation-screen.js` now routes the following active calls through that runtime:
  - `renderPartySlots`
  - `getFormationSlotRoleLabel`
  - `assignCardToActiveSlot`
  - `moveCardToSlot`
  - `getNextAvailableSlotIndex`
  - `handleSlotDragStart`
  - `handleSlotDragOver`
  - `handleSlotDrop`
- Card / inventory list is now also on an active delegated path via:
  - `public/screens/formation-card-list-runtime.js`
- `public/screens/formation-screen.js` now routes the following active calls through that runtime:
  - `renderCardList`
- Growth detail modal is now partially on an active delegated path via:
  - `public/screens/formation-growth-runtime.js`
- Convert controls are now also on an active delegated path via:
  - `public/screens/formation-convert-runtime.js`
- `public/screens/formation-screen.js` now routes the following active calls through that runtime:
  - `ensureConvertControls`
  - `renderConvertControls`
  - `clampNumberToStep`
  - `handleConvertControlsInput`
  - `handleConvertControlsClick`
  - `handleSelectedCardConvert`
  - `handleSelectionConvertError`
  - `handleStaminaConvert`
- Growth detail modal is now also on an active delegated path via:
  - `public/screens/formation-growth-runtime.js`
- `public/screens/formation-screen.js` now routes the following active calls through that runtime:
  - `handleDetailPointerDown`
  - `clearPendingLongPress`
  - `ensureGrowthDetailModal`
  - `openGrowthDetail`
  - `closeGrowthDetail`
  - `resolveCharacterDetail`
  - `resolveEquipmentDetail`
  - `renderGrowthMaterials`
  - `renderGrowthDetail`
  - `handleGrowthActionClick`
  - `handleGrowthResult`
- The old in-file body has now been trimmed substantially.
- `public/screens/formation-screen.js` is no longer carrying duplicate active implementations for:
  - equipment section
  - party / slot UI
  - card / inventory list
  - convert controls
  - growth detail modal
- The file now reads primarily as:
  - screen orchestrator
  - local helper state
  - thin delegated wrappers

## Current Risk Focus After Refactor

- The main residual risk is no longer duplicated live logic.
- The remaining risk is mostly:
  - local screen state coupling
  - drag / long-press glue
  - delegated runtime wiring assumptions
- `formation-screen.js` should now be treated as a watchlist orchestrator, not an active danger core.
- `03. Party / Slot UI` is no longer a primary split target because its active path already runs through `formation-party-runtime.js`.
- `04. Card / Inventory List` is no longer a primary split target because its active path already runs through `formation-card-list-runtime.js`.
- `06. Growth Detail Modal` is now on an active delegated path via `formation-growth-runtime.js`; only legacy in-file bodies remain earlier in the file.
- `02. Convert Controls` is now on an active delegated path via `formation-convert-runtime.js`; only legacy in-file bodies remain earlier in the file.
