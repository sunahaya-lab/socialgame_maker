# public/screens/

## 責務
- play screen 実装と、移行中の compatibility layer を置きます。
- `home`, `gacha`, `story`, `collection`, `formation` などの screen-local behavior を担当します。
- editor mainline の移行が終わるまで、互換層の一部もここに残ります。

## 主な依存
- `public/lib/`
- `public/api/`
- `public/editor/` の mainline helper
- browser DOM

## 分割基準
- screen-local behavior はここに置きます。
- editor mainline 本体は `public/editor/` に置きます。
- compatibility adapter はここに残せますが、mainline source を file 先頭コメントと folder policy の両方で明記します。
- behavior-carrying compatibility implementation は、削除条件と mainline 受け皿を file 先頭コメントで明記します。

## thin adapter の判定基準
- 主な責務が `window.SomeMainline.create(...)` への委譲である。
- file 自身が本質的な DOM render や state mutation をほぼ持たない。
- 互換 global 名と mainline global 名の橋渡しが主目的である。
- 削除条件が「mainline caller へ切り替わったら削除可能」と明確に書ける。

## active compatibility implementation の判定基準
- まだ screen behavior や DOM mutation を実際に持っている。
- mainline 側から一部 helper を使っていても、file 自身に runtime behavior が残っている。
- thin adapter と違い、即削除すると現在の runtime が壊れる。
- mainline 受け皿がある場合でも、移行完了までは behavior を保持する。

## ここに置いてよいもの
- play screen controller
- screen-local render/bind logic
- thin compatibility adapter
- behavior-carrying compatibility implementation
- screen-local text source
- screen-local runtime helper

## ここに置いてはいけないもの
- 新しい editor mainline 実装
- bootstrap/load-order logic
- API thin client 本体
- 複数 screen で共有する editor infrastructure
- 責務不明の巨大 util

## ここで許容する変更
- chapterize / comment / ownership annotation
- mainline helper 優先への依存解決変更
- thin adapter 化
- behavior を変えない runtime helper 抽出
- text source の外出し

## ここで拒否する変更
- `public/editor/` に置くべき mainline code をここへ追加すること
- thin adapter に新しい business logic を積み増すこと
- compatibility implementation に unrelated feature を混ぜること
- bootstrap 順や manifest 順に依存する処理をここへ埋め込むこと
- mainline source を明記しない adapter 追加

## リファクタリング単位
- まず file を `thin adapter` か `active compatibility implementation` に分類します。
- 次に、chapterize して責務境界を見える化します。
- その後で thin helper 抽出、mainline helper 優先化、factory 化を行います。
- file 削除は、`index.html` / manifest / caller / docs の全てで不要確認が取れてから行います。

## 主な入出力
- 入力:
  - current app state
  - DOM nodes
  - shared helpers
  - mainline editor helper
- 出力:
  - screen render
  - UI event handling
  - compatibility bridge behavior
