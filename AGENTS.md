# AGENTS.md

## Document Role
- This file is the agent-facing working reality for the repository.
- Use it for current implementation status, fragile areas, refactor direction, recovery notes, and operational constraints.
- For the human-facing project entry, see [`README.md`](./README.md).
- For docs navigation, see [`docs/README.md`](./docs/README.md).
- Treat this file as the project constitution during active refactor.
- If local folder-level guidance conflicts with ad-hoc convenience, follow this file and the relevant folder `README.md`.

## Constitution-Level Refactor Rules
- Refactor by responsibility boundaries, not by line-count alone.
- Prefer making file boundaries clearer before moving behavior.
- Do not split a dangerous file just to make it smaller if the new boundaries are not yet explicit.
- Prefer chapterizing, annotating, and extracting thin helpers before deleting compatibility code.
- Reject changes that blur ownership between `bootstrap`, `runtime wiring`, `screen behavior`, `editor behavior`, and `API/data access`.
- Reject new mixed-responsibility files when the behavior can live in an existing folder with a clear README boundary.
- Prefer one file, one primary responsibility.
- If a file must temporarily hold two concerns during migration, mark the boundary explicitly in comments and in the relevant health-check doc.

## Folder README Policy
- Active folders must have a local `README.md` that defines:
  - responsibility
  - allowed dependencies
  - split/extraction criteria
  - what may be placed there
  - what must not be placed there
  - major inputs/outputs
- Read the nearest folder `README.md` before adding a new file to that folder.
- When creating a new active folder, create its `README.md` in the same change unless the folder is obviously temporary.
- Do not place new files into a folder that lacks a boundary definition if a nearby defined folder already fits.
- If folder boundaries are unclear, update the folder `README.md` first, then place the file.

## Required Hooks

## Allowed Dependency Direction

### Frontend Layers
- `public/index.html`
  - may load: `public/styles.css`, bootstrap files, manifest-driven runtime entrypoints
- `public/core/`
  - may depend on: `public/lib/`, `public/screens/`, `public/editor/`
  - must not depend on: section-local behavior via deep ad-hoc imports when a runtime/helper boundary already exists
- `public/lib/`
  - may depend on: `public/api/`, browser APIs
  - may be used by: `public/core/`, `public/screens/`, `public/editor/`
  - must not depend on: `public/screens/` feature-local behavior, `public/editor/sections/` section-local behavior
- `public/api/`
  - may depend on: endpoint path helpers, `fetch`, minimal shared normalization helpers
  - must not depend on: DOM, screen logic, editor workflow logic
- `public/screens/`
  - may depend on: `public/lib/`, `public/api/`, explicitly allowed `public/editor/` mainline helpers during compatibility transition
  - must not depend on: unrelated `public/editor/sections/<other-section>/` implementation details
- `public/editor/`
  - may depend on: `public/lib/`, `public/editor/shared/`, `public/editor/sections/`, explicitly needed compatibility implementations
  - must not depend on: play-screen-local behavior unless a documented bridge exists
- `public/editor/shared/`
  - may depend on: `public/lib/`, `public/editor/sections/` contracts, compatibility bridges
  - must not absorb: section-local business logic
- `public/editor/sections/<name>/`
  - may depend on: `public/editor/shared/`, `public/lib/`, that section's compatibility implementation
  - must not depend on: unrelated sibling section implementation details

### Backend Layers
- `functions/api/<endpoint>.js`
  - may depend on: `functions/api/_*.js` helpers
  - must remain thin handlers
- `functions/api/_*.js`
  - may depend on: D1/KV helpers and other backend-only helpers
  - must not depend on: frontend runtime concerns

### Repo-Wide Hooks
- Before adding or moving a file, read the nearest folder `README.md`.
- If no suitable folder rule exists, update the folder `README.md` first, then add the file.
- If a change alters runtime ownership, compatibility status, or deletion safety, update the relevant current doc in `docs/current/`.
- If a file changes classification from `active compatibility implementation` to `thin adapter`, update both the file header comment and the current health check doc.

