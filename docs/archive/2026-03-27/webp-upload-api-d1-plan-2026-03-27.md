# WebP Upload API / D1 Change Plan 2026-03-27

## Purpose

This document translates the `requirements-v0.4.md` static-image normalization
rules into concrete API and D1 change proposals for the current Cloudflare
architecture.

It assumes:

- binary payloads live in R2
- metadata lives in D1 when available
- the existing `assets` table from the v2 schema remains the base table

## Current Baseline

The current v2 schema already defines an `assets` table with these useful base
fields:

- `id`
- `project_id`
- `kind`
- `r2_key`
- `mime_type`
- `byte_size`
- `width`
- `height`
- `original_filename`

This means the first-pass WebP normalization work should extend the current
asset model rather than introduce a second competing asset table.

## Main Design Decision

Static upload normalization should be modeled as:

- one canonical stored object in R2
- one canonical metadata row in D1
- optional derivative metadata only if the first pass truly needs it

The canonical stored object should be the normalized `WebP`, not the original
uploaded PNG/JPG.

## D1 Schema Change Goals

The schema changes should make these things explicit:

- what the stored format is
- what usage type the asset was normalized for
- whether a file is canonical or derivative
- who owns the quota usage
- what pipeline version normalized the file

## Recommended `assets` Table Extensions

The existing `assets` table should be extended with the following columns.

### Ownership and quota columns

- `owner_user_id TEXT`
- `quota_bytes INTEGER`

Reason:

- current product direction treats binary assets as user-owned
- project references should not be the same thing as quota ownership
- `quota_bytes` should represent the stored bytes charged to the owner

### Normalization columns

- `stored_format TEXT`
- `usage_type TEXT`
- `normalization_status TEXT`
- `normalization_version TEXT`

Reason:

- `mime_type` alone is not enough when product rules care specifically about
  canonical `WebP`
- `usage_type` is needed for resize policy
- `normalization_status` helps detect failed or partial records if a write
  boundary is ever crossed

### Source audit columns

- `source_mime_type TEXT`
- `source_byte_size INTEGER`
- `source_width INTEGER`
- `source_height INTEGER`

Reason:

- the original file is not retained, but limited source metadata is still useful
  for debugging and analytics

### Derivative columns

Only add these if the first pass stores derivatives immediately:

- `thumbnail_r2_key TEXT`
- `thumbnail_width INTEGER`
- `thumbnail_height INTEGER`
- `thumbnail_byte_size INTEGER`
- `preview_r2_key TEXT`
- `preview_width INTEGER`
- `preview_height INTEGER`
- `preview_byte_size INTEGER`

If the first pass does not persist derivatives, do not add this complexity yet.

## Minimal First Migration Recommendation

If we want the smallest safe migration, add only:

- `owner_user_id`
- `stored_format`
- `usage_type`
- `quota_bytes`
- `source_mime_type`
- `source_byte_size`
- `source_width`
- `source_height`
- `normalization_status`
- `normalization_version`

This is enough to support canonical `WebP` storage without overcommitting to a
thumbnail schema too early.

## Suggested D1 Migration Name

The next migration could be named along the lines of:

- `0012_asset_webp_normalization.sql`

That keeps the sequence aligned with the current migration set.

## Proposed Column Semantics

### `stored_format`

Examples:

- `webp`
- `animated-webp`
- `ogg`
- `opus`

This is more product-useful than raw MIME alone.

### `usage_type`

Initial static values:

- `portrait`
- `expression`
- `card`
- `banner`
- `background`
- `generic`

This is intentionally separate from the older `kind` column.

Recommended distinction:

- `kind` = product slot / business role
- `usage_type` = processing rule bucket

### `normalization_status`

Initial values:

- `pending`
- `ready`
- `failed`

First-pass simplification:

- rows should ideally be written only after success
- even then, the status field is still useful for future async workflows

## `kind` vs `usage_type`

The current `assets.kind` column should remain.

Recommended separation:

- `kind`
  - where the asset is used in product terms
  - example: `card-image`, `gacha-banner`
- `usage_type`
  - how the asset should be processed
  - example: `card`, `banner`

This avoids overloading one field with two jobs.

## Ownership Model Changes

The current `assets` table uses `project_id`, but the product direction also
needs user ownership.

