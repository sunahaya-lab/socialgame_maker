# Share Spec

## 目的

`socia_maker` の共有機能を、以下の 2 系統に分けて定義する。

1. 無料版共有
誰でも編集できて、誰でも遊べる共同部屋 URL を発行する。

2. 有料版共有
編集はできず、閲覧とプレイだけできる公開共有 URL を発行する。

この仕様は、実装前の要件定義の基準とする。

---

## 前提

- 共有対象の正本は `project` である。
- 共有コンテンツとプレイヤー進行は分離する。
- 共有コンテンツ
  - `base characters`
  - `cards`
  - `stories`
  - `gachas`
  - `system config`
- プレイヤー進行
  - `profile`
  - `inventory`
  - `story progress`
  - `gacha history`
  - `home preferences`
  - `currencies`
- 現在の設計方針どおり、共有コンテンツは project 単位、プレイヤー進行は user 単位で保持する。

---

## 用語

### Project

編集対象の正本データ。

### Collab Room

無料版共有で使う、共同編集と共同プレイのための URL。

### Public Share

有料版共有で使う、編集不可の公開閲覧・公開プレイ用 URL。

### Share Token

URL に含まれるランダム識別子。再発行時に更新される。

---

## 共有の種類

## 1. 無料版共有

### 目的

- チーム内や身内で、すぐに同じ project を触れるようにする。
- URL を知っている人は誰でも編集できる。
- URL を知っている人は誰でも遊べる。

### 要件

- `project` ごとに有効な `collab_room` は 1 本だけ持てる。
- 再発行時、旧 URL は必ず失効する。
- 失効理由は荒らし対策とする。
- 共同部屋参加者は、共有コンテンツを編集できる。
- 共同部屋参加者は、プレイヤー進行を個別に持てる。
- 無料版共有は「ライブ project 共有」であり、閲覧専用ではない。

### 挙動

- `collab_room` URL で開いたユーザーは、その `project` を編集可能。
- 編集内容は同じ `project` の正本へ保存される。
- プレイヤー進行は閲覧者ごとに別保存される。
- `collab_room` 再発行後、旧 URL では編集も閲覧もできない。

### URL 失効時

- 旧 URL アクセス時は専用の無効画面を表示する。
- HTTP レベルでは `410 Gone` 相当の扱いを推奨する。
- UI 文言は「この共有 URL は無効になりました。新しい URL を発行してもらってください。」とする。

---

## 2. 有料版共有

### 目的

- 外部向けに編集不可の状態で project を共有する。
- 読み物・疑似ゲームとして遊べることを主目的とする。

### 要件

- `public_share` は有料版機能とする。
- `public_share` URL では共有コンテンツの編集を禁止する。
- `public_share` URL では閲覧とプレイのみ可能。
- `public_share` 上のプレイヤー進行はユーザーごとに別保存できる。
- `public_share` は project 単位で公開する。

### 挙動

- `public_share` URL で開いたユーザーは、home / gacha / story / collection を利用できる。
- editor 画面、編集ボタン、編集 API は利用不可。
- 編集 API に対する直接アクセスもサーバー側で拒否する。

### 備考

- 将来的に `public_share` を「ライブ project 参照」から「公開スナップショット固定」に拡張する余地を残す。
- 初期実装ではライブ参照でもよいが、仕様としては将来スナップショット化可能な構造を優先する。

---

## 権限モデル

共有 URL に応じて、クライアントとサーバーの両方で権限を制御する。

### 権限種別

- `edit_and_play`
  - 無料版 `collab_room`
- `play_only`
  - 有料版 `public_share`
- `owner`
  - project の元管理者

### 権限ごとの許可

| 操作 | owner | edit_and_play | play_only |
|---|---|---|---|
| project 閲覧 | yes | yes | yes |
| project 編集 | yes | yes | no |
| player progress 保存 | yes | yes | yes |
| shared URL 再発行 | yes | owner のみ | owner のみ |
| editor UI 表示 | yes | yes | no |
| editor API 実行 | yes | yes | no |

### 実装原則

- UI で隠すだけでは不十分。
- Functions 側で権限チェックを必須にする。

---

## データ分離方針

### 共有コンテンツ

- project 正本として保存する。
- 共同部屋も公開共有も、原則としてこの正本を参照する。

### プレイヤー進行

