# entry-editor Split Map 2026-03-31

> Priority Band: Strongly Active

## Goal

- `public/screens/entry-editor.js` is the next stabilization target outside `app-editor.js`.
- Do not split it by file size alone.
- Split it by editing responsibility so image/crop/save regressions stay local.

## Current File

- Target: [`public/screens/entry-editor.js`](../../public/screens/entry-editor.js)
- Current size:
  - about `14,413` chars
  - about `424` lines

## Current Internal Responsibility Bands

### 01. Setup / Dependency Intake / Form Access

Primary functions:

- `setupEntryEditor`
- `createEntryEditor`
- `getCharacterForm`
- `getCharacterImageInput`
- `getCharacterFolderSelect`
- `normalizeAttributeValue`

Assessment:

- Watchlist.
- This is not large, but it is the module entry and currently owns too many downstream helpers.

### 02. Relation / Voice / Simple Form Population

Primary functions:

- `clearCharacterRelationLists`
- `populateCharacterRelationFields`
- `renderCardVoiceLineFields`
- `collectCardVoiceLines`
- `renderCardHomeVoiceLineFields`
- `collectCardHomeVoiceLines`
- `addCardHomeOpinionInput`
- `addCardHomeConversationInput`
- `addCardHomeBirthdayInput`
- `collectCardHomeOpinions`
- `collectCardHomeConversations`
- `collectCardHomeBirthdays`

Assessment:

- Safe first extraction target.
- Mostly DOM helpers for relation/voice subfields.

Recommended destination:

- `public/editor/sections/card/card-editor-relations-runtime.js`

### 03. Save / Refresh / Billing Guard

Primary functions:

- `buildCharacterPayload`
- `saveCharacterCollection`
- `refreshAfterCharacterSave`
- `getBillingSaveErrorMessage`
- `handleCharacterSubmitClean`

Assessment:

- Dangerous.
- This is the highest-risk area because it mixes:
  - payload assembly
  - upload fallback
  - local/shared persistence
  - refresh side effects
  - pack/license handling

Recommended destination:

- `public/editor/sections/card/card-editor-save-runtime.js`

### 04. Form Apply / Reset / Edit Start

Primary functions:

- `applyCharacterToForm`
- `resetCharacterForm`
- `beginCharacterEditClean`
- `resetCharacterFormClean`

Assessment:

- Watchlist.
- This is editor-local and can be split after save/runtime boundaries are stable.

### 05. Image / Crop Editor

Primary functions:

- `ensureCharacterCropEditor`
- `clearCharacterImage`
- `clearCharacterCropEditorState`
- `updateActiveCropPreset`
- `scheduleCharacterCropRender`
- `renderCharacterCropEditor`
- `hasAnyCropImage`

Assessment:

- Dangerous.
- This area mixes:
  - uploaded image state
  - crop preset state
  - render scheduling
  - generated crop assets

Recommended destination:

- `public/editor/sections/card/card-editor-crop-runtime.js`

### 06. SD Editor

Primary functions:

- `ensureCharacterSdEditor`
- `populateCharacterSdEditor`
- `resetCharacterSdEditor`

Assessment:

- Safe.
- Small and isolated enough to split early.

Recommended destination:

- `public/editor/sections/card/card-editor-sd-runtime.js`

### 07. Battle Editor

Primary functions:

- `ensureCharacterBattleEditor`
- `addCharacterSkillPartRow`
- `collectCharacterBattleKit`
- `populateCharacterBattleEditor`
- `resetCharacterBattleEditor`

Assessment:

- Frozen watchlist.
- Battle Pack is currently frozen, so this should not be behavior-expanded.
- Extraction is allowed only to reduce blast radius.

Recommended destination:

- `public/editor/sections/card/card-editor-battle-runtime.js`

## Safe Extraction Order

