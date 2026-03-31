# Runtime Structure And Refactor Note

> Priority Band: Strongly Active

Date: 2026-03-30

## Purpose

この文書は、現時点の `socia_maker` の frontend runtime 構成と、
そこから見えるコード上の問題を整理し、
次のまとまったリファクタリングで何を優先して片付けるかを固定するための作業メモである。

特に今回の `title screen` が表示されない問題は、
単体不具合というより、

- 起動フロー
- screen navigation
- shared config merge
- editor save path
- legacy / current editor line の同居

が絡み合っている結果として扱う。

---

## Current Runtime Snapshot

現行 runtime の中心は以下。

- entry HTML: `public/index.html`
- bootstrap: `public/app.js`
- legacy reference: `public/app.legacy.js`
- shared state/data: `public/lib/app-state.js`, `public/lib/app-data.js`
- runtime/navigation: `public/lib/app-runtime.js`
- global re-render entry: `public/lib/app-ui.js`
- global CSS: `public/styles.css`

実行時に `index.html` から多数の script が一括読み込みされている。

主な傾向:

- `lib/` は runtime, data, battle, layout, auth, editor helper が同列で読み込まれる
- `screens/` は play screen と editor screen が同列で読み込まれる
- editor では `legacy`, `v1`, `current` の系統が同時に載っている
- `app.js` が bootstrap でありながら startup policy と screen behavior も多く抱えている

---

## Current File Structure View

### 1. Entry / Bootstrap Layer

- `public/index.html`
- `public/app.js`
- `public/app.legacy.js`
- `public/styles.css`

現状の問題:

- `index.html` が active runtime の入口である一方、読み込み対象が多すぎる
- `app.js` が thin bootstrap ではなく、state wiring と startup screen 制御を持っている
- `app.legacy.js` が参照用で残っているが、現行線との境界がコード上では弱い
- `styles.css` が単一巨大ファイルのままで、startup / play / editor の責務が混在している

### 2. Shared Lib Layer

主なファイル:

- `public/lib/app-data.js`
- `public/lib/app-runtime.js`
- `public/lib/app-ui.js`
- `public/lib/app-home.js`
- `public/lib/app-editor.js`
- `public/lib/content-state.js`
- `public/lib/editor-runtime.js`

現状の問題:

- `app-data.js` に bootstrap, remote load, local merge, migration 的な責務が集まりやすい
- `app-runtime.js` が navigation と DOM side effect を持つ
- `app-ui.js` が全体 re-render のハブになっており、どの screen が何で再描画されるか追いにくい
- `content-state.js` / `editor-runtime.js` / `app-editor.js` の境界がまだ固まりきっていない

### 3. Play Screen Layer

主なファイル:

- `public/screens/home-screen.js`
- `public/screens/gacha-screen.js`
- `public/screens/story-screen.js`
- `public/screens/collection-screen.js`
- `public/screens/event-screen.js`
- `public/screens/formation-screen.js`
- `public/screens/battle-screen.js`

現状の問題:

- play screen 自体は比較的分かれているが、起動・遷移の責務は screen 外にある
- home だけ編集系 overlay / workspace との結合が強い

### 4. Home Workspace / Overlay Layer

主なファイル:

- `public/screens/home-layout-overlay.js`
- `public/screens/home-edit-workspace.js`
- `public/screens/home-workspace-windows.js`
- `public/screens/home-workspace-assets.js`
- `public/screens/home-workspace-parts.js`
- `public/screens/home-config.js`

現状の問題:

- home 本体と編集 workspace の責務分離は途中段階
- overlay bridge と workspace shell の境界が曖昧
- legacy stable line と新 path が完全には切れていない

### 5. Editor Layer

主なファイル:

- `public/editor/editor-v1-host-app.js`
- `public/editor/editor-app.js`
- `public/editor/editor-dashboard.js`
- `public/editor/editor-dashboard-config.js`
- `public/editor/shared/*`
- `public/editor/sections/*`
- `public/screens/editor-screen.js`
- `public/screens/editor-dashboard-screen.js`
- `public/screens/editor-project-sections.js`
- `public/screens/editor-base-char-host.js`
- `public/screens/editor-character-host.js`
- `public/screens/editor-story-host.js`
- `public/screens/editor-gacha-host.js`
- `public/screens/editor-system-host.js`
- `public/screens/editor-section-host-registry.js`
- `public/screens/editor-member-screen.js`
- `public/screens/editor-share-screen.js`
- `public/screens/editor-legacy-host.js`
- `public/screens/editor-v1-host.js`
- `public/screens/editor-screen-v1.js`

