# editor-refactor-plan.md

## 目的
- 追加機能の累積で壊れやすくなった編集まわりを、責務ごとに整理する
- 既存の見た目と操作感をなるべく維持したまま、保存不具合の追跡と修正をしやすくする
- `home` 実画面編集路線を維持しつつ、旧 `editor-panel` 流用部分の依存を減らす

## いま起きている問題
- `entry-editor` がフォームDOMの細部に強く依存していて、項目追加や削除で簡単に壊れる
- `home-edit-workspace` が既存 `editor-panel` を直接マウントしていて、表示責務と編集責務が混ざっている
- `app-editor` が `gacha` 以外の周辺編集責務まで持ち始めている
- `editor-screen` が一覧表示、フォルダ管理、ウィンドウ管理をまとめて抱えている
- 保存後の再描画が `home / editor list / gacha pool` に散っており、どこで止まったか見えにくい

## 現状の責務分布

### 1. フォーム編集本体
- `public/screens/base-char-editor.js`
- `public/screens/entry-editor.js`
- `public/screens/story-editor.js`
- `public/screens/equipment-card-editor.js`
- `public/screens/system-editor.js`

### 2. 一覧 / 管理UI
- `public/screens/editor-screen.js`
- 役割:
  - 登録済み一覧
  - フォルダ管理
  - 旧 editor 窓管理

### 3. ホーム実画面ワークスペース
- `public/screens/home-edit-workspace.js`
- 役割:
  - ホーム上の浮遊ウィンドウ
  - 素材 / 配置 / 属性
  - 既存フォームのマウント先

### 4. オーケストレーション
- `public/app.js`
- `public/lib/app-editor.js`
- 役割:
  - module wiring
  - gacha submit
  - share panel
  - submit label 更新
  - 一部フォーム補助

## 問題の本質
- いまの編集系は「画面」「フォーム」「保存」「再描画」が同じ場所に寄りすぎている
- そのため小さな項目追加でも
  - HTML
  - form submit
  - reset
  - edit begin
  - list refresh
  - window mount
  を同時に触る必要がある

## 分割方針

### A. Form Controller を各編集対象ごとに閉じる
- `base-char`
- `character-card`
- `equipment-card`
- `story`
- `gacha`
- `system`

各 controller の責務:
- form から値を読む
- form へ値を入れる
- reset
- validate
- submit payload を作る

各 controller が持たない責務:
- 一覧描画
- 窓表示
- ホームUI更新

### B. Save Flow を共通化する
- `collect -> save local state -> try remote save -> refresh registered listeners`

理想の共通フロー:
1. payload 作成
2. in-memory state 更新
3. local 保存
4. remote 保存
5. refresh hooks 実行

### C. Refresh Hook を宣言的にする
- 今は保存後に個別関数を順番呼びしている
- これを「character 保存後は何を更新するか」の設定へ寄せる

例:
- `character`
  - `editorCharacterList`
  - `gachaPool`
  - `home`
  - `collection`
- `story`
  - `editorStoryList`
  - `storyScreen`
- `system`
  - `home`
  - `gacha`
  - `story`

### D. Home Edit Workspace は「窓シェル」に絞る
- `home-edit-workspace` の責務は
  - 窓を開く / 閉じる
  - 位置管理
  - panel mount
  - layout builder
 だけにする

持たせない責務:
- 各フォームの保存ロジック
- 各フォームのDOM参照詳細

### E. Editor Screen は「一覧 + フォルダ管理」に縮める
- old editor screen を本体に戻さない
- ただし登録済み一覧の参照画面としては残す

## 実装フェーズ

### Phase 1
- `character-form` の安定化
- `entry-editor` 内の
  - form field access
  - begin edit
  - reset
  - submit
  を関数単位で分離
- 保存後 refresh を 1か所にまとめる

### Phase 2
- `equipment-card-editor` を同じ型へ寄せる
- `story-editor` も同じ型へ寄せる

### Phase 3
- `app-editor.js` からフォーム責務を減らす
- `gacha` 以外の周辺ロジックを適切な module に戻す

### Phase 4
- `editor-screen.js` を
  - window shell
  - list renderer
  - folder manager
  に薄く分ける

### Phase 5
- `home-edit-workspace` の panel mount を registry 化する
- `baseChar / characterCard / equipmentCard / story / gacha / system`
  を定義配列で管理する

## 最初に手を付けるべき箇所
- `public/screens/entry-editor.js`

理由:
- いま実害が出ている
- `character-form` は利用頻度が高い
- ここを直せば他 editor に同じ型を適用しやすい

## Phase 1 の具体作業
1. `entry-editor` に field accessor をまとめる
2. `buildCharacterPayload(form, existing)` を分離する
3. `applyCharacterToForm(char)` を分離する
4. `resetCharacterForm()` を DOM 依存の少ない形にする
5. `refreshAfterCharacterSave()` を新設する
6. `folderId` や `attribute` など optional field を安全参照へ統一する

## 完了条件
- 既存カード編集が安定して保存される
- 新規カード追加が安定して保存される
- 保存後の再描画失敗が切り分けやすい
- 今後の項目追加で `entry-editor` が壊れにくい
