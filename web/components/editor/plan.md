# Plan: Editor UI & Styling Implementation (mode-aware)

TL;DR
Redesign and extend the resume editor UI to a split-mode (Markdown ⇄ WYSIWYG) editor with a Google-Docs-like toolbar. Confirmed decisions: use inline HTML spans for non‑Markdown styles, bundle selected webfonts into the web app, use a JS color-picker library (with eyedropper) for color selection, add an auto-compile every 10s plus a manual `Compile` override, and include a `Clear formatting` action. The left pane houses the editor (with a `Text` toggle), the right pane shows PDF preview.

---

## Goals

- Preserve canonical Markdown as the single persisted source.
- Let users style highlighted text (apply to selection) with bold/italic/underline/strikethrough/highlight/font/color/header/align/indent/list.
- Map basic styles to Markdown when possible; map advanced styles to inline HTML spans that round-trip.
- Provide a horizontal, responsive toolbar that groups actions like Google Docs.
- Bundle webfonts for faithful PDF rendering and provide a font selector in the toolbar.
- Provide a robust color picker with presets + custom hex + eyedropper.
- Auto-compile preview every 10s (debounced) and keep a manual `Compile` button.
- Add `Clear formatting` to remove inline style wrappers and return to plain Markdown where possible.

---

## Confirmed Design Decisions

- Inline HTML spans: Underline, text color, highlight, and font selection will be expressed as inline HTML spans (e.g. `<span class="r-style" data-font="Inter" style="color:#1f77b4;background:#fff8b3">…</span>`). This leverages Resumx's Markdown parser allowing reliable round-trip.
- Bundle webfonts: Ship a set of webfonts in `web/public/fonts` and reference them via `@font-face` so PDF rendering (Chromium/Playwright) uses embedded fonts. Recommended bundled fonts: `Inter`, `Roboto`, `Merriweather`, `Source Code Pro`, `Georgia` (list below).
- JS color-picker library: Use a lightweight, permissively licensed library providing presets + palette + hex input + eyedropper (e.g., `pickr` or `iro.js`). We'll include the library in the web package and wrap it in a small React component.
- Auto compile: Auto-compile (preview refresh) will run at most once every 10s (debounced) when edits are detected, and a manual `Compile` button will always be available to force immediate render.
- Clear formatting: Single action to remove inline HTML wrappers and convert what can be represented to plain Markdown (e.g., strip `<span>` but keep `**bold**`).

---

## Steps (Implementation Order)

1. Types & shared props
   - Create/extend `web/components/editor/types.ts` with `EditorMode`, `SaveStatus`, `EditorToolbarProps`, and `ResumeEditorSurfaceProps`.

2. Toolbar UI & Layout
   - Implement a new `web/components/editor/editor-toolbar.tsx` (or update existing) to:
     - Move the Markdown/WYSIWYG toggle to the left pane header and label it `Text` for the markdown mode option.
     - Remove `Default` dropdown and `Config` button from the toolbar.
     - Add `Page` label next to existing page controls.
     - Add a horizontal, grouped toolbar containing: header dropdown, font dropdown, text color control (opens color-picker), highlight color control, inline toggles (B, I, U, S), Clear formatting, alignment, indent controls, list controls, link/image/insert controls.
     - Remove the font-size dropdown.
   - Ensure the toolbar is responsive with an overflow menu for smaller viewports.

3. Editor Shell & Mode Handling
   - Refactor `web/components/editor/editor-shell.tsx` to own canonical `markdown` state and an `editorMode` state (`'markdown' | 'wysiwyg'`).
   - Read/restore `editorMode` from `localStorage` for a persistent per-client preference.
   - Expose `onEditorModeChange` to the toolbar.

4. Editor Surfaces
   - `MarkdownEditor` (`web/components/editor/markdown-editor.tsx`): accept shared props; implement selection-aware commands that insert Markdown tokens for bold/italic/strike/headers/lists; support `Clear formatting` to strip inline HTML/styles.
   - `WysiwygEditor` (`web/components/editor/wysiwyg-editor.tsx`): implement toolbar command handlers for selection styling; on change, serialize editor content to Markdown that includes inline HTML spans for styles that Markdown cannot express.
   - Both editors should call the same `onChange(markdown)` handler so `EditorShell` always has canonical source.