現状の問題:

- active editor v1 の本線は `public/editor/` 側へ移動済み
- `public/screens/editor-v1-host.js` は互換 adapter として残っている
- `public/screens/editor-dashboard-screen.js` と `public/screens/editor-dashboard-config.js` も互換 adapter として残っている
- system editor の本線も `public/editor/sections/system/system-editor-app.js` 側へ移し、
  `public/screens/system-editor.js` は互換 adapter として残す方針に切り替えた
- system form の本線も `public/editor/sections/system/system-editor-form-app.js` 側へ移し、
  `public/screens/system-editor-form.js` は互換 adapter として残す
- title / battle も `public/editor/sections/system/` 側へ移し、
  `public/screens/system-editor-title.js` と `public/screens/system-editor-battle.js` は互換 adapter として残す
- announcement editor の本線も `public/editor/sections/notices/announcement-editor-app.js` 側へ移し、
  `public/screens/announcement-editor.js` は互換 adapter として残す
- `app.js` に残っていた announcement editor の組み立ても
  `public/editor/sections/notices/announcement-editor-runtime.js` 側へ寄せた
- `app.js` に残っていた profile local update / title sync の責務も
  `public/lib/profile-runtime.js` 側へ寄せ始めた
- `title editor` の setup も `public/editor/sections/system/title-editor-runtime.js` 側へ寄せた
- `app-auth.js` の profile save / active title 更新は
  `public/lib/profile-actions.js` を通す形に整理した
- `music editor` の setup も `public/editor/sections/music/music-editor-runtime.js` 側へ寄せた
- `story editor` の setup も `public/editor/sections/story/story-editor-runtime.js` 側へ寄せた
- `system save` の共有保存 callback は `public/lib/system-save-runtime.js` に切り出した
- `entry editor` の setup も `public/editor/sections/card/entry-editor-runtime.js` 側へ寄せた
- `equipment card editor` の setup も `public/editor/sections/card/equipment-card-editor-runtime.js` 側へ寄せた
- `base char editor` の setup も `public/editor/sections/base-char/base-char-editor-runtime.js` 側へ寄せた
- `project members` の API 呼び出しは `public/lib/project-members-runtime.js` へ切り出し、
  `public/lib/app-editor.js` は thin wrapper に寄せた
- `auth session` の restore / login-register submit / logout は
  `public/lib/auth-session-runtime.js` 側へ寄せ始め、
  `public/lib/app-auth.js` は UI 管理中心に寄せた
- `collection screen` の setup も `public/screens/collection-screen-runtime.js` 側へ寄せた
- `formation screen` の setup も `public/screens/formation-screen-runtime.js` 側へ寄せた
- `gacha screen` の setup も `public/screens/gacha-screen-runtime.js` 側へ寄せた
- `story screen` の setup も `public/screens/story-screen-runtime.js` 側へ寄せた
- `event screen` の setup も `public/screens/event-screen-runtime.js` 側へ寄せた
- `system editor` の setup 依存束も `public/editor/sections/system/system-editor-runtime.js` 側へ寄せた
- `auth panel` の DOM 生成は `public/lib/auth-panel-ui.js` 側へ寄せ始め、
  `public/lib/app-auth.js` は session / state / UI sync 中心に寄せた
- release scope freeze に合わせて event editor は active runtime から外し、
  `public/screens/system-editor-event.js` は recovery reference として disk に残す
- active editor line が 1 本に固定されていない
- `legacy`, `v1`, `current` の役割がコードから読み取りにくい
- `index.html` 側で複数系統を同時に読み込んでいる
- 編集 UI の設計変更が入るたびに、どこまでが現在の本線なのか曖昧になりやすい

### 6. Feature Editors

主なファイル:

