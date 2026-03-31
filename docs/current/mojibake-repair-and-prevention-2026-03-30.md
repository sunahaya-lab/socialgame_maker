# Mojibake Repair And Prevention

> Priority Band: Strongly Active

Date: 2026-03-30

## Current Assessment

- PowerShell の表示崩れだけでなく、実ファイルに混入した文字化けが少なくとも 1 件ある
- 現時点で確認できた実害:
  - `public/screens/story-editor.js:225`

## Repair Policy

1. まず `Get-Content -Encoding UTF8` とブラウザ表示で実害を確認する
2. 実害がある文字列だけを `apply_patch` で最小修正する
3. 文字列全体が大きく壊れている file は、無理に部分修復せず source-of-truth から戻す
4. 修復後は `node --check` とブラウザ確認を行う

## Prevention Policy

- 日本語を含む file への大きな shell ベースの行置換は避ける
- 文字列修正は `apply_patch` を優先する
- PowerShell 上では UTF-8 を明示する
- `Get-Content -Encoding UTF8` を使う
- 文字化け監視として `node scripts/check-mojibake.js` を使う

## Recommended Workflow

1. `scripts/setup-utf8-console.ps1`
2. `node scripts/check-mojibake.js`
3. `node --check <target>`
4. ブラウザ確認

## Notes

- UTF-8 の日本語 UI 文言に対して不自然なラテン拡張文字や置換文字が混ざる場合は、強い破損シグナルとして扱う
- PowerShell の profile warning は文字化けとは無関係
