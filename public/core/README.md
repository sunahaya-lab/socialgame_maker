# public/core/

## 責務
- ブート、初期化順、manifest/load order 周辺の core runtime を置きます。
- SPA 全体の起動手順を薄く管理します。

## 主な依存
- `public/index.html`
- `public/bootstrap-*.js`
- `public/app.js`
- `public/lib/`
- `public/screens/`
- `public/editor/`

## 分割基準
- 起動順、loader、runtime bridge、navigation のような cross-screen orchestration だけを置きます。
- feature 固有の business logic はここへ入れません。
- screen 固有 code は `public/screens/` へ戻します。
- editor section 固有 setup は `public/editor/sections/` へ戻します。

## ここに置いてよいもの
- bootstrap/runtime helper
- manifest/loader helper
- initialization order helper
- thin app-init runtime

## ここに置いてはいけないもの
- feature 単位の form logic
- editor section 固有 UI
- API persistence detail
- compatibility patch だけで成り立つ file

## ここで許容する変更
- boot 順 annotation
- load-order helper の薄型化
- init 順の抽出
- cross-screen runtime wiring の薄型化

## ここで拒否する変更
- feature 固有 business logic をここへ移すこと
- adapter/fallback を理由なく増やすこと
- load order を docs/manifest 更新なしで変更すること
- screen-local DOM logic を core に押し込むこと

## 主な入出力
- 入力:
  - manifest group
  - DOM readiness
  - shared setup deps
- 出力:
  - initialized runtime
  - ordered setup execution