- `public/screens/system-editor.js`
- `public/screens/system-editor-title.js`
- `public/screens/system-editor-battle.js`
- `public/screens/system-editor-form.js`
- `public/screens/system-editor-event.js`
- `public/editor/sections/system/system-editor-app.js`
- `public/editor/sections/system/system-editor-title-app.js`
- `public/editor/sections/system/system-editor-battle-app.js`
- `public/editor/sections/system/system-editor-form-app.js`
- `public/screens/system-editor-preview.js`
- `public/screens/system-editor-assets.js`
- `public/screens/entry-editor.js`
- `public/screens/base-char-editor.js`
- `public/screens/story-editor.js`
- `public/screens/equipment-card-editor.js`

現状の問題:

- `system-editor.js` の責務が特に大きい
- form, preview, asset handling, save payload, live preview が集まりやすい
- 一部機能追加時に、system editor が startup/config 全体の受け皿になりやすい

---

## Title Screen Issue As A Symptom

今回の `title screen` 不具合は、以下の複合問題の表れとして見るべき。

### 1. Startup policy が 1 箇所に閉じていない

関連箇所:

- `public/app.js`
- `public/lib/app-runtime.js`
- `public/lib/app-ui.js`

具体例:

- 初期 screen の決定が `app.js` 側にある
- 実際の screen 切替と body class 付与は `app-runtime.js` 側にある
- `renderAll()` のタイミングで title render が再度走る

結果:

- `title` を出したい意図があっても、別の render/navigate 経路で `home` に戻る余地が残る

### 2. `systemConfig` が startup UI まで抱え始めている

関連箇所:

- `public/lib/app-state.js`
- `public/lib/app-data.js`
- `public/screens/system-editor.js`

具体例:

- default 値
- remote/local merge
- migration fallback
- editor submit payload

のすべてが別箇所にある。

結果:

- title screen の表示有無を追うのに、保存・読込・初期化・描画を全部追う必要がある

### 3. editor 側の変更が runtime 起動系に直接影響する

今回の title screen は system editor から設定するため、

- startup feature
- global shared config
- system form UI

が直結した。

この構造では、今後も `home`, `event`, `publish`, `cafe` のような機能が
`systemConfig` と `system-editor.js` に流れ込みやすい。

---

## Concrete Code Risks

### Risk 1. `index.html` が script を一括ロードしすぎている

現状、`public/index.html` では `lib/*`, `screens/*`, editor host, legacy host, v1 host をすべて一括ロードしている。

これにより:

- 読み込み順に依存しやすい
- active ではないコードも runtime 上に存在する
- `window.*` の衝突や誤参照が起きやすい

### Risk 2. `app.js` が bootstrap 以上の責務を持っている

現状の `public/app.js` には少なくとも以下が混在している。

- app startup
- state wiring
- current screen の決定
- title screen rendering
- title screen の click binding
- UI API bridge

これでは bootstrap を薄くする方針に逆行しやすい。

### Risk 3. `app-data.js` が data layer 兼 migration layer 兼 fallback layer になっている

`systemConfig` や player bootstrap の統合点として便利だが、
責務が増えるほど「どこで値が最終決定されているか」が見えにくくなる。

特に local cache と server data と default の優先順位が増えると、再現しにくい不具合が増える。

### Risk 4. `system-editor.js` が何でも入る箱になりやすい

今回の title screen 追加でも、

- file input
- preview
- clear button
- config mapping
- submit payload

が `system-editor.js` に増えた。

このパターンを続けると、
今後の `cafe`, `event`, `publish`, `title`, `layout`, `asset` も同じファイルに蓄積する。

### Risk 5. editor 系の active line が不明瞭

`editor-screen.js` 系と `editor-v1-host.js` 系と `editor-legacy-host.js` 系が残っているため、
修正箇所の判断ミスが起きやすい。

これは不具合より先に、開発速度を落とす。

### Risk 6. CSS が startup/play/editor を横断して肥大化している

`public/styles.css` は現状の安定線ではあるが、

- title screen
- home
- editor dashboard
- floating window
- system preview

が同居しているため、見た目修正が局所で閉じにくい。

---

## Refactor Policy

次のリファクタでは、機能追加よりも「本線を 1 本にする」ことを優先する。

### Policy 1. Active runtime path を 1 本に固定する

