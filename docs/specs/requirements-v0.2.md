# Socia Maker Integrated Requirements v0.2

## Purpose

This document extends `requirements-v0.1.md` with the newly defined requirements
for:

- paid publish URL viewer experience
- guest local save behavior for publish URLs
- home editing UX
- home editing object model
- home speech, bubble, and interaction rules

This is the next working integrated requirements snapshot.

## Relationship to v0.1

- `requirements-v0.1.md` remains the earlier consolidated baseline
- this v0.2 keeps the same core commercial, storage, and collaboration model
- v0.2 adds the newer requirements around public viewing and home editing

## Product Goal

`socia_maker` is a pseudo social-game maker.

The core value remains:

- create a social-game-like project
- collaborate on it with other users
- publish it safely for play
- customize its home presentation and interaction
- optionally expand it with richer systems, media, and promotional surfaces

## Core Product Principles

- The canonical shared unit is `project`.
- All editors must have accounts.
- Shared authored content and per-user player progress are separate.
- Storage reduction remains a top-level design constraint.
- Asset binaries belong to users, not directly to projects.
- Projects should reference assets instead of duplicating them whenever possible.
- The free plan is the entry point for collaborative creation.
- Paid packs expand publishing, presentation, gameplay, and storage.
- Billing is buy-once, not subscription.
- Licenses are owned per `user`, not per `project`.
- Public play should be easy to start, even for non-logged-in viewers.
- Home editing should happen on the real home screen, not on a fake mock screen.

## User Roles

### owner

- owns the project
- manages collaborative share URL
- manages publish URL
- can remove members

### collaborator

- joins through collaborative sharing
- can edit shared project content
- can upload their own assets

### play_only

- accesses a paid publish URL
- can view and play only
- cannot edit or upload

### guest viewer

- accesses a paid publish URL without an account session
- can play immediately
- uses local browser save only

## Project and Sharing Model

### Shared canonical unit

- The canonical shared unit is `project`.
- Shared project content includes:
  - base characters
  - cards
  - stories
  - gachas
  - system config

### Player progress

- Player progress is stored separately per `project + user`.
- Player progress includes:
  - profile
  - inventory
  - story progress
  - gacha history
  - home preferences
  - currencies

### Free collaborative share

- Free plan supports collaborative share only.
- A project can have only one active collaborative URL at a time.
- Rotating the collaborative URL invalidates the previous URL immediately.
- Collaborative join requires login.
- Joining creates or reactivates a `project_member` relationship.

### Paid publish share

- Publish URLs are paid-only.
- Publish URLs are separate from collaborative URLs.
- Publish access is play-only.
- Publish URLs can be created, disabled, and rotated by the owner.
- Initial implementation may use live project reads.
- Future snapshot publishing must remain possible.

## Public Viewer Experience

### Core rule

- Publish URLs can be opened without login.
- Publish URLs can be freely shared by anyone who knows them.
- The public play experience should feel like a normal playable project, not a
  crippled admin preview.

### Guest viewer behavior

- Guests can play immediately without account creation.
- Guest progress is stored locally in the browser.
- Guests can:
  - use home
  - use gacha
  - use story
  - use collection
  - use light home personalization

### Logged viewer behavior

- Logged-in viewers use account-backed save instead of guest-only local save.
- Logged-in viewers should be told that their progress is saved more reliably.

### Public viewer restrictions

- No editor UI
- No upload UI
- No member management
- No share management
- No publish management

### Conversion goals

The public viewer experience should also create a path toward:

- logging in for stronger save persistence
- starting a personal project

## Guest Local Save Model

### Purpose

- allow instant public play without account creation
- preserve a lightweight personal state for guests
- keep guest save clearly separate from account save

### Save identity

Guest save is keyed by:

- `publicShareId` or equivalent publish identifier
- `guestLocalUserId`

### Storage location