### Refactor Hooks
- When touching a dangerous file, prefer chapterizing and boundary comments before extracting behavior.
- When extracting behavior from a dangerous file, prefer:
  1. thin helper extraction
  2. factory/runtime helper extraction
  3. mainline helper preference
  4. deletion only after caller/manifest/docs confirmation
- If a compatibility file remains behavior-carrying, mark its future mainline destination in the file header comment.
- If a thin adapter is introduced, its mainline source must be explicit in the file itself.
- Do not add cross-layer imports or dependencies casually.
- In particular, do not make `public/screens/` depend on unrelated `public/editor/sections/<other-section>/` code, and do not pull section-local editor behavior into `public/lib/` or `public/core/` without an explicit boundary reason.
- If a new dependency direction is necessary, document it first in `AGENTS.md` and the nearest folder `README.md` in the same change.

### Docs Hooks
- If implementation guidance changes, update the nearest governing doc under `docs/current/`.
- If the change affects code health or deletion safety, update `docs/current/code-health-check-2026-03-30.md`.
- If the change affects active vs dormant documentation status, update `docs/current/README.md`.
- Do not leave `docs/current/` and runtime reality diverged after a refactor batch.

### UTF-8 / Text Hooks
- If Japanese-heavy frontend text is edited, run `node scripts/check-mojibake.js` after the change.
- If shared UI wording changes, prefer updating the nearest text-source file rather than duplicating inline literals.
- If PowerShell display looks broken but browser/runtime behavior is correct, treat terminal glyph output as non-authoritative until UTF-8 reads or browser checks disagree.

### CSS Hooks
- Before editing `public/styles.css`, check the relevant section ownership and danger comments first.
- If a `styles.css` section changes meaningfully, update the matching split/reference file under `public/styles/` or explicitly record why it remains unsynced.
- Do not change active CSS loading away from `public/styles.css` without updating docs and the boot entry path together.
- Do not add new feature styling to the monolithic `public/styles.css` by default.
- Prefer the appropriate split/reference target under `public/styles/`, and only touch `public/styles.css` when updating the current active source intentionally and with section ownership in mind.

### Boot / Runtime Hooks
- Before editing `public/index.html`, check `public/bootstrap-script-manifest.js` and the boot-file danger annotations.
- Do not change script load order casually; document any load-order change in `docs/current/code-health-check-2026-03-30.md`.
- If a boot-path change moves ownership between `public/core/`, `public/editor/`, and `public/screens/`, update the relevant folder `README.md` files in the same change.

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
- Frontend core runtime:
  - [`public/core/app-init-runtime.js`](./public/core/app-init-runtime.js)
  - [`public/core/bootstrap.js`](./public/core/bootstrap.js)
  - [`public/core/navigation.js`](./public/core/navigation.js)
  - [`public/core/runtime.js`](./public/core/runtime.js)
- Frontend shared modules:
  - [`public/lib/rarity.js`](./public/lib/rarity.js)
  - [`public/lib/storage.js`](./public/lib/storage.js)
  - [`public/lib/image.js`](./public/lib/image.js)
  - [`public/lib/toast.js`](./public/lib/toast.js)
  - [`public/lib/profile-runtime.js`](./public/lib/profile-runtime.js)
  - [`public/lib/profile-actions.js`](./public/lib/profile-actions.js)
  - [`public/lib/auth-panel-ui.js`](./public/lib/auth-panel-ui.js)
  - [`public/lib/auth-session-runtime.js`](./public/lib/auth-session-runtime.js)
  - [`public/lib/project-members-runtime.js`](./public/lib/project-members-runtime.js)
  - [`public/lib/system-save-runtime.js`](./public/lib/system-save-runtime.js)
  - [`public/api/client.js`](./public/api/client.js)
