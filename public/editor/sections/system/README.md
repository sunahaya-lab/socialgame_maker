# public/editor/sections/system/

## 責務
- system editor の mainline source を置きます。
- `title`, `battle`, `form` など system 配下の runtime はここが本線です。
- release line で有効な system 編集導線を安定運用します。

## 主な依存
- `public/editor/shared/`
- `public/screens/system-editor*.js`
- `public/lib/system-save-runtime.js`

## 分割基準
- system section 全体 orchestration はここへ置きます。
- section-local submodule はこのフォルダ内で分けます。
- shared editor helper は `public/editor/shared/` へ戻します。
- freeze 中の `event` は復旧 reference と release line を混ぜません。

## ここに置いてよいもの
- system editor app/runtime
- system form/title/battle runtime
- system text/helper
- system-local runtime bridge

## ここに置いてはいけないもの
- unrelated play screen logic
- editor app 全体 orchestration
- release freeze 中の `event` を再有効化する暫定 patch
- 旧 home layout 実装の復活

## ここで許容する変更
- `title`, `battle`, `form` の mainline 化
- system save の安定化
- text source の分離
- compatibility adapter の thin 化

## ここで拒否する変更
- freeze された `event` を docs 更新なしで戻すこと
- home layout/preset 実験をこの folder に再流入させること
- system section に unrelated editor feature を混ぜること

## release freeze メモ
- `event` は release scope freeze 対象です。
- active runtime に戻す場合は docs と manifest と adapter の3点更新を同時に行います。

## 主な入出力
- 入力:
  - system deps
  - save callbacks
  - shared helper
- 出力:
  - system setup/render/save hooks