- primary recommendation: `localStorage`
- cookie may be used for auxiliary identification if needed
- initial design should not rely on cookie as the main structured storage

### Save contents

Guest local save may include:

- story progress
- gacha history
- owned-card summary
- light personal home preference deltas
- optional guest display name
- last accessed time

### Save boundaries

Guest local save must not include:

- shared authored content
- uploaded assets
- heavy editor state
- collaborative permissions

### UI explanation requirements

The public viewer should be told:

- progress is saved on this device
- local browser data may be lost
- login saves progress more reliably

## Account Requirements

- All editors must have accounts.
- Anonymous collaborative editing is not allowed.
- Assets must always be attributable to an account owner.
- Server-side permission checks are mandatory for all protected actions.

## Member Management Requirements

- Member management is required.
- The owner can list members.
- The owner can remove members manually.
- The owner cannot remove themselves through the normal member removal flow.
- Removed members lose project access.
- Removing a member must also remove that member's project-side asset references.

## Data Ownership Model

### Project-owned data

These remain project-owned:

- card definitions
- story definitions
- gacha definitions
- system settings
- other authored structure data

### User-owned data

These remain user-owned:

- uploaded images
- uploaded audio
- uploaded animated assets
- personal asset folders
- other binary asset payloads

### Reference model

- Projects should not own duplicated asset binaries by default.
- Projects consume assets through reference links.
- Team-facing folders are views over referenced assets, not duplicated storage.

## Data Entities

The minimum model should support at least:

- `users`
- `projects`
- `project_members`
- `user_assets`
- `user_folders`
- `project_asset_links`
- `team_folder_views`

## Member Removal Data Behavior

- Member removal is a required feature.
- Default behavior is unlinking project references, not deleting the user's asset
  binaries.
- The project should remove:
  - project asset links from that member
  - team folder items tied to those links
- The user's own asset storage remains intact unless a separate account-level
  deletion policy applies.

## Storage and Compression Policy

### High-level rule

- Storage is measured per `user`.
- Referencing an asset in a project should not duplicate storage usage.
- Capacity reduction is a first-class product rule.

### Free plan storage

- `25MB/user`

### Paid standard storage

- `500MB/user`

### Paid storage expansion

- `1GB/user`

## Static Image Policy

- Static images should be normalized to `WebP`.
- Original PNGs are not retained by default.
- DPI is not treated as the meaningful size rule.
- Meaningful size rules are:
  - pixel dimensions
  - encoded size
  - usage type
- Upload should include resize and re-encode steps.

## Animated Asset Policy

- Paid plans may accept APNG and GIF as input formats.
- Stored format should be `animated WebP`.
- Original APNG/GIF files are not retained by default.
- Large animated assets must be controlled aggressively.

### Recommended initial limits

- base paid storage tier: `500MB/user`
- animated upload input max: around `30MB/file`
- stored animated file max: around `10MB/file`
- general max edge: `1024px`
- hard exception ceiling: `1600px`
- max duration: `5 seconds`
- max fps: `20fps`

## Audio Policy

### BGM

- BGM is part of the standard feature set.
- BGM should be normalized and compressed on upload.
- Recommended stored formats:
  - `opus`
  - `ogg`

### SE

- SE is not a default feature.
- SE is unlocked by `Story FX Pack`.
- SE should be short-form and compressed.
- SE is treated as a meaningful storage risk because count can grow rapidly.

## Home Editing Model

### Core concept

Home editing is built around four concepts:

- `Assets`
- `Properties`
- `Layers`
- `Actions`

### Editing philosophy

- The real rendered home screen is the editing target.
- The system should not depend on a separate fake preview.
- Panels are support UI; the home itself remains the main editing surface.

### Initial object pipeline

The core editing loop is:

1. choose an asset
2. place it on the home
3. select the object
4. assign or adjust a property
5. assign or adjust an action when needed
6. change layer order
7. save

## Home Save Scope Model

