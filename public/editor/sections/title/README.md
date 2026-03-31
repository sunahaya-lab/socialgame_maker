# public/editor/sections/title/

## 責務
- editor 内の称号/タイトル系 section の wrapper と runtime を置きます。
- title editor 固有の保存、一覧、text source をここで閉じます。

## 主な依存
- `public/editor/shared/`
- `public/screens/title-editor.js`
- `public/lib/`

## 分割基準
- title editor runtime/text/helper はここへ置きます。
- title screen play-side runtime は `public/screens/` か `public/lib/` 側に残します。
- system section 側の title-screen runtime とは役割を混ぜません。

## ここに置いてよいもの
- title editor runtime
- title section wrapper
- title text source
- title runtime bridge

## ここに置いてはいけないもの
- home title-screen bootstrap
- unrelated system/member/share code
- play-side title screen implementation

## ここで許容する変更
- title editor runtime の抽出
- title text source の分離
- compatibility caller の mainline helper 優先化

## ここで拒否する変更
- play-side title screen behavior をここへ持ち込むこと
- unrelated system save logic を混ぜること
- shared helper を title folder に抱え込むこと

## 主な入出力
- 入力:
  - title editor deps
  - shared helper
- 出力:
  - setup/render hooks
