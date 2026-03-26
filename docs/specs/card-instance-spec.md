# カード個体管理仕様

## 目的

- 育成進捗を `cardId` 単位ではなく `所持コピー単位` で持てるようにする
- 同じカードを複数所持していても、`レベル / 進化 / 突破` を個別に管理できるようにする
- 編成、突破、変換、ガチャ取得を個体ベースへ移行する

## 背景

現状は `playerState.inventory` が `cardId + quantity` の集計構造で、`cardGrowth[cardId]` が種類単位の育成進捗になっている。

このため、同じカードを複数持つと全コピーが同じ育成値を共有してしまう。

## 方針

- `カード種類` と `カード個体` を分ける
- マスターデータは既存の `entries` / `equipmentCards` をそのまま使う
- プレイヤー所持データだけを `instance` ベースに拡張する
- 既存の `quantity` ベースデータは互換読み込みで吸収する

## 新しいデータ構造

### キャラカード個体

```js
{
  instanceId: "uuid",
  cardId: "ssr_tsubasa",
  acquiredAt: "2026-03-26T12:34:56.000Z",
  source: "gacha",
  isLocked: false,
  growth: {
    level: 1,
    evolveStage: 0,
    limitBreak: 0
  }
}
```

### 装備カード個体

```js
{
  instanceId: "uuid",
  equipmentId: "sword_alpha",
  acquiredAt: "2026-03-26T12:34:56.000Z",
  source: "gacha",
  isLocked: false,
  growth: {
    level: 1,
    evolveStage: 0,
    limitBreak: 0
  }
}
```

## playerState の追加項目

```js
{
  cardInstances: [],
  equipmentInstances: []
}
```

## 既存項目の扱い

### 維持するもの

- `inventory`
- `equipmentInventory`
- `cardGrowth`
- `equipmentGrowth`

### 役割

- 旧データ互換の読み込み元として当面残す
- 新実装では `cardInstances / equipmentInstances` を正とする

### 将来

- 移行完了後に段階的に縮退

## 互換移行

初回読み込み時に次の変換を行う。

1. `cardInstances` が空で、`inventory` に `quantity > 0` がある場合
2. `quantity` 分だけ個体を生成する
3. 既存 `cardGrowth[cardId]` は、先頭の1個体にだけ引き継ぐ
4. 残りの個体は初期成長値で生成する

装備も同じ考え方で `equipmentInventory` と `equipmentGrowth` から移行する。

## 編成

### 現状

- `partyFormation = [cardId, ...]`

### 変更後

- `partyFormation = [instanceId, ...]`

### 理由

- どのコピーを編成しているかを区別するため
- 同名カードを複数編成したときに育成状態が混ざらないようにするため

## 一覧表示

- 一覧タイルは `instanceId` ごとに1枚描画
- バッジ表示は各個体の `growth` を読む
- 長押し詳細も `instanceId` 指定で開く

## 突破

- 突破対象は `instanceId`
- 素材も `instanceId` を選ぶ
- 実行時は素材個体を `cardInstances` / `equipmentInstances` から削除する

## 変換

- 変換対象は `instanceId`
- 選択した個体だけを削除して `育成ポイント` を加算する

## ガチャ取得

- ガチャ結果ごとに新しい `instanceId` を発行して追加する
- 旧 `quantity` 更新は互換用に残してもよいが、表示と育成は個体データを優先する

## API 影響

### 当面は据え置きでよいもの

- `player-bootstrap`
- `player-gacha-pulls`

### 将来必要な拡張

- `player-bootstrap` が `cardInstances / equipmentInstances` を返す
- `player-gacha-pulls` が個体追加結果を返す

## 実装順

1. `playerState` に `cardInstances / equipmentInstances` を追加
2. ローカル読み込み時の互換移行を実装
3. 編成画面を `instanceId` ベースへ変更
4. 育成詳細を `instanceId` ベースへ変更
5. 変換を `instanceId` ベースへ変更
6. 突破を `instanceId` ベースへ変更
7. ガチャ取得を `instanceId` ベースへ変更
8. 必要なら API 側も個体返却へ拡張

## 非目標

- いまの段階でサーバーDBスキーマを全面更新すること
- いきなり `inventory.quantity` を完全削除すること
- 個体ごとの細かい追加属性を先に増やすこと

## 補足

- `ロック` は将来 `instance.isLocked` へ移す
- `お気に入り` や `編成中保護` も同じ個体単位へ載せやすい
- この構造にしておくと、同カード複数編成や個体差演出にも対応しやすい
