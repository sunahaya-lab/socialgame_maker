# home-config Split Map 2026-03-31

> Priority Band: Watchlist

## Goal

- `public/screens/home-config.js` を `audio`, `panel lifecycle`, `stage preview / drag`, `save` に分ける。
- 先に局所 UI を外し、最後に stage drag を isolated runtime にする。

## Current File

- Target: [`public/screens/home-config.js`](../../public/screens/home-config.js)
- Current size:
  - about `8,098` chars
  - about `272` lines

## Current Internal Responsibility Bands

### 01. Home preference load/save

Primary functions:

- `loadHomeConfig`
- `saveHomeConfig`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`public/screens/home-config-save-runtime.js`](../../public/screens/home-config-save-runtime.js)

### 02. Audio settings

Primary functions:

- `normalizeAudioSettings`
- `getAudioSettings`
- `saveAudioSettings`
- `applyAudioSettings`
- `syncAudioSettingsForm`
- `openAudioSettingsPanel`
- `closeAudioSettingsPanel`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`public/screens/home-config-audio-runtime.js`](../../public/screens/home-config-audio-runtime.js)

### 03. Panel lifecycle / form sync

Primary functions:

- `openHomeConfigPanel`
- `closeHomeConfigPanel`
- `setupHomeConfig`
- `syncHomeConfigForm`
- `syncHomeConfigScale`
- `populateHomeCardSelects`
- `populateHomeBackgroundSelect`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`public/screens/home-config-panel-runtime.js`](../../public/screens/home-config-panel-runtime.js)

### 04. Stage preview / drag

Primary functions:

- `renderHomeConfigStage`
- `renderHomeConfigStageChar`
- `beginHomeConfigDrag`
- `updateHomeConfigDrag`
- `endHomeConfigDrag`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`public/screens/home-config-stage-runtime.js`](../../public/screens/home-config-stage-runtime.js)

## Current State

- `audio settings` は:
  - [`public/screens/home-config-audio-runtime.js`](../../public/screens/home-config-audio-runtime.js)
  へ移動済み。
- `panel lifecycle / form sync` は:
  - [`public/screens/home-config-panel-runtime.js`](../../public/screens/home-config-panel-runtime.js)
  へ移動済み。
- `saveHomeConfig` は:
  - [`public/screens/home-config-save-runtime.js`](../../public/screens/home-config-save-runtime.js)
  へ移動済み。
- `stage preview / drag` は:
  - [`public/screens/home-config-stage-runtime.js`](../../public/screens/home-config-stage-runtime.js)
  へ移動済み。

## Current Recommendation

1. `public/screens/home-config.js` はここで watchlist orchestrator 扱いに下げてよい。
2. 今後の作業は runtime 側の concrete bug 修正を優先する。
3. 以後このファイルを触る場合は、wrapper drift の修正だけに絞る。
