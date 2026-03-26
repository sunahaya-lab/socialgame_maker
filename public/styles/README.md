# CSS Source Of Truth

- Runtime source of truth: [`../styles.css`](../styles.css)
- Current status of this folder: reference/split work only
- These files are not loaded by [`../index.html`](../index.html) at runtime

## Working Rule

- When fixing live styling, edit [`../styles.css`](../styles.css) first
- Do not assume changes under [`./`](./) affect the browser
- Only promote split CSS to runtime after an explicit assembly/load path is introduced

## Intended Split Order

If the split files are reactivated later, start from this load order:

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

`editor.css` is legacy residue and should not be treated as the main editor entry.
