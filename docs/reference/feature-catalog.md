# Feature Catalog

## Purpose

This document is the first working catalog of product features for `socia_maker`.

It is meant to answer:

- what features exist
- whether they are free or paid
- who can use them
- what scope they affect
- which API or subsystem they likely need

This is not the final detailed spec.

Use this document as:

1. a planning board
2. a feature inventory
3. a checklist for implementation order

For detailed behavior, link each item to a separate feature policy entry later.

---

## Status Labels

- `draft`
  - idea is accepted but behavior is still flexible
- `planned`
  - intended for implementation
- `in_progress`
  - currently being built
- `partial`
  - some behavior exists but not productized
- `blocked`
  - depends on auth, billing, or schema work

---

## Feature List

| 機能ID | 機能名 | カテゴリ | 無料版 / 有料版 | 実行できる人 | 対象スコープ | API / モジュール | 状態 | 備考 |
|---|---|---|---|---|---|---|---|---|
| project_create | プロジェクト作成 | project | 無料版 | owner | project | `/api/projects` | partial | 既存機能あり |
| project_select | プロジェクト切替 | project | 無料版 | owner/editor | client runtime | `app-runtime` | partial | 既存機能あり |
| shared_content_edit | 共有コンテンツ編集 | editor | 無料版 | owner/editor | project | content APIs | partial | 現在は project 正本編集 |
| shared_content_read | 共有コンテンツ閲覧 | content | 無料版 | all share users | project | content APIs | partial | owner / collab / public で読む |
| player_state_save | プレイヤー進行保存 | player | 無料版 | player | project + user | player-state APIs | partial | 既存機能あり |
| collab_share_create | 共同編集URL初回発行 | share | 無料版 | owner | project | `/api/collab-share/rotate` | planned | 初回発行も rotate で兼用可 |
| collab_share_rotate | 共同編集URL再発行 | share | 無料版 | owner | project | `/api/collab-share/rotate` | planned | 旧URL失効 |
| collab_share_disable | 共同編集URL停止 | share | 無料版 | owner | project | `/api/collab-share/disable` | draft | 任意で追加 |
| collab_share_resolve | 共同編集URL解決 | share | 無料版 | all share users | token -> project | `/api/collab-share/resolve` | planned | 書き込み権限は edit_and_play |
| collab_edit_permission | 共同部屋編集権限 | auth/share | 無料版 | collab participant | request | `_share-auth.js` | planned | server-side 判定必須 |
| public_share_create | 公開共有URL発行 | share | 有料版 | owner | project | `/api/public-share/create` | planned | 編集不可公開 |
| public_share_rotate | 公開共有URL再発行 | share | 有料版 | owner | project | `/api/public-share/rotate` | draft | 旧URL失効 |
| public_share_disable | 公開共有停止 | share | 有料版 | owner | project | `/api/public-share/disable` | draft | 公開停止 |
| public_share_resolve | 公開共有URL解決 | share | 有料版 | public viewer | token -> project | `/api/public-share/resolve` | planned | play_only 権限 |
| public_read_permission | 公開共有閲覧権限 | auth/share | 有料版 | public viewer | request | `_share-auth.js` | planned | server-side 判定必須 |
| public_edit_block | 公開URLでの編集禁止 | auth/share | 有料版 | public viewer | request | content APIs | planned | 403 を返す |
| editor_ui_hide_public | 公開URLでの editor UI 非表示 | ui/share | 有料版 | public viewer | client UI | app runtime / screen gating | planned | UI と API 両方で制御 |
| public_play_mode | 公開URLでのプレイ許可 | gameplay/share | 有料版 | public viewer | project + user | player-state APIs | planned | home/gacha/story 可 |
| license_state_read | ライセンス状態取得 | billing | 無料版 | owner | project | `/api/project-license` | planned | UI 分岐用 |
| license_state_update | ライセンス状態更新 | billing | 運営/将来 | admin/system | project | `/api/project-license` | blocked | 決済設計待ち |
| free_plan_gate | 無料版機能制限表示 | billing/ui | 無料版 | owner | client UI | share settings UI | planned | アップグレード導線 |
| paid_plan_gate | 有料版機能解放表示 | billing/ui | 有料版 | owner | client UI | share settings UI | planned | 公開共有を enable |
| invalid_share_screen | 無効URL画面 | share/ui | 無料版/有料版 | all share users | token access | resolve flow | planned | 410 相当 |
| share_settings_panel | 共有設定パネル | share/ui | 無料版/有料版 | owner | project | new UI module | draft | collab/public を分離表示 |
| project_owner_permission | owner 権限判定 | auth | 無料版 | owner | request | auth helper | planned | 今後の基礎 |
| project_member_permission | project member 権限判定 | auth | 無料版 | editor/viewer | request | auth helper | blocked | auth/member 実装待ち |
| room_legacy_bridge | 旧 room 互換ブリッジ | migration | 無料版 | system | client + API | legacy room handling | planned | 段階的廃止前提 |
| share_token_rotation_log | 共有URL再発行ログ | audit | 無料版/有料版 | system | project | optional audit table | draft | 後回し可 |
| public_snapshot_publish | 公開スナップショット生成 | publish | 有料版 | owner/system | project snapshot | publish pipeline | blocked | 初期はライブ参照でも可 |
| public_snapshot_read | 公開スナップショット読込 | publish | 有料版 | public viewer | snapshot | KV/cache layer | blocked | 後段実装 |
| anonymous_player_bootstrap | 匿名プレイヤー初期化 | player/share | 無料版/有料版 | share visitor | project + user | player bootstrap | partial | 現在の local user ベース |
| player_state_scope_fix | 共有URL変更時の進行維持 | player/share | 無料版/有料版 | system | project + user | app-data / storage | planned | token 依存を避ける |

