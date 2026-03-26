# Share Schema Draft

## Purpose

This document defines the first D1 schema draft for the share system described in:

- [share-spec.md](./share-spec.md)

The goal is to support two share modes without overloading the current `room` concept:

1. free collaborative share
2. paid public read/play share

This draft is intentionally practical. It focuses on:

- token issuance
- token rotation
- token revocation
- project resolution
- server-side permission checks

---

## Design Principles

1. `project` remains the canonical authored content root
- share links do not become a second content root

2. share links are access records, not content copies
- a share link resolves to one project
- player progress remains user-scoped

3. collaborative share and public share are different entities
- do not force both into one generic `room` table unless the schema still preserves separate semantics

4. token rotation must be cheap and explicit
- old tokens must become invalid immediately

5. permission must be resolvable from D1 on every write path
- UI hiding is not enough

---

## Recommended Entities

### Existing tables reused

- `projects`
- `users`
- `project_members`
- `player_profiles`

### New share-layer tables

- `project_collab_shares`
- `project_public_shares`
- `project_license_states`
- optional: `share_access_audit_logs`

---

## Table Overview

### project_collab_shares

Stores the currently active collaborative share URL state for one project.

This is the free share mode:

- edit allowed
- play allowed
- only one active token per project
- token rotation invalidates the previous token

### project_public_shares

Stores the currently active public share URL state for one project.

This is the paid share mode:

- edit forbidden
- play allowed
- one or more public share records can be supported
- initial recommendation is one active token per project for simplicity

### project_license_states

Stores monetization and entitlement flags for a project.

Initial practical use:

- whether public share is allowed

### share_access_audit_logs

Optional operational log table.

Useful for:

- token rotation history
- abuse investigation
- support workflows

Not required for first implementation.

---

## Recommended Tables

## 1. project_collab_shares

### Purpose

One active collaborative share per project.

### Recommended columns

- `project_id`
- `active_token`
- `version`
- `status`
- `rotated_by_user_id`
- `rotated_at`
- `created_at`
- `updated_at`

### Notes

- use `project_id` as the primary key
- collaborative share is conceptually singular per project
- rotating means replacing `active_token` and incrementing `version`

### Recommended SQL shape

```sql
CREATE TABLE project_collab_shares (
  project_id TEXT PRIMARY KEY,
  active_token TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  rotated_by_user_id TEXT,
  rotated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (rotated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_project_collab_shares_active_token
  ON project_collab_shares(active_token);
```

### Why singular instead of history rows

For the first implementation:

- project lookup by token is simple
- rotation is one row update
- "only one active token" is enforced naturally

If token history is needed later, add a separate history table instead of overcomplicating the active table.

---

## 2. project_public_shares

### Purpose

Public read/play share state for paid projects.

### Recommended columns

- `project_id`
- `active_token`
- `status`
- `access_mode`
- `snapshot_version`
- `rotated_by_user_id`
- `rotated_at`
- `created_at`
- `updated_at`

### Recommended SQL shape

```sql
CREATE TABLE project_public_shares (
  project_id TEXT PRIMARY KEY,
  active_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  access_mode TEXT NOT NULL DEFAULT 'play_only'
    CHECK (access_mode IN ('play_only')),
  snapshot_version INTEGER,
  rotated_by_user_id TEXT,
  rotated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (rotated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_project_public_shares_active_token
  ON project_public_shares(active_token);
```

### Notes

- `snapshot_version` is nullable because the first implementation may still resolve directly to live project content
- keep the column now so snapshot publishing can be added later without another conceptual redesign

---

## 3. project_license_states

### Purpose

Separates payment/entitlement state from share link state.

### Recommended columns

- `project_id`
- `public_share_enabled`
- `license_plan`
- `licensed_at`
- `license_expires_at`
- `created_at`
- `updated_at`

### Recommended SQL shape

```sql
CREATE TABLE project_license_states (
  project_id TEXT PRIMARY KEY,
  public_share_enabled INTEGER NOT NULL DEFAULT 0
    CHECK (public_share_enabled IN (0, 1)),
  license_plan TEXT NOT NULL DEFAULT 'free'
    CHECK (license_plan IN ('free', 'paid')),
  licensed_at TEXT,
  license_expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Notes

- first implementation only needs a boolean-style gate for paid public share
- `license_plan` is enough for now
- future license records can be normalized later if needed

---

## 4. share_access_audit_logs

### Purpose

Optional audit trail for share operations.

### Recommended columns

- `id`
- `project_id`
- `share_type`
- `event_type`
- `actor_user_id`
- `token_suffix`
- `metadata_json`
- `created_at`

### Recommended SQL shape

```sql
CREATE TABLE share_access_audit_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  share_type TEXT NOT NULL
    CHECK (share_type IN ('collab', 'public')),
  event_type TEXT NOT NULL
    CHECK (event_type IN ('create', 'rotate', 'disable', 'resolve_fail')),
  actor_user_id TEXT,
  token_suffix TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_share_access_audit_logs_project_created_at
  ON share_access_audit_logs(project_id, created_at DESC);
