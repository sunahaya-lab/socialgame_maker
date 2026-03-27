# 追加機能レビュー 修正指示メモ 2026-03-27

## 対象
- share / license / billing-admin 追加分
- event 画面と event progression 追加分
- 新規 UI 文言と追加導線

## 優先度
- P0: 既存導線が壊れている、または権限境界が危険
- P1: 仕様から外れていて後でデータ不整合を起こす
- P2: UI 品質や運用性の問題

---

## P0-1. `project-license` と share 発行 API の責務を分離する

### 問題
- 現状の share 発行導線は SPA から叩かれるのに、backend 側では `X-Socia-Admin-Secret` を要求している。
- その結果、通常のチームメンバー導線から共同編集 URL / 公開 URL / plan 確認が失敗する。
- 内部運用 API とアプリ利用 API の責務が混ざっている。

### 確認できた箇所
- frontend:
  - `public/lib/app-editor.js`
  - `public/app.js`
- backend:
  - `functions/api/_share-auth.js`
  - `functions/api/collab-share-rotate.js`
  - `functions/api/public-share-create.js`
  - `functions/api/project-license.js`
  - `functions/api/user-license.js`
  - `public/billing-admin.js`

### 修正方針
- internal admin API と app/team API を明確に分離する。
- `X-Socia-Admin-Secret` は billing-admin 専用 API にだけ使う。
- share パネルや通常 SPA から叩く API では admin secret を要求しない。
- app 側は `project member / owner` 権限で守る。

### 推奨 API 分離案

#### admin 専用
- `/api/admin/user-license`
- `/api/admin/project-license`
- `/api/admin/billing-catalog`
- `/api/admin/project-public-share-audit`

#### app / team 専用
- `/api/share/collab-link`
- `/api/share/public-link`
- `/api/share/access`
- `/api/project/share-summary`

### 権限 helper の分離案
- `ensureInternalAdminAccess()`
- `ensureProjectOwnerAccess()`
- `ensureProjectMemberAccess()`
- `ensureProjectShareManageAccess()`

### 実装ルール
- admin API は billing-admin 以外から直接使わない。
- app 用 summary API は UI に必要な最小情報だけ返す。
- owner の full billing detail や internal source は app 用 API で返さない。
- `ensureOwnerOperationAccess()` のような「admin と owner を直列で要求する helper」は app 用 API で使わない。

### app 用 summary API の返却例
```json
{
  "projectId": "project_xxx",
  "licensePlan": "free",
  "canRotateCollabShare": true,
  "canCreatePublicShare": false,
  "publicShareEnabled": false
}
```

### 受け入れ条件
- share パネルから collaborative share を発行できる。
- share パネルから public share 可否を正しく判定できる。
- billing-admin は引き続き admin secret 必須で動く。
- SPA 側から admin 専用 API を直接叩かない。

---

## P1-1. event progression を player state の server 永続対象に入れる

### 問題
- event login bonus / exchange / event item count が local player state のみで保存されている。
- `project + user` で共有されるべき player progression なのに、端末依存になる。
- ブラウザ変更、端末変更、ストレージ削除で状態が分岐する。

### 確認できた箇所
- `public/lib/app-data.js`
  - `eventItems`
  - `loginBonuses`
  - `eventExchangePurchases`
- `functions/api/player-bootstrap.js`
  - bootstrap に event state が含まれていない

### 修正方針
- event progression を player-state API 側へ昇格する。
- bootstrap で event state を返す。
- event claim / exchange は server 側で更新し、client はその結果を反映する。

### 追加候補
- D1:
  - `player_event_items`
  - `player_event_login_bonus_progress`
  - `player_event_exchange_progress`
- API:
  - `player-event-login-bonus-claim`
  - `player-event-exchange-purchase`
  - または既存 `player-bootstrap` と同系統の event 用 API

### 注意
- event key は `title` ではなく stable key を使う。
- `storyId` や label の変更で progress が飛ばないようにする。
- stock 消費や reward 付与は server 側で整合性を保つ。

### 受け入れ条件
- 同じ `project + user` なら別端末でも event progression が一致する。
- login bonus の二重受け取りを server 側で防げる。
- exchange 購入上限を server 側で保証できる。

---

## P1-2. pack 制御の仕様を確定し、local-only 保存で済ませるかを整理する

### 問題
- battle / story FX / event の有料機能で、server save は失敗しても local には残す挙動が混ざっている。
- これが仕様ならよいが、課金制御としては「未購入でも実質編集できる」状態になりやすい。

### 確認できた箇所
- `public/app.js`
- `public/screens/entry-editor.js`
- `public/screens/story-editor.js`

### 先に決めるべきこと
- 未購入ユーザーに許すのはどこまでか
  - UI を見るだけ
  - local draft 編集まで許す
  - export / shared save は禁止
- team collaboration 時に、未購入ユーザーの local draft をどう扱うか

### 推奨
- 少なくとも仕様を明文化する。
- 暫定なら「local draft は可、shared save は不可」と明記する。
- その場合、UI にも「ローカルのみ保存」の一貫した表示を入れる。

### 受け入れ条件
- pack 未購入時の挙動が battle / story FX / event で統一されている。
- 仕様書と UI 表示と backend 制御が一致する。

---

## P2-1. 新規画面・新規文言の mojibake を除去する

### 問題
- event 画面や billing-admin 画面の日本語が source 上で文字化けしている。
- 新規追加部分の UI 品質が落ちている。
- AGENTS.md の UTF-8 方針とズレている。

### 確認できた箇所
- `public/screens/event-screen.js`
- `public/billing-admin.html`
- そのほか追加された billing / share 関連の新規文言

### 修正方針
- UTF-8 前提で日本語文言を修復する。
- 追加文言は可能な範囲で `public/lib/ui-text.js` に寄せる。
- PowerShell 表示ではなく browser 表示を正として確認する。

### 受け入れ条件
- event 画面の見出し、説明、ボタン、empty state が正常な日本語で表示される。
- billing-admin 画面も同様に正常表示される。

---

## 実施順
1. share / license API の分離方針を先に確定する
2. SPA share パネルを app 用 API に切り替える
3. event progression を server 永続へ移す
4. pack 制御の仕様を明文化し、UI 表示を揃える
5. 新規文言の mojibake を修復する

---

## commit 推奨単位
1. admin API と app API の分離
2. SPA share パネルの接続先差し替え
3. event player-state migration と API 追加
4. event screen の client 更新
5. pack 制御の文言・仕様合わせ
6. 文字化け修復

---

## 最低限の確認チェック
- share パネルから collaborative share 発行成功
- free project では public share が無効表示になる
- publish 権限あり project では public share が有効になる
- event login bonus が別端末でも同じ進捗になる
- event exchange 上限が再読込後も一致する
- event 画面と billing-admin の日本語が正常表示される
