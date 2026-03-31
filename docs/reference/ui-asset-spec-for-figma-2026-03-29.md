# Figma用 UIアセット仕様書

## 目的

この文書は、`socia_maker` の初期 UI アセットセットを定義するものです。

Figma 側の制作指示書として使い、

- 必要な UI パーツを明確にする
- 命名を統一する
- 書き出し単位を揃える
- `team_owned` へ整理しやすくする

ことを目的とします。

## 対象範囲

この版では、まず次の画面で必要になる最小アセットを対象にします。

- `home`
- `formation`
- `battle`
- `gacha`

前提:

- 最初は画像ベースで配置する
- project 共通 UI は `team_owned` に入れる
- 細かなテキスト差し替えより、まず見た目の統合を優先する

## 基本ルール

- 1アセット1役割を基本にする
- まずは置いてすぐ使える完成パーツを優先する
- 初期段階では細かく分割しすぎない
- ファイル名は小文字 ASCII のみを使う
- 空白は使わない
- `final`, `new`, `latest` のような曖昧語は使わない

## 命名規則

次の形式を使います。

```text
{screen}_{category}_{purpose}_{variant}
```

### screen

- `home`
- `formation`
- `battle`
- `gacha`
- `common`

### category

- `btn`
- `banner`
- `frame`
- `panel`
- `icon`
- `badge`
- `slot`
- `deco`

### purpose

例:

- `gacha`
- `story`
- `collection`
- `event`
- `notice`
- `dialog`
- `leader`
- `subleader`
- `test`
- `single`
- `ten`

### variant

例:

- `primary`
- `secondary`
- `basic`
- `main`
- `sub`
- `gold`
- `blue`
- `dark`

## 命名例

- `home_btn_gacha_primary`
- `home_btn_story_primary`
- `home_btn_collection_primary`
- `home_banner_event_main`
- `home_banner_notice_sub`
- `home_frame_dialog_basic`
- `home_icon_notice_basic`
- `formation_slot_leader_basic`
- `formation_badge_link_active`
- `battle_btn_test_primary`
- `gacha_btn_ten_primary`

## 書き出しルール

- アイコンは `SVG` を優先する
- ボタン / バナー / 枠は `PNG` でよい
- 装飾が複雑なものは `PNG`
- 書き出した素材はアプリ側で最終的に `WebP` 正規化される前提

## 推奨サイズ

これは制作・書き出し時の目安であり、実行時の厳密な固定値ではありません。

現在のホーム編集や画面配置で扱いやすいサイズを基準にしています。

### ボタン

- 小ボタン: `160 x 56`
- 中ボタン: `220 x 72`
- 大ボタン: `320 x 88`
- 横長 CTA ボタン: `420 x 96`

### ホームバナー

- メインバナー: `960 x 240`
- サブバナー: `640 x 180`
- 小お知らせバナー: `420 x 120`

### 枠・パネル

- ダイアログ枠: `840 x 220`
- 汎用パネル: `640 x 360`
- 小情報枠: `320 x 160`
- キャラ名プレート: `300 x 72`
- 細帯ラベル: `360 x 48`

### アイコン

- 標準アイコン: `64 x 64`
- 小さめアイコン: `48 x 48`
- 大きめアイコン: `96 x 96`

### 編成 / 戦闘

- 編成メンバースロット: `220 x 300`
- リーダーバッジ領域: `96 x 40`
- サブリーダーバッジ領域: `120 x 40`
- 戦闘スキルボタン土台: `180 x 72`
- 戦闘必殺技ボタン土台: `240 x 84`

### ガチャ

- 1回引きボタン: `220 x 72`
- 10回引きボタン: `320 x 84`
- PICK UP バッジ: `144 x 56`
- NEW バッジ: `120 x 48`
- 結果カード枠: `320 x 440`

## 優先アセット一覧

## Phase 1: 最優先

- `home_btn_gacha_primary`
- `home_btn_story_primary`
- `home_btn_collection_primary`
- `home_banner_event_main`
- `home_banner_notice_sub`
- `home_frame_panel_basic`
- `home_frame_dialog_basic`
- `home_icon_notice_basic`
- `home_icon_setting_basic`
- `battle_btn_test_primary`
- `formation_slot_member_basic`
- `formation_badge_leader_basic`
- `formation_badge_subleader_basic`
- `gacha_btn_single_primary`
- `gacha_btn_ten_primary`

## Phase 2: 強く推奨

