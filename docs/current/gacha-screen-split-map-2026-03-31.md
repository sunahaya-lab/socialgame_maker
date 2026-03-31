# gacha-screen Split Map 2026-03-31

> Priority Band: Watchlist

## Goal

- `public/screens/gacha-screen.js` をファイルサイズではなく責務で分ける。
- `banner / hero / history / info panel / pull execution` を同じ blast radius に置かない。
- 先に UI 局所を section-local runtime へ逃がし、最後に `pullGacha` を単独危険核として扱う。

## Current File

- Target: [`public/screens/gacha-screen.js`](../../public/screens/gacha-screen.js)
- Current size:
  - about `6,521` chars
  - about `202` lines

## Current Internal Responsibility Bands

### 01. Screen setup / selection

Primary functions:

- `setupGachaScreen`
- `renderGachaScreen`
- `selectGacha`
- `showActiveGacha`
- `syncActiveBannerCard`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`public/screens/gacha-selection-runtime.js`](../../public/screens/gacha-selection-runtime.js)

### 02. Hero / candidate visuals

Primary functions:

- `renderGachaHero`
- `resolveHeroEntries`
- `normalizeHeroImages`
- `orderHeroEntries`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`public/screens/gacha-display-runtime.js`](../../public/screens/gacha-display-runtime.js)

### 03. History / info panel

Primary functions:

- `renderGachaHistory`
- `toggleHistory`
- `ensureInfoControls`
- `updateInfoPanel`
- `formatHistoryTime`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`public/screens/gacha-display-runtime.js`](../../public/screens/gacha-display-runtime.js)

### 04. Draw execution

Primary functions:

- `pullGacha`
- `showGachaResults`

Assessment:

- Dangerous.
- inventory, player refresh, overlay, error handling, result rendering が集中している。

## Current State

- `public/screens/gacha-screen.js` は、ほぼ orchestrator + draw execution。
- live danger は実質 `pullGacha` に集中している。
- UI 系 active path は次の runtime に逃がした。
  - [`public/screens/gacha-display-runtime.js`](../../public/screens/gacha-display-runtime.js)
  - [`public/screens/gacha-selection-runtime.js`](../../public/screens/gacha-selection-runtime.js)

## Safe Extraction Order

1. `03. History / info panel`
2. `02. Hero / candidate visuals`
3. `01. Screen setup / selection`
4. `04. Draw execution`

## Current Recommendation

- ここから先は `pullGacha` を単独危険核として扱う。
- 無理に draw execution を切るより、別の危険ファイルへ移る方が安全。