- 共有 URL の種類に関係なくユーザー単位で保存する。
- ただし、保存キーのスコープは `project + user + share_mode` で明確化する。

### 保存スコープ方針

- `project` は共有コンテンツの識別子
- `user` はプレイヤー進行の識別子
- `share_mode` は `owner` / `collab_room` / `public_share`

これにより、少なくとも以下を防ぐ。

- 共有 URL に入っただけでローカル保存が別領域に切り替わって「消えた」ように見える問題
- 共同編集用の状態と公開閲覧用の状態が混線する問題

---

## URL 設計方針

### 無料版共有

例:

```text
/?project={projectId}&collab={token}
```

または

```text
/c/{token}
```

要件:

- token は推測困難であること
- 再発行時に token を更新すること
- projectId と token の対応はサーバー側で解決すること

### 有料版共有

例:

```text
/?project={projectId}&share={token}
```

または

```text
/s/{token}
```

要件:

- token は推測困難であること
- 有料版ライセンスが有効な project のみ発行可能

### 注意

- `room` という 1 種類の概念で無料版共有と有料版共有を兼用しない。
- `collab_room` と `public_share` は別概念として分離する。

---

## API 要件

最低限、以下の責務が必要。

### 共同部屋 API

- `POST /api/collab-room/rotate`
  - 新しい共同部屋 token を発行
  - 旧 token を失効
- `GET /api/collab-room/resolve`
  - token から project を解決
  - 無効なら失効扱いを返す

### 公開共有 API

- `POST /api/public-share/create`
  - 有料版前提で公開共有を発行
- `POST /api/public-share/rotate`
  - 必要なら token 再発行
- `GET /api/public-share/resolve`
  - token から project を解決

### 権限検査

既存の編集 API で、以下のような権限判定が必要。

- `base-chars`
- `entries`
- `stories`
- `gachas`
- `system`

判定結果:

- owner または `edit_and_play` のときだけ書き込み許可
- `play_only` は読み取りのみ許可

---

## UI 要件

### 無料版共有 UI

- 「共同編集 URL をコピー」
- 「共同編集 URL を再発行」
- 再発行時に確認ダイアログを出す
  - 「再発行すると以前の URL は無効になります」

### 有料版共有 UI

- 「公開共有 URL をコピー」
- 「公開共有を有効化」
- 「公開共有を停止」
- 「公開共有 URL を再発行」

### 公開共有アクセス時 UI

- editor タブ非表示
- 編集ボタン非表示
- 書き込み不能時のガード文言表示

---

## 課金・商品仕様メモ

### 無料版

- 共同編集 URL 発行可
- 常に 1 本だけ有効
- 再発行で旧 URL 失効

### 有料版

- 編集不可の公開共有可
- 将来的に公開数制限やライセンス単位管理を追加可能

---

## セキュリティ方針

- token は UUID より短くてもよいが、十分に推測困難であること
- token の再発行はサーバー側でのみ行う
- 旧 token は即時無効化する
- 編集可否はクライアントではなくサーバーで最終判定する
- 有料版公開 URL から編集 API を叩いても拒否する

---

## 今回の設計判断

以下を初期決定とする。

1. 共有対象の正本は `project`
2. 無料版共有は `collab_room`
3. 有料版共有は `public_share`
4. `collab_room` と `public_share` は別トークン・別権限で扱う
5. プレイヤー進行は共有 URL 種別に関係なく user 単位で持つ
6. 編集可否は必ず Functions 側で制御する
7. 旧共有 URL は再発行時に失効する

---

## 未決事項

以下は次の設計で確定させる。

1. `public_share` は初期実装でライブ参照にするか、公開スナップショットにするか
2. `public_share` を URL 知っている人限定にするか、より公開寄りにするか
3. 無料版 `collab_room` に owner 専用の管理 UI をどこまで出すか
4. 有料版ライセンス情報をどの単位で持つか
   - app 全体
   - project 単位
   - owner account 単位
5. プレイヤー進行の localStorage スコープを最終的にどう切るか

---

## 推奨する次工程

1. `collab_room` と `public_share` の D1 スキーマを先に決める
2. API レベルで権限判定の土台を作る
3. 現行の `room` 概念を廃止または `collab_room` に寄せて整理する
4. 共有 URL 発行 UI を無料版と有料版で分ける
5. その後に公開共有の UI 制限と編集 API 制限を実装する
