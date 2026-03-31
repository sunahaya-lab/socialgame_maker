# public/editor/sections/notices/

## 責務
- お知らせ editor の mainline source を置きます。
- リリース対象機能なので runtime の安定性を優先します。

## 主な依存
- `public/editor/shared/`
- `public/screens/announcement-editor.js`
- `public/lib/`

## 分割基準
- announcement editor の runtime/text/helper はここへ置きます。
- home 側 read-only 表示はここではなく play screen 側へ置きます。
- notices の editor workflow と home 表示 workflow を混ぜません。

## ここに置いてよいもの
- announcement editor app/runtime
- announcement text source
- notices section wrapper
- notices runtime bridge

## ここに置いてはいけないもの
- home feed render 本体
- member/share/system 専用 logic
- unrelated editor dashboard logic

## ここで許容する変更
- announcement editor の mainline 化
- text source 分離
- release 安定化のための薄い runtime 抽出

## ここで拒否する変更
- home 側お知らせ表示本体をここへ移すこと
- notices editor に unrelated project/member logic を混ぜること
- release line を不安定にする大規模 UI 改修

## 主な入出力
- 入力:
  - announcement deps
  - shared helper
- 出力:
  - editor setup/render/save hooks
