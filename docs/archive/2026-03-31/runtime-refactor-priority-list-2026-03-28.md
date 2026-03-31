# Runtime Refactor Priority List

> Priority Band: Context / Secondary

Date: 2026-03-28

## Purpose

実行対象ファイルのみを対象に、

- 重複コード
- 並立している旧新実装
- 責務過多
- 不具合の温床になりやすい箇所

を優先度順に並べたリファクタリング掃除リスト。

対象に含む:
- `public/`
- `functions/api/`
- `scripts/`
- `migrations/`

対象に含まない:
- `docs/`

---

## Priority Rule

優先順位は次の基準で決める。

1. 今すぐ不具合を生みやすい重複
2. 旧新実装の並立
3. 1 ファイルに責務が集中している箇所
4. 仕様の境界が曖昧な API 群
5. 見通しを悪くしている補助コード群

---

## Tier S: 最優先

ここは最初に掃除する。放置すると他の修正が全部ぶれやすい。

### S-1. Bootstrap / Runtime 境界

対象:
- `public/app.js`
- `public/app.legacy.js`
- `public/index.html`

理由:
- active runtime と legacy reference の境界が最重要
- script load chain が長く、`window.*` 依存が強い
- 後続の全 screen / lib の依存元になっている

確認済み温床:
- `app.js` と `app.legacy.js` の並立
- `index.html` で editor 系旧新ファイルが多数ロードされている

掃除方針:
- active runtime を 1 本にする
- `app.legacy.js` は参照専用へ退避
- `index.html` の load 順を用途別に整理

### S-2. `system-editor.js`

対象:
- `public/screens/system-editor.js`
- `public/screens/system-editor-preview.js`
- `public/screens/system-editor-assets.js`

理由:
- 画面サイズも責務も大きい
- event、battle、layout、asset、folder、preview、save が集中
- 実際に同一関数の重複定義が残っている

確認済み温床:
- `handleSystemSubmit` が二重定義されている

掃除方針:
- main file を orchestrator にする
- preview / assets / event / save handling を責務分割する
- 重複定義をまず除去する

### S-3. Editor 旧新並立の整理

対象:
- `public/screens/editor-screen.js`
- `public/screens/editor-screen-v1.js`
- `public/screens/editor-v1-host.js`
- `public/screens/editor-legacy-host.js`
- `public/screens/editor-dashboard-screen.js`
- `public/screens/editor-base-char-host.js`
- `public/screens/editor-character-host.js`
- `public/screens/editor-gacha-host.js`
- `public/screens/editor-story-host.js`
- `public/screens/editor-system-host.js`
- `public/screens/editor-project-sections.js`
- `public/screens/editor-section-host-registry.js`
- `public/screens/editor-member-screen.js`
- `public/screens/editor-share-screen.js`

理由:
- editor の現行線と退役線が同居している
- どれが active か分かりにくい
- 修正時に誤って旧線を触る危険が高い

確認済み温床:
- `index.html` が `editor-legacy-host.js`、`editor-v1-host.js`、`editor-screen-v1.js` を同時に読む
- `editor-screen.js` 自体も巨大で window manager を内包している

掃除方針:
- active editor line を 1 つに決める
- legacy / v1 / current の立場を明記する
- 不要な読み込みを止める

### S-4. Share / License API の旧新並立

対象:
- `functions/api/project-license.js`
- `functions/api/user-license.js`
- `functions/api/admin/project-license.js`
- `functions/api/admin/user-license.js`
- `functions/api/share-collab-link.js`
- `functions/api/share-public-link.js`
- `functions/api/collab-share-rotate.js`
- `functions/api/public-share-create.js`
- `functions/api/project-share-summary.js`
- `functions/api/_share-auth.js`

理由:
- 旧 endpoint と新 endpoint が混在している
- app 用 / admin 用の責務が曖昧になりやすい
- 誤配線がそのまま権限バグになる

確認済み温床:
- `admin/*` が re-export のみ
- 旧 `project-license.js` / `user-license.js` も残っている
- share 作成系が複数系統ある

掃除方針:
- namespace ごとに正本を決める
- 旧 endpoint を明示的に廃止または adapter 化する
- helper を admin / owner / member で分ける

---

## Tier A: 高優先

Tier S の次。ここを整理すると重複削除の効果が大きい。

### A-1. Player State 集約層

対象:
- `public/lib/app-data.js`
- `public/lib/player-state.js`
- `functions/api/_player-state.js`
- `functions/api/player-bootstrap.js`
- `functions/api/player-profile.js`
- `functions/api/player-story-progress.js`
- `functions/api/player-gacha-pulls.js`
- `functions/api/player-home-preferences.js`

理由:
- frontend と backend の player state 境界が集まっている
- 進行系の source of truth を間違えやすい
- event 進捗もここに接続される

掃除方針:
- `app-data.js` を責務で分割
- bootstrap が返す shape を固定
- local cache と server state の責務を分離

### A-2. Home Workspace 系

対象:
- `public/screens/home-edit-workspace.js`
- `public/screens/home-workspace-assets.js`
- `public/screens/home-workspace-parts.js`
- `public/screens/home-workspace-windows.js`
- `public/screens/home-layout-overlay.js`
- `public/screens/home-config.js`
- `public/screens/home-screen.js`

理由:
- home 編集導線が増えており、重複と責務分散が入り始めている
- overlay / workspace / home 本体の境界が壊れやすい

掃除方針:
- workspace shell
- windows
- assets
- parts
- overlay bridge

に責務を揃える

