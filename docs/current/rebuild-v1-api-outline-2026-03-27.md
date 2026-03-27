# Rebuild V1 API Outline

Date: 2026-03-27

## Purpose

`socia_maker` 作り直し版 V1 の API 責務分離案。

方針:
- admin と app を分ける
- shared content と player progression を分ける
- share と publish を分ける

---

## API Namespaces

V1 では namespace を固定する。

- `/api/admin/*`
- `/api/projects/*`
- `/api/content/*`
- `/api/player/*`
- `/api/share/*`
- `/api/publish/*`

---

## 1. Admin APIs

用途:
- 内部運用
- billing
- audit

認可:
- internal admin only
- admin secret or internal auth

### `/api/admin/user-license`

用途:
- user base tier 更新
- owned packs 更新
- current entitlements 確認

### `/api/admin/project-license`

用途:
- project owner の実効ライセンス確認
- legacy state の監査

### `/api/admin/billing-catalog`

用途:
- 課金商品定義の取得

### `/api/admin/billing-audit`

用途:
- 付与履歴 / 監査ログ確認

---

## 2. Project APIs

用途:
- project metadata
- membership
- app 用の project summary

認可:
- owner / member based

### `/api/projects/list`

用途:
- 所属 project 一覧

### `/api/projects/create`

用途:
- project 作成

### `/api/projects/update`

用途:
- project 名等の更新

### `/api/projects/members`

用途:
- member 一覧取得
- 招待
- 権限変更

### `/api/projects/share-summary`

用途:
- app UI 用の最小 summary を返す

返すもの例:
- `licensePlan`
- `canRotateCollabShare`
- `canCreatePublicShare`
- `publishEnabled`

返さないもの:
- full owned packs
- admin audit data
- internal source

---

## 3. Content APIs

用途:
- shared content CRUD

認可:
- owner / editor member

共通ルール:
- 全 endpoint は `project` スコープ前提
- `room/global` は持たない

### `/api/content/base-chars`

用途:
- base character の一覧 / 保存 / 更新

### `/api/content/cards`

用途:
- card の一覧 / 保存 / 更新

### `/api/content/stories`

用途:
- story の一覧 / 保存 / 更新

### `/api/content/gachas`

用途:
- gacha の一覧 / 保存 / 更新

### `/api/content/system`

用途:
- system config の取得 / 更新

### `/api/content/events`

event を V1 に入れる場合のみ。

用途:
- event 定義の取得 / 更新

---

## 4. Player APIs

用途:
- player progression の read/write

認可:
- current player
- or public play context

共通ルール:
- `project + user` スコープ
- source of truth は server

### `/api/player/bootstrap`

用途:
- play 画面初期化

返すもの:
- profile
- currencies
- inventory
- gachaHistory
- storyProgress
- homePreferences
- eventProgress

### `/api/player/profile`

用途:
- profile 作成 / 更新

### `/api/player/story-progress`

用途:
- story progress 更新

### `/api/player/gacha-pulls`

用途:
- server-side gacha roll
- inventory/history 更新

### `/api/player/home-preferences`

用途:
- player ごとの home 設定保存

### `/api/player/event/login-bonus-claim`

event を入れる場合。

用途:
- login bonus claim

### `/api/player/event/exchange-purchase`

event を入れる場合。

用途:
- exchange purchase

### `/api/player/event/progress`

用途:
- event progression 取得

---

## 5. Share APIs

用途:
- collaborative invite
- share access check

認可:
- owner / share-manage 権限者

禁止:
- admin 専用 API を兼ねない

### `/api/share/collab-link`

用途:
- collaborative invite の取得 / rotate

### `/api/share/access`

用途:
- 現在ユーザーの share 操作可否確認

返すもの例:
- `canManageCollab`
- `canManagePublic`

---

## 6. Publish APIs

用途:
- public play の設定と解決

認可:
- owner or publish-manage role

### `/api/publish/public-link`

用途:
- public play link の作成 / rotate

### `/api/publish/summary`

用途:
- public play 可否と公開状態の summary

### `/api/publish/resolve`

用途:
- public play token 解決

ルール:
- 現在の publish state と entitlement を毎回確認する

---

## Response Policy

### App APIs

返すものは最小限にする。

方針:
- UI に必要な情報だけ返す
- internal audit 情報は返さない

### Admin APIs

返してよいもの:
- full entitlements
- source
- audit details
- license history

---

## Error Policy

全 API で統一するもの:
- status code
- `code`
- Japanese user-facing message

例:
```json
{
  "code": "project_required",
  "error": "project が指定されていません"
}
```

---

## Authorization Policy

helper も責務で分ける。

- `ensureInternalAdminAccess`
- `ensureProjectOwnerAccess`
- `ensureProjectMemberAccess`
- `ensureProjectEditorAccess`
- `ensureProjectShareManageAccess`
- `ensureProjectPublishManageAccess`
- `ensurePlayerAccess`

避けるべきもの:
- admin と owner を同時要求する曖昧 helper
- token 解決と owner 判定を一体化した helper

---

## Recommended V1 Constraints

1. billing-admin は `/api/admin/*` しか叩かない
2. app 本体は `/api/admin/*` を叩かない
3. public play token 解決は publish state と entitlement を再確認する
4. player progression API は local-only 保存を前提にしない
5. shared content API は project スコープのみ対応
