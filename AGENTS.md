# AGENTS.md

## Project
- Name: `socia_maker`
- Purpose: pseudo-social-game maker web app
- Primary UI: single-page app with screens for `home`, `gacha`, `story`, `collection`, `editor`

## Current Hosting Direction
- Target platform: `Cloudflare Pages + Functions + KV + D1`
- Static files live under [`public/`](./public)
- API lives under [`functions/api/`](./functions/api)
- Legacy Node/JSON server has been retired

## Current Important Files
- Frontend entry:
  - [`public/index.html`](./public/index.html)
  - [`public/app.js`](./public/app.js)
  - [`public/styles.css`](./public/styles.css)
- Frontend shared modules:
  - [`public/lib/rarity.js`](./public/lib/rarity.js)
  - [`public/lib/storage.js`](./public/lib/storage.js)
  - [`public/lib/image.js`](./public/lib/image.js)
  - [`public/lib/toast.js`](./public/lib/toast.js)
  - [`public/api/client.js`](./public/api/client.js)
- Frontend screen modules:
  - [`public/screens/collection-screen.js`](./public/screens/collection-screen.js)
  - [`public/screens/gacha-screen.js`](./public/screens/gacha-screen.js)
  - [`public/screens/story-screen.js`](./public/screens/story-screen.js)
  - [`public/screens/system-editor.js`](./public/screens/system-editor.js)
  - [`public/screens/entry-editor.js`](./public/screens/entry-editor.js)
  - [`public/screens/base-char-editor.js`](./public/screens/base-char-editor.js)
  - [`public/screens/story-editor.js`](./public/screens/story-editor.js)
  - [`public/screens/editor-screen.js`](./public/screens/editor-screen.js)
- Cloudflare API:
  - [`functions/api/base-chars.js`](./functions/api/base-chars.js)
  - [`functions/api/entries.js`](./functions/api/entries.js)
  - [`functions/api/stories.js`](./functions/api/stories.js)
  - [`functions/api/gachas.js`](./functions/api/gachas.js)
  - [`functions/api/system.js`](./functions/api/system.js)
- Config:
  - [`wrangler.toml`](./wrangler.toml)
  - [`package.json`](./package.json)

## Cloudflare State
- KV binding name: `SOCIA_DATA`
- D1 binding name: `SOCIA_DB`
- D1 database id: `06c10043-76cc-4d8c-b85e-9328cb2e24bb`
- `wrangler.toml` already has IDs filled
  - production id: `33177f0dc4ba44aaa7df335c1ff2ff53`
  - preview id: `611238f598bf459d8d597ce0fe1ad3cd`
- Local dev command:
  - `wrangler.cmd pages dev public`

## Important Current Reality
- `public/` is the only static directory Cloudflare Pages serves.
- Any JS/CSS/image file referenced by `public/index.html` must exist under `public/`.
- Root-level `lib/`, `screens/`, `api/client.js` are not enough by themselves for Pages runtime.

## Current App Features

### Shared Project Layer
- `project` selector exists on home
- Shared editor data is scoped by `project`
- Shared content save/load APIs exist for:
  - `base characters`
  - `cards`
  - `stories`
  - `gachas`
  - `system config`
- These APIs prefer `D1` and fall back to `KV` when needed

### Player State Layer
- Per-player state exists, scoped by `project + user`
- Current player state APIs exist for:
  - `player profile`
  - `story progress`
  - `gacha pull history`
  - `inventory`
  - `home preferences`
- `player-bootstrap` returns:
  - `profile`
  - `inventory`
  - `gachaHistory`
  - `storyProgress`
  - `homePreferences`
  - `currencies`

### Home
- Displays registered counts, pseudo level, home characters, banner, home speech
- Supports 1-character or 2-character layout
- Supports drag positioning, scale slider, front/back swap
- Home configuration is now intended to be per-player, not shared per project
- Supports home voice logic:
  - `homeEnter`
  - `eventActive`
  - random home lines
  - relation lines (`homeOpinions`, `homeConversations`)
  - birthday lines (`homeBirthdays`)

### Gacha
- Registered gacha list
- Single draw / ten draw
- Rates depend on system rarity mode
- Draw result opens card detail
- Draw result is recorded into per-player inventory and pull history

### Story
- Tabs:
  - `main`
  - `event`
  - `character`
- Story reader with scenes
- Character story can be linked to a card
- Story progress is per-player
- Status display exists for:
  - `NEW`
  - `LOCKED`
  - `READING`
  - `CLEAR`
- Character story lock uses owned card state
- Scene portrait priority is intended to support:
  - expression
  - scene variant
  - story default variant
  - base portrait

### Collection
- Card list
- Rarity filters
- Card detail modal
- Character story links from card detail
- Voice display prefers card-specific values and falls back to base character values
- Collection is now inventory-based and shows only owned cards

### Editor
- Tabs:
  - base character
  - card
  - story
  - gacha
  - system
- Registered list exists for:
  - base characters
  - cards
  - stories
  - gachas
- Edit pushes data back into the same form
- Story list supports drag reorder for display order
- Card and story lists support project-shared folders
- Folder groups are collapsible

### Base Character Data
- Basic profile
- Birthday
- Expressions
- Event portrait variants
- Battle voice fields
- Home voice fields
- Home relation fields:
  - opinions
  - conversations
  - birthdays

### Card Data
- Base character link
- Optional folder assignment
- Rarity / attribute / image / catch
- Card-specific voices
- Card-specific home voices
- Card-specific opinions / conversations / birthday voices
- Falls back to base character values when card values are blank

