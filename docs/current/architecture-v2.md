# Socia Maker V2 Architecture Draft

## Goal

Socia Maker v2 is a Cloudflare-native authoring tool for building pseudo social-game projects.

It should let a creator or a small team:

- create and manage multiple projects
- define base characters, cards, stories, gachas, and system settings
- preview the result in a game-like viewer
- share a read-only published version when desired

This document is the working draft for rebuilding the service as a product, not just a local prototype.

## Product Direction

### Primary Users

1. Solo creator
- Wants to quickly build a fake social-game world for pitching, concepting, or hobby use
- Needs simple editing, fast iteration, and stable save/load

2. Internal team
- Wants to collaborate on a project with a small number of members
- Needs project ownership, member roles, and shared editing

3. External viewer
- Should only see a published, read-only version
- Should not have access to editing or raw project management

### Product Boundaries For V2

Included in v2:

- account-based editing
- multiple projects per account
- member-based collaboration
- read-only publishing per project
- structured storage for content entities
- asset upload flow for images

Not included in v2 first pass:

- advanced billing
- fine-grained enterprise permissions
- real-time multiplayer editing
- version history UI
- public marketplace or template store

## Core Product Model

### Top-Level Units

- `user`
- `project`
- `project_member`
- `publish_state`

### Content Units

- `base_character`
- `card`
- `story`
- `story_scene`
- `gacha`
- `system_config`

### Player State Units

- `player_profile`
- `player_inventory`
- `gacha_pull_history`
- `story_progress`
- `player_home_preferences`
- `player_currency_balance`

### Optional Supporting Units

- `asset`
- `tag`
- `audit_log`

## Recommended Cloudflare Architecture

### Services

- `Cloudflare Pages`
  - serves the SPA
- `Cloudflare Functions`
  - handles authenticated API routes
- `Cloudflare D1`
  - source of truth for structured relational data
- `Cloudflare R2`
  - stores uploaded images and media assets
- `Cloudflare KV`
  - caches published snapshots, lightweight settings, share lookup, and edge-friendly derived data
- `Cloudflare Access` or external auth provider
  - handles login session validation if needed

### Why This Split

`KV` alone is acceptable for the current prototype, but it becomes weak once the service needs:

- multiple projects per user
- membership and permissions
- relational lookups
- publish state and project metadata queries
- consistent updates across related entities

For v2:

- use `D1` for canonical records
- use `R2` for images instead of `data:` URLs
- use `KV` only for fast read caches and published snapshots

## Data Ownership Model

### User

- id
- email or auth subject
- display_name
- created_at

### Project

- id
- owner_user_id
- name
- slug
- description
- visibility
- created_at
- updated_at

### Project Member

- id
- project_id
- user_id
- role

Suggested roles:

- `owner`
- `editor`
- `viewer`

### Publish State

- project_id
- is_published
- public_slug
- published_at
- snapshot_version

## Content Model

### Base Character

- id
- project_id
- name
- description
- birthday
- color
- portrait_asset_id
- metadata_json

Related subrecords:

- expressions
- variants
- voice lines
- home voices
- relation lines

### Card

- id
- project_id
- base_character_id
- name
- catch_text
- rarity
- attribute
- image_asset_id
- metadata_json

### Story

- id
- project_id
- type
- title
- target_card_id nullable
- bgm_asset_id nullable
- metadata_json

### Story Scene

- id
- story_id
- sort_order
- character_id nullable
- expression_name nullable
- variant_name nullable
- text
- background_asset_id nullable
- bgm_asset_id nullable

### Gacha

- id
- project_id
- title
- description
- banner_asset_id nullable
- rate_json
- featured_json

### System Config

- project_id
- rarity_mode
- orientation
- metadata_json

## API Direction

### Editing API

Editing routes should become project-scoped and authenticated.

Examples:

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `GET /api/projects/:projectId/base-characters`
- `POST /api/projects/:projectId/base-characters`
- `GET /api/projects/:projectId/cards`
- `POST /api/projects/:projectId/cards`
- `GET /api/projects/:projectId/stories`
- `POST /api/projects/:projectId/stories`
- `GET /api/projects/:projectId/gachas`
- `POST /api/projects/:projectId/gachas`
- `GET /api/projects/:projectId/system`
- `PUT /api/projects/:projectId/system`

### Publish API

Read-only published endpoints should not expose editing data or permissions logic.

Examples:

- `GET /p/:publicSlug`
- `GET /api/public/:publicSlug/bootstrap`

The publish API should return a pre-shaped viewer payload optimized for rendering.

### Player State API

Player state should be separated from project-authoring APIs.

Examples:

