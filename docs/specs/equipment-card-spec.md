# equipment-card-spec

## 方針
- `装備カード` は `キャラカード` と同じレジストリに混ぜない
- `entries` には引き続き `キャラカード` だけを保存する
- `装備カード` は別レジストリとして新設する
- UI 部品、画像アップロード、フォルダ管理の見た目は可能な範囲で共通化する

## この方針にする理由
- 既存 `entries` は `baseCharId` 前提の構造が強い
- `ホームボイス`, `関係ボイス`, `カード固有会話`, `キャラストーリー紐付け` は装備に自然に乗らない
- 同一レジストリに `cardType` を足すと、空欄だらけの不自然なレコードになりやすい
- 将来 `装備種別`, `装備部位`, `装備スキル`, `装備強化` を足す余地を残したい

## 新しく作るもの

### データ
- `equipmentCards`
  - 装備カードの配列
  - `characters` とは別保存

### API
- `/api/equipment-cards`
  - `GET`: 一覧取得
  - `POST`: 追加 / 更新

### フロント保存キー
- `socia-equipment-cards`
  - 既存 `socia-characters` とは分ける

## 最小レコード案
```js
{
  id: "uuid",
  name: "蒼光の剣",
  description: "イベント配布のSSR装備",
  rarity: "SSR",
  slotType: "weapon",
  image: "data:image/...",
  catch: "会心率アップ",
  folderId: "",
  passiveText: "",
  activeSkillName: "",
  activeSkillText: "",
  sortOrder: 0
}
```

## 初期項目
- `id`
- `name`
- `description`
- `rarity`
- `slotType`
  - 例: `weapon`, `armor`, `accessory`, `other`
- `image`
- `catch`
- `folderId`
- `passiveText`
- `activeSkillName`
- `activeSkillText`
- `sortOrder`

## 今は入れないもの
- 装備レベル
- 強化素材
- 限界突破
- 複数スキル
- キャラ専用装備制限
- 詳細ステータス配列

## UI 方針

### キャラカード
- 既存 `editor-character` をそのまま使う
- 既存保存先は `entries`

### 装備カード
- 別ウィンドウを使う
- 既存 `character-form` を流用せず、専用フォームを作る
- ただし次の UI 部品は共通化してよい
  - 画像アップロード
  - レアリティ選択
  - フォルダ選択
  - 一覧カードの外観

## フォルダ
- 最初は `equipmentFolders` を `cardFolders` と分ける
- 理由
  - キャラカードと装備カードを同じフォルダ一覧で混ぜないため
- ただし UI 実装は既存フォルダマネージャを参考に共通化してよい

## ガチャとの関係
- `キャラガチャ`
  - 既存どおり `entries` を対象にする
- `装備ガチャ`
  - 今後 `equipmentCards` を対象にする
- 現時点では `装備ガチャ` の保存と表示だけ先行し、排出処理は未実装のままでよい

## コレクションとの関係
- `collection` は将来的に
  - キャラカード
  - 装備カード
  をタブで分ける
- 初期段階ではキャラと装備を同じグリッドへ混ぜない

## プレイヤー所持データ
- 初期案
  - `inventory` は将来的に分離する
  - 例: `characterInventory`, `equipmentInventory`
- 当面は `装備ガチャ` 排出未実装なので、ここはまだ着手しない

## 実装順
1. `equipment-cards` API を追加
2. ローカル保存キー `socia-equipment-cards` を追加
3. 装備カード専用フォームと一覧を追加
4. `equipmentFolders` を追加
5. 装備カードウィンドウを実フォームへ接続
6. その後で `装備ガチャ` の排出処理を追加
7. 最後に `collection` と `inventory` を拡張

## 互換性ルール
- 既存 `entries` は移動しない
- 既存 `gachas` の `character` データはそのまま扱う
- 既存セーブデータに対して一括変換はしない
- 装備機能は新規追加だけにして、既存キャラ系の保存経路へ条件分岐を増やしすぎない

## 実装時の注意
- `character` と `equipment` を同じ submit handler に無理に載せない
- まず保存先を分ける
- その上で、共有できる UI ヘルパーだけを共通化する
