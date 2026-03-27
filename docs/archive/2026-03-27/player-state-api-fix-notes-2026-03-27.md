# Player State API Fix Notes

Date: 2026-03-27
Scope:
- `functions/api/_player-state.js`
- `functions/api/player-bootstrap.js`
- `functions/api/player-gacha-pulls.js`
- `functions/api/player-home-preferences.js`
- `functions/api/player-profile.js`
- `functions/api/player-story-progress.js`

## Summary

This document records issues found in the player-state API review that should be treated as fix-required items before the related changes are committed and pushed.

Priority order:
1. Fix gacha result trust and integrity issues
2. Fix currency deduction and save atomicity
3. Fix invalid-result charging behavior
4. Fix mojibake in API error messages

## 1. Gacha Results Are Trusted From Client Input

Severity: Critical

Affected file:
- `functions/api/player-gacha-pulls.js`

Problem:
- The API accepts `body.results` from the client and writes them directly into `gacha_pull_history` and `player_inventories`.
- The current checks only verify that the referenced gacha and cards exist.
- There is no server-side validation that the submitted cards are actually valid outcomes for the specified gacha.
- There is no server-side enforcement of rarity rates or featured pool rules.

Why this must be fixed:
- A client can submit arbitrary `cardId` and `rarityAtPull` values.
- This allows unauthorized card acquisition.
- This breaks the documented behavior that gacha rates depend on the configured system rules.

Required fix direction:
- Move gacha result determination to the server side, or
- At minimum, validate submitted results against the gacha definition, allowed pool, and rarity constraints on the server.
- Do not treat client-submitted pull results as authoritative.

Recommended acceptance criteria:
- A client cannot obtain a card that is not in the target gacha pool.
- A client cannot forge `rarityAtPull`.
- Pull results are determined or fully validated by the server before inventory is updated.

## 2. Currency Deduction And Result Saving Are Not Atomic

Severity: High

Affected file:
- `functions/api/player-gacha-pulls.js`

Problem:
- Gems are deducted before pull history and inventory writes complete.
- The endpoint then performs multiple inserts and upserts in sequence.
- If any step fails after deduction, the player can lose currency without receiving the full saved result set.

Why this must be fixed:
- This creates player-state corruption.
- It can produce partial writes:
  - gems deducted
  - some history rows inserted
  - some inventory rows updated
  - later rows missing

Required fix direction:
- Make the entire pull operation atomic.
- Use a transaction or equivalent all-or-nothing write strategy for:
  - currency deduction
  - pull history inserts
  - inventory upserts
- If the environment cannot guarantee atomicity in the current structure, redesign the endpoint so the result is persisted consistently before any irreversible deduction is finalized.

Recommended acceptance criteria:
- Either all pull effects are saved, or none are.
- A mid-operation failure does not leave reduced currency behind.

## 3. Invalid Submitted Results Can Still Consume Currency

Severity: Medium

Affected file:
- `functions/api/player-gacha-pulls.js`

Problem:
- Cost is computed from `results.length`.
- Invalid entries are skipped later with `continue`.
- This allows a request to consume gems even when some or all submitted entries are discarded.

Examples of currently skippable invalid entries:
- missing `cardId`
- missing `rarityAtPull`
- nonexistent card

Why this must be fixed:
- The endpoint can return success with fewer saved results than the charged count.
- In the worst case, the request can charge currency and save zero valid results.

Required fix direction:
- Validate the full pull payload before charging, or
- Generate the pull results entirely on the server so this class of mismatch cannot occur.
- Reject the request if the result set is malformed or inconsistent.

Recommended acceptance criteria:
- Charged pull count always matches persisted result count.
- A malformed payload is rejected before any currency update occurs.

## 4. API Error Messages Are Mojibake

Severity: Medium

Affected files:
- `functions/api/_player-state.js`
- `functions/api/player-bootstrap.js`
- `functions/api/player-gacha-pulls.js`
- `functions/api/player-home-preferences.js`
- `functions/api/player-profile.js`
- `functions/api/player-story-progress.js`

Problem:
- Several user-facing error strings were changed to Japanese, but the source now contains mojibake text.
- These strings are returned in JSON responses and will surface in the UI as broken text.

Why this must be fixed:
- It violates the project's UTF-8 text policy.
- It degrades user-facing API error handling.
- It makes future review harder because true string content is no longer readable in source.

Required fix direction:
- Restore these strings as valid UTF-8 Japanese text.
- Verify the actual file bytes and browser/API output, not PowerShell glyph rendering alone.
- Prefer the established UTF-8 workflow noted in `AGENTS.md`.

Recommended acceptance criteria:
- Error responses render as valid Japanese in the browser and API responses.
- Edited files remain UTF-8 without BOM unless the project explicitly requires otherwise.

## Suggested Fix Order

1. `player-gacha-pulls.js`
- Eliminate trust in client-submitted results
- Make deduction and persistence atomic
- Reject malformed result sets before charging

2. Remaining player-state endpoints
- Repair mojibake in all returned error messages

3. Verification
- Confirm `project + user` scoping still behaves correctly
- Confirm bootstrap response shape is unchanged except for intended fields
- Confirm story/home endpoints still return readable Japanese errors

## Verification Checklist

- POST invalid gacha payload does not deduct gems
- POST mixed valid/invalid results is rejected, not partially saved
- Forced failure during inventory/history persistence does not leave reduced gems
- Pull result count matches charged count
- API errors display readable Japanese text
- `player-bootstrap` still returns:
  - `profile`
  - `inventory`
  - `gachaHistory`
  - `storyProgress`
  - `homePreferences`
  - `currencies`

## Review Status

Current recommendation:
- Do not treat this player-state API batch as ready to push until the above items are fixed and re-reviewed.
