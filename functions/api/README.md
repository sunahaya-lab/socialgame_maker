# functions/api/

## 責務
- Cloudflare Pages Functions の API endpoint と、その thin handler を置きます。
- backend 側の request validation と persistence bridge を管理します。

## 主な依存
- `SOCIA_DB`
- `SOCIA_DATA`
- shared helper modules in `functions/api/_*.js`

## 分割基準
- endpoint file は thin handler を保ちます。
- validation/normalization/store helper は `_*.js` に寄せます。
- フロント UI logic はここへ入れません。
- API ごとの business rule は endpoint handler に積み増しすぎず、helper/store に寄せます。

## ここに置いてよいもの
- endpoint handler
- API helper/store module
- auth/project/member persistence helper
- validation/normalization helper

## ここに置いてはいけないもの
- browser-specific code
- UI text/render logic
- unrelated migration notes
- frontend state mutation

## ここで許容する変更
- thin handler 化
- `_*.js` helper への寄せ
- response shape の統一
- D1/KV fallback の store helper 化

## ここで拒否する変更
- endpoint file に巨大 business logic を積み増すこと
- frontend UI 事情を持ち込むこと
- auth/permission rule を docs 更新なしで変えること
- one-off workaround を endpoint 本体へ埋め込むこと

## 主な入出力
- 入力:
  - HTTP request
  - KV
  - D1
- 出力:
  - JSON response
  - status code

- `system.js` ? endpoint orchestration ?????? gate ??? `_system-config-billing.js` ??????
