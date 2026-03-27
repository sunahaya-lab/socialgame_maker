# Pre Large Commit / Push Checklist

Date: 2026-03-27

## Purpose

大規模な commit と push を行う前に、

- 変更が混線していないか
- 回帰点が追えるか
- push 後に切り戻せるか

を確認するためのチェックリスト。

---

## 1. Commit Scope Check

### 1-1. 変更が混ざりすぎていないか

同じ commit に以下を混ぜない。

- bug fix
- API 仕様変更
- refactor
- docs only
- text repair

### 1-2. revert 可能な粒度か

各 commit について、以下を説明できること。

- 何を直した commit か
- 何を分割した commit か
- revert すると何が戻るか

説明できない場合は commit が大きすぎる。

### 1-3. tracked / untracked の整理

確認事項:
- 一時ログ
- 実験ファイル
- recovery JSON
- 不要な出力物

が混ざっていないか。

---

## 2. Runtime Boundary Check

### 2-1. `public/app.js` が再肥大化していないか

確認事項:
- bootstrap 以外の業務ロジックが戻っていないか
- 分割済みロジックが再び `app.js` に逆流していないか

### 2-2. `public/index.html` の読み込み順

確認事項:
- script 順が壊れていないか
- 新旧 runtime が二重起動していないか
- `window.*` 依存のロード順が崩れていないか

### 2-3. legacy と新実装の境界

確認事項:
- `app.legacy.js` が active runtime 扱いになっていないか
- overlay や旧 editor が勝手に再有効化されていないか

---

### 2-4. editor V1 / legacy cleanup

確認事項:
- `public/screens/editor-screen.js` に残る重複定義が active runtime 側に逆流していないか
- `public/screens/editor-screen-v1.js` / `editor-v1-host.js` / `editor-section-host-registry.js` の責務境界が素直か
- 不要になった `editor-*-section.js` の script 読み込みが `public/index.html` に残っていないか

## 3. API Responsibility Check

### 3-1. admin API と app API の分離

確認事項:
- SPA が `/api/admin/*` を直接叩いていないか
- billing-admin が app 用 API に依存していないか

### 3-2. share / publish / billing の責務境界

確認事項:
- collaborative share
- public play
- project license summary
- admin billing detail

が同一 endpoint に詰め込まれていないか。

### 3-3. shared content API の scope

確認事項:
- `project` スコープ前提で揃っているか
- `projects.js` だけ旧 `room/global` のまま残っていないか

---

## 4. Player Progression Check

### 4-1. local-only progression が残っていないか

特に確認するもの:
- event progression
- gacha result
- inventory
- story progress
- home preferences

これらが正式 state として local にだけ残っていないこと。

### 4-2. bootstrap 整合性

確認事項:
- frontend が期待する player state と
- `player-bootstrap` が返す内容

が一致しているか。

### 4-3. source of truth

確認事項:
- progression の source of truth が server になっているか
- local storage は cache / draft 扱いに留まっているか

---

## 5. New Feature Check

### 5-1. share panel

最低限確認:
- collaborative share 発行
- public share 可否表示
- free / paid 状態の出し分け

### 5-2. event

最低限確認:
- event screen が開く
- login bonus
- exchange
- story 導線

### 5-3. paid feature gating

最低限確認:
- battle
- story FX
- event

で pack 未所持時の挙動が揃っているか。

---

## 6. Text / Encoding Check

### 6-1. mojibake 残り確認

重点対象:
- event 画面
- billing-admin
- share/license
- editor 追加文言

### 6-2. browser 表示確認

PowerShell 表示ではなく browser 上で確認すること。

---

## 7. Docs Alignment Check

確認対象:
- `AGENTS.md`
- `README.md`
- `docs/current/*`

確認事項:
- 実装済み内容と矛盾していないか
- 現在の active runtime 説明が古くなっていないか
- 修正メモと現実の挙動がズレていないか

---

## 8. Manual Smoke Test

push 前に最低限通す。

### Play

- home が開く
- gacha が回せる
- story が開ける
- collection が開く

### Editor

- character save
- story save
- gacha save
- system save

### Share / Publish

- share panel が開く
- collaborative share 動作
- public share summary 表示

### Billing Admin

- admin 画面が最低限ロードする
- project/user license 取得が動く

---

## 9. Push Decision Rule

push してよい条件:

- commit が役割別に分かれている
- 主要導線の smoke test が通っている
- docs の最低限更新が済んでいる
- 「revert すると何が戻るか」を commit ごとに説明できる

push しないほうがよい条件:

- runtime 修正と API 修正と editor 分割が 1 commit に混ざっている
- local-only state がどこに残っているか分からない
- admin/app API の境界が曖昧
- 文字化けや二重初期化が未確認

---

## Recommended Final Order

1. `git diff --stat` を見る
2. 不要ファイルを除く
3. commit をテーマ別に切る
4. smoke test を行う
5. docs の整合性を確認する
6. commit message を見直す
7. push
