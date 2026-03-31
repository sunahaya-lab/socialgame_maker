# Rebuild V1 Spec Outline

> Priority Band: Dormant But Kept

Date: 2026-03-27

## Purpose

この文書は、`socia_maker` を最初から作り直す前提で、

- 何を V1 に入れるか
- 何を V2 以降に回すか
- どの責務を最初から分離するか

を整理するための仕様たたき台である。

現行実装の反省点は以下。

- shared content と player progression が部分的に混線している
- share / publish / billing / admin の責務が混線しやすい
- local-only state が仕様として曖昧なまま入り込みやすい
- editor と play surface が同じランタイムで密結合しやすい

この V1 では、機能数を増やすより責務を分けることを優先する。

---

## Product Definition

`socia_maker` は、

- 制作チームが共同で pseudo-social-game 風コンテンツを作る
- プレイヤーは project ごとに個別進行を持つ
- 必要に応じて外部へ公開プレイできる

ための web service とする。

---

## Core Separation

V1 の最重要原則は以下の 5 分離。

1. project management
2. shared content
3. player progression
4. publish / share
5. billing / admin

この 5 つは仕様上も API 上も保存先上も分離する。

---

## Roles

### 1. Internal Admin

運営・管理用。

できること:
- billing の付与
- project/license の監査
- admin tool へのアクセス

制約:
- app 本体 UI と同じ API を使わない

### 2. Project Owner

project を所有するユーザー。

できること:
- project の管理
- member 管理
- shared content 編集
- publish 設定
- public play 公開

### 3. Project Member

project に参加している制作メンバー。

できること:
- shared content 編集
- owner が許可した範囲の share 操作

できないこと:
- billing の内部操作
- owner 専用の publish 管理

### 4. Player

公開または内部テスト用に project を遊ぶユーザー。

できること:
- home / story / gacha / collection のプレイ
- 自分の progression 保存

できないこと:
- shared content 編集

---

## Service Modes

V1 では mode を明示的に分ける。

### 1. Edit Mode

対象:
- owner
- member

できること:
- content 編集
- project 管理

### 2. Play Mode

対象:
- player
- member
- owner

できること:
- 実際のプレイ進行
- player state 更新

### 3. Admin Mode

対象:
- internal admin

できること:
- billing / audit / internal operation

制約:
- app 本体とは別 UI / 別 API namespace を使う

---

## V1 Feature Scope

### Include In V1

- project 作成
- owner / member 管理
- shared content 編集
  - base characters
  - cards
  - stories
  - gachas
  - system config
- player progression
  - profile
  - currencies
  - inventory
  - gacha history
  - story progress
  - home preferences
- home play
- gacha play
- story play
- collection view
- collaborative editing access
- public play publish
- basic billing entitlement check

### Exclude From V1

- 高度な direct manipulation editor
- giant unified editor workspace
- ローカル専用 progression 機能
- 複数形式の share token を暫定仕様で増やすこと
- feature gating が未定義のまま入る追加 pack 機能

---

## Domain Model

### 1. Project

持つもの:
- id
- name
- ownerUserId
- visibility state
- publish state
- member settings

project は shared content の container である。

### 2. Shared Content

project 全員で共有される制作データ。

内容:
- base characters
- cards
- stories
- gachas
- system config
- folder definitions

ルール:
- shared content は player progression に保存しない

### 3. Player Progression

`project + player` 単位の進行データ。

内容:
- player profile
- currency balances
- inventory
- card/equipment ownership
- gacha pull history
- story progress
- home preferences
- event progress

ルール:
- local storage は cache であり source of truth ではない

### 4. Publish State

project が外部公開可能かを表す。

内容:
- public play enabled
- publish summary
- public access metadata

### 5. Billing State

課金権限の source of truth。

内容:
- base tier
- owned packs
- entitlements

---

## Shared Content Spec

### Content Types

V1 で正式対応する content type:

- `base-chars`
- `cards`
- `stories`
- `gachas`
- `system`

### Editing Rule

- shared content は owner/member のみ編集可能
- shared content API は `project` スコープ前提
- `room/global` の旧スコープは V1 では持たない

### Folder Rule

V1 の folder 対象:
- cards
- stories

他 content type への folder 展開は V2 以降にする。

---

## Player Progression Spec

### Rule

V1 では progression をすべて server-backed にする。

