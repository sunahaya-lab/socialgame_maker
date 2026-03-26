# Socia Maker

This file is the human-facing entry point for the project.
Use it for project overview, startup, and first links.
For the current working reality, see [`AGENTS.md`](./AGENTS.md).
For docs navigation, see [`docs/README.md`](./docs/README.md).

Socia Maker is a lightweight fake social-game prototype. It lets you build a small in-app universe from original characters, card data, stories, and gacha banners, then browse it in a mobile-game style UI.

See [`docs/current/architecture-v2.md`](./docs/current/architecture-v2.md) for the current rebuild direction and Cloudflare-native v2 design draft.
See [`docs/current/schema-v2.md`](./docs/current/schema-v2.md), [`migrations/0001_v2_initial.sql`](./migrations/0001_v2_initial.sql), and [`migrations/0006_player_state_initial.sql`](./migrations/0006_player_state_initial.sql) for the current D1 schema drafts.
See [`migrations/0000_project_registries.sql`](./migrations/0000_project_registries.sql), [`migrations/0001_base_character_registries.sql`](./migrations/0001_base_character_registries.sql), [`migrations/0002_entry_registries.sql`](./migrations/0002_entry_registries.sql), [`migrations/0003_story_registries.sql`](./migrations/0003_story_registries.sql), [`migrations/0004_gacha_registries.sql`](./migrations/0004_gacha_registries.sql), and [`migrations/0005_system_config_registries.sql`](./migrations/0005_system_config_registries.sql) for the transitional D1 bridge used to move prototype records off KV incrementally.

The v2 docs now distinguish between shared project content and per-user player state. Shared content is edited collaboratively; player state covers owned cards, gacha results, story progress, currencies, and personal home layout.

For editor text maintenance, use `npm run check:editor` for the normal check flow and see [`docs/current/text-repair-workflow.md`](./docs/current/text-repair-workflow.md) for the emergency repair workflow.

## Current Product Shape

- Single-page app on Cloudflare Pages + Functions + KV
- Mobile-style screens: Home, Gacha, Story, Collection, Editor
- API-backed persistence through Cloudflare Functions
- `localStorage` fallback when the backend is unavailable

## Current Features

### Home

- Shows total counts for cards, stories, and gachas
- Calculates a simple player level from total content
- Displays the first registered character on the home screen
- Shows a speech bubble and a current event-style banner

### Editor

- Base character editor
  - Name
  - Description
  - Theme color
  - Portrait upload
- Card editor
  - Name
  - Catch copy
  - Rarity
  - Attribute
  - Image upload
- Story editor
  - Title
  - Story type: `main` or `event`
  - Multiple scenes with character selection and text
- Gacha editor
  - Title
  - Description
  - Banner image upload
  - Featured card selection
  - Rarity rate inputs

### Gacha

- Select from saved gacha banners
- Run single pull or 10-pull
- Uses configured rarity rates
- Displays pull results in a reveal grid

### Story

- Separate tabs for `main` and `event`
- Story reader overlay with scene progression
- Uses base character portrait and color when linked

### Collection

- Displays saved cards in a grid
- Filter by rarity
- Open card detail modal

## API

- `GET /api/base-chars`
- `POST /api/base-chars`
- `GET /api/entries`
- `POST /api/entries`
- `GET /api/stories`
- `POST /api/stories`
- `GET /api/gachas`
- `POST /api/gachas`
- `GET /api/system`
- `POST /api/system`
- `GET /api/player-bootstrap?project=...&user=...`
- `GET|POST /api/player-profile?project=...&user=...`
- `GET|POST /api/player-story-progress?project=...&user=...`
- `POST /api/player-gacha-pulls?project=...&user=...`

Data is currently stored in the `SOCIA_DATA` KV binding in Cloudflare runtime. `projects`, `base-chars`, `entries`, `stories`, `gachas`, and `system` can move first to D1 through the `SOCIA_DB` binding and the bridge migrations above. Local browser state is used as a fallback cache.

## Run

1. Run `npm start`
2. Open the local Wrangler URL, usually `http://127.0.0.1:8788` or similar
3. Create base characters, cards, stories, and gachas in the editor
4. Browse them through the game-style screens

## D1 Bridge Setup

1. Create a D1 database
2. Fill the commented `SOCIA_DB` block in [`wrangler.toml`](./wrangler.toml)
3. Apply [`migrations/0000_project_registries.sql`](./migrations/0000_project_registries.sql)
4. Restart local dev

Until that binding exists, the app keeps using KV for `projects`.

## Notes

- Card form base-character selection exists in the UI, but the current card save flow does not persist that relationship
- Gacha `featured` selections are stored, but current pull logic still rolls from the rarity pool rather than featured weighting
