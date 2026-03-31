# お知らせ機能仕様

## 目的

- ユーザーが自分のプロジェクト向けにお知らせを配信できるようにする
- ツール作成者が全体向けの運営お知らせを配信できるようにする
- ホーム画面から自然に読める情報導線を用意する

## 位置づけ

- 編集ダッシュボードに `お知らせ` を追加する
- `お知らせ` は `ベースキャラ / カード / ストーリー / ガチャ / BGM / システム` と並ぶ編集対象の1つとして扱う
- 初期版では専用の下部メニューは作らない

## 扱うお知らせの種類

### プロジェクトお知らせ

- 各プロジェクトの管理者や編集権限ユーザーが作成する
- そのプロジェクトを見ているユーザーだけに表示される

### 運営お知らせ

- ツール作成者のみが作成できる
- 全ユーザー共通で表示される

## 初期版の基本方針

- 強制ポップアップより一覧表示を優先する
- 配信期間の制御を入れる
- 画像は1件につき1枚まで
- 本文はプレーンテキスト中心とする
- リッチエディタは後回し
- 予約配信は `startAt` / `endAt` の判定で実現する

## 編集UI

### ダッシュボード項目

- 項目名: `お知らせ`
- サブ文言:
  - `告知と配信期間の編集`

### 編集フォーム項目

- タイトル
- 本文
- 画像1枚
- 配信種別
  - `project`
  - `global`
- 公開状態
  - `draft`
  - `scheduled`
  - `published`
  - `archived`
- 公開開始日時
- 公開終了日時
- 並び順
- 遷移設定任意
  - `none`
  - `story`
  - `gacha`
  - `url`
- 遷移先値

## 表示仕様

### ホーム画面

- ホームに `お知らせ` 入口を置く
- 押すと一覧パネルまたはモーダルを開く
- 初期版ではホーム常設バナーではなく、一覧導線を優先する

### 表示対象

- `global` は全ユーザー対象
- `project` はそのプロジェクトを閲覧中のユーザーのみ対象

### 表示条件

- `status` が `published` または `scheduled`
- 現在時刻が `startAt` 以降
- `endAt` がある場合は `endAt` より前
- `archived` は表示しない

### 並び順

- 基本は `sortOrder ASC`
- 同値の場合は `startAt DESC`
- `startAt` がない場合は `createdAt DESC`

## 権限

### プロジェクトお知らせ

- 対象プロジェクトへの書き込み権限を持つユーザーのみ作成・更新可能

### 運営お知らせ

- 管理者権限のみ作成・更新可能
- 一般ユーザーは閲覧のみ

## データモデル案

### `announcements`

- `id TEXT PRIMARY KEY`
- `scope_type TEXT NOT NULL`
  - `project`
  - `global`
- `project_id TEXT`
- `author_user_id TEXT NOT NULL`
- `title TEXT NOT NULL`
- `body TEXT NOT NULL`
- `image_asset_id TEXT`
- `status TEXT NOT NULL`
- `start_at TEXT`
- `end_at TEXT`
- `sort_order INTEGER NOT NULL DEFAULT 0`
- `link_type TEXT NOT NULL DEFAULT 'none'`
- `link_value TEXT NOT NULL DEFAULT ''`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

## API案

### `GET /api/announcements`

用途:

- 現在のユーザーに表示すべきお知らせを返す

主な条件:

- 現在の `project`
- `global / project` scope
- 権限
- 期間
- `status`

### `POST /api/announcements`

用途:

- 新規作成
- 更新

必要チェック:

- `scope_type`
- `status`
- `startAt <= endAt`
- `global` の作成権限
- `project` の書き込み権限

## 画像の扱い

- 画像は既存アセット基盤を使う
- 初期版では画像1枚のみ
- お知らせ画像は `announcement-image` のような asset kind を後で追加できるようにしておく

## 遷移設定

### 初期版で許可するもの

- `none`
- `story`
- `gacha`
- `url`

### 初期版の挙動

- `story`: 対象ストーリーを開く
- `gacha`: ガチャ画面へ遷移
- `url`: 新規タブまたは同タブ遷移
- `none`: 何もしない

## 非対象

- コメント機能
- いいね機能
- 複数画像
- Markdown / HTML リッチ本文
- プッシュ通知
- ユーザーごとの既読管理
- セグメント配信

## 実装順

1. 仕様上 `お知らせ` を編集ダッシュボード項目として追加
2. `announcements` テーブルを作る
3. `GET /api/announcements` を作る
4. `POST /api/announcements` を作る
5. 編集フォームを作る
6. ホーム側のお知らせ一覧 UI を作る
7. 期間判定と scope 判定を通す

## 将来拡張

- 既読管理
- 固定表示
- 強制表示ポップアップ
- セクション分け
- リッチ本文
- お知らせカテゴリ
- 配信対象の詳細条件

## 現時点の結論

- `お知らせ` は編集ダッシュボードに追加する
- `project` と `global` を同じ機能内で扱う
- 初期版は `タイトル / 本文 / 画像1枚 / 配信期間 / 公開状態 / 任意リンク` に絞る
- 表示はホーム一覧導線を優先し、強制表示は後回しにする
