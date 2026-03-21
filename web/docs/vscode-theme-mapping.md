# VS Code Theme → CSS Variable Mapping Formula

Use this reference to port any VS Code color theme into the resume editor.

## Step 1 — Extract colors from the VS Code theme JSON

VS Code themes are JSON files (`.json`) with a `colors` object. The relevant keys are listed in the mapping table below. You can find theme JSONs in:

- `~/.vscode/extensions/<theme-name>/themes/*.json`
- Published on the VS Code Marketplace (each extension's source repo)

## Step 2 — Convert hex to HSL

CSS variables here use the `H S% L%` format (no `hsl()` wrapper, so Tailwind opacity modifiers work).

Example: `#cba6f7` → `267 84% 81%`

Quick conversion tools:

- https://www.colorhexa.com/ — paste hex, read HSL
- Browser DevTools color picker → switch to HSL mode

## Step 3 — Assign to CSS variables

| CSS variable               | VS Code `colors` key                 | Semantic role                                       |
| -------------------------- | ------------------------------------ | --------------------------------------------------- |
| `--background`             | `editor.background`                  | Main app background                                 |
| `--foreground`             | `editor.foreground`                  | Primary text                                        |
| `--card`                   | `sideBar.background`                 | Card / panel background (slightly offset from base) |
| `--card-foreground`        | `sideBar.foreground`                 | Text on cards                                       |
| `--popover`                | `dropdown.background`                | Dropdown / popover background                       |
| `--popover-foreground`     | `dropdown.foreground`                | Text in popovers                                    |
| `--primary`                | `button.background` or `focusBorder` | Action color, selected states                       |
| `--primary-foreground`     | `button.foreground`                  | Text on primary buttons                             |
| `--secondary`              | `list.hoverBackground`               | Hover states, secondary surfaces                    |
| `--secondary-foreground`   | `list.hoverForeground`               | Text on secondary surfaces                          |
| `--muted`                  | `tab.inactiveBackground`             | Subdued backgrounds                                 |
| `--muted-foreground`       | `tab.inactiveForeground`             | Placeholder / hint text                             |
| `--accent`                 | `list.activeSelectionBackground`     | Highlighted selection background                    |
| `--accent-foreground`      | `list.activeSelectionForeground`     | Text on accent                                      |
| `--destructive`            | `editorError.foreground`             | Error / danger color                                |
| `--destructive-foreground` | _(text on destructive bg)_           | Use Base or Crust color                             |
| `--border`                 | `panel.border` or `widget.border`    | Dividers, borders                                   |
| `--input`                  | `input.background`                   | Input field background                              |
| `--ring`                   | `focusBorder`                        | Focus ring on interactive elements                  |

## Step 4 — Choose the CSS class selector

| Theme type    | Class to use on `<html>` | Also add `.dark`?                                 |
| ------------- | ------------------------ | ------------------------------------------------- |
| Light variant | `.theme-<your-name>`     | No                                                |
| Dark variant  | `.theme-<your-name>`     | **Yes** (required for Tailwind `dark:` utilities) |

Dark themes must be added to the `DARK_THEMES` array in `web/lib/theme.tsx`.

## Step 5 — Add to globals.css

```css
/* ── My Theme Name ───────────────────────────────────── */
.theme-my-theme {
	--background: H S% L%;
	--foreground: H S% L%;
	--card: H S% L%;
	--card-foreground: H S% L%;
	--popover: H S% L%;
	--popover-foreground: H S% L%;
	--primary: H S% L%;
	--primary-foreground: H S% L%;
	--secondary: H S% L%;
	--secondary-foreground: H S% L%;
	--muted: H S% L%;
	--muted-foreground: H S% L%;
	--accent: H S% L%;
	--accent-foreground: H S% L%;
	--destructive: H S% L%;
	--destructive-foreground: H S% L%;
	--border: H S% L%;
	--input: H S% L%;
	--ring: H S% L%;
	--radius: 0.5rem;
}
```

## Step 6 — Wire up the UI

1. Add the new theme name to the `Theme` type in `web/lib/theme.tsx`
2. If dark, add it to `DARK_THEMES` in the same file
3. Add the `applyTheme` class toggle in `applyTheme()` in the same file
4. Update the flash-prevention inline script in `web/app/layout.tsx`
5. Add a `ThemeCard` entry in `web/components/settings-panel.tsx` with representative swatches

---

## Reference: Catppuccin palette (as implemented)

### Mocha (dark) — class `theme-catppuccin-mocha dark`

| Variable             | Color name | Hex       | HSL           |
| -------------------- | ---------- | --------- | ------------- |
| `--background`       | Base       | `#1e1e2e` | `240 21% 15%` |
| `--foreground`       | Text       | `#cdd6f4` | `226 64% 88%` |
| `--card`             | Mantle     | `#181825` | `240 21% 12%` |
| `--primary`          | Mauve      | `#cba6f7` | `267 84% 81%` |
| `--secondary`        | Surface0   | `#313244` | `237 16% 23%` |
| `--muted-foreground` | Subtext0   | `#a6adc8` | `228 24% 72%` |
| `--accent`           | Surface1   | `#45475a` | `234 13% 31%` |
| `--destructive`      | Red        | `#f38ba8` | `343 81% 75%` |
| `--border`           | Surface1   | `#45475a` | `234 13% 31%` |

### Latte (light) — class `theme-catppuccin-latte`

| Variable             | Color name | Hex       | HSL           |
| -------------------- | ---------- | --------- | ------------- |
| `--background`       | Base       | `#eff1f5` | `220 24% 95%` |
| `--foreground`       | Text       | `#4c4f69` | `234 16% 35%` |
| `--card`             | Mantle     | `#e6e9ef` | `220 22% 92%` |
| `--primary`          | Mauve      | `#8839ef` | `266 85% 58%` |
| `--secondary`        | Surface0   | `#ccd0da` | `222 16% 83%` |
| `--muted-foreground` | Subtext0   | `#6c6f85` | `233 10% 47%` |
| `--accent`           | Surface1   | `#bcc0cc` | `225 14% 77%` |
| `--destructive`      | Red        | `#d20f39` | `347 87% 44%` |
| `--ring`             | Lavender   | `#7287fd` | `231 97% 72%` |
