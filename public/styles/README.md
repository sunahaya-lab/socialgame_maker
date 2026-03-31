# public/styles/

## 責務
- `public/styles.css` の split/reference mirror を置きます。
- 現在の active runtime source of truth はまだ `public/styles.css` です。

## 主な依存
- `public/styles.css`
- `docs/current/styles-css-split-map-2026-03-30.md`

## 分割基準
- split file は section 単位で同期します。
- active runtime に切り替える前に、reference sync と owner/danger 注記を揃えます。
- `responsive.css` のような危険 section は extraction pass を docs で固定してから触ります。

## ここに置いてよいもの
- `tokens.css`
- `base.css`
- `home.css`
- `gameplay.css`
- `editor-*.css`
- `home-edit*.css`
- `responsive.css`
- split map/loader 補助 doc

## ここに置いてはいけないもの
- runtime 未確認の勝手な style source
- section 境界不明な追加 CSS
- 1 file で全体を再上書きする新しい巨大 CSS

## ここで許容する変更
- reference sync
- split map 更新
- owner/danger 注記追加
- active runtime を変えない cleanup

## ここで拒否する変更
- `public/styles.css` と同期せずに split 側を独自進化させること
- active runtime 切替を docs/index 側更新なしで行うこと
- danger section を一括移植すること

## 主な入出力
- 入力:
  - `public/styles.css` の current section
- 出力:
  - reference-synced split CSS
  - extraction map