1. `02. Relation / Voice / Simple Form Population`
2. `06. SD Editor`
3. `04. Form Apply / Reset / Edit Start`
4. `05. Image / Crop Editor`
5. `03. Save / Refresh / Billing Guard`
6. `07. Battle Editor`

## Current Recommendation

- Start with relation/voice helpers because they are DOM-local and low-risk.
- Do not start with save logic.
- Do not start with crop logic unless the current form path is stable.
- Treat battle editor as freeze-boundary work, not active feature work.

## 2026-03-31 Progress Update

- Relation / voice helpers are now on an active delegated path via:
  - `public/editor/sections/card/card-editor-relations-runtime.js`
- SD editor helpers are now also on an active delegated path via:
  - `public/editor/sections/card/card-editor-sd-runtime.js`
- `public/screens/entry-editor.js` now routes the following active calls through that section-local runtime:
  - relation list clear/populate
  - card voice field render/collect
  - card home voice field render/collect
  - home opinion/conversation/birthday add helpers
  - home opinion/conversation/birthday collect helpers
- `public/screens/entry-editor.js` also now routes the following active calls through the SD helper:
  - SD editor ensure
  - SD image change preview
  - SD image collect
  - SD editor populate/reset
- `public/screens/entry-editor.js` now also routes the following active calls through the form helper:
  - `applyCharacterToForm`
  - `beginCharacterEditClean`
  - `resetCharacterFormClean`
  - the top-level `resetCharacterForm` wrapper
- `public/screens/entry-editor.js` now also routes the following active calls through the crop helper:
  - `ensureCharacterCropEditor`
  - `handleCharacterImageChange`
  - `clearCharacterImage`
  - `setCharacterCropEditorState`
  - `clearCharacterCropEditorState`
  - `updateActiveCropPreset`
  - `scheduleCharacterCropRender`
  - `rerenderCharacterCropImages`
  - `renderCharacterCropEditor`
  - `resolveCharacterCropAssets`
  - `hasAnyCropImage`
- `public/screens/entry-editor.js` now also routes the following active calls through the save helper:
  - `buildCharacterPayload`
  - `saveCharacterCollection`
  - `refreshAfterCharacterSave`
  - `getBillingSaveErrorMessage`
  - `handleCharacterSubmitClean`
- Several dead in-file save helpers were removed on 2026-03-31:
  - `buildCharacterPayload`
  - `saveCharacterCollection`
- The remaining battle freeze boundary also now routes its active pack-state path through:
  - `public/editor/sections/card/card-editor-battle-runtime.js`
- `refreshBattlePackUi` is no longer live in `entry-editor.js`; the live file now keeps only thin battle wrappers around the frozen path.
  - `refreshAfterCharacterSave`
  - `applyCharacterToForm`
  - `handleCharacterSubmit`
  - `resetCharacterForm`
  - `getBillingSaveErrorMessage`

## Current Risk Focus After Refactor

- The remaining active danger is now concentrated in:
  - `07. Battle Editor`
- `07. Battle Editor` remains frozen-watchlist work.
- `04. Form Apply / Reset / Edit Start` is no longer a priority split target because the active path already runs through `card-editor-form-runtime.js`.
- `05. Image / Crop Editor` is on a delegated active path via `card-editor-crop-runtime.js`.
- `03. Save / Refresh / Billing Guard` is on a delegated active path via `card-editor-save-runtime.js`.
- In other words, this file is now much closer to a thin section orchestrator plus frozen battle helpers.

## Next Recommendation

1. Re-measure before any further split so save and battle do not get mixed together.
2. The next remaining danger task is `07. Battle Editor`.
3. Keep `07. Battle Editor` as freeze-boundary work unless a refactor is needed purely to reduce blast radius.

## Next Recommendation

1. Treat `07. Battle Editor` as the only remaining frozen-watchlist band inside this file.
2. Do not reopen crop/save extraction work here unless a concrete bug forces it.
3. If touching this file again, prefer legacy cleanup or battle-boundary isolation only.
