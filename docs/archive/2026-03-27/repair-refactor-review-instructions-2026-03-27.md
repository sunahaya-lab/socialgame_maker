# Repair / Refactor Review Instructions

Date: 2026-03-27

## Purpose

- 現在の追加機能群を「まず直すべきもの」と「構造的に分解すべきもの」に分ける
- 不具合修正とリファクタリングが互いに邪魔をしない順番を定める
- commit 単位で作業を進めても回帰点が追える状態にする

## Scope

この指示書は以下をまとめて対象にする。

- player state 拡張
- shared content API の追加分
- share / license / billing-admin の追加分
- event 画面と event progression の追加分
- frontend bootstrap / editor / home workspace の再編途中コード

---

## Overall Rule

大前提は以下のとおり。

1. 先に挙動修正を行う
2. 仕様と保存先を安定させてから構造分解を行う
3. 大きい構造変更は一度に 1 系統だけ進める
4. 新機能追加と大規模リファクタリングを同時に進めない

---

## Phase 0: Stop The Bleeding

ここは「明らかに機能していない」「既存導線を壊している」ものを止血する段階。

### 0-1. player-state critical fixes

参照:
- `docs/current/player-state-api-fix-notes-2026-03-27.md`

最優先対象:
- `functions/api/player-gacha-pulls.js`
- `functions/api/player-bootstrap.js`
- `functions/api/_player-state.js`

目的:
- 不正取得や課金不整合を止める
- player bootstrap の整合性を保つ
- 文字化けした error message を修復する

完了条件:
- gacha 抽選権威が server 側にある
- 課金と付与の不整合が解消されている
- player API のエラーメッセージが正常な日本語で返る

### 0-2. share / license 導線の回帰修正

参照:
- `docs/current/share-license-api-fix-notes-2026-03-27.md`
- `docs/current/new-feature-review-fix-notes-2026-03-27.md`

最優先対象:
- `functions/api/_share-auth.js`
- `functions/api/collab-share-rotate.js`
- `functions/api/public-share-create.js`
- `functions/api/project-license.js`
- `functions/api/user-license.js`
- `public/lib/app-editor.js`
- `public/app.js`
- `public/billing-admin.js`

目的:
- 既存 share パネルを再び使える状態に戻す
- admin 用 API と app/team 用 API の責務を分離する

必須方針:
- billing-admin 専用 API は admin secret 必須
- SPA 用 API は admin secret 禁止
- app 側は `project member / owner` 権限で守る

完了条件:
- 通常の share パネルから collaborative share が使える
- public share の可否判定が UI で正しく出る
- billing-admin は内部 API のみ使う

### 0-3. shared content API の仕様逸脱修正

参照:
- `docs/current/shared-content-api-fix-notes-2026-03-27.md`

最優先対象:
- `functions/api/base-chars.js`
- `functions/api/entries.js`
- `functions/api/gachas.js`
- `functions/api/stories.js`
- `functions/api/system.js`
- `functions/api/projects.js`
- `functions/api/equipment-cards.js`

目的:
- 権限抜けと schema 不整合を止める
- `projects.js` を含めて scope を揃える
- 既存 JSON 互換性を壊さない

完了条件:
- shared content write に owner/member ルールが通る
- `projects.js` だけ旧スコープのまま残らない
- `equipment-cards` の永続先が曖昧な状態を解消する

---

## Phase 1: Stabilize New Features

ここは「追加したが保存先や仕様が曖昧」「local-only のまま混線している」ものを整理する段階。

### 1-1. event progression を player state に昇格

参照:
- `docs/current/new-feature-review-fix-notes-2026-03-27.md`

対象:
- `public/lib/app-data.js`
- `public/screens/event-screen.js`
- `functions/api/player-bootstrap.js`
- event 用の新規 D1 migration / API

目的:
- login bonus
- event item count
- exchange purchase progress

これらを `project + user` に紐づく server 永続 state に移す。

完了条件:
- 別端末でも event progression が一致する
- login bonus 二重取得が防げる
- exchange の購入上限が server 側で保証される

### 1-2. paid feature gating の仕様確定

対象:
- `public/app.js`
- `public/screens/entry-editor.js`
- `public/screens/story-editor.js`
- event/battle/story FX の pack 依存 UI

決めること:
- 未購入ユーザーに local draft 編集を許すか
- local 保存のみ許す場合の UI 表示
- shared save / export / publish どこで止めるか

方針:
- battle / story FX / event で挙動を揃える
- backend 制御と UI 文言を一致させる

完了条件:
- pack 未購入時の挙動が機能ごとにバラバラでない
- 「ローカルのみ保存」などの表記が一貫している

### 1-3. 新規画面の text repair

対象:
- `public/screens/event-screen.js`
- `public/billing-admin.html`
- `public/billing-admin.js`
- billing / share / event 追加文言

目的:
- mojibake 除去
- UTF-8 前提への復帰
- UI 文言の集約余地を残す

