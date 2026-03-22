# Editor

- Type: page and shell
- Status: functional, actively evolving
- Primary files:
  - `web/app/resume/[id]/page.tsx`
  - `web/components/editor/editor-shell.tsx`
  - `web/components/editor/markdown-editor.tsx`
  - `web/components/editor/editor-sidebar.tsx`
  - `web/components/editor/editor-toolbar.tsx`

## Current Status

The editor is the main working surface of the web app. It supports single-user editing well and now has the first collaboration-aware access layer.

## What Works

- Split editor and preview layout
- Auto-save
- Auto-compile preview
- Word count
- Frontmatter-aware editing
- Viewer/editor access enforcement
- Narrow-screen preview toggle
- Resume duplication from the editor

## Missing Or Weak

- No dedicated keyboard-shortcuts help
- No command palette
- No snapshot diff viewer
- Mobile layout still needs work
- No realtime multi-user sync yet

## Need To Be Done

- Keep the editor doc aligned with changes across toolbar, sidebar, preview, history, and collaboration work
- Treat the editor as the umbrella feature and keep deeper feature files in sync with it

## Next Steps

- Add command palette and keyboard shortcut reference
- Improve mobile behavior
- Land collaboration sync and review flows without regressing single-user editing