5. Style application & Markdown sync
   - Implement mapping logic (in `src/core/markdown.ts` or `web/lib/markdown-sync.ts`) for:
     - Bold → `**text**`
     - Italic → `_text_` or `*text*`
     - Strikethrough → `~~text~~`
     - Header → `#`..`######` prefixes
     - Lists → `-` or `1.`
     - Underline / Color / Highlight / Font → inline HTML `<span class="r-style" data-font="…" style="…">…</span>`
   - Ensure the Markdown parser/serializer preserves those spans and the WYSIWYG editor can parse them back into styled nodes.

6. Fonts & renderer mapping
   - Add fonts to `web/public/fonts` and wire `styles/fonts.css` with `@font-face` rules.
   - Provide a mapping from UI font names → CSS font-family strings (with fallbacks) in `web/components/editor/font-map.ts`.
   - Ensure the server-side or Playwright renderer (used by Resumx) loads those fonts when rendering PDF. Update `src/core/renderer.ts` or rendering CSS injection points if necessary.

7. Color picker component
   - Add `web/components/editor/color-picker.tsx` wrapping the chosen JS library with a tiny React adapter.
   - Presets: include ~40 swatches (light→dark) and a `Custom` input that accepts `#RRGGBB` plus an eyedropper.
   - On selection, emit hex color and apply via inline span styles.

8. Auto-compile & preview
   - Implement a debounced compile trigger in `editor-shell` that runs at most once per 10s while typing.
   - Provide an explicit `Compile` button which calls the same compile handler immediately.
   - Indicate compiling state in the toolbar (spinner + `isCompiling` flag) and show warnings from preview headers if present.

9. Accessibility & shortcuts
   - Add keyboard shortcuts: `Ctrl/Cmd+B`, `Ctrl/Cmd+I`, `Ctrl/Cmd+U`, `Ctrl/Cmd+Shift+S` for strikethrough (or `Ctrl/Cmd+Shift+X`), `Tab`/`Shift+Tab` for indent, etc.
   - Ensure toolbar buttons have `aria-label` and focus-visible styles.

10. Clear formatting
    - Implement `clearFormatting(selection)` util to remove inline HTML and style attributes within selection and translate any representable styles back to Markdown tokens.

11. Tests & verification
    - Create unit tests for the Markdown ↔ HTML roundtrip (serialize/deserialize with spans).
    - Add integration tests (Playwright) for toolbar actions and PDF preview rendering.
    - Manual checklist (copy into PR description) for mode-switching and compile behavior verification.

12. Docs
    - Update `web/components/editor/README.md` (create if missing) documenting: toolbar actions, keyboard shortcuts, font list, color presets, and compile behavior.

---

## Relevant Files (where to edit)

- `web/components/editor/types.ts` (new)
- `web/components/editor/editor-shell.tsx` (update)
- `web/components/editor/editor-toolbar.tsx` (update)
- `web/components/editor/markdown-editor.tsx` (update)
- `web/components/editor/wysiwyg-editor.tsx` (update)
- `web/components/editor/font-map.ts` (new)
- `web/components/editor/color-picker.tsx` (new)
- `web/components/editor/plan.md` (this file)
- `web/public/fonts/*` (add font files)
- `styles/fonts.css` (new)
- `src/core/markdown.ts` or `web/lib/markdown-sync.ts` (update mapping and serializer)
- `web/components/editor/pdf-preview.tsx` (tune compile behavior)

---

## Fonts (bundle these first — popular first)

- Inter (sans) — recommended default
- Roboto (sans)
- Open Sans (sans)
- Arial (system fallback)
- Helvetica (system fallback)
- Georgia (serif)
- Times New Roman (serif)
- Merriweather (serif)
- Source Code Pro (monospace)
- Consolas / Menlo (monospace fallback)

