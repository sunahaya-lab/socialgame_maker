# docs/current/

## 責務
- 現在進行中の実装方針、危険箇所、health check、freeze scope、split map を置きます。
- 現在の repo に対して拘束力を持つ engineering policy を記録します。

## 主な依存
- `AGENTS.md`
- current runtime files under `public/`
- current API files under `functions/api/`

## 分割基準
- 現在の実装判断に使う文書だけを置きます。
- 過去ログ化したものは `docs/archive/` へ移します。
- 仕様書は `docs/specs/`、長期参照は `docs/reference/` へ分けます。

## Current Priority Bands

## Immediate Working Set

- まず読む:
  - [`active-doc-shortlist-2026-03-31.md`](./active-doc-shortlist-2026-03-31.md)
  - [`code-health-check-2026-03-30.md`](./code-health-check-2026-03-30.md)
  - [`runtime-structure-and-refactor-note-2026-03-30.md`](./runtime-structure-and-refactor-note-2026-03-30.md)
  - [`dangerous-code-handling-policy-2026-03-31.md`](./dangerous-code-handling-policy-2026-03-31.md)
  - [`release-scope-freeze-2026-03-30.md`](./release-scope-freeze-2026-03-30.md)
- split map は task ごとに shortlist から辿ります。
- `Dormant But Kept` は毎回読む束ではありません。

## Current Compression Rule

- `docs/current/` を巨大な常時参照置き場として扱わないこと。
- 日々の実装では `active-doc-shortlist-2026-03-31.md` から入り、必要な split map だけを追加で開きます。
- `Dormant But Kept` に入った文書は daily path から外し、再開根拠が弱ければ次回 archive 候補に回します。
- `Strongly Active` を増やすときは、同時に daily path から外せる文書がないか見直します。

### Strongly Active
- 今の実装判断に直接使う文書です。
- まず最初に読む対象です。
- 内容が現行 runtime に対して拘束力を持ちます。

現在の主対象:
- [`code-health-check-2026-03-30.md`](./code-health-check-2026-03-30.md)
- [`commit-readiness-checklist-2026-03-31.md`](./commit-readiness-checklist-2026-03-31.md)
- [`release-regression-test-playbook-2026-03-31.md`](./release-regression-test-playbook-2026-03-31.md)
- [`app-data-split-map-2026-03-31.md`](./app-data-split-map-2026-03-31.md)
- [`app-auth-split-map-2026-03-31.md`](./app-auth-split-map-2026-03-31.md)
- [`app-runtime-split-map-2026-03-31.md`](./app-runtime-split-map-2026-03-31.md)
- [`base-char-editor-split-map-2026-03-31.md`](./base-char-editor-split-map-2026-03-31.md)
- [`collection-screen-split-map-2026-03-31.md`](./collection-screen-split-map-2026-03-31.md)
- [`dangerous-code-handling-policy-2026-03-31.md`](./dangerous-code-handling-policy-2026-03-31.md)
- [`entry-editor-split-map-2026-03-31.md`](./entry-editor-split-map-2026-03-31.md)
- [`formation-screen-split-map-2026-03-31.md`](./formation-screen-split-map-2026-03-31.md)
- [`gacha-screen-split-map-2026-03-31.md`](./gacha-screen-split-map-2026-03-31.md)
- [`home-config-split-map-2026-03-31.md`](./home-config-split-map-2026-03-31.md)
- [`home-screen-split-map-2026-03-31.md`](./home-screen-split-map-2026-03-31.md)
- [`system-api-split-map-2026-03-31.md`](./system-api-split-map-2026-03-31.md)
- [`story-editor-split-map-2026-03-31.md`](./story-editor-split-map-2026-03-31.md)
- [`runtime-structure-and-refactor-note-2026-03-30.md`](./runtime-structure-and-refactor-note-2026-03-30.md)
- [`release-scope-freeze-2026-03-30.md`](./release-scope-freeze-2026-03-30.md)
- [`styles-css-split-map-2026-03-30.md`](./styles-css-split-map-2026-03-30.md)
- [`mojibake-repair-and-prevention-2026-03-30.md`](./mojibake-repair-and-prevention-2026-03-30.md)
- [`stabilization-freeze-policy-2026-03-30.md`](./stabilization-freeze-policy-2026-03-30.md)

### Context / Secondary
- 現在も参照価値はあるが、毎回の実装判断で必須ではない文書です。
- Strongly Active の補助として読む位置づけです。

現在の主対象:
- [`architecture-v2.md`](./architecture-v2.md)
- [`schema-v2.md`](./schema-v2.md)
- [`text-repair-workflow.md`](./text-repair-workflow.md)
- moved to reference:
  - [`../reference/audio-asset-guidelines-2026-03-30.md`](../reference/audio-asset-guidelines-2026-03-30.md)
  - [`../reference/ui-asset-spec-for-figma-2026-03-29.md`](../reference/ui-asset-spec-for-figma-2026-03-29.md)
  - [`../reference/ui-asset-size-guide-2026-03-29.md`](../reference/ui-asset-size-guide-2026-03-29.md)
- moved to archive:
  - [`../archive/2026-03-31/pages-migration-runbook-2026-03-28.md`](../archive/2026-03-31/pages-migration-runbook-2026-03-28.md)

### Dormant But Kept
- 現在の実装を直接は動かしていないが、再開・復旧・将来判断のために保持している文書です。
- ここにあるからといって current runtime の強い拘束力があるとは限りません。
- 再開時に使わないと判断できたものは archive へ移します。

現在の主対象:
- archived on 2026-03-31:
  - [`../archive/2026-03-31/README.md`](../archive/2026-03-31/README.md)

次回 archive 候補:
- none currently queued

## Daily Reading Boundary

- まず読むのは `Immediate Working Set` と shortlist の `Always Read First` のみです。
- `Read By Task` は担当ファイルに触るときだけ開きます。
- `Secondary Reference Only` は設計確認が必要なときだけ開きます。
- `Dormant But Kept` は archive 準備が終わるまで保持するだけで、通常作業では読まない前提です。

## ここに置いてよいもの
- code health check
- refactor direction
- release freeze memo
- split map
- encoding/mojibake recovery policy
- current runtime ownership memo

## ここに置いてはいけないもの
- obsolete archive log
- runtime source code
- one-off terminal dump
- 将来使うかもしれないだけの無拘束メモ

## ここで許容する変更
- current policy の更新
- health check の追記
- freeze scope の更新
- refactor boundary の明文化
- priority band の見直し

## ここで拒否する変更
- archive 向け文書を current に置くこと
- 実装済みコードと矛盾したまま放置すること
- 進捗ログを複数の current doc に重複分散させること
- `Strongly Active` を根拠なく増やすこと

## 主な入出力
- 入力:
  - current repo state
  - current implementation decisions
- 出力:
  - current engineering policy
  - current progress record