- Frontend screen modules:
  - [`public/screens/collection-screen-runtime.js`](./public/screens/collection-screen-runtime.js)
  - [`public/screens/collection-screen.js`](./public/screens/collection-screen.js)
  - [`public/screens/formation-screen-runtime.js`](./public/screens/formation-screen-runtime.js)
  - [`public/screens/story-screen-runtime.js`](./public/screens/story-screen-runtime.js)
  - [`public/screens/gacha-screen-runtime.js`](./public/screens/gacha-screen-runtime.js)
  - [`public/screens/gacha-screen.js`](./public/screens/gacha-screen.js)
  - [`public/screens/event-screen-runtime.js`](./public/screens/event-screen-runtime.js)
  - [`public/screens/story-screen.js`](./public/screens/story-screen.js)
  - [`public/screens/system-editor.js`](./public/screens/system-editor.js)
  - [`public/screens/entry-editor.js`](./public/screens/entry-editor.js)
  - [`public/screens/base-char-editor.js`](./public/screens/base-char-editor.js)
  - [`public/screens/story-editor.js`](./public/screens/story-editor.js)
  - [`public/screens/editor-screen.js`](./public/screens/editor-screen.js)
- Frontend editor runtime:
  - [`public/editor/editor-v1-host-app.js`](./public/editor/editor-v1-host-app.js)
  - [`public/editor/editor-app.js`](./public/editor/editor-app.js)
  - [`public/editor/editor-dashboard.js`](./public/editor/editor-dashboard.js)
  - [`public/editor/editor-dashboard-config.js`](./public/editor/editor-dashboard-config.js)
  - [`public/editor/editor-dashboard-screen-app.js`](./public/editor/editor-dashboard-screen-app.js)
  - [`public/editor/editor-runtime-bridge.js`](./public/editor/editor-runtime-bridge.js)
  - [`public/editor/sections/system/system-editor-app.js`](./public/editor/sections/system/system-editor-app.js)
  - [`public/editor/sections/system/system-editor-runtime.js`](./public/editor/sections/system/system-editor-runtime.js)
  - [`public/editor/sections/system/system-editor-title-app.js`](./public/editor/sections/system/system-editor-title-app.js)
  - [`public/editor/sections/system/system-editor-battle-app.js`](./public/editor/sections/system/system-editor-battle-app.js)
  - [`public/editor/sections/system/system-editor-form-app.js`](./public/editor/sections/system/system-editor-form-app.js)
  - [`public/editor/sections/system/title-editor-runtime.js`](./public/editor/sections/system/title-editor-runtime.js)
  - [`public/editor/sections/card/entry-editor-runtime.js`](./public/editor/sections/card/entry-editor-runtime.js)
  - [`public/editor/sections/card/equipment-card-editor-runtime.js`](./public/editor/sections/card/equipment-card-editor-runtime.js)
  - [`public/editor/sections/base-char/base-char-editor-runtime.js`](./public/editor/sections/base-char/base-char-editor-runtime.js)
  - [`public/editor/sections/story/story-editor-runtime.js`](./public/editor/sections/story/story-editor-runtime.js)
  - [`public/editor/sections/music/music-editor-runtime.js`](./public/editor/sections/music/music-editor-runtime.js)
  - [`public/editor/sections/notices/announcement-editor-app.js`](./public/editor/sections/notices/announcement-editor-app.js)
  - [`public/editor/sections/notices/announcement-editor-runtime.js`](./public/editor/sections/notices/announcement-editor-runtime.js)
  - [`public/editor/shared/`](./public/editor/shared)
  - [`public/editor/sections/`](./public/editor/sections)
- Cloudflare API:
  - [`functions/api/base-chars.js`](./functions/api/base-chars.js)
  - [`functions/api/entries.js`](./functions/api/entries.js)
  - [`functions/api/stories.js`](./functions/api/stories.js)
  - [`functions/api/gachas.js`](./functions/api/gachas.js)
  - [`functions/api/system.js`](./functions/api/system.js)
- Config:
  - [`wrangler.toml`](./wrangler.toml)
  - [`package.json`](./package.json)

## Current Docs Layout
- Docs index:
  - [`docs/README.md`](./docs/README.md)
- Current working docs:
  - [`docs/current/`](./docs/current)
- Active implementation specs:
  - [`docs/specs/`](./docs/specs)
