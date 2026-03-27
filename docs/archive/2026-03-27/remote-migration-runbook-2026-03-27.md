# remote migration 実行 runbook

## 目的

- クローズドテスト公開前に、remote D1 の必要テーブルを揃える。
- 実行順と確認順を固定し、途中で抜け漏れが出ないようにする。

## 基本方針

- 既存の migration 番号順を尊重する
- クローズドテストに必要なものを優先して確認する
- 実行後は API で軽く動作確認する

---

## 優先度の高い migration

### 共有 / 公開 / ライセンス

- `0009_share_access_tables.sql`
- `0010_user_billing_entitlements.sql`

### 画像アップロード

- `0012_asset_webp_normalization.sql`

### プレイヤー状態

- `0007_player_home_preferences.sql`
- `0008_player_currency_balances.sql`
- `0011_player_event_progress.sql`

---

## 推奨実行順

番号順で実行する。

1. `0007_player_home_preferences.sql`
2. `0008_player_currency_balances.sql`
3. `0009_share_access_tables.sql`
4. `0010_user_billing_entitlements.sql`
5. `0011_player_event_progress.sql`
6. `0012_asset_webp_normalization.sql`

---

## 実行前チェック

- `wrangler.toml` の `SOCIA_DB` が正しい
- Cloudflare 認証が有効
- remote D1 に接続できる
- ローカルの migration ファイルが最新

---

## 実行コマンドの形

例:

```powershell
wrangler.cmd d1 migrations apply socia-maker --remote
```

または、必要に応じて個別 SQL 実行を使う

```powershell
wrangler.cmd d1 execute socia-maker --remote --file migrations/0012_asset_webp_normalization.sql
```

---

## 実行時の注意

- 途中で `auth error 10000` が出ることがある
- その場合は認証状態を確認し直す
- 一部だけ進めて止まるより、状態を確認してから再開した方が安全

---

## 適用後の確認項目

### share / public share

- `project_public_shares`
- `project_collab_shares`
- ライセンス関連テーブル

### asset

- `assets` の新規カラム
  - `owner_user_id`
  - `usage_type`
  - `stored_format`
  - `quota_bytes`
  - `normalization_status`

### player state

- `player_home_preferences`
- `player_currency_balances`
- `player_event_progress`

---

## API での最低限確認

### 共有系

- `/api/project-share-summary`
- `/api/share-public-link`

### 画像系

- `/api/assets-upload`
- `/api/assets-content`

### プレイヤー bootstrap

- `/api/player-bootstrap`

---

## 成功条件

- migration が remote に最後まで入る
- テーブル欠如エラーが消える
- share 系 API が fallback ではなく本来値を返す
- asset upload 系がテーブル不足で止まらない

---

## 失敗時の切り分け

### Cloudflare 認証エラー

- `wrangler login` 状態を確認
- アカウント切替ミスがないか確認

### テーブル不足エラー

- 実際に migration が remote に入っているか確認
- 番号順の抜けがないか確認

### asset upload だけ失敗

- D1 だけでなく `SOCIA_ASSETS` の R2 バインディングも確認する

---

## 実行後の次アクション

1. `SOCIA_ASSETS` を設定する
2. カード画像アップロードを試す
3. `カード → ガチャ → 引く → 編成 → 戦闘` を一周する
4. その後に Cloudflare Access 下で友人テストを始める