やること:

- `index.html` で読み込む active script 群を再定義する
- `legacy`, `v1`, `current` のうち、今動かす本線を明文化する
- 非本線は参照用として残しても、runtime 読み込みからは外す

### Policy 2. `app.js` を startup orchestrator に縮める

`app.js` が持つ責務は以下までに制限する。

- dependency wiring
- init order
- active mode / active screen の初期決定
- module bind 呼び出し

以下は外へ逃がす。

- title screen render
- title screen interaction
- per-screen startup rule
- config migration detail

### Policy 3. Startup flow を独立モジュール化する

最低でも以下を独立させる。

- startup screen policy
- title screen UI module
- first navigation decision

形としては、

- `public/lib/app-startup.js`
- または `public/screens/title-screen.js`

のような分離が妥当。

### Policy 4. `systemConfig` を肥大化する箱にしない

`systemConfig` に入れてよいものを制限する。

入れてよい:

- project 共通 UI 設定
- rarity mode
- folder 定義
- title screen の最小設定

入れない方がよい:

- event の巨大設定
- cafe の行動ロジック
- player progression 的な状態
- editor runtime 専用情報

### Policy 5. `system-editor.js` は orchestrator に戻す

`system-editor.js` 自体に機能を足し続けない。

最低でも以下へ分割する。

- basic settings section
- title screen section
- asset handling helper
- preview renderer
- payload builder / submit helper

### Policy 6. Home 編集線と Play Home を分けて考える

`home-screen.js` は play 本体、
workspace / overlay は edit 補助として明確に切る。

この分離を保てない限り、
home 周りの不具合は screen 単体でなく runtime 不具合に化けやすい。

### Policy 7. 新機能は legacy runtime に直挿ししない

今後の `cafe`, `title`, `event`, `publish summary` などは、
既存の巨大ファイルへ即時追加する前に、

- どの層に属するか
- shared か player か
- startup か play か editor か

を決めてから置く。

---

## Recommended Refactor Order

### Phase 1. Runtime Line Fix

対象:

- `public/index.html`
- `public/app.js`
- `public/app.legacy.js`
- `public/lib/app-runtime.js`
- `public/lib/app-ui.js`

目的:

- startup と navigation の責務を明確化
- active runtime の読み込みを最小化

### Phase 2. Editor Line Fix

対象:

- `public/screens/editor-screen.js`
- `public/screens/editor-dashboard-screen.js`
- `public/screens/editor-*-host.js`
- `public/screens/editor-screen-v1.js`
- `public/screens/editor-v1-host.js`
- `public/screens/editor-legacy-host.js`

目的:

- active editor line を 1 本に固定
- 退役線を runtime から外す

### Phase 3. System Editor Split

対象:

- `public/screens/system-editor.js`
- `public/screens/system-editor-preview.js`
- `public/screens/system-editor-assets.js`

目的:

- section 単位の責務分離
- startup 関連設定の追跡容易化

### Phase 4. Data Layer Split

対象:

- `public/lib/app-data.js`
- `public/lib/app-state.js`
- `public/lib/player-state.js`

目的:

- default / local cache / remote data / migration を整理
- source of truth の線を明確化

### Phase 5. CSS Boundary Fix

対象:

- `public/styles.css`

目的:

- startup
- play
- editor
- system preview

の責務単位で整理する。

現時点では runtime 安定を優先し、
CSS 分割そのものより「編集対象の境界ラベル付け」を先にやるのが安全。

---

## Immediate Working Rules

リファクタ実施までの暫定ルール:

1. `app.js` へ新しい純粋 helper を増やさない
2. `system-editor.js` に大型機能を追加しない
3. `index.html` の script 追加は最小限にする
4. `legacy`, `v1`, `current` のどれを触るかを作業前に明示する
5. startup feature は screen 切替と config merge を同時にいじる前提で確認する

---

## Decision

現時点の結論は以下。

- `title screen` 不具合は単発修正より runtime 整理の題材として扱う
- 次のまとまった作業では startup/runtime/editor の本線整理を最優先にする
- 新機能追加は、active line を 1 本に固定した後に再開する

この方針で、まずは「どれが本番線か分からない状態」を解消する。
