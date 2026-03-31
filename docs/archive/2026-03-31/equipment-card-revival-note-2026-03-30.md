# 装備カード復活メモ 2026-03-30

## 目的

- 既存カードとは別の `装備カード` を復活させる
- システム設定で有効化した時だけゲーム機能として見せる
- 無効時は `DB と編集UIは残るが、ゲーム本編では使わない` 状態にする

## 現時点の結論

- 装備カード機能は完全消滅していない
- `保存`, `編集`, `所持`, `個体`, `成長`, `編成画面での表示` は相当量残っている
- 一方で `装着による実効果`, `戦闘反映`, `完成した排出導線` は未完成
- よって `デフォルトでは眠らせ、システム設定で起こす` 方針は取りやすい

## 現在残っている実装

### データ層

- `equipmentCards` の独立配列が存在
- `equipmentInventory`
- `equipmentInstances`
- `equipmentGrowth`

関連:

- [`public/app.js`](../../public/app.js)
- [`public/lib/app-state.js`](../../public/lib/app-state.js)
- [`public/lib/app-data.js`](../../public/lib/app-data.js)

### API 層

- `/api/equipment-cards` が存在
- 現状は KV 保存
- 通常カードとは分離されている

関連:

- [`functions/api/equipment-cards.js`](../../functions/api/equipment-cards.js)

### 編集UI

- 装備カード専用フォームが存在
- 保存項目:
  - 名前
  - 説明
  - レアリティ
  - 装備種別
  - 画像
  - キャッチ
  - パッシブ文言
  - アクティブ文言

関連:

- [`public/screens/equipment-card-editor.js`](../../public/screens/equipment-card-editor.js)

### 所持 / 個体 / 成長

- 所持数管理
- 個体生成
- 成長値
- 強化
- 進化
- 限界突破
- 重複変換

関連:

- [`public/lib/app-data.js`](../../public/lib/app-data.js)

### 編成画面

- 装備一覧表示が残っている
- 個体ごとに表示される
- 詳細 / 長押し導線がある
- 変換対象に含められる

関連:

- [`public/screens/formation-screen.js`](../../public/screens/formation-screen.js)

### ガチャ周辺

- `equipment` ガチャ種別の分岐が残っている
- 文言や種別管理は残っている
- ただし排出本線は未完成寄り

関連:

- [`public/screens/gacha-screen.js`](../../public/screens/gacha-screen.js)
- [`functions/api/gachas.js`](../../functions/api/gachas.js)
- [`functions/api/player-gacha-pulls.js`](../../functions/api/player-gacha-pulls.js)

## 現在弱い / 未完成な部分

### ゲーム効果

- 装備カードの `passiveText` / `activeSkillText` は保存できる
- ただし文言保存中心で、戦闘計算への本実装は確認できない

### 装着スロット

- `どのキャラに何を装備したか` の明確なスロット管理は未完成
- 一覧表示はあるが装着管理としてはまだ弱い

### ガチャ排出

- 装備ガチャの型は残る
- 実際に装備カードを安定排出し、所持へ積む経路は完成していない前提で見るべき

### UI統合

- 通常カードと装備カードの表示導線はまだ別れ気味
- コレクションや詳細導線の統合は弱い

## 復活方針

### 基本方針

- デフォルトでは `装備機能OFF`
- OFF の時:
  - DB は残す
  - 編集UIも残す
  - ゲーム内では表示しない
- ON の時:
  - 編成画面に装備一覧を表示
  - 必要な範囲だけ順に有効化する

### 最小復活ライン

- システム設定に `equipmentMode` を追加
  - `disabled`
  - `database_only`
  - `enabled`

初期の意味:

- `disabled`
  - ユーザー向けには非表示
  - 編集もできれば隠す
- `database_only`
  - 編集できる
  - 保存できる
  - ただし本編では使わない
- `enabled`
  - 編成で表示
  - 所持や成長を扱う
  - ただし戦闘効果は別段階

### 段階実装

#### Stage 1

- システム設定で装備カードを明示的に ON/OFF
- OFF の時に装備UIを隠す
- ON の時に編集ダッシュボードへ出す
- ON の時に編成画面の装備一覧を表示

#### Stage 2

- 装備カードを所持に入れる正規導線を整える
- 手動付与または別導線で所持追加できるようにする
- ガチャ排出はまだ必須ではない

#### Stage 3

- キャラごとの装着スロットを実装
- `1キャラ1装備` など単純ルールで開始

#### Stage 4

- 戦闘中に装備効果を反映
- `passiveText` を見せるだけでなく、実効果を持たせる
- 必要なら `effectType`, `effectValue` を別フィールド化

#### Stage 5

- 装備ガチャを完成させる
- `mixed_shared` / `split_catalogs` と整合を取る

## 最小仕様としておすすめする線

当面はここまでで十分:

- `equipmentMode`
- 装備カード編集
- 装備カード所持
- 編成画面での装備一覧表示
- 装着はまだ未実装でもよい
- 実効果もまだ未実装でよい

この形なら、

- 装備カードは存在する
- 将来の拡張先も残る
- 今すぐ戦闘ロジックまで広げなくて済む

## UI方針

### OFF時

- ダッシュボードから装備カードを隠す
- ガチャ画面の装備種別も見せない
- 編成画面の装備欄も出さない

### ON時

- ダッシュボードに `装備カード` を出す
- 編成画面に装備一覧を出す
- システム設定内で現在のモードが分かるようにする

## 既存実装を活かす時の注意

- 装備カードは通常カードと無理に同じ submit handler に載せない
- ガチャ排出まで一気に復活させない
- 戦闘効果は文言保存と実効果を分離する
- `database_only` を挟んで、眠っている実装を段階的に起こす

## 次にやるべきこと

1. システム設定に `equipmentMode` を追加する
2. `disabled / database_only / enabled` の3段階を入れる
3. 編集ダッシュボードで装備カード項目を条件表示にする
4. 編成画面の装備欄を条件表示にする
5. その後で所持導線を整える

## 現時点の整理

- 装備カードは `ただの死にコード` ではない
- かなりの層が残っている
- ただし `ゲーム機能として完成している` とまでは言えない
- いまは `眠っているが、起こしやすい機能` とみなすのが正しい
> Priority Band: Dormant But Kept
