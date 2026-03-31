# public/editor/sections/share/

## 責務
- 公開/共有 section の mainline wrapper を置きます。
- project の share UI 導線を扱います。

## 主な依存
- `public/editor/shared/`
- `public/screens/editor-share-screen.js`
- project/share runtime helper

## 分割基準
- share screen factory/wrapper はここへ置きます。
- floating window や project context は shared に残します。
- member 権限管理と public share/license を混ぜません。

## ここに置いてよいもの
- share section
- share screen factory
- share runtime bridge
- share panel runtime
- share button binding

## ここに置いてはいけないもの
- member/project settings code
- unrelated editor app orchestration
- auth/session 本体

## ここで許容する変更
- share screen の factory 化
- public share UI の mainline 化
- compatibility screen の thin 化

## ここで拒否する変更
- member 権限管理を混ぜること
- license/billing policy を UI file に埋め込むこと
- auth/session 本体をここへ移すこと

## 主な入出力
- 入力:
  - share deps
  - shared helper
- 出力:
  - open/close/render hooks
  - public share UI
