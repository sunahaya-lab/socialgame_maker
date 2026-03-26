# Socia Maker V2 D1 Schema Draft

## Purpose

This document defines the first practical D1 schema for Socia Maker v2.

The goal is not maximum normalization. The goal is:

- stable project ownership
- project-scoped content records
- enough structure for collaboration and publishing
- a realistic migration path from the current KV-backed prototype

## Design Principles

1. Canonical data lives in `D1`
- relational records and permissions belong here

2. Assets do not live in row payloads
- store file metadata in `D1`
- store actual files in `R2`

3. Published views are derived data
- public snapshots should be built from D1 and cached in KV

4. Prefer a mixed model
- use first-class columns for query-critical fields
- use JSON columns only for flexible edge data

## Entity Overview

### Ownership Layer

- `users`
- `projects`
- `project_members`
- `publish_states`

### Content Layer

- `assets`
- `base_characters`
- `base_character_expressions`
- `base_character_variants`
- `base_character_voice_lines`
- `base_character_home_voice_lines`
- `base_character_home_opinions`
- `base_character_home_conversations`
- `base_character_home_birthdays`
- `cards`
- `card_voice_lines`
- `card_home_voice_lines`
- `card_home_opinions`
- `card_home_conversations`
- `card_home_birthdays`
- `stories`
- `story_variant_defaults`
- `story_scenes`
- `gachas`
- `gacha_featured_cards`
- `gacha_rates`
- `system_configs`

### Player State Layer

- `player_profiles`
- `player_inventories`
- `gacha_pull_history`
- `story_progress`
- `player_home_preferences`
- `player_currency_balances`

## Table Notes

### users

Source of truth for authenticated editor identities.

Key fields:

- `id`
- `auth_subject`
- `email`
- `display_name`

### projects

Top-level unit for all authored content.

Key fields:

- `id`
- `owner_user_id`
- `name`
- `slug`
- `description`
- `visibility`

### project_members

Controls collaboration.

Roles:

- `owner`
- `editor`
- `viewer`

### publish_states

Separates publishing state from editing state.

Key fields:

- `project_id`
- `is_published`
- `public_slug`
- `published_snapshot_version`
- `last_published_at`

### assets

Metadata only. Binary content lives in R2.

Key fields:

- `id`
- `project_id`
- `kind`
- `r2_key`
- `mime_type`

Suggested `kind` values:

- `base-character-portrait`
- `base-character-expression`
- `base-character-variant`
- `card-image`
- `story-background`
- `story-bgm`
- `gacha-banner`

### base_characters

Core character identity per project.

Flexible data should stay small. Put query-critical values in columns.

### base_character_* sub tables

These tables exist because home dialogue and voice data are core behavior, not optional metadata. Splitting them helps:

- partial updates
- future filtering
- smaller row payloads

### cards

A card optionally references a base character.

`base_character_id` is nullable to keep prototype flexibility, though product direction should prefer linked cards.

### stories and story_scenes

Story and scene are separated because scenes are ordered child records and will likely grow.

### gachas, gacha_featured_cards, gacha_rates

Rates and featured lists should be queryable and editable without rewriting a single large JSON blob.

### system_configs

One row per project. Small and stable.

### player_profiles

One row per `(project_id, user_id)` viewer/player identity.

This row is the anchor for all personal progress in a project.

Suggested fields:

- `id`
- `project_id`
- `user_id`
- `display_name`
- `last_active_at`

### player_inventories

Tracks which cards a player owns in one project.

Suggested fields:

- `id`
- `player_profile_id`
- `card_id`
- `quantity`
- `first_acquired_at`
- `last_acquired_at`

### gacha_pull_history

Append-only history of pull results.

Suggested fields:

- `id`
- `player_profile_id`
- `gacha_id`
- `pull_group_id`
- `card_id`
- `rarity_at_pull`
- `created_at`

`pull_group_id` lets one ten-pull be reconstructed as one batch.

### story_progress

Tracks unlock/read state per story for one player.

Suggested fields:

- `id`
- `player_profile_id`
- `story_id`
- `status`
- `last_scene_index`
- `read_at`
- `unlocked_at`

Suggested `status` values:

- `locked`
- `unlocked`
- `in_progress`
- `completed`

### player_home_preferences

Stores personal home layout separate from authored defaults.

Suggested fields:

- `player_profile_id`
- `card_1_id`
- `card_2_id`
- `mode`
- `layout_json`
- `updated_at`

### player_currency_balances

Stores currencies, tickets, pity counters, or similar gacha state.

Suggested fields:

- `id`
- `player_profile_id`
- `currency_key`
- `balance`
- `updated_at`

## Current Recommended SQL

The matching initial migration lives in:

- [`migrations/0001_v2_initial.sql`](../migrations/0001_v2_initial.sql)
- [`migrations/0006_player_state_initial.sql`](../migrations/0006_player_state_initial.sql)

This migration should be treated as the first serious draft, not final law.

## Transitional Bridge

Before full v2 ownership is implemented, the current prototype can move selected collections to D1 through:

- [`migrations/0000_project_registries.sql`](../migrations/0000_project_registries.sql)
- [`migrations/0001_base_character_registries.sql`](../migrations/0001_base_character_registries.sql)
- [`migrations/0002_entry_registries.sql`](../migrations/0002_entry_registries.sql)
- [`migrations/0003_story_registries.sql`](../migrations/0003_story_registries.sql)
- [`migrations/0004_gacha_registries.sql`](../migrations/0004_gacha_registries.sql)
- [`migrations/0005_system_config_registries.sql`](../migrations/0005_system_config_registries.sql)

These tables are intentionally transitional. They keep today's `project/room/global -> collection[]` behavior while the app still lacks real authenticated users, canonical `projects.owner_user_id`, and normalized child rows for voice lines or variants.

## Query Patterns To Support

### Editor bootstrap

For one project:

- project metadata
- system config
- base characters and subrecords
- cards and subrecords
- stories and scenes
- gachas and rates

### Player bootstrap

For one `(project, user)`:

- player profile
- owned cards
- recent gacha history
- story progress
- personal home preferences
- currencies and pity state

### Project list

For one user:

- projects they own
- projects they are a member of

### Publish build

For one project:

- all content entities
- only current published configuration

### Public read

Should not query D1 directly on every request once publishing exists. Prefer:

- publish build from D1
- snapshot read from KV

### Player actions

Should write to player-state tables only and must not modify shared authored rows:

- gacha pull
- story read progress
- personal home changes
- currency consumption

## Migration Guidance From Current Prototype

### Prototype Shape

Current content is effectively:

- one global collection per content type
- optional room scoping
- images embedded inline

### Migration Rules

1. Create a default project per imported dataset
2. Convert every content record to project-scoped rows
3. Move embedded images to R2 where practical
4. Preserve original ids when possible
5. Treat local browser cache only as a temporary import source, never canonical

Player-state migration rule:

- do not infer personal progress from authored content
- start player tables empty unless explicit user progress data exists

## Open Decisions

### Strong candidates to revisit before production

- whether `viewer` membership is needed before public publish exists
- whether voice line tables should be unified into a generic table
- whether `cards.lines` deserves its own child table
- whether story BGM assets should be versioned separately
- whether `player_profiles` should exist for public anonymous users or only authenticated users
- whether gacha pity belongs in `player_currency_balances` or its own table

## Default Recommendation

Do not over-compress the schema yet.

For v2 implementation:

- keep ownership and content explicit
- allow JSON only for secondary metadata
- favor tables that match editor behavior directly
