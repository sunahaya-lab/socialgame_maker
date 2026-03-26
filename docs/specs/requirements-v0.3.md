# Socia Maker Integrated Requirements v0.3

## Purpose

This document extends `requirements-v0.2.md` with the newly defined requirements
for:

- card-centered battle setup
- recast-based auto and semi-auto battle flow
- battle presets and effect vocabulary
- 5-member party formation
- leader skills, link skills, and title rewards
- test battle flow
- simple vs detailed editing mode behavior
- free vs paid boundary for home editing depth

This is the current integrated working requirements snapshot.

## Relationship to Earlier Versions

- `requirements-v0.1.md` is the first integrated baseline
- `requirements-v0.2.md` adds public viewer and home editing foundations
- `requirements-v0.3.md` adds battle, formation, tutorial flow, and editing-depth
  rules

## Product Goal

`socia_maker` is a pseudo social-game maker.

The core value remains:

- create a social-game-like project
- collaborate on it with other users
- publish it safely for play
- customize its home presentation and interaction
- create something that quickly feels like a playable social game
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
- Users should be able to reach a "this already feels like a game" state quickly.
- Simple mode should be the default editing surface across the product.

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
  - title progress

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

## Home Editing Free/Paid Boundary

### Free home editing

Free plan should include only simple home editing:

- place images
- use decorative objects
- create basic buttons
- create single banners
- basic layer ordering
- navigate actions

### Paid home editing

Detailed home editing should belong to `Publish Pack`, including:

- `frame`
- `text_panel`
- `hotspot`
- `character_anchor`
- `speak`
- `open_panel`
- `toggle`
- bubble tuning
- speech cue setup
- button pressed-state visuals
- multi-banner carousel control

### Boundary rule

- free plan keeps the joy of making a home
- paid plan unlocks deeper, more game-like home construction

## Simple vs Detailed Editing Modes

### Core rule

- `simple mode` is the default editing surface
- `detailed mode` is optional
- switching modes must not destroy values
- the edited object remains the same; only visible editing depth changes

### Recommended scope

- mode state should be handled per editing screen
- global default remains `simple mode`

## Simple Mode Surface by Screen

### Card editor simple mode

Show only:

- card name
- card image
- rarity
- battle preset

### Gacha editor simple mode

Show only:

- gacha name
- gacha template
- included cards
- optional banner image

### Home editor simple mode

Show only:

- decorative object
- button
- banner
- basic navigate/noop actions
- basic layer ordering

## Battle Entry Flow

### Core goal

Users should be able to quickly reach:

1. create card
2. create gacha
3. pull card
4. build party
5. enter battle
6. feel "this already looks like a social game"

### Design rule

- base character registration must not be required for this flow
- detailed balance setup must not be required for this flow

## Card-Centered Battle Model

### Core rule

- battle capability should be centered on the card, not the base character
- a card should be enough to:
  - be pulled
  - be collected
  - be placed in a party
  - enter battle

### Base character role

Base characters are optional support entities for:

- story
- shared portraits
- home conversations
- relationship handling
- link-skill identity

They are not required for battle to function.

## Card Battle Fields

Each battle-capable card should be able to hold:

- `battlePreset`
- `baseHp`
- `baseAtk`
- `growthLevel`
- `normalAttack`
- `skill`
- `special`
- `battleModeSupport`
- `visualModeSupport`

## Growth Rules

### Shared growth rule

- each growth step adds `HP +50`
- each growth step adds `ATK +10`

This rule may be shared across cards and equipment in the first implementation.

## Battle Preset Model

### Purpose

- make battle work even when the creator has not filled in detailed combat values
- give new users a fast way to make playable cards

### Initial presets

- `balance`
- `attacker`
- `healer`
- `support`

### Resolution order

Battle values should resolve in this order:

1. explicit card-level detailed settings
2. selected battle preset
3. system fallback defaults

## Initial Preset Defaults

### balance

- HP around `1000`
- ATK around `100`
- normal attack:
  - enemy single / damage / small
- skill:
  - enemy single / damage / medium
- special:
  - enemy all / damage / medium

### attacker

- HP around `900`
- ATK around `120`
- normal attack:
  - enemy single / damage / medium
- skill:
  - enemy single / damage / large
- special:
  - enemy all / damage / large

### healer

- HP around `1100`
- ATK around `80`
- normal attack:
  - enemy single / damage / small
- skill:
  - ally single / heal / medium
- special:
  - ally all / heal / small

### support

- HP around `1000`
- ATK around `90`
- normal attack:
  - enemy single / damage / small
- skill:
  - ally all / atk up / small / 2 turns
- special:
  - enemy all / atk down / small / 2 turns

## Effect Vocabulary

### Base structure

Each effect should be built from:

- `target`
- `effectType`
- `magnitude`

Optional later axis:

- `duration`
- `attribute`
- `hitCount`
- `condition`

### Initial target dictionary

- `self`
- `ally_single`
- `ally_all`
- `enemy_single`
- `enemy_all`

### Initial effectType dictionary

- `damage`
- `heal`
- `atk_up`
- `atk_down`
- `def_up`
- `def_down`

### Initial magnitude dictionary

- `small`
- `medium`
- `large`

### Initial multi-effect rule

- effects may be chained using additional effect entries
- first implementation should limit:
  - card skill: up to 2 effects
  - equipment effect: up to 1 effect