### Shared home

- stored per `project`
- defines the canonical home layout for the project
- should include shared structure such as:
  - standard buttons
  - banners
  - shared decoration
  - shared bubble templates
  - shared character anchor defaults

### Player home

- stored per `project + user`
- defines lightweight personal differences
- should include:
  - selected home character
  - selected card
  - single/double mode preference
  - small position offsets
  - lightweight bubble offsets

### Composition rule

Rendering should be based on:

1. shared home base
2. player home overlay or overrides

## Public Viewer Home Customization Boundary

### Guest-allowed home changes

Guests may be allowed only lightweight personal home changes:

- character selection
- selected card
- single/double mode
- light position adjustments
- light speech-bubble offset adjustments

### Guest-forbidden home changes

Guests may not:

- upload assets
- add new home objects
- edit layers broadly
- edit shared home structure
- edit object actions
- edit project-wide properties

## Home Object Model

### Layout structure

Home data should be modeled as:

- `homeLayout`
- `homeObjects[]`

### Common object structure

Each home object should support at least:

- `objectId`
- `assetRef`
- `transform`
- `layer`
- `property`
- `action`
- `visibility`
- `meta`

## Home Property Types

Initial property candidates:

- `decorative`
- `frame`
- `button`
- `banner`
- `text_panel`
- `hotspot`
- `character_anchor`

Later candidates:

- `menu_bar`
- `status_panel`

### Meaning of each initial property

- `decorative`
  - visual only
- `frame`
  - visual support structure
- `button`
  - explicit interactive UI
- `banner`
  - promotional or event-style callout UI
- `text_panel`
  - speech or text container
- `hotspot`
  - invisible or independent tap region
- `character_anchor`
  - home character placement and speech anchor base

## Home Actions

Initial action set:

- `navigate`
- `speak`
- `open_panel`
- `toggle`
- `noop`

Later candidates:

- `select_target`
- `external_link`

### Initial priorities

Highest priority:

- `navigate`
- `speak`

## button / banner / hotspot distinction

### button

- explicit operation UI
- user should recognize it as something to press

### banner

- promotional or highlighted content UI
- user should recognize it as something to notice first, then press

### hotspot

- invisible or helper tap region
- separates visible art from interactive hit area

### Implementation rule

- button and banner may share internal interaction infrastructure
- but they must remain distinct property kinds in authoring UI
- hotspot must remain a distinct invisible-interaction concept

## Button Rules

- buttons must support normal image
- pressed-state image is optional
- if no pressed-state image is set, a simple press effect may be used instead

## Banner Carousel Model

### Core rule

- a banner object may contain multiple banner items
- only one banner item is shown at a time
- each banner item may have its own action

### Required initial features

- multiple items
- per-item image
- per-item action
- auto-slide on/off
- auto-slide interval
- manual next/previous switching

### Initial simplification

- keep banner as a single object in Layers
- do not expose per-item layers
- do not add conditional display scheduling yet

## Hotspot Requirement

- hotspot is included in the initial implementation scope
- hotspot is especially important for character tap speech and invisible tap areas

## Home Speech and Bubble Model

### Voice philosophy

- full voice playback is not required as a baseline
- instead, each character may define a lightweight speech cue SFX
- if no character-specific cue exists, use a default fallback speech cue

### Bubble philosophy

- bubbles should be semi-automatic, not fully manual
- bubble placement should follow speaker anchors
- bubble placement should auto-correct to stay in view
- users should only need small offset adjustments, not full manual layout

### Initial bubble model

Bubble placement should support:

- target speaker
- preferred side
- offset x/y
- auto flip
- auto clamp

### Initial speech simplification

- only one visible speech bubble at a time is sufficient initially

## Home Editing UI Layout

### Main structure

- top toolbar
- large central real-home canvas
- Assets drawer on the left or bottom
- Properties panel on the right
- Layers panel near Properties