### Story Data
- `main`, `event`, `character`
- Character stories can target a card
- Optional folder assignment
- Display order uses `sortOrder`
- Story-level variant defaults
- Scene-level character / text / bg / bgm / expression / variant

### Gacha Data
- Title / description / banner image
- Featured candidates
- Rates

### System Data
- Rarity mode:
  - `classic4`: `N / R / SR / SSR`
  - `stars5`: 5-star display
- Shared folder definitions currently live in system config:
  - `cardFolders`
  - `storyFolders`

## Current Goal Status
- Cloudflare Pages migration:
  - reached working state
- Shared project editing:
  - reached working state
- D1 bridge for shared content:
  - reached working state for `projects`, `base-chars`, `entries`, `stories`, `gachas`, `system`
- Player-specific progress:
  - partially reached
  - `story progress`, `inventory`, `gacha history`, `home preferences` exist
- Productized app architecture:
  - still in progress
  - auth/member/public-share/license layers are not implemented yet

## Current Known Problems
- Remote D1 migration for `player_home_preferences` is not yet applied because `wrangler d1 execute --remote` hit Cloudflare authentication error `10000`
- `player-home-preferences` works locally and is guarded to avoid hard failure when the remote table is missing
- Some UI text is still historically mojibake in source and should be cleaned gradually
- Folder UI currently exists for `cards` and `stories`, but not yet for other content types
- Story unlock logic still follows current display order; this is acceptable for now because display order is treated as presentation, not strict progression schema

## Important Recovery Notes
- Last known good commit for SPA navigation before Cloudflare migration troubles:
  - `dd5719c` `Refactor screens and restore navigation`
- After Cloudflare migration work, `public/index.html` and `public/app.js` were restored from that commit to get back to a stable UI baseline.

## Current Git State
- Expect active local changes related to:
  - player-state expansion
  - home preference persistence
  - folder UI / editor UX
- Re-check `git status` before destructive cleanup or commit batching

## What Must Not Be Deleted
- Do not delete [`functions/`](./functions) or [`wrangler.toml`](./wrangler.toml)
- Do not delete [`public/api`](./public/api), [`public/lib`](./public/lib), [`public/screens`](./public/screens)
- `.wrangler/` and `wrangler-dev*.log` are local artifacts and can be ignored or deleted later

## Current Runtime
- Cloudflare Pages + Functions + KV + D1 is the active runtime
- Legacy Node files (`server.js`, `data/`, old root `index.js`) are retired after browser save/load confirmation
- Prefer updating Cloudflare-side files over reintroducing Node-based storage logic

## Commands That Were Used Successfully
- Install wrangler:
  - `npm install -g wrangler`
- Login:
  - `wrangler.cmd login`
- Create preview KV:
  - `wrangler.cmd kv namespace create SOCIA_DATA --preview`
- Run local Pages dev:
  - `wrangler.cmd pages dev public`

## Current Expected Local URL
- Local dev usually runs at something like:
  - `http://127.0.0.1:8788`
  - or `http://127.0.0.1:8789`

## Next Recommended Implementation Steps
1. Apply remote D1 migration for:
   - [`migrations/0007_player_home_preferences.sql`](./migrations/0007_player_home_preferences.sql)
2. Expand player state toward actual gameplay loop:
   - `player_currency_balances`
   - `player_home_preferences` polish
   - optional `gacha history` UI
3. Refine progression UX:
   - story status visuals
   - inventory-based gating polish
4. Clean editor UX:
   - more UTF-8 text cleanup
   - optional folder management improvements
5. Only after that:
   - start auth/member/public-share implementation

## If App Still Does Not Open
- First inspect browser console for runtime errors
- Then verify these URLs return `200`:
  - `/`
  - `/app.js`
  - `/styles.css`
  - `/lib/rarity.js`
  - `/lib/storage.js`
  - `/lib/image.js`
  - `/lib/toast.js`
  - `/api/client.js`
  - `/screens/collection-screen.js`
  - `/screens/gacha-screen.js`
  - `/screens/story-screen.js`
  - `/screens/system-editor.js`
  - `/screens/entry-editor.js`
  - `/screens/base-char-editor.js`
  - `/screens/story-editor.js`
  - `/screens/editor-screen.js`
- Then verify API endpoints return JSON:
  - `/api/base-chars`
  - `/api/entries`
  - `/api/stories`
  - `/api/gachas`
  - `/api/system`

## Product Direction Notes
- Planned productization:
  - team-internal collaboration can be free
  - external read-only public sharing should be paid / license-gated
- Payment model discussion moved toward buy-once license rather than subscription
- Long-term architecture discussed:
  - auth
  - project/member model
  - public share license
- Current architecture direction is:
  - shared project content edited collaboratively
  - player-specific progress stored separately per user
  - home/gacha/story progression should diverge per player while editor data stays shared

## Important Reminder For Next Session
- Do not assume mojibake shown in PowerShell means file bytes are broken.
- PowerShell display encoding is noisy.
- Browser behavior and UTF-8 file reads matter more than terminal glyphs.

## Text Encoding Policy
- All frontend text files must be saved as UTF-8.
- Prefer UTF-8 without BOM for edited or newly created `.html`, `.js`, `.css`, `.json`, `.md`, `.toml`.
- Treat browser rendering and UTF-8-aware file reads as the source of truth, not PowerShell glyph display.
- If Japanese UI text looks broken in the browser, assume actual file corruption and restore the text immediately.
- When recovering files from git history, verify the restored content still uses UTF-8 and re-check in browser after reload.
