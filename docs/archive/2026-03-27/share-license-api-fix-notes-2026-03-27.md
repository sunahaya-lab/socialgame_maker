# Share And License API Fix Notes

Date: 2026-03-27
Scope:
- `functions/api/_share-auth.js`
- `functions/api/collab-share-resolve.js`
- `functions/api/collab-share-rotate.js`
- `functions/api/project-license.js`
- `functions/api/public-share-create.js`
- `functions/api/public-share-resolve.js`
- `migrations/0009_share_access_tables.sql`

## Summary

This document records issues found in the share/license API review that should be treated as fix-required items before the related changes are committed and pushed.

Priority order:
1. Fix owner impersonation in owner-only endpoints
2. Fix public share validity checks so license state is enforced after token issuance
3. Fix direct project access policy drift in shared access resolution
4. Fix mojibake in API strings

## 1. Owner-Only Endpoints Trust Caller-Supplied `user`

Severity: Critical

Affected files:
- `functions/api/_share-auth.js`
- `functions/api/collab-share-rotate.js`
- `functions/api/project-license.js`
- `functions/api/public-share-create.js`

Relevant lines:
- `_share-auth.js`: `getRequesterUserId()`
- `_share-auth.js`: `ensureProjectOwnerAccess()`
- owner-only endpoints call `ensureProjectOwnerAccess(...)`

Problem:
- `ensureProjectOwnerAccess()` determines the requester identity from:
  - query param `user`
  - request body `userId`
- It then compares that raw client-supplied value to `projects.owner_user_id`.
- There is no authenticated session, signed identity, or server-trusted principal involved in the check.

Why this must be fixed:
- Anyone who knows or can guess the owner user id can impersonate the owner.
- That grants access to:
  - rotating collaborative share tokens
  - reading project license state
  - creating or rotating public share tokens

Required fix direction:
- Do not use plain query/body `user` as the trust source for owner authorization.
- Introduce a server-trusted identity mechanism before treating these endpoints as owner-protected.
- Until real auth exists, either:
  - treat these endpoints as internal/dev-only and guard them explicitly, or
  - avoid presenting them as secure owner-protected features.

Recommended acceptance criteria:
- A forged `?user=<ownerId>` request cannot pass owner checks by itself.
- Owner-only operations require a server-verified identity, not only a client-provided identifier.

## 2. Public Share Tokens Stay Valid Even If License State Later Disables Sharing

Severity: High

Affected files:
- `functions/api/_share-auth.js`
- `functions/api/public-share-create.js`
- `functions/api/public-share-resolve.js`
- `functions/api/project-license.js`

Relevant lines:
- `_share-auth.js`: `resolvePublicShareToken()`
- `public-share-create.js`: paid/public-share checks before token issuance
- `project-license.js`: returns `public_share_enabled`, `license_plan`, `license_expires_at`
- migration defines `project_license_states`

Problem:
- `public-share-create.js` checks `licensePlan` and `publicShareEnabled` only when issuing the token.
- `resolvePublicShareToken()` validates only:
  - token existence
  - row status = `active`
- It does not re-check:
  - `project_license_states.public_share_enabled`
  - `project_license_states.license_plan`
  - `project_license_states.license_expires_at`

Why this must be fixed:
- A project can keep serving an old public token after licensing is disabled, downgraded, or expired.
- The intended paid/license gate becomes issuance-only instead of enforcement-at-access-time.

Required fix direction:
- On public token resolution, join or separately check current license state.
- Reject public share access when:
  - public sharing is disabled
  - plan is no longer eligible
  - license is expired, if expiration is part of the product model

Recommended acceptance criteria:
- A previously issued public token stops resolving if the project loses public-share entitlement.
- License expiry, if populated, is enforced consistently.

## 3. Shared Access Resolution Still Treats Plain `project` Access As Owner-Level

Severity: High

Affected file:
- `functions/api/_share-auth.js`

Relevant lines:
- `resolveShareAccess()`
- `accessMode: explicitProjectId ? "owner" : ...`

Problem:
- `resolveShareAccess()` still maps a plain `project` query parameter to:
  - `accessMode: "owner"`
  - `shareType: "direct"`
- This is not backed by any real ownership verification.

Why this must be fixed:
- It creates policy drift across the API layer.
- It also feeds into content endpoints that rely on `ensureWritableAccess()` and therefore over-trust direct project access.
- Even if owner-only endpoints separately call `ensureProjectOwnerAccess()`, the shared access model itself is still declaring unauthenticated project access as owner-level.

Required fix direction:
- Replace the direct `project => owner` mapping with a neutral or unauthenticated mode.
- Only elevate access after explicit authorization succeeds.
- Keep access resolution descriptive, not authoritative, when identity has not been proven.

Recommended acceptance criteria:
- `resolveShareAccess()` does not mark an unauthenticated direct project request as owner-equivalent.
- Access level only becomes writable/owner after a verified permission check.

## 4. Share And License API Strings Contain Mojibake

Severity: Medium

Affected files:
- `functions/api/_share-auth.js`
- `functions/api/collab-share-resolve.js`
- `functions/api/collab-share-rotate.js`
- `functions/api/project-license.js`
- `functions/api/public-share-create.js`
- `functions/api/public-share-resolve.js`

Problem:
- User-facing strings are stored as mojibake in multiple endpoints.
- This includes:
  - method-not-allowed messages
  - owner-required errors
  - invalid public/collab URL errors
  - D1-required errors
  - share creation/rotation failure messages

Why this must be fixed:
- These endpoints are meant to communicate access failures clearly.
- Broken text makes permission problems harder to understand and debug.
- It violates the repository UTF-8 policy.

Required fix direction:
- Restore all user-visible strings as valid UTF-8 Japanese text.
- Verify response payloads in actual API output, not only in terminal rendering.

Recommended acceptance criteria:
- Share and license error responses render as readable Japanese text.
- No mojibake remains in the reviewed files.

## Suggested Fix Order

1. `_share-auth.js`
- replace client-supplied owner identity trust
- stop treating direct project access as owner by default

2. `public-share-create.js` and `_share-auth.js`
- enforce live license state when resolving public tokens

3. owner-only endpoints
- re-check they all depend on the corrected authorization model

4. string repair
- restore all mojibake in share/license API sources

## Verification Checklist

- Forged `?user=<ownerId>` requests cannot rotate or create share tokens
- Public share tokens stop resolving when public sharing is disabled
- Public share tokens stop resolving when the relevant license is no longer valid
- Direct `?project=<id>` access is not treated as owner-level without verified authorization
- Invalid public and collab URLs return readable Japanese errors
- Owner-required errors return readable Japanese text

## Review Status

Current recommendation:
- Do not treat this share/license API batch as ready to push until the above items are fixed and re-reviewed.
