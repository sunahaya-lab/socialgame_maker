# collection-screen split map 2026-03-31

> Priority Band: Strongly Active

## Current status

- `public/screens/collection-screen.js` is already relatively small.
- The main goal is not emergency shrinkage but boundary clarification.
- First extraction target is `card detail`.

## Current measured size

- `public/screens/collection-screen.js`
  - about `2,764` chars
  - about `106` lines
- `public/screens/collection-grid-runtime.js`
  - about `3,061` chars
  - about `82` lines
- `public/screens/collection-detail-runtime.js`
  - about `3,901` chars
  - about `112` lines

## Responsibility bands

### Extracted active path

- collection grid render
- rarity filter render
- card detail modal
- voice display
- linked story buttons

### Safe to keep local for now

- filter button binding
- modal open/close binding

### Watchlist

- rarity filter click binding
- modal open/close glue

## Safe next extraction order

1. `filter binding`
2. stop here unless modal/runtime drift appears
3. stop here unless inventory/runtime drift appears

## Current risk assessment

- `grid / filter render`: `Watchlist -> de-risked active path`
- `card detail`: `Watchlist -> de-risked active path`
- overall `collection-screen.js`: `Watchlist -> near-healthy thin screen shell`
