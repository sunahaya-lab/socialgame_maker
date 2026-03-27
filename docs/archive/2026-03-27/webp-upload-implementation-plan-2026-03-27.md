# WebP Upload Implementation Plan 2026-03-27

## Purpose

This document turns `requirements-v0.4.md` into an implementation-oriented task
breakdown.

The goal is to make static image upload normalization concrete enough to build
in the current Cloudflare Pages + Functions + D1/KV architecture without
reopening the product-level decisions.

## Scope

This plan covers only static image uploads.

Included:

- upload validation
- static image resize rules
- `WebP` re-encode rules
- storage accounting impact
- metadata persistence
- derivative image policy for the first pass

Explicitly out of scope:

- APNG / GIF animated workflow implementation
- paid publish licensing implementation
- home editor redesign work beyond asset intake

## First-Pass Product Behavior

The first implementation should satisfy the following visible behavior:

- users can upload `png`, `jpg`, `jpeg`, or `webp`
- the system validates size and format first
- the system resizes large static images to the allowed max edge
- the system re-encodes static images to `WebP`
- the system stores the normalized `WebP` as the canonical source file
- the system does not retain the uploaded original by default
- quota usage is updated from the stored normalized file

## Recommended Delivery Phases

### Phase 1: validation and metadata skeleton

Deliver:

- accepted input format checks
- upload usage-type classification field
- max file and dimension validation
- asset metadata structure for normalized output

This phase should not yet expose a half-working upload UX.

### Phase 2: static resize and `WebP` conversion

Deliver:

- image decode
- resize by usage type
- `WebP` lossy encode
- canonical asset save
- quota update after successful save

This is the first user-meaningful milestone.

### Phase 3: editor and picker integration

Deliver:

- asset upload UI copy updates
- usage-type selector
- normalized-image consumption in card/home/banner flows
- basic upload failure messaging

### Phase 4: optional derivatives

Deliver only if needed after the canonical path is stable:

- thumbnail generation
- preview generation
- picker-side thumbnail usage

## Upload Pipeline Tasks

### 1. Input validation

Add validation for:

- supported file extension / MIME
- user quota state
- max input byte size
- max processable dimensions
- empty or broken image files

Expected result:

- bad uploads fail early
- no asset record is created on validation failure

### 2. Usage-type selection

Support these upload usage types:

- `portrait`
- `expression`
- `card`
- `banner`
- `background`
- `generic`

Implementation note:

- if UI selection is not wired yet, default to `generic`
- keep the server capable of receiving an explicit type later

### 3. Resize step

Implement max-edge resizing based on usage type.

First-pass limits:

- `portrait`: `1800px`
- `expression`: `1800px`
- `card`: `1600px`
- `banner`: `1600px`
- `background`: `1600px`
- `generic`: `1600px`

Implementation rule:

- preserve aspect ratio
- do not upscale smaller images

### 4. `WebP` encode step

Encode the resized result as lossy `WebP`.

First-pass default:

- quality around `78`

Optional later split:

- `portrait`: `78`
- `expression`: `78`
- `card`: `80`
- `banner`: `76`
- `background`: `72`
- `generic`: `78`

### 5. Canonical save step

Persist only the normalized result as the source of truth.

The stored asset record should point to:

- normalized format: `webp`
- normalized byte size
- normalized width / height
- usage type

### 6. Quota update step

After successful save:

- update owner storage usage from the normalized file size

If save fails:

- do not charge quota
- do not keep dangling asset rows or references

## Data Model Additions

The first-pass asset record should be able to store:

- `asset_id`
- `owner_user_id`
- `project_id` or project reference context if needed
- `usage_type`
- `original_filename`
- `stored_format`
- `stored_width`
- `stored_height`
- `stored_bytes`
- `storage_key`
- `created_at`

Optional later:

- `thumbnail_storage_key`
- `preview_storage_key`
- `source_mime`
- `normalization_version`

## API Responsibilities

### Upload API

The upload API should be responsible for:

- auth check
- license/quota check
- validation
- resize
- `WebP` encode
- canonical save
- metadata write
- quota update

### Asset read APIs

Asset consumer APIs should expose normalized asset metadata only.

They should not expose any assumption that the original uploaded PNG/JPG still
exists.

## Frontend Responsibilities

The frontend upload surfaces should:

- accept static image files
- optionally let the user choose usage type
- explain that large images may be resized
- explain that static uploads are stored as `WebP`
- show upload failure reasons when processing fails

The frontend should not try to be the source of truth for quota or processing
results.

## Recommended File Ownership by Area

### Frontend

Likely touch points:

- [`public/lib/image.js`](C:/Users/suzuma/Documents/socia_maker/public/lib/image.js)
- [`public/lib/storage.js`](C:/Users/suzuma/Documents/socia_maker/public/lib/storage.js)
- card/home/banner editing surfaces under [`public/screens/`](C:/Users/suzuma/Documents/socia_maker/public/screens)

### API

Likely touch points:

- upload-related Functions under [`functions/api/`](C:/Users/suzuma/Documents/socia_maker/functions/api)
- shared asset metadata routes if introduced

### Data

Likely touch points:

- D1 schema additions for asset metadata
- optional KV fallback only if D1 path is not yet ready

## Storage Backend Guidance

The current runtime is Cloudflare Pages + Functions + KV + D1.

For this static-image first pass:

- metadata should live in D1 where possible
- binary payload handling must align with the actual current asset storage path
- do not reintroduce a legacy Node server path

If the current repo does not yet have a settled binary object store path, keep
the implementation minimal and explicit rather than inventing a second storage
model implicitly.

## Error Classes to Implement

The first pass should have explicit handling for:

- unsupported format
- quota exceeded
- file too large
- image too large to process
- image decode failure
- `WebP` encode failure
- save failure

## First-Pass UI Copy Requirements

Upload UI should explain:

- accepted formats
- large images may be resized automatically
- static images are stored as `WebP`
- storage is counted per account

Failure messages should distinguish:

- unsupported file
- quota full
- processing failed

## Verification Checklist

After implementation, verify at least:

- uploading a normal PNG succeeds
- uploading a normal JPG succeeds
- uploading a WEBP succeeds
- oversized dimensions are resized
- small images are not upscaled
- resulting stored format is `webp`
- original file is not retained in the first-pass path
- quota usage reflects normalized stored bytes
- failed processing does not create dangling data
- card/home/banner consumers can display the normalized asset

## Risks

Main risks for this work:

- binary storage path in the current app may still be underspecified
- image processing inside Cloudflare runtime may require a constrained pipeline
- derivative generation can silently complicate quota and metadata handling
- frontend may still assume raw uploaded file behavior in some places

## Recommended First Implementation Cut

If delivery needs to be aggressively staged, the best first cut is:

1. support `png/jpg/jpeg/webp`
2. validate quota and format
3. resize by generic max edge
4. encode to `WebP` at one shared quality
5. save canonical normalized asset
6. update quota

Only after that:

7. usage-specific resize presets
8. better UI messages
9. thumbnails/previews

## Current Working Conclusion

The implementation should begin with a narrow, stable static-image path rather
than trying to solve every media format at once.

The first successful milestone is:

- a creator uploads a normal image
- the app stores it as normalized `WebP`
- quota updates correctly
- the normalized asset renders correctly in the app
