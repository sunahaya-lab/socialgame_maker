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
