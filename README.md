# Socia Maker

Socia Maker is a lightweight fake social-game prototype. It lets you build a small in-app universe from original characters, card data, stories, and gacha banners, then browse it in a mobile-game style UI.

## Current Product Shape

- Single-page app with a small Node.js backend
- Mobile-style screens: Home, Gacha, Story, Collection, Editor
- Shared JSON storage through local API endpoints
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

## Data Model

The app stores four collections in `data/`.

- `base-chars.json`
- `entries.json`
- `stories.json`
- `gachas.json`

## API

- `GET /api/base-chars`
- `POST /api/base-chars`
- `GET /api/entries`
- `POST /api/entries`
- `GET /api/stories`
- `POST /api/stories`
- `GET /api/gachas`
- `POST /api/gachas`

All data is stored as JSON files on disk by the bundled Node server.

## Run

1. Run `npm start`
2. Open `http://localhost:3000`
3. Create base characters, cards, stories, and gachas in the editor
4. Browse them through the game-style screens

## Notes

- Base character deletion is currently local-only in the frontend and does not remove server-side JSON records
- Card form base-character selection exists in the UI, but the current card save flow does not persist that relationship
- Gacha `featured` selections are stored, but current pull logic still rolls from the rarity pool rather than featured weighting
