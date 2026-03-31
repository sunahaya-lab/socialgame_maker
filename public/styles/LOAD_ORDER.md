# Split CSS Load Order

This folder is still reference-only.

Runtime CSS source of truth:
- [`../styles.css`](../styles.css)

If the split CSS path is reactivated later, use this starting order:

1. `tokens.css`
2. `base.css`
3. `home.css`
4. `gameplay.css`
5. `editor-shared.css`
6. `editor-core.css`
7. `editor-forms.css`
8. `editor-folders.css`
9. `editor-story-tools.css`
10. `responsive.css`

Notes:
- `editor.css` is legacy residue only
- do not load both `../styles.css` and this split stack at the same time

Current extraction priority before any runtime switch:

1. `SECTION 05` from `../styles.css`
2. `SECTION 02` from `../styles.css`
3. `SECTION 03-04` from `../styles.css`
4. `SECTION 07` from `../styles.css`
5. `SECTION 06` and `SECTION 08A` from `../styles.css`
6. `SECTION 01` from `../styles.css`

Reference:
- [`../../docs/current/styles-css-split-map-2026-03-30.md`](../../docs/current/styles-css-split-map-2026-03-30.md)