### A-3. Character / Story Editor 本体

対象:
- `public/screens/entry-editor.js`
- `public/screens/story-editor.js`
- `public/screens/base-char-editor.js`
- `public/screens/equipment-card-editor.js`

理由:
- 各 editor が大型化している
- feature gating、save、preview、relation fields、assets などが混ざる

掃除方針:
- form controller
- preview helper
- pack-gated subfeature
- payload builder

の分離を進める

### A-4. Event 実装一式

対象:
- `public/screens/event-screen.js`
- `functions/api/_player-event.js`
- `functions/api/player-event-login-bonus-claim.js`
- `functions/api/player-event-exchange-purchase.js`
- `migrations/0011_player_event_progress.sql`

理由:
- まだ新しく、仕様と保存先がぶれやすい
- player progression との境界を固める必要がある

掃除方針:
- event resource
- event progression
- UI rendering

を分ける

---

## Tier B: 中優先

構造改善に効くが、Tier S/A が先。

### B-1. Shared Content API 群

対象:
- `functions/api/base-chars.js`
- `functions/api/entries.js`
- `functions/api/stories.js`
- `functions/api/gachas.js`
- `functions/api/equipment-cards.js`
- `functions/api/system.js`
- `functions/api/projects.js`
- `functions/api/_content-sanitize.js`
- `functions/api/_content-sanitize-entry.js`
- `functions/api/_content-sanitize-relations.js`

理由:
- sanitizer 抽出は始まっているが、endpoint ごとの責務整理はまだ途中
- `projects.js` だけ別構造になりやすい

掃除方針:
- endpoint から sanitize / parse / persistence を分離
- `projects.js` を同じパターンに寄せる

### B-2. App 中核 lib 群

対象:
- `public/lib/app-editor.js`
- `public/lib/app-runtime.js`
- `public/lib/app-home.js`
- `public/lib/app-ui.js`
- `public/lib/app-state.js`
- `public/lib/content-state.js`
- `public/lib/editor-runtime.js`

理由:
- runtime の責務移譲先だが、まだ重なりがある
- helper の行き先が曖昧だと再肥大化する

掃除方針:
- runtime
- data
- ui
- editor
- content helper

の境界を固定する

### B-3. Story / Gacha / Collection / Formation / Battle

対象:
- `public/screens/story-screen.js`
- `public/screens/gacha-screen.js`
- `public/screens/collection-screen.js`
- `public/screens/formation-screen.js`
- `public/screens/battle-screen.js`
- `public/screens/formation-battle-entry.js`
- `public/lib/battle-controller.js`
- `public/lib/battle-engine.js`
- `public/lib/battle-state.js`
- `public/lib/battle-view.js`

理由:
- gameplay 画面の責務は比較的分かれているが、formation/battle はまだ厚い
- ここは Tier S/A 完了後に触るほうが安全

---

## Tier C: 低優先

放置可ではないが、他を片付けてからでよい。

### C-1. Utility lib

対象:
- `public/api/client.js`
- `public/lib/image.js`
- `public/lib/storage.js`
- `public/lib/toast.js`
- `public/lib/rarity.js`
- `public/lib/attribute.js`
- `public/lib/layout-bridge.js`
- `public/lib/layout-presets.js`
- `public/lib/layout-renderer.js`
- `public/lib/layout-runtime.js`
- `public/lib/layout-schema.js`
- `public/lib/app-mode.js`
- `public/lib/ui-text.js`

理由:
- 小さめで責務も比較的限定されている
- 今は main problem ではない

### C-2. Asset API

対象:
- `functions/api/_assets.js`
- `functions/api/assets-content.js`
- `functions/api/assets-upload.js`
- `migrations/0012_asset_webp_normalization.sql`

理由:
- upload / asset 導線は独立しており、コア不具合の温床としては優先度が下がる

### C-3. Scripts / Migrations

対象:
- `scripts/check-editor-files.ps1`
- `scripts/repair-editor-text.js`
- `scripts/repair-system-text.js`
- `scripts/setup-utf8-console.ps1`
- `migrations/*.sql`

理由:
- 実行ファイルではあるが、アプリの runtime 不具合の主因ではない
- ただし migration 命名や重複は後で整える価値がある

---

## 実行順の推奨

1. `public/app.js` / `public/app.legacy.js` / `public/index.html`
2. `public/screens/system-editor.js` 系
3. editor 旧新並立の整理
4. share / license API の旧新並立整理
5. `public/lib/app-data.js` と player-state API 群
6. home workspace 系
7. `entry-editor.js` / `story-editor.js` / `base-char-editor.js`
8. event 一式
9. shared content API 群
10. app 中核 lib 群
11. gameplay screen 群
12. utility / asset / scripts / migrations

---

## 1 グループずつ掃除する時のルール

各グループでやることは同じ。

1. 正本ファイルを決める
2. 旧実装 / 重複実装 / adapter を仕分ける
3. 同じ責務の helper を 1 箇所へ寄せる
4. 不要コードを削る
5. load / import / 呼び出し先を 1 本にする

---

## 直近の着手推奨

最初に着手すべき 4 グループ:

1. `public/app.js` / `public/app.legacy.js` / `public/index.html`
2. `public/screens/system-editor.js`
3. `public/screens/editor-screen*.js` と host 群
4. `functions/api/project-license.js` / `user-license.js` / share 系 endpoint 群

この 4 つを片付けるだけで、

- どの線が active か
- どこに同じ責務が重なっているか
- どの API が正本か

がかなり見えるようになる。