```

### Notes

- store only a safe token suffix, not the full token
- optional for v1

---

## Permission Resolution Model

## Share permission classes

### owner

Resolved from:

- `projects.owner_user_id`

### collaborative editor

Resolved from:

- valid `project_collab_shares.active_token`

### public player

Resolved from:

- valid `project_public_shares.active_token`

---

## Recommended runtime permission result

Every request that depends on share state should normalize into a single permission result:

```ts
type ShareAccessResult = {
  projectId: string | null;
  mode: "owner" | "edit_and_play" | "play_only" | "none";
  source: "owner" | "collab_token" | "public_token" | "none";
  shareTokenVersion?: number | null;
};
```

### Meaning

- `owner`
  - full access
- `edit_and_play`
  - collaborative share
- `play_only`
  - public share
- `none`
  - invalid token or no access

---

## Token Resolution Queries

## Collaborative share resolve

```sql
SELECT project_id, version, status
FROM project_collab_shares
WHERE active_token = ?
LIMIT 1;
```

Valid only when:

- row exists
- `status = 'active'`

## Public share resolve

```sql
SELECT project_id, status, access_mode, snapshot_version
FROM project_public_shares
WHERE active_token = ?
LIMIT 1;
```

Valid only when:

- row exists
- `status = 'active'`

---

## Rotation Flows

## Collaborative share rotate

### Goal

Invalidate the previous free collaborative URL immediately.

### Recommended transaction logic

1. confirm caller is project owner
2. generate new token
3. upsert `project_collab_shares`
4. increment `version`
5. set `rotated_by_user_id`
6. set `rotated_at`, `updated_at`

### Upsert pattern

```sql
INSERT INTO project_collab_shares (
  project_id,
  active_token,
  version,
  status,
  rotated_by_user_id,
  rotated_at,
  created_at,
  updated_at
)
VALUES (?, ?, 1, 'active', ?, ?, ?, ?)
ON CONFLICT(project_id) DO UPDATE SET
  active_token = excluded.active_token,
  version = project_collab_shares.version + 1,
  status = 'active',
  rotated_by_user_id = excluded.rotated_by_user_id,
  rotated_at = excluded.rotated_at,
  updated_at = excluded.updated_at;
```

## Public share rotate

Same pattern, but only allowed when:

- project has paid license enabled

---

## Recommended Token Format

### Minimum requirement

- high entropy
- URL safe
- not guessable

### Recommendation

- 24 to 40 bytes random, base64url encoded

Do not use:

- short human-readable ids
- sequential numbers

### Storage rule

For the first implementation, storing the raw token in D1 is acceptable if:

- it is generated server-side
- it is only returned once on issuance/rotation

Future hardening option:

- store token hash instead of raw token

That can come later if threat model requires it.

---

## Interaction With Player State

Player state should not be keyed directly by share token.

That would make token rotation behave like data loss for users.

### Recommended player-state anchor

- `project_id`
- `user_id`

### Recommended request context extras

- `access_mode`
- `share_type`

These values are useful for UI and permission checks, but should not become the core identity for saved progress.

### Important implication

When a collaborative token rotates:

- authored content access changes
- player progress should still resolve by the same `project + user`

This avoids the exact bug class where "share URL changed, so all saved state looks gone".

---

## Suggested API Mapping

## New APIs

### Collaborative share

- `POST /api/collab-share/rotate`
- `GET /api/collab-share/resolve`
- optional: `POST /api/collab-share/disable`

### Public share

- `POST /api/public-share/create`
- `POST /api/public-share/rotate`
- `GET /api/public-share/resolve`
- `POST /api/public-share/disable`

### License

- `GET /api/project-license`
- `POST /api/project-license`

---

## Recommended Middleware Direction

Introduce a shared Functions helper, for example:

- `functions/api/_share-auth.js`

Responsibilities:

1. read URL token inputs
2. resolve project from collab token or public token
3. determine permission mode
4. reject editor writes when mode is `play_only`
5. expose normalized access result to handlers

This should become the single place that replaces the current loose `room` behavior.

---

## Migration Direction From Current `room`

Current `room` mixes:

- share identity
- local storage scope
- project-like access routing

That is too ambiguous for the productized share model.

### Recommended migration

1. stop using `room` as the long-term share primitive
2. introduce `collab` token and `share` token separately
3. resolve tokens to `project_id` on the server
4. keep local browser state anchored to `project_id`

### Temporary bridge

If needed during migration:

- treat current `room` as legacy collaborative share only
- do not use it for paid public share

---

## Open Decisions

### Still open

1. whether `project_public_shares` should allow multiple simultaneous public tokens
2. whether public shares should point to live project data or published snapshots first
3. whether token hashing is needed immediately or later
4. whether collaborative share participants eventually need identities beyond anonymous user ids

---

## Default Recommendation

For the first serious implementation:

1. add `project_collab_shares`
2. add `project_public_shares`
3. add `project_license_states`
4. keep one active token per project for each share type
5. resolve permission server-side on every write endpoint
6. anchor player progress to `project_id + user_id`, not share token

This gives a stable base for:

- safe free collaborative links
- paid public links
- future snapshot publishing
- future auth/member expansion
