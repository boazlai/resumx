# Style Options

Resumx exposes a set of style options you can override to customize your resume without touching your Markdown.

## Overriding Styles

Set `style:` in frontmatter to override any option:

```markdown
---
style:
  font-family: 'Inter, sans-serif'
  section-title-color: '#2563eb'
  section-title-border: none
---
```

You can also override via `--style` on the CLI. See the [CLI Reference](/guide/cli-reference) for details.

**Priority:** CLI `--style` > Frontmatter > Defaults

## Options Reference

### Typography

| Variable              | Default              | Description                                              |
| --------------------- | -------------------- | -------------------------------------------------------- |
| `font-family`         | `'Georgia', serif`   | Base font stack (used by title and content when not set) |
| `title-font-family`   | `var(--font-family)` | Font for name (h1) and section headings (h2)             |
| `content-font-family` | `var(--font-family)` | Font for body text, entry titles (h3), bullets, etc.     |
| `font-size`           | `11pt`               | Base font size (10–12pt recommended)                     |
| `line-height`         | `1.4`                | Line height ratio                                        |

### Colors

| Variable           | Default   | Description     |
| ------------------ | --------- | --------------- |
| `text-color`       | `#333`    | Main text color |
| `link-color`       | `#0563bb` | Link color      |
| `background-color` | `#fff`    | Page background |

### Headings

| Variable               | Default                                  | Description                                                    |
| ---------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `name-size`            | `1.85rem`                                | Name (h1) font size                                            |
| `name-caps`            | `small-caps`                             | Name capitalization (`small-caps`, `all-small-caps`, `normal`) |
| `name-weight`          | `normal`                                 | Name font weight                                               |
| `name-italic`          | `normal`                                 | Name italic (`normal`, `italic`)                               |
| `name-color`           | `var(--text-color)`                      | Name (h1) color                                                |
| `section-title-size`   | `1.25rem`                                | Section (h2) font size                                         |
| `section-title-caps`   | `normal`                                 | Section title capitalization                                   |
| `section-title-weight` | `bold`                                   | Section title font weight                                      |
| `section-title-italic` | `normal`                                 | Section title italic (`normal`, `italic`)                      |
| `section-title-color`  | `var(--text-color)`                      | Section title color                                            |
| `section-title-border` | `1.5px solid var(--section-title-color)` | Section title underline border                                 |
| `header-align`         | `center`                                 | Header alignment (`left`, `center`, `right`)                   |
| `section-title-align`  | `left`                                   | Section title alignment                                        |
| `entry-title-size`     | `1.05rem`                                | Entry (h3) font size                                           |
| `entry-title-weight`   | `bold`                                   | Entry title font weight                                        |
| `entry-title-italic`   | `normal`                                 | Entry title italic (`normal`, `italic`)                        |

### Links

| Variable         | Default | Description                                |
| ---------------- | ------- | ------------------------------------------ |
| `link-underline` | `none`  | Link underline style (`underline`, `none`) |

### Spacing

| Variable        | Default | Description                                                                             |
| --------------- | ------- | --------------------------------------------------------------------------------------- |
| `page-margin-x` | `0.5in` | Horizontal page margin                                                                  |
| `page-margin-y` | `0.5in` | Vertical page margin                                                                    |
| `gap`           | `1`     | Unitless scale factor for all vertical gaps                                             |
| `section-gap`   | `10px`  | Gap between sections (scaled by `gap`)                                                  |
| `entry-gap`     | `5px`   | Gap between entries (scaled by `gap`)                                                   |
| `row-gap`       | `2px`   | Vertical gap between list items, definition list rows, and table rows (scaled by `gap`) |
| `col-gap`       | `12px`  | Column gap for definition lists and tables                                              |
| `list-indent`   | `1.2em` | List indentation                                                                        |

### Lists

| Variable       | Default | Description                                             |
| -------------- | ------- | ------------------------------------------------------- |
| `bullet-style` | `disc`  | Bullet point style (`disc`, `circle`, `square`, `none`) |

### Features

| Variable     | Default  | Description                     |
| ------------ | -------- | ------------------------------- |
| `auto-icons` | `inline` | Icon display (`inline`, `none`) |

## Style Recipes

A few `style:` snippets that create distinct looks using only variable overrides.

### Classic Serif (the default)

```yaml
style:
  font-family: "'Georgia', serif"
  header-align: center
  name-caps: normal
```

No overrides needed, this is what you get out of the box.

### Zurich

Warm serif with small-caps name and colored section headers.

```yaml
style:
  font-family: 'Inter, ui-sans-serif, system-ui, sans-serif'
  name-caps: small-caps
  section-title-color: '#c43218'
  section-title-border: 1.5px solid var(--section-title-color)
```

### Seattle

Clean sans-serif with left-aligned header and muted section borders.

```yaml
style:
  font-family: "'Arial', 'Helvetica Neue', sans-serif"
  text-color: '#2d3748'
  section-title-border: 2px solid #b0b5be
  header-align: left
  bullet-style: circle
```

### Minimal

No section borders, tight spacing, all-caps section titles.

```yaml
style:
  section-title-border: none
  section-title-caps: uppercase
  section-gap: 6px
  entry-gap: 3px
```

### Bold Modern

Strong contrast with a vibrant blue theme.

```yaml
style:
  font-family: "'Inter', 'Segoe UI', sans-serif"
  name-weight: bold
  section-title-color: '#2563eb'
  link-color: '#2563eb'
```
