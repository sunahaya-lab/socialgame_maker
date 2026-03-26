# Shared Content API Fix Notes

Date: 2026-03-27
Scope:
- `functions/api/_share-auth.js`
- `functions/api/base-chars.js`
- `functions/api/entries.js`
- `functions/api/gachas.js`
- `functions/api/projects.js`
- `functions/api/stories.js`
- `functions/api/system.js`
- `functions/api/equipment-cards.js`

## Summary

This document records issues found in the shared-content API review that should be treated as fix-required items before the related changes are committed and pushed.

Priority order:
1. Fix project write authorization bypass
2. Fix missing D1 storage path for equipment cards
3. Fix backward-incompatible system config coercion
4. Fix project endpoint scope drift
5. Fix mojibake in API strings

## 1. Project Write Authorization Is Effectively Bypassed

Severity: Critical

Affected files:
- `functions/api/_share-auth.js`
- `functions/api/base-chars.js`
- `functions/api/entries.js`
- `functions/api/gachas.js`
- `functions/api/stories.js`
- `functions/api/system.js`
- `functions/api/equipment-cards.js`

Relevant lines:
- `_share-auth.js`: `accessMode: explicitProjectId ? "owner" ...`
- `_share-auth.js`: `ensureWritableAccess(...)`
- content endpoints: each POST path only calls `ensureWritableAccess(access, corsHeaders)`

Problem:
- `resolveShareAccess()` treats any request with a `project` query parameter as `accessMode: "owner"`.
- `ensureWritableAccess()` only blocks invalid tokens and `play_only` public shares.
- The content endpoints do not call `ensureProjectOwnerAccess()`.
- As a result, a client can write project-scoped shared content by sending `?project=<id>` without proving ownership.

Why this must be fixed:
- Shared editor data is supposed to be collaboratively scoped, not anonymously writable by anyone who knows a project id.
- This is an authorization failure across all shared content write endpoints.
- The risk applies to:
  - base characters
  - cards
  - stories
  - gachas
  - system config
  - equipment cards

Required fix direction:
- Do not map plain `project` access to `owner` automatically.
- Require real owner or member validation for direct project writes.
- Use `ensureProjectOwnerAccess()` or a proper project-member permission check in POST handlers.
- Keep public share tokens read-only.
- Keep collab tokens scoped to the permissions they are intended to grant.

Recommended acceptance criteria:
- A direct `?project=<id>` request without valid owner/member identity cannot write shared content.
- Public share URLs cannot write.
- Collab/direct access behavior is explicit and verified, not inferred from the presence of a query parameter.

## 2. Equipment Cards Have No Confirmed D1 Schema Backing

Severity: High

Affected files:
- `functions/api/equipment-cards.js`

Related evidence:
- code references `equipment_card_registries`
- no matching migration was found under `migrations/`

Problem:
- The new endpoint reads and writes `equipment_card_registries`.
- No migration for that table was found in the repository review.
- The endpoint silently falls back to KV if the D1 query fails.

Why this must be fixed:
- The current architecture direction is D1-first for shared project content.
- Silent fallback can hide a production schema miss.
- This creates split persistence behavior:
  - some content types in D1
  - equipment cards in KV
- That makes debugging, migration, and consistency harder.

Required fix direction:
- Add and apply the D1 migration for `equipment_card_registries`, or
- Explicitly document that equipment cards are KV-only for now and block D1 code paths until the schema exists.
- Avoid silently pretending the feature is fully integrated when it is not.

Recommended acceptance criteria:
- A migration exists for `equipment_card_registries`.
- Local and remote environments both support the same storage path.
- The endpoint does not rely on silent fallback to mask a missing table.

## 3. System Config Sanitization Breaks Backward Compatibility For Orientation

Severity: Medium

Affected file:
- `functions/api/system.js`

Relevant lines:
- `defaultSystemConfig()` now defaults `orientation` to `"portrait"`
- `sanitizeSystemConfig()` only accepts `"portrait"`, `"landscape"`, `"fullscreen"`