---

## Initial Recommended Groups

## Group 1: shared access foundation

These unblock the whole share system.

- `collab_share_create`
- `collab_share_rotate`
- `collab_share_resolve`
- `public_share_create`
- `public_share_resolve`
- `public_edit_block`
- `project_owner_permission`
- `player_state_scope_fix`

## Group 2: owner-facing share UI

- `share_settings_panel`
- `free_plan_gate`
- `paid_plan_gate`
- `invalid_share_screen`

## Group 3: later productization

- `project_member_permission`
- `public_snapshot_publish`
- `public_snapshot_read`
- `share_token_rotation_log`
- `license_state_update`

---

## Suggested First Implementation Order

1. `project_owner_permission`
2. `collab_share_rotate`
3. `collab_share_resolve`
4. `public_share_create`
5. `public_share_resolve`
6. `public_edit_block`
7. `player_state_scope_fix`
8. `share_settings_panel`
9. `invalid_share_screen`
10. `free_plan_gate` and `paid_plan_gate`

---

## Notes

- For now, treat `owner` as the only trusted issuer of share URLs.
- Do not let `room` become the permanent architecture for sharing.
- Public share must stay separate from collaborative share even if both are token-based.
- Player progress should survive share token rotation as long as `project_id` and `user_id` remain the same.

---

## Next Recommended Documents

After this catalog, the next useful documents are:

1. per-feature detail pages for the highest-priority share features
2. API contract notes for share endpoints
3. a migration note for replacing current `room` behavior

---

## Friend Test Intake

Use this section as the bridge between casual friend feedback and the formal feature catalog.

Related note:

- [friend-test-checklist.md](C:/Users/suzuma/Documents/socia_maker/docs/reference/friend-test-checklist.md)

### How to use it

1. collect rough feedback from a friend test session
2. rewrite each point as a feature or issue candidate
3. classify it before adding it to the main table
4. promote only repeated or high-impact items into active planning

### Intake Labels

- `friend_feedback`
  - a raw request, confusion point, or impression from testing
- `candidate_feature`
  - likely worth implementing, but still needs shaping
- `candidate_fix`
  - likely a bug fix, UX fix, or wording fix rather than a new feature
- `validated`
  - confirmed by multiple testers or clearly high impact
- `deferred`
  - valid idea, but intentionally not prioritized now

### Friend Test Candidate Table

