# Pages Migration Runbook

> Priority Band: Context / Secondary

## Purpose

This memo captures the practical migration path from the current mixed `Workers Builds` state into the intended `Cloudflare Pages + Functions + D1 + R2` deployment shape.

It is written to preserve the current working closed-test environment while moving toward a cleaner production setup.

## Current State

- The intended runtime is `Cloudflare Pages + Functions + KV + D1 + R2`
- The repository structure already matches that direction:
  - static output: `public/`
  - API: `functions/api/`
  - config: `wrangler.toml` with `pages_build_output_dir = "public"`
- A real Pages project now exists:
  - `socialgamemaker-pages`
  - preview domain: `https://socialgamemaker-pages.pages.dev/`
- The older Cloudflare app was effectively managed as `Workers Builds`, which caused:
  - `Deploy command`
  - `Version command`
  - `wrangler deploy` warnings
  - successful builds that did not actually publish app changes

## Current Safe Operating Rule

Until the migration is fully cleaned up, treat this as the safe source of truth:

- code source of truth: GitHub `main`
- deploy source of truth: manual Pages deploy
- target project: `socialgamemaker-pages`

Use this command when preview needs to reflect local fixes:

```powershell
wrangler.cmd pages deploy public --project-name socialgamemaker-pages
```

## Migration Goal

The final target is:

- one canonical Pages project
- one canonical custom domain
- one canonical Access-protected entrypoint
- no competing Worker-build deploy path for the same app

## Recommended Migration Order

### 1. Stabilize Preview on Pages

Keep using:

- `socialgamemaker-pages.pages.dev`

for implementation verification until all critical flows work there.

Minimum flows to verify:

- app opens
- editor opens
- base character image upload works
- card image upload works
- card -> gacha -> draw -> formation -> test battle works

### 2. Continue Manual Deploys During Closed Test

Do not trust automatic Git deploy for the old mixed setup.

During this phase:

- make local fix
- verify locally
- deploy manually with `wrangler.cmd pages deploy`
- verify on `socialgamemaker-pages.pages.dev`

### 3. Move Custom Domain to the Pages Project

After preview becomes stable enough:

- attach `social-game-maker.com` to `socialgamemaker-pages`
- verify DNS and certificate issuance
- verify the domain resolves to the Pages project rather than the old Worker-oriented app

Only move the custom domain after preview behavior is confirmed.

### 4. Re-apply Cloudflare Access to the Pages-backed Domain

Once the custom domain points to the Pages project:

- verify Access still guards the site
- if needed, recreate or update the `Self-hosted` Access application
- protect the actual tester-facing hostname

Access should guard:

- `/`
- SPA routes
- `/api/*`

## 5. Retire the Old Worker-style Deploy Path

After the Pages project fully replaces the older route:

- remove or disconnect the old Worker-build Git deploy path
- ensure there is no second app still trying to deploy the same repo
- keep only the Pages project as the deployment truth

Do this last, not first.

## Practical Day-to-Day Flow During Migration

1. edit locally
2. verify locally with `wrangler.cmd pages dev public`
3. deploy manually to Pages
4. verify on `socialgamemaker-pages.pages.dev`
5. only then test on `social-game-maker.com`

## Deploy Checklist

Before each manual Pages deploy:

- local changes saved
- no obvious console error locally
- image upload still works if touched
- important editor flows still open

After each manual Pages deploy:

- preview URL opens
- browser console has no blocking error
- `/api/system` returns JSON
- affected screen actually reflects the new change

## Cutover Checklist for `social-game-maker.com`

Before final domain cutover:

- preview verified
- Access behavior confirmed
- image upload confirmed
- D1-backed content confirmed
- test battle flow confirmed

After cutover:

- `https://social-game-maker.com/` opens behind Access
- authenticated access works
- unauthenticated access is blocked
- API-backed screens still work

## Important Notes

- A successful `Workers Builds` build is not enough if it does not publish the app change.
- A successful `Pages` manual deploy is the meaningful signal during this phase.
- Do not rewrite `wrangler.toml` to fit the older Worker-build path unless the whole app is intentionally migrated away from Pages.

## Current Known Good Manual Deploy Target

- project: `socialgamemaker-pages`
- command:

```powershell
wrangler.cmd pages deploy public --project-name socialgamemaker-pages
```