local-only を禁止する対象:
- gacha result
- inventory
- story progress
- event item count
- login bonus progress
- exchange purchase progress

### Allowed Local State

local storage で許すもの:
- UI cache
- temporary draft
- last viewed screen
- optimistic cache

ただし、最終的な source of truth ではない。

---

## Event Spec

V1 で event を入れる場合、`systemConfig` に巨大オブジェクトとして抱え込まない。

### Option A

V1 では event を入れない。

利点:
- scope を絞れる
- progression 複雑化を避けられる

### Option B

V1 で event を入れる場合は独立 resource にする。

event が持つもの:
- eventId
- title
- subtitle
- active flag
- linked story
- login bonus definition
- exchange definition
- event currencies
- event item definitions

event progression は別保存にする。

推奨:
- 無理に V1 に入れるなら Option B
- `systemConfig.eventConfig` のベタ積みは避ける

---

## Share / Publish Spec

### Access Types

V1 では access type を明示的に 3 つに限定する。

1. member access
2. collaborative invite
3. public play access

### 1. Member Access

project に所属する user が持つ通常権限。

### 2. Collaborative Invite

用途:
- member 参加を補助するためのリンク

ルール:
- play-only と混ぜない
- owner または share-manage 権限者のみ発行可能

### 3. Public Play Access

用途:
- project を編集不可の読み取り専用で公開する

ルール:
- publish state に従う
- shared content 編集権限は一切付与しない

### Important Rule

- `project-license` と share token 解決 API を兼用しない
- app 用 summary API と admin 用詳細 API は別にする

---

## Billing Spec

### Model

billing は user entitlement ベースで持つ。

V1 の基本分類:
- free
- publish
- optional packs

### Optional Packs

必要なら以下を pack として扱う:
- story FX
- battle
- event

### Rule

- publish 権限と editor feature pack は別概念
- admin API と app API は最初から別 namespace

### UI Rule

pack 未所持時の挙動は仕様で固定する。

候補:
- 閲覧のみ可
- local draft 編集は可
- shared save は不可

この挙動は pack ごとに変えず、原則統一する。

---

## API Namespace Spec

V1 では namespace を分ける。

### Admin

- `/api/admin/*`

用途:
- billing
- audit
- internal tools

### Projects

- `/api/projects/*`

用途:
- project metadata
- members
- share summary

### Content

- `/api/content/base-chars`
- `/api/content/cards`
- `/api/content/stories`
- `/api/content/gachas`
- `/api/content/system`

用途:
- shared content CRUD

### Player

- `/api/player/bootstrap`
- `/api/player/profile`
- `/api/player/story-progress`
- `/api/player/gacha-pulls`
- `/api/player/home-preferences`
- `/api/player/event/*`

用途:
- player progression

### Publish

- `/api/publish/*`

用途:
- public play resolve
- publish access summary

### Share

- `/api/share/*`

用途:
- collaborative invite
- share access check

---

## UI / UX Spec

### Core Rule

play surface と editor surface を最初から分ける。

### Play Screens

- home
- gacha
- story
- collection

### Editor Screens

- character editor
- card editor
- story editor
- gacha editor
- system editor

### Not In V1

- direct on-screen home editor
- floating multi-window workspace
- giant integrated editor shell

これらは V2 の拡張とする。

---

## Persistence Rule

### Source Of Truth

- shared content: server
- player progression: server
- billing: server
- publish/share state: server

### Cache

client local storage は以下のみ。

- temporary cache
- optimistic UI state
- unsaved editor draft

progression や権限判定の source of truth にしない。

---

## Migration Strategy

作り直し時は以下の順で進める。

1. 権限モデルを確定
2. shared content schema を確定
3. player progression schema を確定
4. admin/share/publish API の分離
5. play mode 実装
6. editor mode 実装
7. V2 として高度 editor を検討

---

## Recommended V1 Decisions

実務上の推奨は以下。

1. event は V1 から外すか、独立 resource にする
2. direct manipulation editor は V1 に入れない
3. local-only progression は禁止する
4. share / publish / admin を最初から分離する
5. `systemConfig` を何でも箱にしない

---

## Done Criteria

この V1 仕様が良い仕様として成立する条件:

- shared content と player progression の境界が明確
- admin と app の API が混ざらない
- public play と collaborative editing の意味が明確
- local storage が source of truth にならない
- editor と play の責務が最初から分かれている
