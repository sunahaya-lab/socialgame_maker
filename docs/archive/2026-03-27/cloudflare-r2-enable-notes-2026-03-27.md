# Cloudflare R2 有効化メモ

## 目的

- `socia_maker` の WebP 正規化アセット保存で使う `R2` を、Cloudflare アカウント側で有効化する。
- `wrangler` でバケット作成しようとした時の `code: 10042` を解消する。

## 今回の状況

`wrangler r2 bucket create` 実行時に、次のエラーで止まった。

- `Please enable R2 through the Cloudflare Dashboard. [code: 10042]`

つまり、設定ファイルや CLI の問題ではなく、**Cloudflare アカウント側で R2 がまだ有効化されていない**。

---

## やること

1. Cloudflare Dashboard を開く
2. `socia_maker` で使っているアカウントを選ぶ
3. 左メニューの `R2` を開く
4. 初回有効化フローを完了する
5. 必要なら利用規約や請求関連の確認を済ませる
6. `R2` 画面が通常表示されることを確認する

---

## 有効化後にやること

有効化が終わったら、次を作る。

- `socia-maker-assets`
- `socia-maker-assets-preview`

その後、`wrangler.toml` の binding と一致しているか確認する。

現在の想定 binding:

- `SOCIA_ASSETS`

現在の想定バケット名:

- production: `socia-maker-assets`
- preview: `socia-maker-assets-preview`

---

## 確認ポイント

- `R2` メニューがアカウント内で開ける
- 新規バケット作成 UI が出る
- 作成後にバケット一覧へ表示される

---

## 有効化後の次アクション

1. production / preview の 2 バケットを作る
2. こちらで `wrangler` から再確認する
3. 画像アップロード API の binding 不足が消えるか確認する

---

## 補足

- 今回の失敗はコード不具合ではない
- `wrangler.toml` 側の `SOCIA_ASSETS` binding はすでに追加済み
- R2 が有効になれば、次はバケット作成とアップロード確認へ進める
