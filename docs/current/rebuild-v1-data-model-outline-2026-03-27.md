# Rebuild V1 Data Model Outline

Date: 2026-03-27

## Purpose

`socia_maker` 作り直し版 V1 のためのデータモデルたたき台。

主眼:
- shared content と player progression を分離する
- publish/share/billing を独立した責務として持つ
- local storage を source of truth にしない

---

## Domain Groups

V1 のデータは大きく 5 群に分かれる。

1. project / membership
2. shared content
3. player progression
4. publish / share
5. billing / entitlements

---

## 1. Project / Membership

### projects

持つもの:
- `id`
- `name`
- `owner_user_id`
- `created_at`
- `updated_at`

役割:
- shared content の container
- publish/share の単位

### project_members

持つもの:
- `id`
- `project_id`
- `user_id`
- `role`
- `status`
- `created_at`
- `updated_at`

想定 role:
- `owner`
- `editor`
- `viewer`

想定 status:
- `active`
- `invited`
- `disabled`

---

## 2. Shared Content

shared content は全て `project_id` を持つ。

### base_characters

持つもの:
- `id`
- `project_id`
- `name`
- `profile_json`
- `birthday_json`
- `expressions_json`
- `variants_json`
- `voice_lines_json`
- `home_voice_lines_json`
- `home_relations_json`
- `created_at`
- `updated_at`

### cards

持つもの:
- `id`
- `project_id`
- `base_character_id`
- `folder_id`
- `name`
- `rarity`
- `attribute`
- `image_src`
- `catch_text`
- `voice_lines_json`
- `home_voice_lines_json`
- `home_relations_json`
- `created_at`
- `updated_at`

### stories

持つもの:
- `id`
- `project_id`
- `folder_id`
- `type`
- `entry_card_id`
- `title`
- `sort_order`
- `bgm`
- `variant_defaults_json`
- `scenes_json`
- `created_at`
- `updated_at`

### gachas

持つもの:
- `id`
- `project_id`
- `title`
- `description`
- `banner_image`
- `gacha_type`
- `featured_ids_json`
- `rates_json`
- `created_at`
- `updated_at`

### system_configs

持つもの:
- `id`
- `project_id`
- `rarity_mode`
- `orientation`
- `card_folders_json`
- `story_folders_json`
- `ui_config_json`
- `created_at`
- `updated_at`

注意:
- `system_config` に何でも積まない
- event は別 resource に寄せる

### content_folders

V1 で統一するなら独立 table 化も可能。

持つもの:
- `id`
- `project_id`
- `content_type`
- `name`
- `sort_order`
- `created_at`
- `updated_at`

---

## 3. Player Progression

player progression は全て `project_id + user_id` の組で意味を持つ。

### player_profiles

持つもの:
- `id`
- `project_id`
- `user_id`
- `display_name`
- `last_active_at`
- `created_at`
- `updated_at`

### player_currency_balances

持つもの:
- `id`
- `player_profile_id`
- `currency_key`
- `amount`
- `max_amount`
- `updated_at`

### player_inventories

持つもの:
- `id`
- `player_profile_id`
- `card_id`
- `quantity`
- `first_acquired_at`
- `last_acquired_at`
- `created_at`
- `updated_at`

### player_equipment_inventories`

必要なら V1 で追加。

持つもの:
- `id`
- `player_profile_id`
- `equipment_id`
- `quantity`
- `created_at`
- `updated_at`

### gacha_pull_history

持つもの:
- `id`
- `player_profile_id`
- `gacha_id`
- `pull_group_id`
- `card_id`
- `rarity_at_pull`
- `created_at`

### story_progress

持つもの:
- `id`
- `player_profile_id`
- `story_id`
- `status`
- `last_scene_index`
- `read_at`
- `unlocked_at`
- `created_at`
- `updated_at`

### player_home_preferences

持つもの:
- `id`
- `player_profile_id`
- `mode`
- `card_1_id`
- `card_2_id`
- `scale_1`
- `x_1`
- `y_1`
- `scale_2`
- `x_2`
- `y_2`
- `front`
- `updated_at`

### player_event_progress

event を V1 に含める場合の親レコード。

持つもの:
- `id`
- `player_profile_id`
- `event_id`
- `created_at`
- `updated_at`

### player_event_login_bonus_progress

持つもの:
- `id`
- `player_event_progress_id`
- `claimed_days`
- `last_claimed_on`
- `updated_at`

### player_event_exchange_progress

持つもの:
- `id`
- `player_event_progress_id`
- `exchange_item_id`
- `purchased_count`
- `updated_at`

### player_event_item_balances

持つもの:
- `id`
- `player_event_progress_id`
- `item_key`
- `amount`
- `updated_at`

---

## 4. Publish / Share

### project_publish_states

持つもの:
- `id`
- `project_id`
- `publish_enabled`
- `published_at`
- `updated_at`

### collab_invites

持つもの:
- `id`
- `project_id`
- `token_hash`
- `created_by_user_id`
- `status`
- `created_at`
- `rotated_at`
- `expires_at`

用途:
- collaborative invite 専用

### public_play_links

持つもの:
- `id`
- `project_id`
- `token_hash`
- `created_by_user_id`
- `status`
- `created_at`
- `rotated_at`
- `expires_at`

用途:
- public play 専用

---

## 5. Billing / Entitlements

### user_license_profiles

持つもの:
- `user_id`
- `base_tier`
- `granted_at`
- `updated_at`

### user_owned_packs

持つもの:
- `id`
- `user_id`
- `pack_id`
- `granted_at`
- `granted_by_user_id`
- `created_at`

### billing_audit_logs

持つもの:
- `id`
- `target_user_id`
- `action`
- `payload_json`
- `performed_by_admin_id`
- `created_at`

---

## Relationship Summary

### Project Side

- `projects 1 - n project_members`
- `projects 1 - n base_characters`
- `projects 1 - n cards`
- `projects 1 - n stories`
- `projects 1 - n gachas`
- `projects 1 - 1 system_configs`
- `projects 1 - 1 project_publish_states`
- `projects 1 - n collab_invites`
- `projects 1 - n public_play_links`

### Player Side

- `player_profiles 1 - n player_currency_balances`
- `player_profiles 1 - n player_inventories`
- `player_profiles 1 - n gacha_pull_history`
- `player_profiles 1 - n story_progress`
- `player_profiles 1 - 1 player_home_preferences`
- `player_profiles 1 - n player_event_progress`

### Billing Side

- `user_license_profiles 1 - n user_owned_packs`

---

## Source Of Truth Rule

server を source of truth とするもの:
- shared content
- player progression
- publish state
- share state
- billing state

client local storage に許すもの:
- cache
- unsaved draft
- UI state

禁止:
- progression の正式保存
- 権限判定の正式保存

---

## Recommended V1 Constraints

1. `room/global` スコープは廃止
2. event は入れるなら独立 table 群で持つ
3. `system_config` に progression を入れない
4. share token と publish state を同一レコードで持たない
5. entitlement と project publish state を混ぜない