- `GET /api/projects/:projectId/me/bootstrap`
- `GET /api/projects/:projectId/me/inventory`
- `POST /api/projects/:projectId/me/gacha-pulls`
- `GET /api/projects/:projectId/me/story-progress`
- `POST /api/projects/:projectId/me/story-progress`
- `GET /api/projects/:projectId/me/home-preferences`
- `PUT /api/projects/:projectId/me/home-preferences`

These endpoints should require an authenticated viewer/editor identity and must never mutate shared authored content.

## Frontend Direction

### Split The App Into Two Modes

1. Editor mode
- project switcher
- content management
- publish settings
- member management later

2. Viewer mode
- home
- gacha
- story
- collection

3. Player state mode
- owned cards
- gacha history
- read progress
- per-user home setup

This separation matters because the current prototype blends authoring and viewing into one SPA state model.

### Recommended Frontend Structure

- `public/app.js`
  - should gradually become a shell/router only
- `public/screens/*`
  - can stay temporarily
- medium-term target:
  - `public/features/projects/*`
  - `public/features/editor/*`
  - `public/features/viewer/*`
  - `public/services/api/*`
  - `public/state/*`

### Immediate UI Goal

Keep the current SPA, but introduce a project selector and stop assuming one global dataset per browser session.

## Authentication Direction

### v2 Requirement

Replace `room` query-string persistence as the primary editing identity.

Recommended model:

- authenticated user session
- each project belongs to an owner
- optional invited editors
- public published viewer uses slug-based anonymous access

### Minimum Viable Auth

One pragmatic path:

- Cloudflare Access or third-party auth
- user identity forwarded to Functions
- user record upserted on first login

The exact provider can be chosen later, but the project/member model should not depend on `room`.

## Asset Strategy

### Current Problem

The prototype stores images as `data:` URLs inside records. This is easy, but it creates:

- large payloads
- expensive save/load
- poor cache behavior
- difficult future migrations

### V2 Recommendation

- upload files to `R2`
- store asset metadata in `D1`
- reference assets by stable id or URL

Suggested asset record:

- id
- project_id
- kind
- r2_key
- mime_type
- width nullable
- height nullable
- created_at

## Publishing Strategy

### Draft

Publishing should create a derived read-only snapshot for a project.

Suggested flow:

1. editor presses publish
2. system reads canonical project data from `D1`
3. system builds a viewer-friendly payload
4. payload is stored in `KV` under public slug and version
5. public viewer reads from `KV`

Benefits:

- fast public reads
- safer separation from edit APIs
- easier rollback and cache invalidation

## Shared Content vs Player State

### Shared project content

This is edited collaboratively and shared by everyone in the project:

- base characters
- cards
- stories and scenes
- gacha definitions
- system config
- publish settings

### Player state

This belongs to one authenticated user inside one project:

- which cards they own
- what they pulled from gacha
- their currencies, pity, or tickets
- which stories they unlocked or read
- personal home screen arrangement

### Working rule

If changing a record would affect every member and every viewer of the project, it is shared content.

If changing a record should affect only one person playing through that project, it is player state.

## Migration From Current Prototype

### Current State

The current project now works on:

- Pages
- Functions
- KV
- browser local fallback

But its data shape is still prototype-oriented.

### Migration Plan

Phase 1:

- keep current SPA
- introduce project records
- move from global keys to project-scoped keys
- keep KV as temporary storage

Phase 2:

- add auth
- move canonical storage from KV to D1
- add R2 asset upload

Phase 3:

- add publish pipeline
- add public viewer bootstrap endpoint
- add member roles

Phase 4:

- add per-user player state tables and APIs
- separate authored viewer payload from personal progress payload
- reduce localStorage dependence for per-user progress

Phase 5:

- refactor frontend around project-aware state
- reduce localStorage dependence to cache only

## Recommended Immediate Next Tasks

### Highest Value

1. Write a concrete v2 schema draft
- define tables and JSON fields
- choose D1 canonical schema

2. Introduce project scope in the current app
- stop assuming a single global dataset
- add `project` as a first-class concept

3. Decide auth direction
- choose provider or integration path

### Good Follow-Up

4. Design publish/read-only flow
5. Design asset upload flow with R2
6. Refactor frontend state by mode: editor vs viewer

## Open Questions

- Is the service primarily for solo use first, or team collaboration first?
- Should public sharing be per project, per build, or per published version?
- Should free usage allow private internal collaboration, with paid plans only for public sharing?
- Is buy-once license still the intended commercial direction, or should that decision wait until the project/member model is real?

## Working Decision For Now

Until these are resolved, the safest implementation path is:

- build v2 around `user -> project -> content`
- treat public sharing as a separate publish layer
- use `D1` as canonical structured storage
- use `R2` for assets
- use `KV` for published snapshots and edge cache
