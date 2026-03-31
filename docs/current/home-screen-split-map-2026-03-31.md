# home-screen split map 2026-03-31

> Priority Band: Strongly Active

## Current status

- Active path extraction has started for `public/screens/home-screen.js`.
- `announcements` and `homeBgm` now run through dedicated runtimes:
  - `public/screens/home-announcement-runtime.js`
  - `public/screens/home-bgm-runtime.js`
- `dialogue state / relation choice / interaction binding` now also runs through:
  - `public/screens/home-dialogue-runtime.js`
- `currency / header display` now also runs through:
  - `public/screens/home-header-runtime.js`
- `event banner decision / display` now also runs through:
  - `public/screens/home-event-banner-runtime.js`
- `public/screens/home-screen.js` is back to a valid orchestrator after cleaning duplicated wrapper remnants.

## Current measured size

- `public/screens/home-screen.js`
  - about `7,171` chars
  - about `199` lines
- `public/screens/home-announcement-runtime.js`
  - about `4,318` chars
  - about `111` lines
- `public/screens/home-bgm-runtime.js`
  - about `1,582` chars
  - about `55` lines
- `public/screens/home-dialogue-runtime.js`
  - about `7,779` chars
  - about `193` lines
- `public/screens/home-header-runtime.js`
  - about `1,409` chars
  - about `38` lines
- `public/screens/home-event-banner-runtime.js`
  - about `3,198` chars
  - about `84` lines

## Responsibility bands

### Extracted active path

- announcements list render / visibility / action link handling
- home BGM volume / apply logic
- dialogue state / relation choice / interaction binding
- currency / header display
- event banner decision / display

### Remaining active core

- home render orchestration

### Legacy / cleanup watch

- small wrapper glue around announcement and BGM runtimes
- small wrapper glue around dialogue runtime
- small wrapper glue around header runtime
- small wrapper glue around event-banner runtime
- any future local helper that grows past simple orchestration

## Safe next extraction order

1. tighten remaining render orchestration
2. decide whether any remaining wrapper should stay local or move beside its runtime
3. stop here if no new runtime drift appears

## Current risk assessment

- `announcements`: `Watchlist -> de-risked active path`
- `homeBgm`: `Watchlist -> de-risked active path`
- `dialogue`: `Watchlist -> de-risked active path`
- `header / currency`: `Watchlist -> de-risked active path`
- `event banner`: `Watchlist -> de-risked active path`
- overall `home-screen.js`: `Watchlist -> near-healthy orchestrator`