完了条件:
- event 画面のラベルと説明が正常表示
- billing-admin も正常表示
- 新規機能の Japanese UI が壊れていない

---

## Phase 2: Runtime Boundary Cleanup

ここから先は構造分解。Phase 0 と Phase 1 が終わるまでは大きく触らない。

参照:
- `docs/current/refactor-priority-instructions-2026-03-27.md`
- `docs/current/refactor-commit-plan-2026-03-27.md`

### 2-1. bootstrap boundary cleanup

対象:
- `public/app.js`
- `public/app.legacy.js`
- `public/index.html`
- `public/lib/app-runtime.js`
- `public/lib/app-data.js`
- `public/lib/app-ui.js`
- `public/lib/app-home.js`
- `public/lib/app-editor.js`

目的:
- active runtime を 1 本化する
- `app.js` を orchestration のみに寄せる
- script load chain と `window.*` 依存を縮める

完了条件:
- active bootstrap path が 1 つに見える
- `app.legacy.js` は参照専用の立場になる
- `app.js` に新しい業務ロジックを足さない

### 2-2. `system-editor.js` の分割

対象:
- `public/screens/system-editor.js`

分離単位:
- system form/controller
- layout preview/controller
- asset library / folder manager
- free parts editor

完了条件:
- preview と save handling が同居しない
- main file が orchestrator に近づく

### 2-3. `home-edit-workspace.js` の分割

対象:
- `public/screens/home-edit-workspace.js`

分離単位:
- workspace shell / window manager
- asset and folder operations
- property editing
- render helpers
- persistence / sync

完了条件:
- drag/window 管理と content 編集が分離される
- 単一ファイルに責務が集中しない

---

## Phase 3: API Cleanup

ここは挙動が安定してから進める。

### 3-1. sanitizer 共通化

対象:
- `functions/api/base-chars.js`
- `functions/api/entries.js`
- `functions/api/gachas.js`
- `functions/api/stories.js`
- `functions/api/equipment-cards.js`

方向:
- `_content-sanitize.js` のような共通 helper へ寄せる
- endpoint 側は request handling / access control / persistence に集中させる

### 3-2. transport helper 共通化

対象:
- `functions/api/_player-state.js`
- `functions/api/_share-auth.js`
- `functions/api/_http.js`

方向:
- `createCorsHeaders`
- `json`
- `readJson`

を共通基盤へ寄せ、ドメイン固有 helper と分ける。

---

## Phase 4: Deferred Cleanup

後回し可能。ただし backlog として保持する。

参照:
- `docs/current/refactor-backlog-risk-notes-2026-03-27.md`

対象候補:
- `public/lib/app-data.js`
- `public/screens/editor-screen.js`
- `public/screens/entry-editor.js`
- `functions/api/projects.js`
- UI 文言集約
- `public/index.html` の構造整理
- CSS source of truth 整理
- `window.*` surface 縮小

---

## Recommended Execution Order

厳守推奨順:

1. Phase 0-1 player-state critical fixes
2. Phase 0-2 share / license 回帰修正
3. Phase 0-3 shared content API 修正
4. Phase 1-1 event progression の server 永続化
5. Phase 1-2 paid feature gating の仕様確定
6. Phase 1-3 text repair
7. Phase 2-1 bootstrap boundary cleanup
8. Phase 2-2 `system-editor.js` 分割
9. Phase 2-3 `home-edit-workspace.js` 分割
10. Phase 3-1 sanitizer 共通化
11. Phase 3-2 transport helper 共通化
12. Phase 4 backlog 順次処理

---

## Commit Rule

1 task = 1 commit を原則にする。

避けるべきこと:
- API 修正と editor 分割を同じ commit に入れる
- event persistence 変更と text repair を同じ commit に入れる
- bootstrap 整理と share/license 権限変更を同時にやる

推奨 commit 粒度:
- share app/admin API 分離
- SPA share panel 接続先差し替え
- event state migration
- event client state 接続変更
- paid gating 挙動統一
- event/billing text repair
- bootstrap cleanup
- `system-editor.js` split
- `home-edit-workspace.js` split
- API sanitizer helper extraction
- API transport helper extraction

---

## Review Focus While Executing

各段階で特に見る点:

- 権限:
  - owner/member/admin の境界が混ざっていないか
- 永続化:
  - local-only と server-backed の責務が混ざっていないか
- 回帰:
  - 既存 home/gacha/story/collection 導線を壊していないか
- UI:
  - mojibake と二重表示が再発していないか
- runtime:
  - `app.js` が再び肥大化していないか

---

## Done Criteria

この指示書が完了扱いになる条件:

- 追加機能のうち「明らかに動かない」ものが残っていない
- 新規 state が local-only のまま放置されていない
- share / license / billing-admin の責務分離が明確
- `app.js`, `system-editor.js`, `home-edit-workspace.js` の過密責務が緩和されている
- 以後の不具合修正が「どこを触ればよいか」分かる構造になっている
