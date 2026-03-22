# AGENTS.md

## Project
- Name: `socia_maker`
- Purpose: pseudo-social-game maker web app
- Primary UI: single-page app with screens for `home`, `gacha`, `story`, `collection`, `editor`

## Current Hosting Direction
- Target platform: `Cloudflare Pages + Functions + KV`
- Static files live under [`public/`](./public)
- API lives under [`functions/api/`](./functions/api)
- Old Node/JSON server is being retired

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

### Home
- Displays registered counts, pseudo level, home characters, banner, home speech
- Supports 1-character or 2-character layout
- Supports drag positioning, scale slider, front/back swap
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

### Story
- Tabs:
  - `main`
  - `event`
  - `character`
- Story reader with scenes
- Character story can be linked to a card
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
- Rarity / attribute / image / catch
- Card-specific voices
- Card-specific home voices
- Card-specific opinions / conversations / birthday voices
- Falls back to base character values when card values are blank

### Story Data
- `main`, `event`, `character`
- Character stories can target a card
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

## Current Known Problems
- Main current blocker: app sometimes does not fully open in browser after Cloudflare migration.
- The immediate cause earlier was broken `public/` asset placement.
- Another major cause was mojibake / corruption in `public/index.html` and `public/app.js`.
- `public/index.html` and `public/app.js` were restored from commit `dd5719c` as a temporary recovery base.
- Browser still needs hard refresh and re-check after restart.

## Important Recovery Notes
- Last known good commit for SPA navigation before Cloudflare migration troubles:
  - `dd5719c` `Refactor screens and restore navigation`
- After Cloudflare migration work, `public/index.html` and `public/app.js` were restored from that commit to get back to a stable UI baseline.

## Current Git State
- There are uncommitted local changes related to Cloudflare migration.
- `git status --short` previously showed:
  - modified:
    - `package.json`
    - `public/app.js`
    - `public/index.html`
  - untracked:
    - `functions/`
    - `public/api/`
    - `public/lib/`
    - `public/screens/`
    - `wrangler.toml`
    - `.wrangler/`
    - local wrangler logs

## What Must Not Be Deleted
- Do not delete [`functions/`](./functions) or [`wrangler.toml`](./wrangler.toml)
- Do not delete [`public/api`](./public/api), [`public/lib`](./public/lib), [`public/screens`](./public/screens)
- `.wrangler/` and `wrangler-dev*.log` are local artifacts and can be ignored or deleted later

## Current Runtime
- Cloudflare Pages + Functions + KV is the active runtime
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

## Next Steps After Restart
1. Run:
   - `wrangler.cmd pages dev public`
2. Open local URL and hard refresh
3. Verify first:
   - app shell opens
   - home screen appears
   - navigation works
4. Then verify API-backed save/load:
   - base character save
   - card save
   - story save
   - gacha save
   - system save
5. After all of the above are confirmed:
   - keep Cloudflare config as the source of truth
   - simplify `package.json`

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
- None of that is implemented yet in current Cloudflare migration

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
