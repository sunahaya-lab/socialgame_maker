# WebP Upload Migration SQL Draft 2026-03-27

## Purpose

This document provides a draft SQL migration for the static-image `WebP`
normalization work described in:

- [`requirements-v0.4.md`](C:/Users/suzuma/Documents/socia_maker/docs/specs/requirements-v0.4.md)
- [`webp-upload-implementation-plan-2026-03-27.md`](C:/Users/suzuma/Documents/socia_maker/docs/current/webp-upload-implementation-plan-2026-03-27.md)
- [`webp-upload-api-d1-plan-2026-03-27.md`](C:/Users/suzuma/Documents/socia_maker/docs/current/webp-upload-api-d1-plan-2026-03-27.md)

This is a draft, not an applied migration.

## Migration Intent

The current v2 schema already has an `assets` table.

This draft extends that table so the app can represent:

- owner-based quota responsibility
- canonical stored format
- processing usage bucket
- source-image audit metadata
- normalization pipeline status

## Recommended Migration Name

- `0012_asset_webp_normalization.sql`

## Draft SQL

```sql
-- 0012_asset_webp_normalization.sql
-- Extend v2 assets for static image normalization and owner-based quota tracking.

ALTER TABLE assets ADD COLUMN owner_user_id TEXT;
ALTER TABLE assets ADD COLUMN stored_format TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE assets ADD COLUMN usage_type TEXT NOT NULL DEFAULT 'generic';
ALTER TABLE assets ADD COLUMN quota_bytes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE assets ADD COLUMN source_mime_type TEXT;
ALTER TABLE assets ADD COLUMN source_byte_size INTEGER;
ALTER TABLE assets ADD COLUMN source_width INTEGER;
ALTER TABLE assets ADD COLUMN source_height INTEGER;
ALTER TABLE assets ADD COLUMN normalization_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE assets ADD COLUMN normalization_version TEXT NOT NULL DEFAULT 'v1';

CREATE INDEX IF NOT EXISTS idx_assets_owner_user_id ON assets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_assets_usage_type ON assets(usage_type);
CREATE INDEX IF NOT EXISTS idx_assets_project_usage_type ON assets(project_id, usage_type);
CREATE INDEX IF NOT EXISTS idx_assets_normalization_status ON assets(normalization_status);
```

## Column-by-Column Rationale

### `owner_user_id`

Purpose:

- identifies who actually owns the binary asset
- supports account-based quota logic
- keeps ownership separate from `project_id`

Reason not to remove `project_id` yet:

- current schema and app flow still rely on project scoping
- this is a safer additive migration

### `stored_format`

Purpose:

- records the canonical persisted format

Examples:

- `webp`
- `animated-webp`
- `ogg`
- `opus`

Why not rely on `mime_type` only:

- product logic cares about normalized storage class, not only raw MIME

### `usage_type`

Purpose:

- records the processing bucket used during upload normalization

Initial values:

- `portrait`
- `expression`
- `card`
- `banner`
- `background`
- `generic`

### `quota_bytes`

Purpose:

- explicit byte count charged to the owner quota

This should reflect:

- canonical normalized bytes
- plus derivative bytes later if those are persisted and counted

### `source_mime_type`

Purpose:

- records the uploaded source MIME before conversion

Useful for:

- debugging
- metrics
- future migration and cleanup work

### `source_byte_size`

Purpose:

- records uploaded source size before normalization

Useful for:

- measuring compression savings
- diagnosing user complaints

### `source_width` / `source_height`

Purpose:

- records uploaded source dimensions before resize

Useful for:

- tracing resize decisions
- analytics

### `normalization_status`

Purpose:

- allows the system to represent upload pipeline state

Recommended values:

- `pending`
- `ready`
- `failed`

Even if the first implementation aims for write-on-success only, this is still
useful for later async workflows.

### `normalization_version`

Purpose:

- records which normalization rule set produced the stored asset

This helps future reprocessing if quality or resize defaults change.

## Optional Later Migration

If the first implementation later decides to persist derivatives, add them in a
separate migration instead of overloading the first one.

Possible later columns:

```sql
ALTER TABLE assets ADD COLUMN thumbnail_r2_key TEXT;
ALTER TABLE assets ADD COLUMN thumbnail_width INTEGER;
ALTER TABLE assets ADD COLUMN thumbnail_height INTEGER;
ALTER TABLE assets ADD COLUMN thumbnail_byte_size INTEGER;
ALTER TABLE assets ADD COLUMN preview_r2_key TEXT;
ALTER TABLE assets ADD COLUMN preview_width INTEGER;
ALTER TABLE assets ADD COLUMN preview_height INTEGER;
ALTER TABLE assets ADD COLUMN preview_byte_size INTEGER;
```

This should be delayed until derivatives are truly needed.

## Suggested Backfill Strategy

Because older rows may already exist, the first deployment should define how
legacy rows behave.

Recommended first-pass assumptions for old rows:

- `stored_format`
  - infer from existing `mime_type` where possible
- `usage_type`
  - default to `generic`
- `quota_bytes`
  - backfill from existing `byte_size`
- `normalization_status`
  - use `ready` for already-valid rows if they are actively in use

If inference is too risky, keep defaults and let later repair scripts normalize
legacy metadata explicitly.

## Safer Two-Step Alternative

If the team wants lower migration risk, use two steps:

### Step 1

- add nullable columns first
- add indexes

### Step 2

- run a backfill script
- only later tighten defaults or assumptions if needed

This is safer when production data quality is uncertain.

## Recommended First Applied Variant

For the first real migration, the safest practical variant is:

```sql
ALTER TABLE assets ADD COLUMN owner_user_id TEXT;
ALTER TABLE assets ADD COLUMN stored_format TEXT DEFAULT 'unknown';
ALTER TABLE assets ADD COLUMN usage_type TEXT DEFAULT 'generic';
ALTER TABLE assets ADD COLUMN quota_bytes INTEGER DEFAULT 0;
ALTER TABLE assets ADD COLUMN source_mime_type TEXT;
ALTER TABLE assets ADD COLUMN source_byte_size INTEGER;
ALTER TABLE assets ADD COLUMN source_width INTEGER;
ALTER TABLE assets ADD COLUMN source_height INTEGER;
ALTER TABLE assets ADD COLUMN normalization_status TEXT DEFAULT 'pending';
ALTER TABLE assets ADD COLUMN normalization_version TEXT DEFAULT 'v1';

CREATE INDEX IF NOT EXISTS idx_assets_owner_user_id ON assets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_assets_usage_type ON assets(usage_type);
CREATE INDEX IF NOT EXISTS idx_assets_project_usage_type ON assets(project_id, usage_type);
CREATE INDEX IF NOT EXISTS idx_assets_normalization_status ON assets(normalization_status);
```

This avoids forcing `NOT NULL` onto rows that predate the new pipeline.

## Post-Migration App Expectations

After this migration, the app should be able to:

- charge quota to the asset owner
- distinguish source metadata from stored normalized metadata
- identify `webp` as the canonical static format
- group assets by upload processing bucket
- evolve the normalization pipeline later without schema ambiguity

## Follow-Up Work Required

This migration alone does not finish the feature.

Still required:

- upload API implementation
- R2 write path
- resize and `WebP` encode logic
- quota aggregation logic
- UI upload messaging
- optional backfill / repair for legacy rows

## Current Working Conclusion

The migration should extend the existing `assets` table rather than replace it.

The first applied SQL should stay additive and conservative:

- ownership column
- normalization columns
- source audit columns
- processing indexes
```