- `home_btn_editor_primary`
- `home_btn_homeconfig_secondary`
- `home_banner_pickup_main`
- `home_frame_nameplate_basic`
- `home_frame_speech_basic`
- `formation_badge_link_active`
- `formation_badge_title_ready`
- `battle_btn_auto_basic`
- `battle_btn_semiauto_basic`
- `battle_btn_skill_basic`
- `battle_btn_special_basic`
- `gacha_badge_pickup_gold`
- `gacha_badge_new_basic`

## Phase 3: 装飾拡張

- `home_deco_star_gold`
- `home_deco_light_soft`
- `home_deco_corner_frame_gold`
- `home_deco_line_glow`
- `common_panel_header_dark`
- `common_panel_header_light`

## 画面別アセット一覧

## Home

### ボタン

- `home_btn_gacha_primary`
- `home_btn_story_primary`
- `home_btn_collection_primary`
- `home_btn_editor_primary`
- `home_btn_homeconfig_secondary`
- `home_btn_generic_small_basic`
- `home_btn_generic_medium_basic`
- `home_btn_generic_large_basic`

### バナー

- `home_banner_event_main`
- `home_banner_notice_sub`
- `home_banner_pickup_main`
- `home_banner_campaign_sub`
- `home_banner_carousel_frame_basic`
- `home_banner_indicator_dot_basic`
- `home_banner_arrow_prev_basic`
- `home_banner_arrow_next_basic`

### 枠・パネル

- `home_frame_panel_basic`
- `home_frame_dialog_basic`
- `home_frame_speech_basic`
- `home_frame_nameplate_basic`
- `home_frame_info_basic`
- `home_frame_status_basic`
- `home_panel_header_basic`
- `home_panel_label_basic`

### アイコン・装飾

- `home_icon_notice_basic`
- `home_icon_setting_basic`
- `home_icon_share_basic`
- `home_icon_lock_basic`
- `home_deco_star_gold`
- `home_deco_light_soft`
- `home_deco_corner_frame_gold`

## Formation

- `formation_slot_member_basic`
- `formation_slot_leader_basic`
- `formation_slot_subleader_basic`
- `formation_slot_empty_basic`
- `formation_btn_confirm_primary`
- `formation_btn_sort_basic`
- `formation_badge_leader_basic`
- `formation_badge_subleader_basic`
- `formation_badge_link_active`
- `formation_badge_title_ready`

## Battle

- `battle_btn_test_primary`
- `battle_btn_auto_basic`
- `battle_btn_semiauto_basic`
- `battle_btn_skill_basic`
- `battle_btn_special_basic`
- `battle_badge_leader_basic`
- `battle_badge_subleader_basic`
- `battle_frame_skillname_basic`
- `battle_frame_specialname_basic`

## Gacha

- `gacha_btn_single_primary`
- `gacha_btn_ten_primary`
- `gacha_btn_rates_secondary`
- `gacha_banner_pickup_main`
- `gacha_frame_result_card_basic`
- `gacha_badge_pickup_gold`
- `gacha_badge_new_basic`

## Figma ページ構成

推奨ページ / セクション構成:

- `00_guideline`
- `10_home_buttons`
- `20_home_banners`
- `30_frames_panels`
- `40_icons_badges`
- `50_formation_battle`
- `60_gacha`
- `90_export`

## Figma への引き渡しメモ

- この仕様書のファイル名をそのまま export 名に使う
- 1フレーム / 1コンポーネントにつき 1書き出し対象を基本にする
- `team_owned` 用に使うものは、共通UI素材として完成させる
- 文言変更が多そうなものは、フレーム名やコメントにその旨を残す
- 文言変更が少ないものは、Phase 1 では文字焼き込みでもよい

## 最初の納品推奨セット

もし最初の1回でまとめて渡すなら、まずこのセットを作る:

- `home_btn_gacha_primary`
- `home_btn_story_primary`
- `home_btn_collection_primary`
- `home_banner_event_main`
- `home_frame_panel_basic`
- `home_frame_dialog_basic`
- `formation_slot_member_basic`
- `formation_badge_leader_basic`
- `formation_badge_subleader_basic`
- `battle_btn_test_primary`
- `gacha_btn_single_primary`
- `gacha_btn_ten_primary`

このセットがあれば、まず次の画面で共有UIアセットの導入を始められます。

- home
- formation
- test battle
- gacha

## アプリへの取り込み手順

書き出し後の想定フロー:

1. export from Figma
2. upload into `team_owned`
3. place in home or related screen editor flow
4. 必要に応じて role を付ける:
   - `decorative`
   - `button`
   - `banner`
   - later detailed roles in advanced editing

## 現在の版

- spec version: `v0.1`
- date: `2026-03-29`
> Priority Band: Context / Secondary