### Text generation rule

- user-facing effect descriptions should be auto-generated from the structured
  vocabulary

## Recast-Based Auto / Semi-Auto Rules

### Core combat timing rule

- battle proceeds in elapsed time
- auto and semi-auto use second-based recast timing
- future command battle may switch to turn-based cooldowns

### Action cadence

- each card should have a normal action interval
- that interval determines when the unit gets an action opportunity

### Auto mode

- ready skills and specials are used automatically
- if nothing special is ready, the unit performs its default action

### Semi-auto mode

- the battle continues automatically
- skills and specials become ready over time
- once ready, the player may trigger them at any later moment

### Cooldown model

- skill and special should hold:
  - `cooldownValue`
  - `cooldownUnit`
- `seconds` is required for auto and semi-auto
- `turns` remains reserved for future command battle support

## Equipment Minimum Model

### Core rule

- equipment is a lightweight supplement to a card
- equipment is not required for the basic battle loop

### Initial equipment fields

- `baseHpBonus`
- `baseAtkBonus`
- `growthLevel`
- optional `effect`

### Initial equipment behavior

- one equipment slot per card is enough initially
- one simple effect per equipment is enough initially
- initial effects should stay small and simple, mostly self buffs

## Party Formation Model

### Team size

- party size is fixed at 5

### Slot meanings

- slot 1: leader
- slot 2: sub leader
- slot 3-5: members

### Leader role

- leader skill is active only when a card is placed in slot 1

### Sub leader role

- sub leader should not have combat-stat bonuses in the first implementation
- sub leader is primarily a reward and relationship position:
  - special formation lines
  - title conditions

## Leader Skill Model

### Core rule

- leader skill belongs to a card
- it activates only when that card is in leader position

### Initial vocabulary

Targets:

- `ally_all`

Effect types:

- `hp_up`
- `atk_up`
- `def_up`

Magnitudes:

- `small`
- `medium`

### Initial simplification

- one leader skill per card
- always-on effect
- no stacking of multiple leader skills

## Link Skill Model

### Core rule

- link skills are based on base-character combinations
- they reward relationship-aware setups

### Trigger rule

- if required base characters are all present in the party, the link skill activates

### Initial simplification

- link skill can stay light
- initial effects should remain small
- link skill should be optional and not required for battle to function

## Title System Model

### Core rule

- titles are collection rewards, not combat power
- title progress is stored per `project + user`

### Initial title types

- `leader_pair_title`
  - specific leader + sub leader pair
- `team_combo_title`
  - specific 3+ base-character combination

### Progress rule

- battle participation while the condition is met increases progress
- initial implementation may count participation regardless of win/loss

### Reward rule

- titles should not grant combat bonuses initially

## Formation Voice Reward Model

### Core rule

- leader/sub leader combinations may have formation lines
- creators may define multiple random lines for the same combination
- text-only implementation is acceptable initially

## Battle Presentation Template Model

### Core presentation hierarchy

- normal attack < skill < special

### Normal attack template

- character image moves
- attack effect appears
- hit feedback and numbers appear

### Skill template

- stronger presentation than normal attack
- portrait or emphasis appears
- skill name appears
- optional line appears if configured

### Special template

- cut-in appears
- special name appears
- strongest effect layer appears
- optional line appears if configured

### Voice/line rule

- action lines are optional
- if set, they should appear with a bubble or dedicated line display
- if unset, combat still proceeds normally

## Simple Enemy / Test Battle Model

### Core rule

- users should not have to build enemies before trying battle
- system-provided enemy templates are enough for the first flow

### Initial enemy templates

- single enemy
- multi-enemy group
- boss enemy

### Test battle entry

- party screen should provide a direct test battle entry
- test battle should allow repeated use without penalty

## Simple Tutorial Flow

### Initial onboarding path

The first path should be:

1. create one card
2. create one gacha
3. pull once
4. build a party
5. start test battle

### Editing-mode rule

- simple mode should be the default throughout this tutorial path
- detailed mode should remain optional and hidden behind a deliberate toggle

## Free and Paid Product Boundary

### Free

- collaborative editing
- shared authored content
- static assets
- `25MB/user`
- no publish URL
- no animated media pipeline
- no advanced system packs
- simple home editing

### Paid standard

The paid base product is `Publish Pack`.

It includes:

- publish URL capability
- `500MB/user`
- animated asset intake
- animated WebP workflow
- paid-base editing surface
- detailed home editing

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
- detailed home editing controls

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
- detailed home editing

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

- advanced home editing beyond the Publish Pack baseline
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
- when trying to use detailed home editing -> `Publish Pack`

## UI Rules

- Keep heavy controls hidden or locked unless the required pack exists.
- Avoid cluttering the free/default UI.
- Advanced editing areas should be gated by pack ownership.
- Team folders should clearly communicate that they are reference-based, not
  copy-based.
- Storage usage should always remain visible enough for users to understand.
- Public viewer mode must not expose editor controls.
- Simple mode should be the default across beginner-facing editors.

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
- simple mode is the default and detailed mode is optional

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
- concrete title unlock counts
- exact default rarity rate numbers
- whether special should remain optional on all cards

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
- simple-mode-first editing UX
- card-centered battle setup
- 5-member party model with leader and sub leader positions
- title rewards and relationship-driven formation incentives