### Toolbar responsibilities

- back
- save
- current scope display
- panel toggles

### Scope visibility

The editor must always show whether the user is editing:

- shared home
- personal home

## Home Editing Panel Language Direction

Core panel labels should remain:

- `Assets`
- `Properties`
- `Layers`

But supporting Japanese explanations should clearly describe:

- whether the user is editing shared home or personal home
- what each property kind means
- what each action means
- that assets are referenced, not copied

## Initial Home Editing Implementation Scope

### Included initially

- `decorative`
- `frame`
- `button`
- `banner`
- `text_panel`
- `hotspot`
- `character_anchor`
- `navigate`
- `speak`
- `open_panel`
- `noop`
- optional `toggle`

### Explicitly included feature decisions

- hotspot is in the initial scope
- banner supports multiple items and auto-slide
- button pressed-state image is optional
- button and banner may share internal infrastructure but remain distinct in UI

### Deliberately postponed

- `menu_bar`
- `status_panel`
- `select_target`
- `external_link`
- complex conditions
- advanced timelines
- group editing
- undo/redo as a required baseline

## Free and Paid Product Boundary

### Free

- collaborative editing
- shared authored content
- static assets
- `25MB/user`
- no publish URL
- no animated media pipeline
- no advanced system packs

### Paid standard

The paid base product is `Publish Pack`.

It includes:

- publish URL capability
- `500MB/user`
- animated asset intake
- animated WebP workflow
- paid-base editing surface

### Paid expansion

Additional packs expand:

- storage
- story presentation
- battle systems
- defense systems
- event systems
- future promo and branding systems

## Licensing Model

Recommended model:

- `base_tier`
- `owned_packs[]`

### base_tier values

- `free`
- `publish`

### initial owned packs

- `storage_plus`
- `story_fx`
- `battle`
- `defense`
- `event`

### future pack candidates

- `promo_site`
- `promo_video`
- `theme`
- `home`
- `relationship`
- `export`
- `puzzle`
- `rhythm`
- `raid`

## License Decision Rules

### owner-based checks

These should depend on the project owner's paid state:

- publish URL creation
- publish URL rotation
- publish URL disable
- publish settings UI

### acting-user checks

These should depend on the current acting user's owned packs:

- advanced editing panels
- story FX controls
- battle mode controls
- defense mode controls
- event controls

### asset-owner checks

These should depend on the asset owner's license state:

- storage quota
- media upload allowance

## Initial Commercial Product Catalog

### Free

- collaborative editing entry tier
- `25MB/user`

### Publish Pack

Core paid product.

Unlocks:

- publish URL
- `500MB/user`
- animated asset workflow
- paid-base editing surface

Suggested price:

- `1,980 JPY`

### Story FX Pack

Unlocks:

- story presentation controls
- character motion hints
- visual effects
- SE upload and playback
- fine-grained scene direction

Suggested price:

- `980 JPY`

### Battle Pack

Unlocks:

- SP-managed semi-auto battle
- SP-managed command battle
- related battle configuration UI

Suggested price:

- `980 JPY`

### Defense Pack

Unlocks:

- side-scrolling tower defense mode
- placement and wave configuration

Suggested price:

- `1,280 JPY`

### Event Pack

Unlocks:

- event points
- missions
- exchange shop
- box gacha

Suggested price:

- `980 JPY`

### Storage Plus Pack

Unlocks:

- `1GB/user`

Requirements:

- should require `Publish Pack`

Suggested price:

- `780 JPY`

## Future Pack Candidates

### Promo Site Pack

- official-site-like page generation
- key visual, character, story, and campaign style presentation

### Promo Video Pack

- promo-video-like sequencing
- teaser and announcement style presentation

### Theme Pack

- UI themes
- skins
- presentation presets

### Home Pack

- advanced home editing
- extra layers
- richer idle presentation

### Relationship Pack

- relationship systems
- affinity-like presentation
- stronger conversation/event gating