Recommended first-pass rule:

- keep `project_id` because the current app already relies on project scoping
- add `owner_user_id` for quota ownership and membership cleanup logic

This matches the already agreed product direction better than trying to remove
`project_id` immediately.

## API Shape Recommendation

The upload flow should use a dedicated asset upload endpoint instead of hiding
normalization inside unrelated editor save endpoints.

Recommended new endpoint family:

- `POST /api/assets/upload`
- `GET /api/assets?project=...`
- `GET /api/assets/:id`
- `DELETE /api/assets/:id` later if needed

The first critical piece is `POST /api/assets/upload`.

## `POST /api/assets/upload` Responsibilities

This endpoint should:

1. verify the uploading user context
2. verify project access
3. validate the file type and size
4. resolve usage type
5. inspect dimensions
6. resize if needed
7. encode to `WebP`
8. write canonical object to R2
9. insert metadata row in D1
10. update quota usage
11. return normalized metadata JSON

## Request Shape Recommendation

The upload request should eventually carry:

- `project`
- `user`
- `usageType`
- file payload

If auth is later formalized, user identity should move from query/body into the
session layer, but the current app can still use the existing project/user
patterns for the first pass.

## Response Shape Recommendation

The upload response should return at least:

- `id`
- `projectId`
- `ownerUserId`
- `kind` if applicable
- `usageType`
- `storedFormat`
- `mimeType`
- `byteSize`
- `width`
- `height`
- `originalFilename`
- `r2Key`

This is enough for editor and picker integration.

## Failure Behavior

If any processing step fails:

- do not insert a final ready row
- do not charge quota
- do not return a fake asset success response

If a partial R2 write happens before metadata failure:

- the implementation should try to delete the partial object
- if cleanup fails, log it as an orphan cleanup issue rather than pretending the
  upload succeeded

## Quota Integration Recommendation

The API layer should calculate quota impact from:

- canonical stored bytes
- any persisted derivative bytes, if derivatives are added later

Recommended implementation split:

- asset row stores `quota_bytes`
- owner-level quota aggregation reads from asset rows or from a separate cached
  usage table later

For the first pass, row-level truth is simpler.

## Suggested D1 Query Patterns

Useful first-pass access patterns:

- assets by `project_id`
- assets by `owner_user_id`
- assets by `project_id + usage_type`
- assets by `kind`

Recommended new indexes:

- `idx_assets_owner_user_id`
- `idx_assets_usage_type`
- `idx_assets_project_usage_type`

## Frontend Client Integration

The current frontend client layer under
[`public/api/client.js`](C:/Users/suzuma/Documents/socia_maker/public/api/client.js)
should eventually get:

- `uploadAsset(...)`
- `listAssets(...)`

The first implementation should keep the response model explicit enough for:

- card image picking
- banner image picking
- home asset placement

## UI Integration Order

Recommended UI hookup order:

1. card image upload
2. gacha banner upload
3. home asset upload/picker
4. base character portrait upload
5. story background upload

This order follows the shortest user-facing product path first.

## Migration Safety Notes

Because the repo already has transitional and v2 schemas in flight:

- do not silently mutate older transitional bridge tables
- keep the `assets` extension scoped to the v2 path
- make migration intent explicit in both schema docs and SQL migration naming

## Schema Doc Update Recommendation

When implementation starts, also update
[`schema-v2.md`](C:/Users/suzuma/Documents/socia_maker/docs/current/schema-v2.md)
to clarify:

- canonical static storage is normalized `WebP`
- originals are not retained by default
- `assets.kind` and `assets.usage_type` are separate concepts
- `owner_user_id` carries quota ownership

## First Implementation Cut Recommendation

The narrowest useful API/D1 delivery is:

1. extend `assets`
2. add `POST /api/assets/upload`
3. support one generic static usage type
4. normalize to `WebP`
5. return metadata
6. consume it in one editor path first

The best first editor path is likely card image upload because it is the most
visible and part of the shortest product loop.

## Current Working Conclusion

The API/D1 plan should treat `WebP` normalization as an explicit asset pipeline,
not as an incidental side effect of card or banner saving.

The first safe architecture is:

- canonical normalized asset in R2
- canonical metadata row in D1
- explicit owner-based quota fields
- one upload endpoint responsible for validation and normalization