- Background/reference docs:
  - [`docs/reference/`](./docs/reference)
- Keep [`docs/refactor-commit-plan-2026-03-27.md`](./docs/refactor-commit-plan-2026-03-27.md) in mind if it still remains at `docs/` root during active use

## Current Most Useful Docs
- Architecture / schema:
  - [`docs/current/architecture-v2.md`](./docs/current/architecture-v2.md)
  - [`docs/current/schema-v2.md`](./docs/current/schema-v2.md)
- Current fix notes:
  - [`docs/current/player-state-api-fix-notes-2026-03-27.md`](./docs/current/player-state-api-fix-notes-2026-03-27.md)
  - [`docs/current/shared-content-api-fix-notes-2026-03-27.md`](./docs/current/shared-content-api-fix-notes-2026-03-27.md)
  - [`docs/current/share-license-api-fix-notes-2026-03-27.md`](./docs/current/share-license-api-fix-notes-2026-03-27.md)
- Current refactor instructions:
  - [`docs/current/refactor-priority-instructions-2026-03-27.md`](./docs/current/refactor-priority-instructions-2026-03-27.md)
  - [`docs/refactor-commit-plan-2026-03-27.md`](./docs/refactor-commit-plan-2026-03-27.md)
  - [`docs/current/refactor-backlog-risk-notes-2026-03-27.md`](./docs/current/refactor-backlog-risk-notes-2026-03-27.md)
- Text repair workflow:
  - [`docs/current/text-repair-workflow.md`](./docs/current/text-repair-workflow.md)
  - [`docs/current/mojibake-repair-and-prevention-2026-03-30.md`](./docs/current/mojibake-repair-and-prevention-2026-03-30.md)

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

### Editor Snapshot Before Redesign
- Current editor runtime is being retired and redesigned from scratch
- Current active editor v1 line now lives under [`public/editor/`](./public/editor)
- [`public/screens/editor-v1-host.js`](./public/screens/editor-v1-host.js) is now a thin compatibility adapter that delegates to [`public/editor/editor-v1-host-app.js`](./public/editor/editor-v1-host-app.js)
- [`public/screens/editor-dashboard-screen.js`](./public/screens/editor-dashboard-screen.js) and [`public/screens/editor-dashboard-config.js`](./public/screens/editor-dashboard-config.js) are also compatibility adapters over the `public/editor/` runtime
- [`public/screens/system-editor.js`](./public/screens/system-editor.js) is now a thin compatibility adapter that delegates to [`public/editor/sections/system/system-editor-app.js`](./public/editor/sections/system/system-editor-app.js)
- [`public/screens/system-editor-title.js`](./public/screens/system-editor-title.js) is now a thin compatibility adapter that delegates to [`public/editor/sections/system/system-editor-title-app.js`](./public/editor/sections/system/system-editor-title-app.js)
- [`public/screens/system-editor-battle.js`](./public/screens/system-editor-battle.js) is now a thin compatibility adapter that delegates to [`public/editor/sections/system/system-editor-battle-app.js`](./public/editor/sections/system/system-editor-battle-app.js)
- [`public/screens/system-editor-form.js`](./public/screens/system-editor-form.js) is now a thin compatibility adapter that delegates to [`public/editor/sections/system/system-editor-form-app.js`](./public/editor/sections/system/system-editor-form-app.js)
- [`public/screens/system-editor-event.js`](./public/screens/system-editor-event.js) remains on disk for recovery, but is no longer part of the active release runtime
- [`public/screens/announcement-editor.js`](./public/screens/announcement-editor.js) is now a thin compatibility adapter that delegates to [`public/editor/sections/notices/announcement-editor-app.js`](./public/editor/sections/notices/announcement-editor-app.js)
- Deleted on 2026-03-30 because they were no longer on the active runtime path:
  - `public/screens/editor-legacy-host.js`
  - `public/screens/editor-base-char-host.js`
  - `public/screens/editor-character-host.js`
  - `public/screens/editor-story-host.js`
  - `public/screens/editor-gacha-host.js`
  - `public/screens/editor-system-host.js`
  - `public/screens/editor-project-sections.js`
  - `public/screens/editor-section-host-registry.js`
