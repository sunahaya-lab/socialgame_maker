# public/api/

## 責務
- ブラウザから使う API client の薄い入口を置きます。
- HTTP endpoint 呼び出しの共通化だけを担当します。

## 主な依存
- `functions/api/`
- `fetch`
- `public/lib/` の shared helper

## 分割基準
- endpoint 単位の thin client はここに置きます。
- UI state や DOM 更新はここに置きません。
- 認証/セッション/権限の UI 表現は呼び出し側に残します。
- project/editor 特有の workflow は `public/lib/` か各 screen/editor section へ戻します。

## ここに置いてよいもの
- `fetchJSON`
- request/response shape の薄い整形
- API path helper
- API client facade

## ここに置いてはいけないもの
- DOM 操作
- screen render
- project/editor 固有 workflow
- bootstrap/load-order 依存

## ここで許容する変更
- thin client 化
- request/response helper 抽出
- error shape の統一

## ここで拒否する変更
- UI state mutation をここへ持ち込むこと
- editor/play-side workflow を client file に積み増すこと
- endpoint ごとの business logic をブラウザ側で抱え込むこと

## 主な入出力
- 入力:
  - endpoint path
  - request body / query
- 出力:
  - JSON response
  - normalized error