| Intake ID | Type | Area | Source | Summary | First Action | Priority | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| friend-home-001 | friend_feedback | home | friend test | Home画面で最初に何をすればよいか分かりにくい | 導線の観察と文言見直し | high | open | 初回導線の問題か確認 |
| friend-share-001 | candidate_feature | share | friend test | 共同編集URLと公開URLの違いが分かりにくい | 共有パネル説明文の追加 | high | open | 無料版/有料版説明にも関係 |
| friend-story-001 | candidate_fix | story | friend test | ストーリー解放条件が伝わりにくい | 状態表示と補助文を見直し | medium | open | LOCK条件の説明不足か確認 |
| friend-home-002 | candidate_fix | home | friend test | ホーム上のボタンの役割が見た目だけでは分かりにくい | ボタン文言と配置を見直し | high | open | ホーム設定 / ホーム編集 / 共有 の区別確認 |
| friend-home-003 | candidate_feature | home | friend test | ホームでキャラやパーツをもっと触って遊びたい | 直接操作したくなる要素を整理 | medium | open | 実画面編集の優先度判断材料 |
| friend-gacha-001 | candidate_fix | gacha | friend test | ガチャ結果の気持ちよさが弱く、引いた実感が薄い | 演出と結果表示の観察 | medium | open | 優先度は反応次第 |
| friend-gacha-002 | candidate_fix | gacha | friend test | どのガチャを引けばよいか違いが伝わりにくい | バナー情報と説明文を見直し | medium | open | タイトル/説明不足の可能性 |
| friend-story-002 | candidate_fix | story | friend test | どこまで読んだかは分かるが、次に何を読めばよいか迷う | 次の導線を補う | high | open | progression UX に関係 |
| friend-story-003 | candidate_feature | story | friend test | ストーリー中の演出や立ち絵変化をもっと分かりやすく見たい | 演出密度の希望を収集 | low | open | 機能追加か演出調整か切り分け |
| friend-collection-001 | candidate_fix | collection | friend test | 所持カード一覧は見られるが、絞り込みや探し方が弱い | フィルタ要求を記録 | medium | open | 実際の所持数増加後に再評価 |
| friend-editor-001 | candidate_fix | editor | friend test | 保存できたか不安になる | 保存完了表示と失敗表示を見直し | high | open | 体感品質に直結 |
| friend-editor-002 | candidate_fix | editor | friend test | どのデータが全体共有で、どれが自分専用か分かりにくい | project共有 / player進行の説明追加 | high | open | 今の設計の核心部分 |
| friend-share-002 | candidate_fix | share | friend test | 共有URLを作った後に何が起こるのか予想しにくい | 発行後の説明文を追加 | high | open | 共有事故防止 |
| friend-share-003 | candidate_feature | share | friend test | 共同編集URLを再発行したときの影響を事前に知りたい | 失効説明と確認導線を強化 | medium | open | 荒らし対策仕様と連動 |
| friend-mobile-001 | candidate_fix | mobile | friend test | スマホで見たときに情報が詰まりやすい | 狭幅表示の観察 | high | open | 友人テストでは優先監視 |
| friend-wording-001 | candidate_fix | wording | friend test | 用語の意味が分からず止まる場面がある | 分かりにくい語を収集 | medium | open | UI文言改善の入口 |

### Recommended classification rule

- If the tester says "使い方が分からない", classify it as `candidate_fix` first.
- If the tester says "こういうこともしたい", classify it as `candidate_feature`.
- If the tester hits a save problem, state loss, or wrong data issue, classify it as `candidate_fix` with highest priority.
- If the same request appears from multiple testers, promote it to `validated`.

### Promotion rule into the main Feature List

Move an intake item into the main `Feature List` when one of these is true:

- it blocks normal use
- it is reported repeatedly
- it is essential for friend testing to continue
- it directly affects free/paid product boundaries

### Good categories for friend-test intake

- onboarding
- home readability
- gacha excitement
- story progression clarity
- collection usability
- editor save confidence
- sharing comprehension
- wording and labels
- mobile usability

### What not to add immediately

Avoid promoting these too early:

- one-person taste-only visual requests
- vague "something feels off" comments without a concrete observation
- large future platform ideas unrelated to the next 1 to 3 test rounds
