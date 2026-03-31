# public/editor/

## 責務
- editor の mainline runtime と shared editor infrastructure を置きます。
- `public/screens/` 側 compatibility layer の移行先です。
- editor の本線はここに集約し、`public/screens/` へ逆流させません。

## 主な依存
- `public/lib/`
- `public/screens/` の一部 compatibility implementation
- `public/editor/shared/`
- `public/editor/sections/`

## 分割基準
- editor mainline はここへ置きます。
- thin adapter はここではなく、必要なら `public/screens/` に残します。
- section ごとの責務は `public/editor/sections/` に分けます。
- 複数 section/host にまたがる基盤は `public/editor/shared/` に分けます。
- 現在 `public/lib/` に暫定で残っている editor wiring facade は、将来的にここか `public/editor/shared/` が受け皿になります。

## ここに置いてよいもの
- editor app/runtime
- editor dashboard/mainline host
- editor bootstrap factory
- editor section runtime factory
- editor runtime bridge
- editor runtime factory
- shared editor helper
- section orchestration の mainline source
- `public/lib/` から移設される editor bootstrap/runtime wiring

## ここに置いてはいけないもの
- play screen 固有 code
- bootstrap manifest/loader
- API 実装 detail
- 薄い互換 adapter
- file 単位の応急措置だけで成り立つ compatibility patch

## ここで許容する変更
- compatibility caller を mainline helper へ寄せる変更
- section 化、shared helper 化、factory 化
- thin adapter の受け皿を作る変更
- runtime wiring の薄型化

## ここで拒否する変更
- `public/screens/` に残すべき互換層の behavior を、境界定義なしにここへコピーすること
- section 専用 logic を root の `public/editor/` に積み増すこと
- shared helper に unrelated feature logic を混ぜること
- bootstrap/load-order の都合だけで mainline の責務を崩すこと

## 将来ここが受けるもの
- `public/lib/app-editor-section-runtime-factory.js`
- `public/lib/app-editor-bootstrap-factory.js`
- `public/lib/app-editor-section-runtime-factory.js` はすでに `public/editor/editor-section-runtime-factory.js` へ受け済みで、残っているのは thin compatibility adapter です。
- `public/lib/app-editor-bootstrap-factory.js` はすでに `public/editor/editor-bootstrap-factory.js` へ受け済みで、残っているのは thin compatibility adapter です。
- ただし移設時は、そのまま root に置くのではなく:
  - app-level wiring は `public/editor/`
  - shared wiring/helper は `public/editor/shared/`
  - section-local wiring は `public/editor/sections/<name>/`
  に分けます。

## リファクタリング単位
- まず `mainline app`, `shared helper`, `section runtime`, `section wrapper` に分類します。
- 次に compatibility caller を mainline helper 優先へ寄せます。
- その後で thin adapter を残し、behavior-carrying compatibility implementation を段階縮小します。
- 削除は `public/screens/` 側 caller と manifest/docs の不要確認後に行います。

## 主な入出力
- 入力:
  - editor runtime deps
  - shared helper
  - compatibility bridge
- 出力:
  - editor app setup
  - section orchestration
  - dashboard/window control
