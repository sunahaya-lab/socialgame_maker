# public/lib/

## 責務
- 画面横断で使う shared helper と runtime facade を置きます。
- 純粋 helper と薄い runtime helper を優先します。

## 主な依存
- `public/api/`
- `public/screens/`
- `public/editor/`
- browser APIs

## 分割基準
- DOM を持たない pure helper は優先してここに置きます。
- DOM を持つ場合でも cross-screen で再利用される薄い helper ならここに置けます。
- 特定 screen 専用の UI ロジックは `public/screens/` に残します。
- 特定 section 専用の editor logic は `public/editor/sections/` に残します。
- ただし現在は、移行途中の例外として editor wiring の暫定 shared facade が一部ここに残っています。

## ここに置いてよいもの
- text source
- storage helper
- image helper
- runtime facade
- auth/profile shared action helper
- project/member shared runtime helper
- transitional editor wiring facade already documented in current health check

## ここに置いてはいけないもの
- 巨大 screen implementation
- editor section 固有の詳細 UI
- bootstrap 順依存の本体
- manifest/load-order 直結 code

## ここで許容する変更
- pure helper 抽出
- shared runtime facade 抽出
- auth/profile/project などの横断 action helper 化
- text source の共有化

## ここで拒否する変更
- screen-local behavior をここへ移すこと
- section-local editor logic をここへ移すこと
- bootstrap/load-order 依存をここへ埋め込むこと
- DOM 大改修を shared helper に押し込むこと
- 既存の暫定 editor wiring facade を理由に、新しい section-local editor wiring を `public/lib/` に追加すること

## 現在の例外
- 以下は移行途中の暫定層として `public/lib/` に残っています:
  - `public/lib/app-editor.js`
  - `public/lib/app-editor-section-runtime-factory.js`
  - `public/lib/app-editor-bootstrap-factory.js`
- これらは長期配置の正解ではありません。
- `public/lib/app-editor.js` は、share panel / gacha form / folder controls / shared editor persistence をまだ混在して持つ transitional shared editor module です。
- そのうち share panel / project member runtime は、`public/editor/sections/share/share-panel-runtime.js` へ抽出を開始しています。
- そのうち gacha form helpers も、`public/editor/sections/gacha/gacha-editor-form-runtime.js` へ active path の委譲を開始しています。
- そのうち gacha featured selection helper も、`public/editor/sections/gacha/gacha-selection-runtime.js` へ active path の委譲を開始しています。
- そのうち folder controls / shared system-config persistence も、`public/editor/shared/editor-folder-runtime.js` へ active path の委譲を開始しています。
- そのうち submit-label sync も、`public/editor/shared/editor-form-sync-runtime.js` へ active path の委譲を開始しています。
- そのうち base-character option sync も、`public/editor/shared/editor-base-char-option-sync-runtime.js` へ active path の委譲を開始しています。
- `public/lib/app-editor-section-runtime-factory.js` は、現在は `public/editor/editor-section-runtime-factory.js` への thin compatibility adapter です。
- `public/lib/app-editor-bootstrap-factory.js` は、現在は `public/editor/editor-bootstrap-factory.js` への thin compatibility adapter です。
- 新しい editor wiring は原則として `public/editor/` 側に作り、`public/lib/` 側の暫定層を増やさないでください。

## 主な入出力
- 入力:
  - app state
  - API client
  - browser storage
- 出力:
  - normalized data
  - shared actions
  - thin runtime setup
