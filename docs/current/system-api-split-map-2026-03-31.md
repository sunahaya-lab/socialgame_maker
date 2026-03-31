# system API Split Map 2026-03-31

> Priority Band: Watchlist

## Goal

- `functions/api/system.js` を巨大 endpoint ではなく責務帯で扱う。
- sanitize 群と persistence 群を先に外し、最後に request/write core だけを残す。
- event は凍結前提なので、機能拡張ではなく blast radius の縮小を優先する。

## Current File

- Target: [`functions/api/system.js`](../../functions/api/system.js)
- Current size:
  - about `8,312` chars
  - about `239` lines

## Current Internal Responsibility Bands

### 01. Request entry / access control

Primary functions:

- `onRequest`
- `ensureSystemBillingAccess`
- `getRequiredSystemFeature`
- `usesBattlePackSystemConfig`
- `usesEventPackSystemConfig`
- `getSystemBillingErrorMessage`

Assessment:

- Dangerous.
- request method branching, share access, owner/member write gate, billing gate が集中している。

### 02. Static defaults / enum-like helpers

Primary functions:

- `HOME_ADVANCED_NODE_IDS`
- `defaultEventConfig`
- `defaultSystemConfig`
- `sanitizeEquipmentMode`
- `sanitizeFontPreset`
- `sanitizeGachaCatalogMode`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`functions/api/_system-config-defaults.js`](../../functions/api/_system-config-defaults.js)

### 03. Core sanitize root

Primary functions:

- `sanitizeSystemConfig`
- `sanitizeTitleMasters`
- `sanitizeTitleScreenConfig`
- `sanitizeMusicAssets`
- `sanitizeMusicAsset`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`functions/api/_system-config-core-sanitize.js`](../../functions/api/_system-config-core-sanitize.js)

### 04. Event-specific sanitize cluster

Primary functions:

- `sanitizeEventConfig`
- `sanitizeEventCurrencies`
- `sanitizeExchangeItems`
- `sanitizeDisplayItems`
- `sanitizeEventCardIds`
- `sanitizeLoginBonusRewards`
- `sanitizeCurrencyKey`

Assessment:

- Active path extracted with freeze bias.
- Runtime moved to:
  - [`functions/api/_system-config-event-sanitize.js`](../../functions/api/_system-config-event-sanitize.js)

### 05. Layout / asset / folder sanitize cluster

Primary functions:

- `sanitizeLayoutPresets`
- `sanitizeAdvancedNodes`
- `sanitizeLayoutAssets`
- `sanitizeLayoutAsset`
- `sanitizeAssetFolders`
- `sanitizeAssetFolder`
- `sanitizeFolderSourceRefs`
- `sanitizeCustomParts`
- `sanitizeCustomPart`
- `sanitizeAdvancedNode`
- `sanitizeFolderList`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`functions/api/_system-config-layout-sanitize.js`](../../functions/api/_system-config-layout-sanitize.js)

### 06. Shared persistence

Primary functions:

- `loadSystemConfig`
- `saveSystemConfig`
- `loadSystemConfigFromD1`
- `saveSystemConfigToD1`
- `parseSystemPayload`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`functions/api/_system-config-storage.js`](../../functions/api/_system-config-storage.js)

## Safe Extraction Order

1. `02. Static defaults / enum-like helpers`
2. `04. Event-specific sanitize cluster`
3. `05. Layout / asset / folder sanitize cluster`
4. `06. Shared persistence`
5. `03. Core sanitize root`
6. `01. Request entry / access control`

## Current State

- defaults / enum-like helpers は:
  - [`functions/api/_system-config-defaults.js`](../../functions/api/_system-config-defaults.js)
  へ移動済み。
- event-specific sanitize cluster は:
  - [`functions/api/_system-config-event-sanitize.js`](../../functions/api/_system-config-event-sanitize.js)
  へ移動済み。
- layout / asset / folder sanitize cluster は:
  - [`functions/api/_system-config-layout-sanitize.js`](../../functions/api/_system-config-layout-sanitize.js)
  へ移動済み。
- shared persistence は:
  - [`functions/api/_system-config-storage.js`](../../functions/api/_system-config-storage.js)
  へ移動済み。
- core sanitize root は:
  - [`functions/api/_system-config-core-sanitize.js`](../../functions/api/_system-config-core-sanitize.js)
  へ移動済み。
- live danger は引き続き:
  - request entry / access control
  に集中している。

## Next Recommendation

1. 最後に `onRequest / access control / billing gate` だけを live core として残す。
2. 以後の作業は authorization と request branching を別レビュー単位で扱う。
3. `system.js` は endpoint orchestration ファイルとして扱う。
