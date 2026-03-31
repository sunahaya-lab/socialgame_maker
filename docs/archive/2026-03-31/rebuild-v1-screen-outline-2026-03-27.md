# Rebuild V1 Screen Outline

> Priority Band: Dormant But Kept

Date: 2026-03-27

## Purpose

`socia_maker` 作り直し版 V1 の画面構成たたき台。

主眼:
- play と edit を最初から分ける
- 1 画面に責務を詰め込みすぎない
- 高度 editor は V2 以降へ回す

---

## Top-Level Modes

V1 の画面は 3 系統に分ける。

1. Play Mode
2. Edit Mode
3. Admin Mode

---

## 1. Play Mode

### 1-1. Project Entry Screen

用途:
- project 選択
- project summary 表示
- play 開始

表示項目:
- project name
- play availability
- current player name

### 1-2. Home Screen

用途:
- プレイヤーのホーム表示
- current currencies
- banner / home speech
- 主要導線

遷移先:
- gacha
- story
- collection

V1 ではやらない:
- 高度な direct editing overlay

### 1-3. Gacha Screen

用途:
- gacha list
- gacha detail
- single draw / ten draw
- result display

依存する state:
- player currencies
- inventory
- gacha history

### 1-4. Story Screen

用途:
- story list
- tabs
- lock/new/clear 状態表示
- story reader 起動

依存する state:
- story progress
- inventory or unlock condition

### 1-5. Story Reader Screen / Modal

用途:
- scenes 表示
- next / prev
- read progress 更新

### 1-6. Collection Screen

用途:
- owned card 一覧
- rarity filter
- card detail
- character story 導線

依存する state:
- inventory

### 1-7. Event Screen

V1 に event を入れる場合のみ。

用途:
- event overview
- login bonus claim
- exchange
- linked story 導線

依存する state:
- event progression
- player currencies

---

## 2. Edit Mode

Edit Mode は play surface と分離する。

### 2-1. Project Dashboard

用途:
- project 概要
- content counts
- member summary
- publish summary
- editor 各画面への入口

### 2-2. Base Character Editor

用途:
- base character 一覧
- base character 作成 / 更新

扱う内容:
- profile
- birthday
- expressions
- variants
- voice lines
- home relation lines

### 2-3. Card Editor

用途:
- card 一覧
- card 作成 / 更新

扱う内容:
- base character link
- rarity
- attribute
- image
- card-specific voices
- folder assignment

### 2-4. Story Editor

用途:
- story 一覧
- story 作成 / 更新

扱う内容:
- type
- linked card
- sort order
- scenes
- variant defaults

### 2-5. Gacha Editor

用途:
- gacha 一覧
- gacha 作成 / 更新

扱う内容:
- title
- description
- featured
- rates

### 2-6. System Editor

用途:
- rarity mode
- folders
- orientation
- shared UI config

制約:
- V1 では肥大化させない
- preview-heavy editor にしない

### 2-7. Event Editor

event を V1 に入れる場合のみ。

用途:
- event metadata
- login bonus config
- exchange config
- linked story config

注意:
- `system editor` に event 全部を押し込まない

### 2-8. Publish / Share Settings Screen

用途:
- collab link 管理
- public play link 管理
- publish summary

注意:
- billing の内部詳細はここで見せない
- app 用 summary のみ表示

### 2-9. Member Management Screen

用途:
- member 一覧
- invite
- role update

---

## 3. Admin Mode

app 本体とは別系統にする。

### 3-1. Billing Admin Screen

用途:
- user license 更新
- owned pack 更新
- entitlement 確認

### 3-2. Project Audit Screen

用途:
- project の publish/share 状態確認
- owner/license 状態監査

---

## Navigation Rule

### Play Mode Navigation

最小構成:
- home
- gacha
- story
- collection

event を入れる場合:
- event を追加

### Edit Mode Navigation

一覧:
- dashboard
- base character
- card
- story
- gacha
- system
- publish/share
- members

---

## V1 UX Constraints

1. giant integrated editor は作らない
2. floating multi-window workspace は入れない
3. direct manipulation editor は入れない
4. play と edit の DOM / state を過度に混在させない
5. まずフォーム中心の安定した編集 UX を作る

---

## Screen Responsibility Rule

各 screen は以下を守る。

- 1 screen = 1 primary responsibility
- editor screen は player progression を直接持たない
- play screen は shared content 保存を直接持たない
- admin screen は app 用 API を前提にしない

---

## Recommended V1 Build Order

1. project entry
2. home
3. gacha
4. story
5. collection
6. player bootstrap / progression
7. project dashboard
8. content editors
9. publish/share settings
10. member management
11. billing admin
12. event screens if included

---

## Deferred To V2

V2 に回すもの:
- home direct editing
- multi-window editor workspace
- on-screen object manipulation
- advanced layout authoring
- editor overlay experiments

---

## Done Criteria

この画面仕様が良い状態といえる条件:

- play 画面と edit 画面の責務が混ざらない
- admin 画面が app 本体から独立している
- 1 画面に過剰な責務が詰め込まれていない
- V1 の画面だけで最低限の制作とプレイが成立する
