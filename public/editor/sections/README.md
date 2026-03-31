# public/editor/sections/

## 責務
- editor の section 単位責務を分離して置きます。
- 各フォルダは `1 section = 1 primary responsibility` を基本とします。
- `base-char`, `card`, `story`, `gacha`, `music`, `system`, `share`, `members`, `notices`, `title` などの section ごとに責務を閉じます。

## 主な依存
- `public/editor/shared/`
- `public/lib/`
- 必要に応じて `public/screens/` compatibility implementation

## 分割基準
- section 固有の setup/open/close/render は各 section フォルダへ置きます。
- section 固有の text source, runtime helper, factory も各 section フォルダへ置きます。
- 複数 section で使う helper は `public/editor/shared/` へ戻します。
- play-side から使う helper は `public/lib/` か `public/screens/` 側に残します。

## section-local に置く基準
- 主に 1 つの section だけが使う。
- section の business rule や setup sequence を持つ。
- その section を削れば一緒に消せる。

## shared へ戻す基準
- 少なくとも 2 section 以上が使う。
- section 名を取り替えても成立する汎用 helper である。
- host/app root と section の両方から参照される。
- floating window, project context, managed section, callback bundle のような橋渡し責務を持つ。

## ここに置いてよいもの
- section runtime
- section app/mainline source
- section-local text source
- section-local factory
- section-local screen factory
- section-local runtime bridge

## ここに置いてはいけないもの
- 複数 section 共通 helper
- bootstrap/load-order code
- unrelated play screen behavior
- section をまたぐ巨大 util
- thin compatibility adapter 本体

## section フォルダに必須で欲しいもの
- `README.md`
- その section の mainline source か runtime
- section-local text が多い場合は text source file

## ここで許容する変更
- section-local runtime 抽出
- compatibility caller を section factory 経由に寄せる変更
- text source の section-local 化
- section folder 内での app/runtime/factory 分離

## ここで拒否する変更
- 他 section の business rule を混ぜること
- section-local でない helper を抱え込むこと
- shared に置くべき bridge を section ごとに複製すること
- thin adapter を section folder に作ること

## リファクタリング単位
- まず `runtime`, `app`, `factory`, `text`, `screen-factory` のどれかに分類します。
- section-local で閉じるものだけを section folder に移します。
- 共有化が見えた時点で `public/editor/shared/` へ戻します。
- 互換層削除は caller/manifest/docs の不要確認後に行います。

## 主な入出力
- 入力:
  - section deps
  - shared editor helper
  - compatibility screen or bridge
- 出力:
  - section setup/open/close/render
  - section-local runtime behavior
