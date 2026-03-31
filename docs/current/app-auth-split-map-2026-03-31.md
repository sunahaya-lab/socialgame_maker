# app-auth Split Map 2026-03-31

> Priority Band: Watchlist

## Goal

- `public/lib/app-auth.js` を auth session flow, panel lifecycle, profile UI, profile actions に分けて扱う。
- auth は壊すと全画面に波及するため、抽出順を固定した上で active path を先に外す。

## Current File

- Target: [`public/lib/app-auth.js`](../../public/lib/app-auth.js)
- Current size:
  - about `8,614` chars
  - about `285` lines

## Current Internal Responsibility Bands

### 01. Dependency intake / runtime factories

Primary functions:

- `createAppAuthModule`
- `text`
- `ensureAuthSessionRuntime`
- `ensureAuthPanelUi`
- `ensureProfileActions`

Assessment:

- Watchlist.
- entrypoint だが runtime factory wiring が多い。

### 02. Auth panel ensure / bind lifecycle

Primary functions:

- `ensureUi`
- `ensureAuthButton`
- `ensureAuthPanel`
- `bindEscClose`
- `bindSessionSync`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`public/lib/app-auth-lifecycle-runtime.js`](../../public/lib/app-auth-lifecycle-runtime.js)

### 03. Auth session flow

Primary functions:

- `restoreSession`
- `submitAuth`
- `handleLogin`
- `handleRegister`
- `handleLogout`

Assessment:

- Dangerous.
- Active path extracted.
- Runtime moved to:
  - [`public/lib/app-auth-session-flow-runtime.js`](../../public/lib/app-auth-session-flow-runtime.js)
- Cleanup completed.
- auth 全体への波及が大きいので band 自体は `Dangerous` のまま扱う。

### 04. Profile actions

Primary functions:

- `handleProfileSave`
- `handleActiveTitleChange`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`public/lib/app-auth-profile-actions-runtime.js`](../../public/lib/app-auth-profile-actions-runtime.js)
- profile persistence に限定された watchlist band。

### 05. Profile UI / auth state render

Primary functions:

- `toggleSummaryDetails`
- `toggleProfileEditor`
- `syncProfileEditorUi`
- `syncPlayerProfile`
- `syncTitleSelect`
- `renderAuthState`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`public/lib/app-auth-profile-ui-runtime.js`](../../public/lib/app-auth-profile-ui-runtime.js)
- Cleanup completed.
- `app-auth.js` は thin wrapper / orchestration に寄った。

### 06. Shared utility helpers

Primary functions:

- `getPlayerProfile`
- `isProfileSetupRequired`
- `renderPanelStatus`
- `setProfileStatus`
- `clearProfileStatus`
- `getApiErrorMessage`
- `escapeHtml`

Assessment:

- Active path extracted.
- Runtime moved to:
  - [`public/lib/app-auth-utils-runtime.js`](../../public/lib/app-auth-utils-runtime.js)

## Safe Extraction Order

1. `06. Shared utility helpers`
2. `02. Auth panel ensure / bind lifecycle`
3. `05. Profile UI / auth state render`
4. `04. Profile actions`
5. `03. Auth session flow`

## Current Recommendation

1. helper 帯は:
  - [`public/lib/app-auth-utils-runtime.js`](../../public/lib/app-auth-utils-runtime.js)
  へ移動済み。
2. panel lifecycle は:
  - [`public/lib/app-auth-lifecycle-runtime.js`](../../public/lib/app-auth-lifecycle-runtime.js)
  へ移動済み。
3. profile UI/render は:
  - [`public/lib/app-auth-profile-ui-runtime.js`](../../public/lib/app-auth-profile-ui-runtime.js)
  へ active path 移動済み。
4. profile actions は:
  - [`public/lib/app-auth-profile-actions-runtime.js`](../../public/lib/app-auth-profile-actions-runtime.js)
  へ active path 移動済み。
5. session flow は:
  - [`public/lib/app-auth-session-flow-runtime.js`](../../public/lib/app-auth-session-flow-runtime.js)
  へ active path 移動済み。
6. `public/lib/app-auth.js` 自体は cleanup 後、thin auth shell として watchlist 寄りに下がった。
7. auth に concrete bug がない限り、reload/session の振る舞いは先に変えない。
