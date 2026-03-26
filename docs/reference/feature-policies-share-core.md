# Share Core Feature Policies

## Purpose

This document defines the first detailed feature policies for the highest-priority share features.

Scope:

1. `collab_share_rotate`
2. `collab_share_resolve`
3. `public_share_create`
4. `public_edit_block`
5. `player_state_scope_fix`

These are the minimum features needed to turn the current prototype share direction into a stable product foundation.

---

## 1. 共同編集URL再発行

- 機能ID: `collab_share_rotate`
- カテゴリ: 共有
- 無料版 / 有料版: 無料版
- 優先度: 高

- 対象ユーザー: project owner
- 実行できる人: owner のみ
- 対象スコープ: project

- できること:
  - 新しい共同編集URLを発行できる
  - 以前の共同編集URLを無効化できる
- できないこと:
  - owner 以外が再発行すること
  - 他 project の URL を再発行すること
- 保存対象:
  - `project_collab_shares.active_token`
  - `project_collab_shares.version`
  - `project_collab_shares.rotated_by_user_id`
  - `project_collab_shares.rotated_at`
- 影響範囲:
  - 旧URLは直後から失効する
  - 新URLだけが有効になる

- UI表示:
  - 共有設定パネルに「共同編集URLを再発行」ボタンを表示
- 無料版での見せ方:
  - 通常表示
- 有料版での見せ方:
  - 通常表示
- エラー時の見せ方:
  - 「共同編集URLの再発行に失敗しました」

- API:
  - `POST /api/collab-share/rotate`
- 成功条件:
  - caller が owner
  - target project が存在する
- 拒否条件:
  - owner 以外
  - project 不存在
- 権限エラー時レスポンス:
  - `403`

- 補足:
  - 再発行前に確認ダイアログを出す
  - 文言は「再発行すると以前の共同編集URLは無効になります」
- 未決事項:
  - audit log を初期実装で書くかどうか

---

## 2. 共同編集URL解決

- 機能ID: `collab_share_resolve`
- カテゴリ: 共有
- 無料版 / 有料版: 無料版
- 優先度: 高

- 対象ユーザー: 共同編集URLを知っているユーザー
- 実行できる人: token を持つ全員
- 対象スコープ: token -> project

- できること:
  - token から project を解決できる
  - collaborative access を `edit_and_play` として確定できる
- できないこと:
  - 無効 token で project を開くこと
  - disabled 状態の share を開くこと
- 保存対象:
  - 原則なし
- 影響範囲:
  - request 権限が `edit_and_play` になる

- UI表示:
  - 共有URLアクセス時に自動解決
- 無料版での見せ方:
  - URLから project を開く
- 有料版での見せ方:
  - 該当なし
- エラー時の見せ方:
  - 「この共同編集URLは無効です」

- API:
  - `GET /api/collab-share/resolve`
- 成功条件:
  - token に対応する active row が存在する
- 拒否条件:
  - token 不存在
  - `status != active`
- 権限エラー時レスポンス:
  - `404` または `410`

- 補足:
  - アプリ内部では `collab` token を projectId に解決してからデータを読む
- 未決事項:
  - 失効時レスポンスを `404` と `410` のどちらで統一するか

---

## 3. 公開共有URL発行

- 機能ID: `public_share_create`
- カテゴリ: 共有
- 無料版 / 有料版: 有料版
- 優先度: 高

- 対象ユーザー: project owner
- 実行できる人: owner のみ
- 対象スコープ: project

- できること:
  - 編集不可の公開共有URLを発行できる
  - project を公開閲覧・公開プレイ可能にできる
- できないこと:
  - 無料版 project で発行すること
  - 発行されたURLで編集すること
- 保存対象:
  - `project_public_shares`
  - `project_license_states`
- 影響範囲:
  - public token を知るユーザーが play-only で project を利用できる

- UI表示:
  - 共有設定パネルに「公開共有URLを発行」ボタンを表示