Related evidence:
- `migrations/0001_v2_initial.sql` still shows `orientation TEXT NOT NULL DEFAULT 'auto'`

Problem:
- Older data and schema defaults still use `orientation: "auto"`.
- The new sanitizer no longer accepts `"auto"`.
- Any saved or loaded system config that still uses `"auto"` will be coerced to `"portrait"` on save.

Why this must be fixed:
- This is a behavioral regression, not just a field rename.
- It changes existing project behavior without an explicit migration.
- The CSS and older docs still refer to device-orientation-driven behavior.

Required fix direction:
- Either preserve `"auto"` as a supported value, or
- Introduce an explicit data migration and runtime migration path before changing the default behavior.
- Do not silently coerce old data into a different orientation mode.

Recommended acceptance criteria:
- Existing projects with `orientation: "auto"` keep the intended behavior after load/save.
- If `"auto"` is being retired, the migration is explicit and documented.

## 4. Projects Endpoint Still Uses Legacy Room/Global Scope And Is Out Of Step

Severity: Medium

Affected file:
- `functions/api/projects.js`

Problem:
- `projects.js` still keys data by `room` or `global`.
- It does not use `resolveShareAccess()` or `buildContentScope()`.
- It does not participate in the new project/share permission model used by the other shared content endpoints.

Why this must be fixed:
- The rest of the shared-content APIs are moving to project/share-aware scope resolution.
- Leaving projects on a separate legacy scope model makes behavior inconsistent.
- It also makes authorization policy uneven across the API surface.

Required fix direction:
- Align `projects.js` with the same scope and permission model used by the other shared content endpoints, or
- Explicitly document why project listing/creation is intentionally separate and how it is secured.

Recommended acceptance criteria:
- Project endpoint scope resolution matches the intended project/share architecture.
- Authorization expectations are consistent across the shared content API surface.

## 5. API Strings Contain Mojibake

Severity: Medium

Affected files:
- `functions/api/base-chars.js`
- `functions/api/entries.js`
- `functions/api/gachas.js`
- `functions/api/projects.js`
- `functions/api/stories.js`
- `functions/api/system.js`
- `functions/api/equipment-cards.js`
- `functions/api/_share-auth.js`

Problem:
- Several user-facing strings are stored as mojibake.
- This includes:
  - method-not-allowed responses
  - default names such as project/card/story/gacha/base-character labels
  - equipment-card strings that appear to be double-garbled

Why this must be fixed:
- These strings are user-visible through API responses or default content creation paths.
- It violates the repository UTF-8 policy.
- It increases the risk of corrupted source spreading into saved project data.

Required fix direction:
- Restore the source text as valid UTF-8 Japanese.
- Recheck file bytes with the UTF-8 workflow described in `AGENTS.md`.
- Verify both source readability and API output readability.

Recommended acceptance criteria:
- Default generated labels render as proper Japanese.
- Error responses render as proper Japanese.
- No mojibake remains in the reviewed shared-content API files.

## Suggested Fix Order

1. `_share-auth.js` and all POST content endpoints
- close the authorization gap first

2. `equipment-cards.js` and schema support
- add or confirm D1 migration path

3. `system.js`
- restore backward compatibility for `orientation`

4. `projects.js`
- align scope and permission handling with the project/share model

5. String repair
- restore all mojibake in shared-content API sources

## Verification Checklist

- Direct `?project=<id>` POST without valid ownership or membership is rejected
- Public share token can read but cannot write
- Collaborative share token write behavior matches intended permission policy
- `equipment-cards` works against D1 without falling back due to missing schema
- Existing `orientation: "auto"` config survives round-trip save/load correctly, or a documented migration handles it
- `projects` API behavior matches the active project/share architecture
- All reviewed API responses and default labels display valid Japanese text

## Review Status

Current recommendation:
- Do not treat this shared-content API batch as ready to push until the above items are fixed and re-reviewed.
