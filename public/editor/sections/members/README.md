# public/editor/sections/members/

## 責務
- プロジェクト設定 / member 管理 section の mainline wrapper を置きます。
- owner / editor / viewer に関わる UI 導線を担当します。

## 主な依存
- `public/editor/shared/`
- `public/screens/editor-member-screen.js`
- `public/lib/project-members-runtime.js`

## 分割基準
- member screen 生成や wrapper はここへ置きます。
- project context や floating window は `public/editor/shared/` に残します。
- auth/session の本体は `public/lib/` 側へ残します。

## ここに置いてよいもの
- members section
- members screen factory
- member-management runtime helper

## ここに置いてはいけないもの
- project-wide shared helper
- unrelated auth panel UI
- public share logic

## ここで許容する変更
- member screen factory 化
- project-members runtime への依存整理
- owner/member 権限表示の安定化

## ここで拒否する変更
- auth/session 管理本体をここへ持ち込むこと
- share/license/public URL logic を混ぜること
- 権限境界の docs なし変更

## 主な入出力
- 入力:
  - project/member deps
  - shared helper
- 出力:
  - open/close/render hooks
  - member management UI
