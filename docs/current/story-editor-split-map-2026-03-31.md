# story-editor Split Map 2026-03-31

> Priority Band: Watchlist

## Goal

- `public/screens/story-editor.js` をファイルサイズではなく責務で分ける。
- `scene builder / save / folder reorder / story-fx UI` を同じ blast radius に置かない。
- 先に `variant / BGM / story type` の局所 UI helper を section-local runtime へ逃がす。

## Current File

- Target: [`public/screens/story-editor.js`](../../public/screens/story-editor.js)
- Current size:
  - about `6,740` chars
  - about `181` lines

## Current Internal Responsibility Bands

### 01. Submit / save / billing guard

Primary functions:

- `handleStorySubmit`
- `collectStoryScenes`
- `collectStoryVariantAssignments`
- `getStoryBillingErrorMessage`
- `persistStories`

Assessment:

- Dangerous.
- Shared save, local cache, billing guard, scene serialization が混ざっている。

Recommended destination:

- `public/editor/sections/story/story-editor-save-runtime.js`

### 02. Story FX / type / BGM UI

Primary functions:

- `renderStoryVariantDefaults`
- `ensureStoryFxPackNote`
- `handleStoryTypeChange`
- `refreshStoryFxUi`
- `renderStoryBgmOptions`
- `updateSceneCharacterOptions`

Assessment:

- Safe-watchlist.
- DOM 局所でまとまっており、最初の抽出対象として扱いやすい。

Recommended destination:

- `public/editor/sections/story/story-editor-ui-runtime.js`

### 03. Scene editor

Primary functions:

- `addSceneInput`

Assessment:

- Watchlist.
- scene DOM 生成、背景 upload、BGM select、scene extras toggle を抱えている。

Recommended destination:

- `public/editor/sections/story/story-editor-scene-runtime.js`

### 04. Edit lifecycle

Primary functions:

- `beginStoryEdit`
- `resetStoryForm`

Assessment:

- Watchlist.
- scene builder / UI helper / submit labels にまたがる。

Recommended destination:

- `public/editor/sections/story/story-editor-lifecycle-runtime.js`

### 05. Order / folder operations

Primary functions:

- `moveStoryOrder`
- `handleCreateStoryFolder`
- `assignStoryFolder`
- `reorderStoriesInFolder`

Assessment:

- Watchlist.
- 並び替えと folder 移動は save 本体へ依存するが、scene builder とは分離しやすい。

## Safe Extraction Order

1. `02. Story FX / type / BGM UI`
2. `04. Edit lifecycle`
3. `05. Order / folder operations`
4. `03. Scene editor`
5. `01. Submit / save / billing guard`

## 2026-03-31 Progress Update

- Story FX / type / BGM UI は active delegated path に移行済み:
  - `public/editor/sections/story/story-editor-ui-runtime.js`
- `public/screens/story-editor.js` は次を runtime に流す:
  - `renderStoryVariantDefaults`
  - `ensureStoryFxPackNote`
  - `handleStoryTypeChange`
  - `refreshStoryFxUi`
  - `renderStoryBgmOptions`
  - `updateSceneCharacterOptions`
- Edit lifecycle も active delegated path に移行済み:
  - `public/editor/sections/story/story-editor-lifecycle-runtime.js`
- `public/screens/story-editor.js` は次も runtime に流す:
  - `beginStoryEdit`
  - `resetStoryForm`
- Scene builder も active delegated path に移行済み:
  - `public/editor/sections/story/story-editor-scene-runtime.js`
- `public/screens/story-editor.js` は次も runtime に流す:
  - `addSceneInput`
- Save / billing / persistence も active delegated path に移行済み:
  - `public/editor/sections/story/story-editor-save-runtime.js`
- `public/screens/story-editor.js` は次も runtime に流す:
  - `handleStorySubmit`
  - `getStoryBillingErrorMessage`
  - `moveStoryOrder`
  - `assignStoryFolder`
  - `reorderStoriesInFolder`
  - `persistStories`

## Current Risk Focus After Refactor

- 主な live danger は、もう active path ではなく in-file legacy body の残置有無に寄っている。
- つまり、`story-editor.js` は active path ベースではかなり section-local runtime に移っていて、
  watchlist orchestrator として扱える段階に入っている。
