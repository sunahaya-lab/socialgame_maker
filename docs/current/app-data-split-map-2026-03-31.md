# app-data Split Map 2026-03-31

> Priority Band: Strongly Active

## Goal

- `public/lib/app-data.js` is the next major stabilization target.
- Do not split it by arbitrary size.
- Split it by runtime responsibility so future regressions stay local.

## Current File

- Target: [`public/lib/app-data.js`](../../public/lib/app-data.js)
- Current role:
  - shared content bootstrap
  - player identity and player profile persistence
  - player-state load/save
  - inventory and instance reconciliation
  - growth / evolve / limit-break / convert logic
  - event-specific player systems
  - local storage policy and project-scoped cache helpers

## Current Internal Responsibility Bands

### 01. Transport / Scope / Local Cache

Primary functions:

- `fetchJSON`
- `postJSON`
- `getDataScope`
- `getPlayerIdentityScope`
- `getProjectRegistryScope`
- `loadLocal`
- `saveLocal`
- `getScopedStorageKey`
- `clearCharactersLocalCache`
- `loadProjectRegistry`
- `saveProjectRegistry`

Assessment:

- Safe first extraction target.
- Mostly transport and storage policy.
- Current risk is broad call reach, not algorithmic complexity.

Recommended destination:

- `public/lib/app-data-storage.js`

### 02. Normalization / Construction Helpers

Primary functions:

- `normalizeGrowthState`
- `normalizeGrowthResources`
- `normalizeEquipmentInventory`
- `makeCardInstance`
- `makeEquipmentInstance`
- `normalizeCardInstances`
- `normalizeEquipmentInstances`
- `createLegacyCardInstances`
- `createLegacyEquipmentInstances`
- `hasCardInstanceInventoryMismatch`
- `hasEquipmentInstanceInventoryMismatch`
- `ensureInstanceCollections`

Assessment:

- Safe-to-watch extraction target.
- Pure or near-pure helpers, but many downstream callers.
- Good candidate after storage split.

Recommended destination:

- `public/lib/app-data-normalize.js`
- or `public/lib/player-instance-normalize.js`

### 03. Player-State Persistence / Identity / Profile

Primary functions:

- `persistPlayerState`
- `getCurrentPlayerId`
- `getPlayerApiUrl`
- `ensurePlayerProfile`
- `updatePlayerProfile`
- `loadPlayerState`

Assessment:

- Safe extraction target after storage helpers.
- Strong cohesion.
- Important because many modules indirectly depend on this path.

Recommended destination:

- `public/lib/player-state-data.js`

### 04. Story Progress / Inventory Accessors / Instance Mutators

Primary functions:

- `getPlayerStoryProgress`
- `saveStoryProgress`
- `upsertPlayerStoryProgress`
- `upsertInventoryRecord`
- `getOwnedCardCount`
- `getOwnedEquipmentCount`
- `getCardInstances`
- `getEquipmentInstances`
- `getCardInstance`
- `getEquipmentInstance`
- `updateCardInstance`
- `updateEquipmentInstance`
- `removeCardInstance`
- `removeEquipmentInstance`
- `syncLegacyInventoryCountsFromInstances`

Assessment:

- Watchlist.
- These are not heavy individually, but they sit at the boundary between:
  - player-state persistence
  - inventory semantics
  - instance regeneration

Recommended destination:

- `public/lib/player-inventory-data.js`

### 05. Growth / Evolve / Limit Break / Convert

Primary functions:

- `getCardGrowth`
- `getEquipmentGrowth`
- `getGrowthResources`
- `updateCardGrowth`
- `updateEquipmentGrowth`
- `getAvailableCardDuplicates`
- `getAvailableEquipmentDuplicates`
- `setCardLockedCopies`
- `setEquipmentLockedCopies`
- `enhanceCard`
- `enhanceCardInstance`
- `enhanceEquipment`
- `enhanceEquipmentInstance`
- `evolveCard`
- `evolveCardInstance`
- `evolveEquipment`
- `evolveEquipmentInstance`
- `limitBreakCard`
- `limitBreakCardInstance`
- `limitBreakEquipment`
- `limitBreakEquipmentInstance`
- `convertCardDuplicates`
- `convertEquipmentDuplicates`
- `convertSelectedCharacterCards`
- `convertSelectedEquipmentCards`
- `convertSelectedCharacterInstances`
- `convertSelectedEquipmentInstances`
- `convertStaminaToGrowthPoints`

Assessment:

- Dangerous.
- This is the densest gameplay logic zone in the file.
- Do not mix extraction with behavior changes.