- Existing editor responsibilities before retirement:
  - base character form editing and list management
  - card form editing and list management
  - story form editing and list management
  - gacha form editing and list management
  - system form editing and shared config editing
  - folder manager window for cards / stories / UI assets
  - editor overlay experiments
  - home edit experiments layered on top of home screen
- Existing editor-related modules that remain on disk for reference:
  - [`public/screens/editor-screen.js`](./public/screens/editor-screen.js)
  - [`public/screens/system-editor.js`](./public/screens/system-editor.js)
  - [`public/screens/entry-editor.js`](./public/screens/entry-editor.js)
  - [`public/screens/base-char-editor.js`](./public/screens/base-char-editor.js)
  - [`public/screens/story-editor.js`](./public/screens/story-editor.js)
- Current redesign direction:
  - do not restore the old giant editor screen
  - do not continue patching the old editor overlay
  - rebuild editing around direct on-screen editing modes per target screen
  - home should use direct home editing, not the old editor screen

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
  - auth/member/public-share/license layers are partially implemented in draft form on disk, but are not production-ready yet

## Current Known Problems
- Remote D1 migration for `player_home_preferences` is not yet applied because `wrangler d1 execute --remote` hit Cloudflare authentication error `10000`
- `player-home-preferences` works locally and is guarded to avoid hard failure when the remote table is missing
- Some UI text is still historically mojibake in source and should be cleaned gradually
- Folder UI currently exists for `cards` and `stories`, but not yet for other content types
- Story unlock logic still follows current display order; this is acceptable for now because display order is treated as presentation, not strict progression schema
- Share / license endpoints and related access rules exist on disk, but still have open authorization and behavior issues and should be treated as implementation-in-progress

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
5. Fix the current share / license draft implementation before treating it as a stable product layer:
   - auth boundary
   - owner/member verification
   - public-share validity rules
6. Continue staged frontend refactor using:
   - [`docs/current/refactor-priority-instructions-2026-03-27.md`](./docs/current/refactor-priority-instructions-2026-03-27.md)
   - [`docs/refactor-commit-plan-2026-03-27.md`](./docs/refactor-commit-plan-2026-03-27.md)

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

## Current Stabilization State
- As of `2026-03-24`, the app was stabilized by reverting CSS loading back to single-file [`public/styles.css`](./public/styles.css).
- Split CSS files under [`public/styles/`](./public/styles/) currently exist but are not trusted as the active runtime source of truth.
- [`public/index.html`](./public/index.html) currently loads only [`public/styles.css`](./public/styles.css) again.
- [`public/app.js`](./public/app.js) is still mid-refactor and should be treated as a fragile orchestrator under recovery.
- A backup of the current orchestrator exists at [`public/app.legacy.js`](./public/app.legacy.js).
- [`public/screens/home-layout-overlay.js`](./public/screens/home-layout-overlay.js) was temporarily changed to stop overlay rendering and fall back to legacy home DOM only.
- If the UI looks duplicated again, first suspect `home-layout-overlay` or another overlay path re-enabling itself on top of legacy DOM.

## Rebuild Direction Agreed On
- Do not continue large in-place rewrites on top of the current partially refactored runtime.
- Keep the current visible UI as the `legacy stable line` until the replacement path is ready.
- Rebuild forward by creating a thin bootstrap/orchestrator and a separate real-screen editing workspace.

### Legacy Stable Line
- Keep current [`public/index.html`](./public/index.html) and [`public/styles.css`](./public/styles.css) working first.
- Do not re-enable split CSS files as active runtime sources until the new architecture is ready.
- Do not re-enable home overlay rendering until duplication is intentionally rebuilt.

### New Architecture Direction
- New [`public/app.js`](./public/app.js) should become a thin bootstrap only:
  - state initialization
  - module wiring
  - `init()`
  - minimum `window.*` hooks
