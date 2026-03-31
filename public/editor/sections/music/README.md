# public/editor/sections/music/

## 責務
- BGM editor の mainline runtime と wrapper を置きます。
- BGM 一覧、保存、選択補助など music 固有導線をここで閉じます。

## 主な依存
- `public/editor/shared/`
- `public/screens/music-editor.js`
- `public/lib/`

## 分割基準
- music editor setup はここへ置きます。
- title/system/notices と共有する text/helper は shared か lib へ戻します。
- play-side BGM 再生実装とは混ぜません。

## ここに置いてよいもの
- music runtime
- music section wrapper
- music text source
- music runtime bridge

## ここに置いてはいけないもの
- unrelated play screen code
- bootstrap logic
- system/title/notices 専用 logic

## ここで許容する変更
- BGM editor runtime の抽出
- text source の分離
- compatibility screen の mainline helper 優先化

## ここで拒否する変更
- play-side audio runtime をここへ持ち込むこと
- unrelated notice/system logic を混ぜること
- shared helper を music folder に抱え込むこと

## 主な入出力
- 入力:
  - music deps
  - shared helper
- 出力:
  - setup/render hooks