- 無料版での見せ方:
  - disabled 表示
  - 「有料版限定」導線を表示
- 有料版での見せ方:
  - 通常表示
- エラー時の見せ方:
  - 「この機能は有料版限定です」

- API:
  - `POST /api/public-share/create`
- 成功条件:
  - caller が owner
  - project が paid plan
  - `public_share_enabled = 1`
- 拒否条件:
  - owner 以外
  - 無料版
  - ライセンス無効
- 権限エラー時レスポンス:
  - `403`

- 補足:
  - 初期実装では create と rotate を分けてもよいし、upsert 型でもよい
- 未決事項:
  - 初回発行時に自動で active にするか

---

## 4. 公開URLでの編集禁止

- 機能ID: `public_edit_block`
- カテゴリ: 認可
- 無料版 / 有料版: 有料版
- 優先度: 高

- 対象ユーザー: public share viewer
- 実行できる人: server-side enforcement
- 対象スコープ: request

- できること:
  - public share URL 経由のアクセスを `play_only` として扱える
  - content write API を拒否できる
- できないこと:
  - public share URL から shared content を更新すること
- 保存対象:
  - 原則なし
- 影響範囲:
  - `base-chars`
  - `entries`
  - `stories`
  - `gachas`
  - `system`

- UI表示:
  - editor UI を隠す
  - 編集ボタンを出さない
- 無料版での見せ方:
  - 該当なし
- 有料版での見せ方:
  - 公開ビューでは編集UIなし
- エラー時の見せ方:
  - 直接 API を叩かれた場合は JSON エラーを返す

- API:
  - 既存 write endpoints 全体
  - `_share-auth.js` で共通判定
- 成功条件:
  - owner または `edit_and_play`
- 拒否条件:
  - `play_only`
- 権限エラー時レスポンス:
  - `403`
  - 例: `{ "error": "Editing is not allowed in public share mode." }`

- 補足:
  - UI で隠しても、サーバー側拒否を必須にする
- 未決事項:
  - read-only モード時の画面上バッジ表示の有無

---

## 5. 共有URL変更時の進行維持

- 機能ID: `player_state_scope_fix`
- カテゴリ: プレイヤー進行
- 無料版 / 有料版: 無料版 / 有料版
- 優先度: 高

- 対象ユーザー: share visitor
- 実行できる人: system
- 対象スコープ: project + user

- できること:
  - share token が変わっても player progress を継続できる
  - local state が token 切り替えで空に見えないようにできる
- できないこと:
  - token を identity anchor にすること
- 保存対象:
  - localStorage scope rule
  - player bootstrap resolution rule
- 影響範囲:
  - home preferences
  - inventory
  - story progress
  - gacha history
  - currencies

- UI表示:
  - ユーザーには原則意識させない
- 無料版での見せ方:
  - 共同編集URL再発行後も project 単位の進行が続く
- 有料版での見せ方:
  - 公開URL再発行後も project 単位の進行が続く
- エラー時の見せ方:
  - 進行が見えなくならないことが目的なので、エラー表示より設計修正を優先

- API:
  - `player-bootstrap`
  - player-state save endpoints
  - client storage scope
- 成功条件:
  - player state が `project_id + user_id` で安定して引ける
- 拒否条件:
  - 実質なし
- 権限エラー時レスポンス:
  - 該当なし

- 補足:
  - 現行の `room` ベース localStorage scope は長期的に廃止対象
  - share token は access resolution にのみ使い、player identity anchor には使わない
- 未決事項:
  - local cache で `share_mode` を補助的に持つか完全に project-only に寄せるか

---

## Recommended Implementation Order

1. `player_state_scope_fix`
2. `collab_share_rotate`
3. `collab_share_resolve`
4. `public_share_create`
5. `public_edit_block`

---

## Notes

- The first bug already observed in the current app is exactly the kind of issue covered by `player_state_scope_fix`.
- Do not reintroduce token-scoped local storage as the canonical model.
- Permission resolution should be centralized before write-endpoint gating is added.