- Business logic should live in:
  - [`public/lib/`](./public/lib)
  - [`public/screens/`](./public/screens)
  - future `public/core/` style modules if added

### Intended New Editing Model
- Do not use preview-window-first editing.
- Use real-screen editing mode on top of the actual `home`, later `gacha` and `story`.
- Floating windows should be support UI only:
  - `Layers`
  - `Properties`
  - `Assets`
  - `Folders`
- Editing target should be the real rendered screen, not a separate mock preview.

### Recommended Next Implementation Order
1. Keep the current legacy UI stable.
2. Replace [`public/app.js`](./public/app.js) with a truly thin bootstrap.
3. Create a new home-only workspace/editor path separate from legacy editor flow.
4. First target only one real on-screen object for direct manipulation.
   - initially discussed target: the home-side battle button
5. After direct manipulation works:
   - add `Layers`
   - add `Properties`
   - add `Assets/Folders`
   - add role binding
6. Only after home workspace is stable:
   - expand the same system to `gacha`
   - then to `story`

### Important Constraint For Next Session
- Prefer building the new path beside legacy code rather than replacing legacy code piecemeal.
- When in doubt, stabilize first, then branch into the new system.

## Text Encoding Policy
- All frontend text files must be saved as UTF-8.
- Prefer UTF-8 without BOM for edited or newly created `.html`, `.js`, `.css`, `.json`, `.md`, `.toml`.
- Treat browser rendering and UTF-8-aware file reads as the source of truth, not PowerShell glyph display.
- If Japanese UI text looks broken in the browser, assume actual file corruption and restore the text immediately.
- When recovering files from git history, verify the restored content still uses UTF-8 and re-check in browser after reload.

## PowerShell UTF-8 Workflow
- Before inspecting or editing Japanese-heavy frontend files in PowerShell, switch the console to UTF-8 first.
- Recommended commands:
  - `chcp 65001`
  - `[Console]::InputEncoding = [System.Text.UTF8Encoding]::new()`
  - `[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()`
  - `$OutputEncoding = [System.Text.UTF8Encoding]::new()`
- A helper script exists at [`scripts/setup-utf8-console.ps1`](./scripts/setup-utf8-console.ps1).
- Before and after repairing suspected mojibake, run [`scripts/check-mojibake.js`](./scripts/check-mojibake.js).
- Prefer `Get-Content -Encoding UTF8 <path>` when direct file reads are needed.
- Prefer `rg`, `node --check`, and browser verification over trusting PowerShell glyph rendering.
- Avoid pushing long Japanese text blocks through ad-hoc shell commands when `apply_patch` is sufficient.
- User-facing feature descriptions, labels, guidance text, and explanatory UI copy must be written in Japanese unless there is a clear product reason not to.

## Frontend Refactor Direction
- `public/app.js` is being reduced toward orchestration only.
- Pure state/config helpers should move into `public/lib/` first.
- Screen-specific behavior should move into `public/screens/` rather than growing `app.js`.
- `public/styles.css` is being decomposed starting with token extraction.
- Prefer this order for refactor safety:
  1. pure helpers
  2. screen modules
  3. shared UI primitives
  4. CSS token/base/component split
- Avoid re-expanding `app.js` with new pure utility functions during this phase.

## UI Text Safety
- Repeated editor empty-state and note text should prefer shared definitions in [`public/lib/ui-text.js`](./public/lib/ui-text.js) instead of being duplicated inline.
- When touching multiple editor-facing files, prefer running [`scripts/check-editor-files.ps1`](./scripts/check-editor-files.ps1) after edits.
- When touching Japanese-heavy frontend files, also run [`scripts/check-mojibake.js`](./scripts/check-mojibake.js) and consult [`docs/current/mojibake-repair-and-prevention-2026-03-30.md`](./docs/current/mojibake-repair-and-prevention-2026-03-30.md).
- [`scripts/repair-editor-text.js`](./scripts/repair-editor-text.js) and [`scripts/repair-system-text.js`](./scripts/repair-system-text.js) are emergency repair helpers, not the default editing path.