### Export Pack

- backup
- archive
- export/migration surface

### Other gameplay candidates

- puzzle
- rhythm
- raid

## Initial Sales Line

Recommended initial sale lineup:

- `Publish Pack`
- `Story FX Pack`
- `Battle Pack`
- `Defense Pack`
- `Event Pack`
- `Storage Plus Pack`

Keep these as future-phase products for now:

- `Promo Site Pack`
- `Promo Video Pack`
- `Theme Pack`
- `Home Pack`
- `Relationship Pack`
- `Export Pack`
- `Puzzle Pack`
- `Rhythm Pack`
- `Raid Pack`

## Recommended Sales Ordering

Present products in this order:

1. `Publish Pack`
2. `Story FX Pack`
3. `Battle Pack`
4. `Defense Pack`
5. `Event Pack`
6. `Storage Plus Pack`

Rule:

- `Storage Plus Pack` should not be presented as the hero product.

## Recommended Implementation Order

1. `Publish Pack`
2. `Storage Plus Pack`
3. `Story FX Pack`
4. `Battle Pack`
5. `Event Pack`
6. `Defense Pack`

## Product Messaging Priorities

Value should be explained in this order:

1. publish what you made
2. increase storage
3. use richer media
4. build more distinctive systems

## Store and Upgrade Direction

### Hero messaging

The main upgrade message should center on:

- you can publish your project for others to play

### Trigger-based upsell

Recommended upsell triggers:

- when trying to publish -> `Publish Pack`
- when trying to use story FX -> `Story FX Pack`
- when trying to use SP battle modes -> `Battle Pack`
- when trying to use defense mode -> `Defense Pack`
- when trying to use event systems -> `Event Pack`
- when exceeding `500MB` -> `Storage Plus Pack`

## UI Rules

- Keep heavy controls hidden or locked unless the required pack exists.
- Avoid cluttering the free/default UI.
- Advanced editing areas should be gated by pack ownership.
- Team folders should clearly communicate that they are reference-based, not
  copy-based.
- Storage usage should always remain visible enough for users to understand.
- Public viewer mode must not expose editor controls.

## API Rules

- All permission and entitlement checks must happen server-side.
- Unauthorized feature-save attempts must be rejected server-side even if the
  client tries to send them.
- Collaborative and publish permissions must be enforced in Functions.

## State Transition Requirements

Critical flows must follow these rules:

- collaborative join:
  - token validation -> login requirement -> join confirmation
- collab URL rotation:
  - confirm -> rotate -> old URL invalid immediately
- member removal:
  - preview impact -> confirm -> unlink references
- upload:
  - quota check before save
- delete:
  - reference check before delete

## Required User-Facing Explanations

The product must clearly explain:

- collaborative participation requires login
- rotating a collaborative URL invalidates the old URL
- assets consume the owner's quota
- projects reference assets instead of copying them
- removing a member removes that member's project references
- storage is enforced per account
- APNG/GIF are normalized when paid animated workflows are used
- guest public play saves to the current device unless the user logs in

## Open Decisions

Still unresolved:

- final public product names
- whether public viewers should later be nudged harder toward account creation
- final delete policy for assets that are still in use
- exact Story FX authoring model
- exact minimum specs for Battle, Defense, and Event packs
- final BGM/SE encoding defaults
- future pack release order after the first sales line
- final pricing and payment flow implementation details
- whether guest-to-account save migration should be supported in the first pass

## Current Working Conclusion

At this stage, the following are stable enough to treat as the working product
baseline:

- account-required collaboration
- project/user split for authored data vs binaries
- reference-first asset architecture
- free collaborative tier
- paid publish tier
- buy-once user-based licensing
- initial paid expansion pack catalog
- initial implementation and sales priorities
- public play without mandatory login
- local guest save for public play
- real-screen home editing with Assets, Properties, Layers, and Actions