Notes: include WOFF2 variants for best PDF embedding. For licensing-critical fonts (system fonts like Arial/Times), rely on system fallbacks or choose Libre alternatives (e.g., Liberation Sans/Serif) if bundling is problematic.

---

## Color Picker & Presets

- Library: `Pickr` (MIT) or `iro.js` (MIT). Implementation will use `pickr` unless you prefer `iro`.
- UI: small dropdown with 40 swatch buttons, a `Custom` input for hex, and an eyedropper.
- Output: normalized `#RRGGBB` stored in inline span style.

---

## Toolbar ASCII Layout (Google-Docs-inspired)

[Mode: Text ▾] [Header ▾] [Font ▾] [Text Color ▾] [Highlight ▾] [B] [I] [U] [S] [Clear] | [Align ▾] [Bulleted] [Numbered] [Decrease indent] [Increase indent] | [Link] [Image] [Insert]

Compact icon row:

[Text] [Normal ▼] [Arial ▼] [H ▼] [A▾] [✚] [B] [I] [U] [S] [⎚] | [L] [•] [1.] [«] [»]

Legend: `⎚` = Clear formatting, `✚` = highlight, `A▾` = text color, `H` = header dropdown.

---

## Synchronization rules (summary)

- Actions that map to standard Markdown: apply Markdown tokens (bold, italic, lists, headers, strike).
- Actions that do not map to Markdown: wrap selection with an HTML `<span>` including class and inline `style` attributes (e.g., color/font/highlight/underline). Example:

```html
<span
	class="r-style"
	data-font="Inter"
	style="color:#1f77b4;background:#fff8b3;text-decoration:underline"
	>Highlighted text</span
>
```

- The serializer should keep markup minimal and use `class` to signal semantics. The CSS in the render pipeline should translate these into the expected PDF appearance.

---

## Auto-compile behavior

- Debounced auto-compile window: 10s after the last edit.
- On initial page load after a compile action, show compiled PDF in the preview pane immediately (if available).
- The toolbar will show compile status and allow forced compile via `Compile` button.

---

## Clear formatting algorithm (high-level)

1. If selection includes inline HTML spans with `r-style`, remove `style` attributes and `class` attributes from the matched nodes.
2. If the span contains styles that can be expressed in Markdown (bold/italic/strike/header/list), convert back to Markdown tokens.
3. For remaining inline HTML wrappers, unwrap the element, keeping plain text content.
4. Normalize whitespace and reserialize to canonical Markdown.

---

## Accessibility & Shortcuts

- `Ctrl/Cmd+B`: Bold
- `Ctrl/Cmd+I`: Italic
- `Ctrl/Cmd+U`: Underline
- `Ctrl/Cmd+Shift+S`: Strikethrough
- `Tab` / `Shift+Tab`: Increase/Decrease indent when cursor inside list
- Toolbar buttons must have `aria-label` and keyboard focus styles.

---

## Verification & Tests

- Unit tests for serializer/ deserializer round-trip for mixed Markdown + inline spans.
- Playwright integration test for toolbar operations (bold, color, font, header, clear formatting) and PDF generation.
- Manual test checklist to include mode switch, autosave, compile, export, and clear formatting behavior.

---

## Open Questions (already decided)

- Use inline HTML spans: YES
- Bundle webfonts: YES
- JS color picker: YES (Pickr by default)
- Auto-compile every 10s + manual compile: YES
- Add `Clear formatting`: YES

---

## Next actions I will take after your approval

1. Create `web/components/editor/types.ts` and update the `todo` tracking item status.
2. Implement toolbar UI in `web/components/editor/editor-toolbar.tsx` and wire `editor-shell` interactions.
3. Add `color-picker.tsx` and `font-map.ts`.
4. Implement Markdown ↔ WYSIWYG sync utilities in `web/lib/markdown-sync.ts` and add tests.

If this looks correct, I will start implementing step 1 and update the TODOs as I progress.
