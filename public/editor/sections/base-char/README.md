# public/editor/sections/base-char/

## 責務
- ベースキャラ editor の mainline runtime と section wrapper を置きます。
- ベースキャラ固有の編集導線、text source、runtime helper をここで閉じます。

## 主な依存
- `public/editor/shared/`
- `public/screens/base-char-editor.js`
- `public/lib/`

## 分割基準
- ベースキャラ編集に閉じた runtime/helper/text はここへ置きます。
- card/story/system と共有するものは `public/editor/shared/` へ戻します。
- card 側に寄せるべき voice/image logic をここに混ぜません。

## ここに置いてよいもの
- base-char section runtime
- base-char adapter/factory
- base-char text source
- base-char runtime bridge

## ここに置いてはいけないもの
- card/story/system 専用 logic
- global bootstrap code
- 複数 section 共通 helper

## ここで許容する変更
- base-char text source の分離
- base-char runtime/helper の抽出
- compatibility caller の mainline helper 優先化

## ここで拒否する変更
- card 固有仕様をここへ持ち込むこと
- unrelated editor dashboard logic を混ぜること
- shared に置くべき helper を section-local に抱え込むこと

## 主な入出力
- 入力:
  - base-char editor deps
  - shared helper
- 出力:
  - setup/open/render hooks
