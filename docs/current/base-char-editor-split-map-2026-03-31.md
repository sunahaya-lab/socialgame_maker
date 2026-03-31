# base-char-editor Split Map 2026-03-31

> Priority Band: Watchlist

## Goal

- `public/screens/base-char-editor.js` をファイルサイズではなく責務で分ける。
- `save / image / expression / variant / home voice` を同じ blast radius に置かない。
- `entry-editor.js` と同じく、先に active path を section-local runtime へ逃がす。

## Current File

- Target: [`public/screens/base-char-editor.js`](../../public/screens/base-char-editor.js)
- Current size:
  - about `20,156` chars
  - about `433` lines

## Current Internal Responsibility Bands

### 01. Static helper / speech sound

Primary functions:

- `normalizeCharacterSpeechSoundId`
- `getCharacterSpeechSoundOptions`
- `getSpeechAudioContext`
- `getCharacterSpeechPattern`
- `playCharacterSpeechSound`

Assessment:

- Safe-watchlist.
- This is mostly isolated helper logic and does not need to stay in the editor file.

### 02. Submit / save / image upload

Primary functions:

- `resolveStaticImage`
- `handleBaseCharSubmit`

Assessment:

- Dangerous.
- This area mixes:
  - upload/preview handling
  - normalization
  - shared save
  - refresh hooks

### 03. Edit lifecycle

Primary functions:

- `beginBaseCharEdit`
- `resetBaseCharForm`
- `deleteBaseChar`

Assessment:

- Watchlist.
- This is coherent editor lifecycle and a good early split candidate.

### 04. Voice / home voice fields

Primary functions:

- `renderBaseCharVoiceLineFields`
- `collectBaseCharVoiceLines`
- `renderBaseCharHomeVoiceLineFields`
- `collectBaseCharHomeVoiceLines`
- `renderCharacterSpeechSoundOptions`

Assessment:

- Safe-watchlist.
- Mostly local DOM population/collection.

### 05. Expression / variant editors

Primary functions:

- `addExpressionInput`
- `addVariantInput`
- `collectExpressions`
- `collectVariants`

Assessment:

- Watchlist.
- More stateful than voice fields because image/file inputs are involved.

### 06. Home relation editors

Primary functions:

- `addHomeOpinionInput`
- `addHomeConversationInput`
- `addHomeBirthdayInput`
- `collectHomeOpinions`
- `collectHomeConversations`
- `collectHomeBirthdays`

Assessment:

- Safe-watchlist.
- Similar to `entry-editor.js` relation blocks and should be easy to isolate.

### 07. Small UI helper

Primary functions:

- `ensureCheckMark`

Assessment:

- Safe.
- Can remain as local helper or be moved with image/editor helpers.

## Safe Extraction Order

1. `04. Voice / home voice fields`
2. `06. Home relation editors`
3. `03. Edit lifecycle`
4. `05. Expression / variant editors`
5. `02. Submit / save / image upload`

## Current Recommendation

- Start with DOM-local sections, not with save/upload.
- Mirror the successful `entry-editor.js` pattern:
  - move active path first
  - keep legacy body temporarily
  - trim old bodies only after delegated path is stable

## Initial Risk Focus

- The main danger core is `handleBaseCharSubmit`.
- The next most coupled area is `expression / variant` because it mixes UI state and file/image handling.
- Voice and relation editors should be the first low-risk extraction path.

## 2026-03-31 Progress Update

- Voice / home voice / relation / edit lifecycle are now on an active delegated path via:
  - `public/editor/sections/base-char/base-char-editor-fields-runtime.js`
- Expression / variant editor is now also on an active delegated path via:
  - `public/editor/sections/base-char/base-char-editor-expression-runtime.js`
- Save / upload path is now also on an active delegated path via:
  - `public/editor/sections/base-char/base-char-editor-save-runtime.js`
- `public/screens/base-char-editor.js` now routes the following active calls through that runtime:
  - `beginBaseCharEdit`
  - `resetBaseCharForm`
  - `renderBaseCharVoiceLineFields`
  - `renderCharacterSpeechSoundOptions`
  - `collectBaseCharVoiceLines`
  - `renderBaseCharHomeVoiceLineFields`
  - `collectBaseCharHomeVoiceLines`
  - `addHomeOpinionInput`
  - `addHomeConversationInput`
  - `addHomeBirthdayInput`
  - `collectHomeOpinions`
  - `collectHomeConversations`
  - `collectHomeBirthdays`
  - `addExpressionInput`
  - `addVariantInput`
  - `collectExpressions`
  - `collectVariants`
  - `ensureCheckMark`
  - `resolveStaticImage`
  - `handleBaseCharSubmit`
- Current size after this pass:
  - about `9,205` chars
  - about `263` lines

## Current Risk Focus After Refactor

- The main live danger is no longer concentrated in the file body itself.
- The remaining risk is mostly:
  - runtime wiring assumptions
  - legacy helper residue if any is still kept in-file
- `base-char-editor.js` should now be treated as a watchlist orchestrator, not an active danger core.
