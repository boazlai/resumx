# Style Toolbar

- Type: toolbar component
- Status: functional, broad but not finished
- Primary files:
  - `web/components/editor/style-toolbar.tsx`
  - `web/components/editor/color-picker.tsx`
  - `web/components/editor/frontmatter-panel.tsx`

## Current Status

The style toolbar gives users rich inline formatting and frontmatter-driven style controls without leaving the editor.

## What Works

- Bold, italic, underline, strikethrough
- Heading levels
- Font family selection
- Font size presets
- Text color and highlight selection
- Alignment controls
- Bullet and ordered lists
- Indent controls
- Clear formatting
- Table insertion dialog

## Missing Or Weak

- No richer text effects like small caps as first-class toolbar actions
- No keyboard shortcut documentation for toolbar actions
- Some insert actions remain lighter-weight helpers rather than mature workflows

## Need To Be Done

- Keep toolbar docs aligned with the actual supported markdown/frontmatter transformations
- Document disabled/read-only behavior whenever permissions change

## Next Steps

- Add stronger documentation around what is pure markdown versus HTML span styling
- Add any missing insertion tools only if they map cleanly to resumx semantics
