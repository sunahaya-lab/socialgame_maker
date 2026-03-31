# Stripe Payment Links 課金導線メモ 2026-03-30

## 目的

- `socia_maker` の初期課金導線を `Stripe Payment Links` ベースで成立させる
- 複雑なサブスク基盤は先送りし、まずは買い切りと容量追加を安全に扱う
- 課金後の権限付与を `redirect` ではなく `webhook` 基準で確定させる

## 前提

- 決済画面は Stripe Hosted Checkout を使う
- アプリ内で価格表と購入理由を見せる
- 実際の購入ボタンは Stripe Payment Link に遷移する
- 購入結果の確定は `checkout.session.completed` を受けた時点で行う
- アプリ復帰用の成功画面は用意するが、復帰画面だけでは権限を付与しない

## この方式で向くもの

- 買い切りライセンス
- 容量追加パック
- カフェ用の部屋追加
- 演出パック
- 内装拡張パック

## この方式で弱いもの

- ユーザーごとに価格や構成が大きく変わる複雑課金
- 複数商品を毎回自由に組み合わせるカート型導線
- 強い座席課金や利用人数課金

上記が必要になったら `Payment Links` ではなく `Checkout Sessions API` に寄せる。

## 課金導線

### 常設導線

- `ユーザープロフィール` または `プロジェクト設定` に `プラン / 容量` を置く
- ここで無料枠と追加購入できる項目を一覧表示する
- 各商品に `購入する` ボタンを置き、対応する Payment Link に遷移させる

### 文脈導線

- 容量上限到達時に `保存容量を増やす`
- 部屋数上限到達時に `部屋を追加`
- ロックされた演出や内装機能押下時に `この機能を解放`

### UX方針

- 下部メニューに専用課金タブは作らない
- 常設導線 1 本と、上限到達時の導線を優先する
- 課金を押し売りせず、必要になった時だけ自然に見せる

## 商品の切り方

### 無料

- 基本プレイ
- 1 ルームのカフェ
- 少数キャラ配置
- 最低限のホーム編集
- タイトル画像変更

### 課金候補

- 保存容量追加
- カフェの部屋数追加
- 内装自由配置
- 家具や装飾レイヤー追加
- 動く素材パック
- 特殊演出パック
- 高コストな専用アニメーション機能

## Stripe 側の構成

### Payment Link 単位

- 1 商品につき 1 本を基本にする
- 例:
  - `storage_1gb`
  - `cafe_room_pack`
  - `cafe_fx_pack`
  - `interior_layout_pack`

### URL パラメータ

- `client_reference_id` を必ず付ける
- 推奨形式:
  - `userId`
  - または `userId_projectId_productKey_nonce`

`client_reference_id` は webhook の `checkout.session.completed` から回収して、どのユーザーの購入かを特定するために使う。

### 成功後の戻り先

- `after_completion.redirect.url` でアプリに戻す
- 例:
  - `/billing/success?session_id={CHECKOUT_SESSION_ID}`
- ただしここでは `購入処理中です` を表示するだけにして、権限付与は webhook 側で行う

## D1 テーブル案

### `billing_products`

- `product_key TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `stripe_payment_link_url TEXT NOT NULL`
- `grant_type TEXT NOT NULL`
- `grant_value_json TEXT NOT NULL`
- `active INTEGER NOT NULL DEFAULT 1`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

用途:

- アプリ内に表示する商品定義
- Stripe URL と自前の権限付与内容の対応表

### `billing_orders`

- `id TEXT PRIMARY KEY`
- `user_id TEXT NOT NULL`
- `project_id TEXT`
- `product_key TEXT NOT NULL`
- `client_reference_id TEXT NOT NULL`
- `stripe_session_id TEXT NOT NULL UNIQUE`
- `stripe_payment_intent_id TEXT`
- `status TEXT NOT NULL`
- `amount_total INTEGER`
- `currency TEXT`
- `created_at TEXT NOT NULL`
- `paid_at TEXT`

用途:

- Stripe 決済単位の保存
- 二重 webhook 処理防止
- 返金時の追跡

### `entitlements`

- `id TEXT PRIMARY KEY`
- `user_id TEXT NOT NULL`
- `project_id TEXT`
- `scope_type TEXT NOT NULL`
- `product_key TEXT NOT NULL`
- `benefit_type TEXT NOT NULL`
- `benefit_value TEXT NOT NULL`
- `source_order_id TEXT NOT NULL`
- `granted_at TEXT NOT NULL`
- `expires_at TEXT`

用途:

- UI や機能制限の判定元
- 実際に何が解放されているかの真実ソース

## Cloudflare Functions 最小構成

### `GET /api/billing/products`

返すもの:

- 商品一覧
- 表示名
- 説明
- 課金種別
- アプリ内表示用価格文言

責務:

- フロントに価格表を出す
- 商品の `product_key` と Stripe リンク定義を引く

### `POST /api/billing/create-link-context`

入力:

- `productKey`
- `projectId` nullable

返すもの:

- `paymentUrl`

責務:

- 現在ログイン中の `userId` を解決する
- `client_reference_id` を生成する
- `paymentLinkUrl` に query を付けた最終 URL を返す

メモ:

- Payment Link 自体は固定 URL なので、アプリから直接生 URL を持たせるより、この API で一度文脈付き URL を返した方が安全

### `POST /api/stripe/webhook`

受ける主イベント:

- `checkout.session.completed`

必要処理:

- Stripe 署名検証
- `client_reference_id` を読む
- `session.id` の重複確認
- `billing_orders` に記録
- `product_key` に応じて `entitlements` を付与
- 成功レスポンスを返す

追加検討:

- `charge.refunded`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

## entitlement 判定の考え方

### ユーザー単位

- 容量追加
- 演出パック
- 動く素材パック

### プロジェクト単位

- 特定プロジェクトの共有ライセンス
- 特定プロジェクトの公開権限

### 判定例

- 保存容量上限:
  - 基本無料容量 + `storage_mb` entitlement 合計
- カフェ部屋数:
  - 基本 1 + `room_slots` entitlement 合計
- 特殊演出:
  - `feature_flag = cafe_fx_pack` の有無

## UI 反映方針

- 課金機能の利用可否は `entitlements` を見る
- 上限値は `entitlements` の合算で求める
- ロック中 UI は隠さず、押すと購入導線を出す
- 購入直後は webhook 反映待ちのため、成功画面では `反映を確認中` を表示する

## 実装順

1. `billing_products` の静的定義か D1 テーブルを作る
2. `GET /api/billing/products` を作る
3. `POST /api/billing/create-link-context` を作る
4. Stripe Dashboard 側で Payment Link を作成する
5. `POST /api/stripe/webhook` を作る
6. `billing_orders` と `entitlements` を保存する
7. フロントに `プラン / 容量` 画面を作る
8. カフェや容量上限の文脈導線を追加する

## 運用メモ

- 権限付与は絶対に redirect 完了だけで行わない
- Stripe 側の商品名変更と `product_key` の対応が壊れないように管理する
- 返金時の entitlement 取り消しルールは別途定義が必要
- 将来サブスクに進む場合は `Payment Links` ではなく専用の subscription 設計に切り出した方がよい

## 現時点の結論

- 初期課金基盤は `Stripe Payment Links + webhook + D1 entitlements` で十分成立する
- `socia_maker` では `課金専用タブ` より `プラン画面 + 上限到達時導線` の方が自然
- 最初に売るべきものは `容量`, `部屋数`, `表現拡張` であり、基本体験そのものではない
> Priority Band: Dormant But Kept
