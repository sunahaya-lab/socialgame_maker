# public/editor/shared/

## 責務
- editor mainline が共有する helper と bridge 部品を置きます。
- host, dashboard, section, compatibility bridge の共通基盤です。

## 主な依存
- `public/editor/`
- `public/editor/sections/`
- `public/lib/`
- 必要に応じて `public/screens/` compatibility implementation

## 分割基準
- 複数 section/host が使う editor helper はここへ置きます。
- 1 section 専用 logic は `public/editor/sections/<name>/` に置きます。
- `public/screens/` の薄い adapter が直接知るべきでない mainline bridge はここに集めます。

## shared に置く基準
- 少なくとも 2 つ以上の section/host が使う。
- editor app root と section の両方から参照される。
- 特定 section の business rule ではなく、橋渡し・生成・共通 UI shell の責務を持つ。
- 将来 thin adapter からも参照される可能性がある。

## shared に置かない基準
- 1 section だけが使う form/detail logic
- 1 画面だけの text source
- 一時的な workaround しか持たない patch
- play-side helper

## ここに置いてよいもの
- project context
- floating window helper
- special section bridge
- managed section helper
- legacy bridge/workspace helper
- runtime callback bundle
- shared folder/runtime helper
- shared form setup runtime
- shared form sync helper
- shared base-character option sync helper
- shared preview runtime

## ここに置いてはいけないもの
- 単一 section 専用 form logic
- 大量の inline UI text
- unrelated play-side utility
- bootstrap manifest/loader logic

## ここで許容する変更
- factory/helper 抽出
- bridge の thin 化
- named callback bundle 化
- compatibility caller の mainline helper 優先化

## ここで拒否する変更
- section-local behavior を shared に逃がすこと
- `shared` を巨大 util 置き場にすること
- DOM 大改修を shared helper に押し込むこと

## 主な入出力
- 入力:
  - editor deps
  - compatibility API
  - section objects
- 出力:
  - shared editor behavior
  - thin orchestration helpers
