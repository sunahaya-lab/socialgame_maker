# public/editor/sections/story/

## 責務
- story editor の mainline runtime と wrapper を置きます。
- scene/text/variant など story 固有の編集導線をここで閉じます。

## 主な依存
- `public/editor/shared/`
- `public/screens/story-editor.js`
- `public/lib/`

## 分割基準
- story editor setup/text/helper はここへ置きます。
- scene UI 共通 helper が横断化したら shared へ戻します。
- play-side story reader の runtime とは混ぜません。

## ここに置いてよいもの
- story runtime
- story section wrapper
- story text source
- story-local screen factory

## ここに置いてはいけないもの
- gacha/system/music 専用 logic
- bootstrap code
- play-side story reader behavior

## ここで許容する変更
- story text source の分離
- story runtime/helper の抽出
- scene editor の section-local 整理

## ここで拒否する変更
- play-side reader logic をここへ持ち込むこと
- unrelated announcement/member/share logic を混ぜること
- shared helper を story folder に抱え込むこと

## 主な入出力
- 入力:
  - story deps
  - shared helper
- 出力:
  - setup/open/render hooks
