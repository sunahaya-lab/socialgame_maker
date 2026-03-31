# public/editor/sections/card/

## 責務
- カード editor 系の mainline runtime と wrapper を置きます。
- `entry` と `equipment-card` の runtime もここで扱います。

## 主な依存
- `public/editor/shared/`
- `public/screens/entry-editor.js`
- `public/lib/`

## 分割基準
- card/equipment-card 編集に閉じた runtime はここへ置きます。
- base-char/system/story と共有する helper はここへ置きません。
- base-char 側に置くべき素体情報と、card 側に置くべきカード固有情報を混ぜません。

## ここに置いてよいもの
- entry/equipment-card runtime
- battle runtime
- card section wrapper
- card text source
- card runtime bridge

## ここに置いてはいけないもの
- story/system 専用 logic
- floating window 共通基盤
- base-char 専用 business rule

## ここで許容する変更
- entry/equipment-card runtime の分離
- card text source の外出し
- compatibility screen の mainline helper 優先化

## ここで拒否する変更
- base-char 共有仕様をここへ複製すること
- gacha/story/system の behavior を混ぜること
- shared helper を section-local に閉じ込めること

## 主な入出力
- 入力:
  - card editor deps
  - shared helper
- 出力:
  - setup/open/render hooks