Recommended destination:

- `public/lib/player-growth-data.js`

### 06. Event-Specific Player Systems

Primary functions:

- `ensureEventCurrencies`
- `getLoginBonusEventKey`
- `getEventExchangeKey`
- `getEventItemCounts`
- `applyRemoteEventState`
- `normalizeLoginBonusProgress`
- `getEventLoginBonusStatus`
- `getEventExchangeStatus`
- `claimEventLoginBonus`
- `purchaseEventExchangeItem`

Assessment:

- Dangerous but frozen.
- This area should not be actively expanded during stabilization.
- Extraction is allowed only to reduce blast radius.

Recommended destination:

- `public/lib/player-event-data.js`

### 07. Shared Content Bootstrap

Primary functions:

- `recordGachaPulls`
- `loadAllData`

Assessment:

- Dangerous.
- `loadAllData` is one of the highest-risk functions in the repo because it merges:
  - remote shared content
  - local scoped cache
  - default config
  - instance reconciliation
  - player bootstrap side effects

Recommended destination:

- `public/lib/app-data-bootstrap.js`

### 08. Currency Recovery Timer

Primary functions:

- `syncRecoveredCurrenciesInMemory`
- `getEffectivePlayerCurrency`
- `getPlayerCurrencyAmount`
- `ensureHomeCurrencyTimerImpl`

Assessment:

- Watchlist.
- Small enough to split late.
- Coupled to home rendering timing, so do not move it first.

Recommended destination:

- `public/lib/player-currency-runtime.js`

## Safe Extraction Order

1. `01. Transport / Scope / Local Cache`
2. `03. Player-State Persistence / Identity / Profile`
3. `02. Normalization / Construction Helpers`
4. `04. Story Progress / Inventory Accessors / Instance Mutators`
5. `08. Currency Recovery Timer`
6. `07. Shared Content Bootstrap`
7. `06. Event-Specific Player Systems`
8. `05. Growth / Evolve / Limit Break / Convert`

## Rules During Extraction

- Do not change storage behavior and gameplay behavior in the same patch.
- Do not move `loadAllData` before its helper boundaries are already extracted.
- Do not mix `event` extraction with feature revival; event remains frozen.
- Prefer facade-style delegation first, then definition removal after checks pass.
- Keep `public/lib/app-data.js` as the source of truth until a delegated submodule is verified.

## Current Recommendation

- The first real cut should be:
  - storage/scope helpers
  - then player identity/profile/player-state persistence
- Do not start with growth/convert logic.
- Do not start with `loadAllData`.

## 2026-03-31 Progress Update

- Extracted modules now exist for:
  - `storage / scope / local cache`
  - `player identity / profile / player-state persistence`
  - `normalization / instance construction`
  - `story progress / inventory / instance mutators`
  - `event-specific player systems`
  - `currency recovery timer`
  - `internal bridge helpers shared by growth/inventory`
  - `growth / evolve / convert` public API surface
  - `shared content bootstrap` public API surface
- `public/lib/app-data.js` now works more like an orchestrator that wires those modules together.
- Legacy bodies for bootstrap still remain in-file and are now explicitly parked as:
  - `_legacyRecordGachaPulls`
  - `_legacyLoadAllData`

## Remaining Kernel

What is still truly dangerous inside `public/lib/app-data.js` is now much narrower:

- legacy growth / evolve / convert bodies
- legacy shared bootstrap bodies
- bridging glue that still exposes both old and new paths together

### Naming progress

- The legacy growth / convert block is now explicitly marked by function names such as:
  - `_legacyGetCardGrowth`
  - `_legacyUpdateCardGrowth`
  - `_legacyEnhanceCard`
  - `_legacyEvolveCard`
  - `_legacyConvertSelectedCharacterCards`
  - `_legacyConvertSelectedEquipmentCards`
  - `_legacyConvertStaminaToGrowthPoints`
- This means the public path is no longer ambiguous:
  - current public API -> delegated module
  - old in-file body -> legacy bridge only

### Reference status

- Repository-wide search currently shows no external code path calling the `_legacy...` names directly.
- In practice this means:
  - public callers already use delegated module exports
  - legacy bodies are now retained only as in-file fallback/bridge candidates
  - the remaining risk is maintenance noise, not unclear runtime ownership

## Updated Next Step

The next safe objective is no longer “split more files blindly”.

It is:

1. keep `app-data.js` syntactically stable
2. mark remaining heavy bodies as legacy boundaries
3. gradually hollow out the remaining legacy bridge
