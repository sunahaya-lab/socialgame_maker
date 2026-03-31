# public/

## 責務
- Cloudflare Pages から直接配信されるフロントエンドの実行領域です。
- 実行時に必要な `HTML`, `CSS`, `JS`, partial, asset の公開ソースを置きます。

## 主な依存
- `public/index.html`
- `public/styles.css`
- `public/bootstrap-*.js`
- `public/api/`
- `public/core/`
- `public/editor/`
- `public/lib/`
- `public/screens/`
- `functions/api/` の HTTP endpoint

## 分割基準
- ブートと読み込み順に関わるものは `public/core/` か bootstrap 系へ寄せます。
- 画面固有の UI/behavior は `public/screens/` へ寄せます。
- editor 本線は `public/editor/` へ寄せます。
- shared helper は `public/lib/` へ寄せます。
- API thin client は `public/api/` へ寄せます。

## 許容される依存方向
- `public/core/` -> `public/lib/`, `public/screens/`, `public/editor/`
- `public/lib/` -> browser APIs, `public/api/`
- `public/api/` -> endpoint access only
- `public/screens/` -> `public/lib/`, `public/api/`, documented compatibility bridges
- `public/editor/` -> `public/lib/`, `public/editor/shared/`, `public/editor/sections/`
- `public/editor/shared/` -> shared editor contracts only
- `public/editor/sections/<name>/` -> `public/editor/shared/`, `public/lib/`, same-section code

## 依存方向で禁止するもの
- `public/lib/` から `public/screens/` や `public/editor/sections/` の section-local behavior を参照すること
- `public/screens/` から unrelated な `public/editor/sections/<other-section>/` 実装を直接参照すること
- `public/editor/sections/<name>/` から sibling section の実装詳細を直接参照すること
- `public/api/` に DOM/UI workflow を持ち込むこと

## ここに置いてよいもの
- `index.html`
- runtime に読み込まれる公開 JS/CSS
- browser から参照される partial/asset
- boot/path/loader の公開 entry

## ここに置いてはいけないもの
- Node 専用 script
- API 実装本体
- repo 内部だけで使う build memo
- 責務不明の巨大 util
- current runtime に不要な一時 dump

## ここで許容する変更
- folder boundary の明確化
- boot annotation
- public runtime source の thin 化
- mainline / compatibility の整理

## ここで拒否する変更
- 責務不明な file 追加
- bootstrap/load-order を docs なしで変えること
- compatibility 実装を理由なく `public/` root へ増やすこと
- `public/styles.css` の active status を無言で変えること

## 主な入出力
- 入力:
  - browser request
  - bootstrap manifest/load order
  - API JSON
- 出力:
  - rendered SPA
  - browser event handling
  - API request dispatch
