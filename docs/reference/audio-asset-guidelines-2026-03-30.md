# Audio Asset Guidelines 2026-03-30

> Priority Band: Context / Secondary

## Purpose

This note defines practical audio compression and upload rules for `socia_maker`.
The goal is to keep storage and delivery costs low while preserving acceptable in-game quality.

## Current Product Direction

Audio should be treated differently by category.

- BGM: user upload allowed
- sound effects: handle carefully
- talk sound effects: prefer shared presets
- large-scale free audio upload should be avoided

## Recommended Formats

### BGM

Recommended:

- `m4a` (AAC)
- `ogg`
- `mp3` as fallback when compatibility is needed

Preferred order for this project:

1. `m4a`
2. `ogg`
3. `mp3`

### Sound Effects

Recommended:

- `ogg`
- short `m4a`

### Voice / Talk Audio

Recommended:

- `m4a`
- `ogg`

For character talk sounds, shared presets are preferred over free upload.

## Compression Rules

### BGM

Default target:

- bitrate: `64kbps` to `96kbps`
- channels: `mono` if acceptable, otherwise `stereo`
- sample rate: `44.1kHz` or lower when acceptable

Practical rule:

- use `64kbps mono` first
- move to `96kbps stereo` only if the track audibly breaks

### Sound Effects

Default target:

- bitrate: `48kbps` to `96kbps`
- channels: `mono`
- keep duration short

### Voice / Talk Audio

Default target:

- bitrate: `48kbps` to `80kbps`
- channels: `mono`
- remove silence before export

## Size Rules

### Free Plan Baseline

For early release, the practical baseline should be:

- max BGM upload count: fixed free limit
- max single BGM file size: strict limit
- no free user-defined bulk sound effect upload

Recommended initial limits:

- total BGM upload count: `10`
- max single BGM file size: `4MB`
- preferred target per BGM: `1MB` to `3MB`

### Paid Expansion Direction

If paid expansion is added later, it should increase:

- number of BGM files
- total stored audio size
- optional advanced audio categories

Not recommended for early release:

- unlimited sound effect upload
- large voice pack upload
- many category-specific custom audio slots

## Pre-Export Checklist

Before uploading audio, always prefer:

- trim leading silence
- trim trailing silence
- cut unnecessary intro/outro
- convert to mono if quality remains acceptable
- lower bitrate before increasing file count
- avoid duplicate variants of near-identical files

In practice, silence trimming and mono conversion usually save more than format choice alone.

## Product Rules For `socia_maker`

### Home BGM

Allowed for release:

- user uploads own BGM
- chooses from uploaded BGM list
- volume controlled by audio settings

Recommended rule:

- one active home BGM at a time
- no autoplay-heavy multi-track system

### Battle BGM

Allowed for release:

- user chooses one battle BGM from uploaded BGM
- battle uses shared project BGM assets

Recommended rule:

- one active battle BGM at a time
- reuse the same uploaded BGM pool as home

### Story BGM

Allowed for release:

- story can reference uploaded BGM from the shared project pool
- multiple stories may reuse the same track
- story does not get unlimited unique upload slots

Recommended rule:

- story-specific BGM is selected from the common BGM library
- free plan stays within the same total `10` track cap
- “some tracks for story” is acceptable, but not a separate unlimited story library

### Talk Sound Effects

For release:

- keep as preset selection managed by the app
- do not open free user upload yet

Reason:

- sound effect count grows quickly
- storage cost scales badly
- operational moderation becomes harder

### System Audio Expansion

Deferred for now:

- custom global sound effect banks
- per-scene sound effect upload systems
- large voice asset libraries

## Technical Guidance

When implementing upload validation later, check:

- MIME type
- file extension
- file size
- duration if possible

Useful policy:

- reject files above hard limit
- show recommended format and target size in UI
- store lightweight metadata with each audio asset

Suggested metadata:

- `id`
- `name`
- `mimeType`
- `sizeBytes`
- `durationMs`
- `category`
- `ownerUserId`
- `projectId`

## Release Recommendation

For first release, keep the rule simple:

- BGM only
- free plan uses a shared BGM library for home, battle, and story
- strict count limit: total `10` tracks
- strict file size limit
- talk sound uses presets
- sound effect free upload is deferred

This gives the product audio flexibility without letting storage costs drift early.
