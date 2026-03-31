# public/editor/sections/gacha/

## 責務
- ガチャ editor section の mainline wrapper と runtime を置きます。
- ガチャ設定、featured pool 補助、rates 周辺の section-local 導線をここで閉じます。

## 主な依存
- `public/editor/shared/`
- `public/screens/editor-screen.js`
- `public/lib/`

## 分割基準
- gacha 編集に閉じた setup/open/render はここへ置きます。
- featured pool 共通 helper が複数 section に広がるなら shared へ戻します。
- play-side gacha draw/runtime とは混ぜません。

## ここに置いてよいもの
- gacha section wrapper
- gacha runtime helper
- gacha editor form runtime
- gacha featured selection runtime
- gacha text source
- gacha runtime bridge

## ここに置いてはいけないもの
- story/music/system 専用 code
- play-side gacha draw behavior
- shared featured helper の section-local 複製

## ここで許容する変更
- gacha runtime/helper の抽出
- rates/featured pool の text source 分離
- compatibility screen の mainline helper 優先化

## ここで拒否する変更
- play-side gacha behavior をここへ持ち込むこと
- unrelated story/system logic を混ぜること
- shared helper を gacha folder に抱え込むこと

## 主な入出力
- 入力:
  - gacha deps
  - shared helper
- 出力:
  - section open/setup behavior
