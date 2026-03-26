# gacha-mode-spec

## 方針
- キャラDBと装備DBは常に残す
- ゲームシステム設定で「何をガチャ対象として使うか」だけを切り替える
- 既存のキャラガチャデータは壊さない
- 装備機能は追加仕様として積み上げる

## 採用するモード

### `characters_only`
- 表示名: `キャラのみ`
- キャラだけをガチャ対象にする
- 装備カードDBは保持する
- 装備カード編集はできる
- ただし装備ガチャ、混合ガチャ、装備所持表示は使わない

### `mixed_shared`
- 表示名: `キャラと装備 同じガチャ`
- 1つのガチャからキャラと装備の両方を排出する
- ガチャ画面上は混合ガチャとして扱う
- 排出時はまず `character / equipment` のどちらを出すかを決め、その後に各DBから抽選する

### `split_catalogs`
- 表示名: `キャラと装備 別ガチャ`
- キャラガチャと装備ガチャを分ける
- 今後の本命仕様はこれ
- 既存 `character` ガチャをそのまま活かしながら `equipment` ガチャを追加できる

## ゲームシステム設定

### 追加する設定
```js
systemConfig.gachaCatalogMode =
  "characters_only" |
  "mixed_shared" |
  "split_catalogs";
```

### 初期値
- 初期値は `characters_only`
- 既存セーブデータにこの項目が無い場合も `characters_only` とみなす

### この設定の責務
- ガチャ編集UIで作れるガチャ種別を制限する
- ガチャ画面で見せるタブや説明を切り替える
- 排出処理でどの抽選ルートを使うかを決める

## ガチャ定義

### ガチャ種別
```js
gacha.gachaType =
  "character" |
  "equipment" |
  "mixed";
```

### 既存互換
- 既存データで `gachaType` が無い場合は `character`
- 既存キャラガチャは移行不要

### モードごとの許可
- `characters_only`
  - `character` のみ許可
- `mixed_shared`
  - `mixed` のみ許可
- `split_catalogs`
  - `character` と `equipment` を許可

## 排出データ

### `character`
- 既存どおり `entries` から抽選する
- `featured` はキャラカードID配列のまま維持する

### `equipment`
- `equipmentCards` から抽選する
- 将来的には `featuredEquipmentIds` を持つ
- 最初の段階では `featured` を装備カードID配列へ切り替えるか、装備専用キーを分ける

### `mixed`
- キャラと装備の両方を対象にする
- 先に排出種別を決め、その後に対象DBから抽選する

```js
gacha.dropWeights = {
  character: 70,
  equipment: 30
};
```

- `dropWeights` が無い場合は `50 / 50` など安全な既定値を置く

## UI方針

### ゲームシステム画面
- `ガチャ構成` という選択UIを追加する
- 選択肢:
  - `キャラのみ`
  - `キャラと装備 同じガチャ`
  - `キャラと装備 別ガチャ`
- 説明文も付ける
  - `キャラのみ`: 装備DBは残るがガチャには出さない
  - `同じガチャ`: 1つのガチャから両方出る
  - `別ガチャ`: キャラガチャと装備ガチャを分ける

### ガチャ編集画面
- `characters_only`
  - `ガチャ種別` は固定で `キャラガチャ`
  - 装備関連UIは出さない
- `mixed_shared`
  - `ガチャ種別` は固定で `混合ガチャ`
  - `dropWeights` 編集UIを出す
  - キャラピックアップと装備ピックアップを別欄で持てるようにする
- `split_catalogs`
  - `ガチャ種別` で `キャラガチャ / 装備ガチャ` を選べる

### ガチャ画面
- `characters_only`
  - キャラガチャだけ見せる
- `mixed_shared`
  - 混合ガチャとして見せる
  - 結果画面で `キャラ / 装備` を区別して表示する
- `split_catalogs`
  - キャラガチャと装備ガチャを分けて見せる

## データ互換性
- キャラDBはそのまま
- 装備DBはそのまま
- 既存ガチャは `character` とみなす
- 既存プレイヤー所持データは無理に変換しない
- 装備排出を実装するまでは、装備所持データは新規追加の別経路で増やす

## 実装順
1. `system` に `gachaCatalogMode` を追加
2. `system-editor` に `ガチャ構成` UIを追加
3. `gacha` 保存時にモードと種別の整合性を取る
4. `gacha-screen` の表示をモード対応させる
5. `equipment` ガチャ排出を実装する
6. `mixed` ガチャ排出を実装する
7. 最後にコレクションと所持品へ反映する

## 今回の実装判断
- データは分ける
- ガチャ運用ルールは `systemConfig.gachaCatalogMode` で切り替える
- 既存キャラガチャは壊さない
- 装備DBはモードに関係なく残す

## 注意点
- `characters_only` でも装備カード編集を禁止しない
- ゲームシステム設定は「DBの削除」ではなく「機能の使用可否」を制御する
- `mixed_shared` は将来分岐が増えやすいので、排出処理を `character` と `equipment` の抽選関数へ分けてから束ねる
- 先に `split_catalogs` を安定させ、その後 `mixed_shared` を載せる順が安全
