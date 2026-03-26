# Text Repair Workflow

通常運用では、文字化け修復スクリプトを前提にしません。

## 通常運用
- `scripts/setup-utf8-console.ps1` で PowerShell を UTF-8 にする
- 文言は `public/lib/ui-text.js` を優先して編集する
- 画面ファイルの編集後は `scripts/check-editor-files.ps1` を実行する
- ブラウザ表示を正として確認する

## 非常用スクリプト
- `scripts/repair-editor-text.js`
- `scripts/repair-system-text.js`

これらは、既に文字化けや崩れが入ったファイルをまとめて復旧したいときだけ使います。

## 注意
- 通常の文言修正で毎回使わない
- 実行前に対象ファイルの差分を確認する
- 実行後は必ず `scripts/check-editor-files.ps1` を通す
- できればブラウザで対象画面を開いて確認する
