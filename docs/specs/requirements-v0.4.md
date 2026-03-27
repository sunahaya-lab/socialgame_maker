# Socia Maker Integrated Requirements v0.4

## Purpose

This document extends `requirements-v0.3.md` with the newly defined requirements
for:

- image upload normalization flow
- static image `WebP` conversion rules
- derivative image generation policy
- upload failure and validation behavior
- free/paid handling differences around image processing

This is the next integrated working requirements snapshot.

## Relationship to Earlier Versions

- `requirements-v0.1.md` is the first integrated baseline
- `requirements-v0.2.md` adds public viewer and home editing foundations
- `requirements-v0.3.md` adds battle, formation, tutorial flow, and editing-depth
  rules
- `requirements-v0.4.md` adds concrete image upload and `WebP` normalization
  rules

## Scope of This Version

`requirements-v0.4.md` does not replace the earlier collaboration, publish,
home-editing, battle, or product rules.

It adds the missing operational detail for:

- how images are accepted
- when resizing happens
- when `WebP` conversion happens
- when originals are discarded
- what happens when conversion fails

## Image Upload and WebP Conversion Model

### Core rule

- Static images are accepted as user uploads.
- Static images are normalized into `WebP` before final storage.
- The normalized `WebP` file becomes the stored source of truth.
- Original uploaded image files are not retained by default.

### Product intent

- users can upload ordinary creator-side source images without preparing them
  perfectly first
- the system should reduce waste automatically
- creators should still get a result that looks acceptable in the app
- the app should not become a raw archive for huge PNG files

## Accepted Static Image Inputs

Initial accepted static image inputs should include:

- `png`
- `jpg`
- `jpeg`
- `webp`

Initial non-goals for this policy:

- retaining uploaded originals as a permanent source file archive
- supporting every desktop publishing image format

## Static Upload Processing Pipeline

Static image uploads should follow this order:

1. authenticate the uploading user
2. validate quota and remaining storage
3. validate file type
4. inspect dimensions and encoded file size
5. classify the intended usage type if available
6. resize to the allowed max edge for that usage type
7. re-encode to `WebP`
8. generate required derivatives if needed
9. save the normalized file
10. update the owner's storage usage

This pipeline should happen before the final stored asset record is confirmed.

## Static Image Classification

The upload flow should support a lightweight intended-usage classification.

Initial usage types should be:

- `portrait`
- `expression`
- `card`
- `banner`
- `background`
- `generic`

If the user does not choose a type, the system may default to `generic`.

## Static Resize Rules

Resize policy should be based on pixel dimensions, not dpi metadata.

Initial recommended max edges:

- `portrait`: `1800px`
- `expression`: `1800px`
- `card`: `1600px`
- `banner`: `1600px`
- `background`: `1600px`
- `generic`: `1600px`

These values are operational defaults, not final artistic limits.

They may later be tuned per screen or per pack.

## Static WebP Encoding Defaults

Static images should use lossy `WebP` by default.

Initial recommended quality defaults:

- `portrait`: around `78`
- `expression`: around `78`
- `card`: around `80`
- `banner`: around `76`
- `background`: around `72`
- `generic`: around `78`

The exact numbers remain tunable, but the first pass should prefer one shared
default over too many micro-presets.

### Safe initial fallback

If no usage-specific quality rule exists yet:

- use `WebP lossy`
- use quality around `78`

## Original File Retention Policy

### Free plan

- uploaded static originals should not be retained
- only the normalized `WebP` should remain

### Paid plan

- the initial implementation should still not retain originals by default
- future paid upgrades may introduce optional original retention later

This keeps early storage behavior simple and consistent.

## Existing WebP Inputs

If the user uploads a `webp` file:

- the file should still pass through validation
- the system may still re-encode it if needed for size normalization or
  derivative generation
- the system should not assume an uploaded `webp` is already acceptable as-is

## Derivative Image Policy

The system may generate additional derivative images when needed for runtime
performance.

Initial derivative candidates:

- thumbnail image
- reduced-size preview image

### Rules

- derivatives are secondary artifacts, not the canonical source
- storage accounting should include stored derivatives if they are persisted
- if the first implementation does not persist derivatives separately, that is
  acceptable

## Thumbnail / Preview Recommendations

If thumbnails are generated, initial defaults may be:

- thumbnail max edge: `512px`
- preview max edge: `1024px`

This is especially useful for:

- collection grids
- asset pickers
- banner selectors
- editor-side lists

## Validation Rules

Static upload validation should reject or block files when:

- the user is over quota
- the input file type is unsupported
- the file is structurally invalid
- the dimensions are too large to process safely
- the normalized output would still exceed allowed limits

Validation errors should be surfaced before final save.

## Failure Handling

If static image normalization fails:

- do not keep a half-saved asset record
- do not charge storage usage
- return a clear upload failure state

Preferred user-facing failure classes:

- unsupported format
- file too large
- image processing failed
- quota exceeded
- server error

## Storage Accounting Rule

For static images, account storage usage against:

- the normalized stored `WebP`
- any persisted derivatives if the implementation stores them separately

Do not account against:

- a temporary uploaded original that is discarded during processing

## Home Editing and Runtime Consumption

Home editing, banners, portraits, cards, and collection views should all consume
the normalized assets rather than the user-uploaded original file.

This keeps runtime behavior consistent with storage policy.

## Free / Paid Differences

### Free plan

- static image upload is allowed
- normalization to `WebP` is required
- originals are discarded
- storage is limited by the free plan quota

### Paid plan

- static image upload is allowed
- normalization to `WebP` is still required
- originals are still discarded in the first implementation
- higher storage limits apply
- paid animated workflows remain a separate rule set

## Interaction with Animated Asset Rules

This v0.4 policy only clarifies static image uploads.

Animated rules remain:

- paid plans may accept `APNG` and `GIF`
- stored animated format should be `animated WebP`
- originals are not retained by default

Static and animated uploads should share the same high-level philosophy:

- normalize
- constrain
- discard raw originals unless a future explicit archival feature exists

## User-Facing Messaging Requirements

The product should clearly explain:

- uploaded images are automatically resized when needed
- uploaded static images are converted to `WebP` for storage
- original uploaded PNG/JPG files are not kept by default
- storage usage is calculated from stored assets, not from project references

## Editor and Upload UI Requirements

Upload UIs should show at least:

- accepted formats
- the fact that large images may be resized automatically
- that static images are stored as `WebP`
- that storage is counted per account

If the first pass can show estimated post-conversion size, that is desirable but
not required.

## Open Decisions

Still unresolved in this v0.4 extension:

- exact `WebP` quality values per asset type
- whether derivatives should be persisted or generated lazily
- exact thumbnail and preview pipeline
- exact max input dimensions for safe server processing
- whether paid users should later get optional original retention
- whether static `webp` uploads should always be re-encoded or only normalized
  conditionally

## Current Working Conclusion

At this stage, the following are stable enough to treat as the working image
upload baseline:

- static images are normalized to `WebP`
- static originals are not retained by default
- upload flow includes validation, resize, re-encode, save, and quota update
- processing rules are based on dimensions and encoded size, not dpi
- free and paid plans both follow the same static normalization rule
- animated assets remain a separate paid workflow with `animated WebP`
