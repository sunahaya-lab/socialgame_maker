# Socia Maker Integrated Requirements v0.1

## Purpose

This document is the consolidated working requirements draft for the current
product direction of `socia_maker`.

It combines the current decisions around:

- account and sharing model
- data ownership model
- storage and compression policy
- free and paid product boundaries
- publish flow
- license model
- initial product catalog

This is a planning and implementation-driving spec, not a final public product
document.

## Product Goal

`socia_maker` is a pseudo social-game maker.

The core value is:

- create a project that feels like a social game
- collaborate on that project with other users
- publish it so other people can play it safely
- optionally expand it with more presentation, game systems, and media

## Core Product Principles

- The canonical shared unit is `project`.
- All users must have accounts.
- Shared authored content and per-user player progress are separate.
- Storage reduction is a top-level design constraint.
- Asset binaries belong to users, not directly to projects.
- Projects should reference assets instead of duplicating them whenever possible.
- The free plan is the entry point for collaborative creation.
- Paid packs expand publishing, presentation, gameplay, and storage.
- Billing is buy-once, not subscription.
- Licenses are owned per `user`, not per `project`.

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

## Project and Sharing Model

### Shared canonical unit

- The canonical shared unit is `project`.
- Shared project content is edited collaboratively.
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
- The collaborative URL can be rotated.
- Rotating the URL invalidates the previous URL immediately.
- Collaborative join requires login.
- Joining creates or reactivates a `project_member` relationship.

### Paid publish share

- Publish URLs are paid-only.
- Publish URLs are separate from collaborative URLs.
- Publish access is play-only.
- Publish URLs can be created, disabled, and rotated by the owner.
- Initial implementation may use live project reads.
- Future snapshot publishing must remain possible.

## Account Requirements

- All users must register and log in.
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

### Recommended target ranges

- character standing art:
  - max edge around `1800px`
  - typical stored size `180KB-350KB`
- expression variants:
  - max edge around `1800px`
  - typical stored size `120KB-280KB`
- card art:
  - max edge around `1600px`
  - typical stored size `200KB-450KB`
- banners:
  - max edge around `1600px`
  - typical stored size `120KB-300KB`
- story backgrounds:
  - max edge around `1600px`
  - typical stored size `180KB-500KB`

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

### Operational rule

- High-resolution, long-duration, high-fps assets should not all be allowed
  together without hard limits.

## Audio Policy

### BGM

- BGM is part of the standard feature set.
- BGM should be normalized and compressed on upload.
- Recommended stored formats:
  - `opus`
  - `ogg`
- BGM is allowed because file count is expected to remain relatively small.

### SE

- SE is not a default feature.
- SE is unlocked by `Story FX Pack`.
- SE should be short-form and compressed.
- SE is treated as a meaningful storage risk because count can grow rapidly.

### Suggested limits

- BGM:
  - around `5MB/file`
  - around `5 minutes` max in the initial policy
- SE:
  - around `200KB-500KB/file`
  - around `3 seconds` max
  - mono downmix is acceptable when needed

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
- higher-end editing controls needed by the paid surface

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

In practice:

- `Publish Pack` sells "safe public release"
- `Story FX Pack` sells "game-like story direction"
- `Battle Pack` sells "more strategic combat"
- `Defense Pack` sells "completely different gameplay"
- `Event Pack` sells "social-game event structure"
- `Storage Plus Pack` sells "heavy-media capacity"

## Store and Upgrade Direction

### Hero messaging

The main upgrade message should center on:

- you can publish your project for others to play

Secondary messaging:

- more storage
- animated media
- richer editing

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

## Open Decisions

Still unresolved:

- final public product names
- whether publish viewers also require accounts
- final delete policy for assets that are still in use
- exact Story FX authoring model
- exact minimum specs for Battle, Defense, and Event packs
- final BGM/SE encoding defaults
- future pack release order after the first sales line
- final pricing and payment flow implementation details

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
