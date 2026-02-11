# CLI Reference

The Resumx CLI is invoked with `resumx`. Running `resumx --help` shows all commands and options.

[[toc]]

## Render (Default)

Render a Markdown resume to PDF, HTML, PNG, or DOCX.

```bash
resumx <file>
```

If no file is specified, defaults to `resume.md`.

### Options

| Flag                  | Description                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `-s, --style <name>`  | Style(s) to use. Repeatable, comma-separated.                    |
| `-o, --output <name>` | Output filename (without extension) or directory path.           |
| `--var <name=value>`  | Override a CSS variable. Repeatable.                             |
| `--role <name>`       | Generate for specific role(s) only. Repeatable, comma-separated. |
| `--pdf`               | Output PDF only.                                                 |
| `--html`              | Output HTML only.                                                |
| `--docx`              | Output DOCX only (requires `pdf2docx`).                          |
| `--png`               | Output PNG image.                                                |
| `--all`               | Output all formats (PDF, HTML, DOCX).                            |
| `-w, --watch`         | Watch for changes and auto-rebuild.                              |

### Examples

```bash
# Basic render to PDF
resumx resume.md

# Use a specific style
resumx resume.md --style zurich

# Multiple styles (produces separate PDFs)
resumx resume.md --style zurich,oxford,seattle

# Custom output name
resumx resume.md --output John_Doe_Resume

# Override CSS variables
resumx resume.md --var font-family="Inter, sans-serif" --var accent-color="#2563eb"

# Multiple formats
resumx resume.md --all

# Watch mode
resumx resume.md --watch

# Filter by role
resumx resume.md --role frontend

# Combine options
resumx resume.md --style zurich --role frontend,backend --all --watch
```

## init

Create a new resume from the starter template.

```bash
resumx init [filename]
```

| Argument   | Default     | Description                   |
| ---------- | ----------- | ----------------------------- |
| `filename` | `resume.md` | Name for the new resume file. |

| Flag          | Description                                |
| ------------- | ------------------------------------------ |
| `-f, --force` | Overwrite existing file without prompting. |

### Examples

```bash
resumx init                    # Creates resume.md
resumx init my-resume.md       # Creates my-resume.md
resumx init resume.md --force  # Overwrite if exists
```

## eject

Copy a bundled style to `./styles/` for local customization.

```bash
resumx eject [style]
```

| Argument | Default         | Description                         |
| -------- | --------------- | ----------------------------------- |
| `style`  | _(interactive)_ | Name of the bundled style to eject. |

| Flag          | Description                     |
| ------------- | ------------------------------- |
| `-f, --force` | Overwrite existing local style. |

Once ejected, the local copy in `./styles/` takes precedence over the bundled version. Edit it freely.

### Examples

```bash
resumx eject zurich         # Copy zurich.css to ./styles/
resumx eject zurich         # Copy zurich.css to ./styles/
resumx eject zurich --force # Overwrite existing local copy
```

## style

List available styles, view style details, or manage style defaults.

```bash
resumx style [name]
```

### Subcommands

**List all styles:**

```bash
resumx style
```

Shows all available styles (bundled and local), indicating which are local overrides.

**View style info:**

```bash
resumx style zurich
```

Shows the style's CSS variables and their current values.

**Set default style:**

```bash
resumx style --default zurich
```

| Flag                     | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| `-d, --default <name>`   | Set the global default style.                            |
| `--set <name=value>`     | Set a default variable override for a style. Repeatable. |
| `-r, --reset <variable>` | Reset a specific style variable to its default.          |
| `--reset-all`            | Reset all style variable overrides.                      |

### Examples

```bash
# Set global default
resumx style --default zurich

# Set persistent variable overrides
resumx style zurich --set font-family="Inter, sans-serif"
resumx style zurich --set accent-color="#2563eb"

# Reset a variable
resumx style zurich --reset font-family

# Reset all overrides
resumx style zurich --reset-all
```

## validate

Validate resume structure and content.

```bash
resumx validate [file]
```

| Argument | Default     | Description              |
| -------- | ----------- | ------------------------ |
| `file`   | `resume.md` | Resume file to validate. |

| Flag                     | Description                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `--strict`               | Exit with error code if any issues are found.                                          |
| `--min-severity <level>` | Minimum severity to display: `critical`, `warning`, `note`, `bonus`. Default: `bonus`. |

### Examples

```bash
resumx validate                           # Validate resume.md
resumx validate my-resume.md              # Validate specific file
resumx validate --strict                  # Fail on any issue (for CI)
resumx validate --min-severity warning    # Hide notes and bonuses
```

## Output Formats

| Format | Flag              | Notes                                                               |
| ------ | ----------------- | ------------------------------------------------------------------- |
| PDF    | `--pdf` (default) | Rendered via Chromium, A4 page size                                 |
| HTML   | `--html`          | Standalone file with embedded CSS                                   |
| PNG    | `--png`           | A4 viewport (794 × 1123 px)                                         |
| DOCX   | `--docx`          | Via PDF intermediate — requires `pdf2docx` (`pip install pdf2docx`) |

Use `--all` to generate PDF, HTML, and DOCX at once.

## Frontmatter Configuration

All CLI options can be set in the resume's YAML frontmatter:

```yaml
---
style: zurich # Style name(s)
outputName: John_Doe_Resume # Output filename (no extension)
outputDir: ./dist # Output directory
formats: [pdf, html] # Output formats (pdf, html, docx, png)
roles: [frontend, backend] # Roles to generate
variables: # CSS variable overrides
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
---
```

TOML frontmatter (`+++` delimited) is also supported:

```toml
+++
style = "zurich"
outputName = "John_Doe_Resume"
formats = ["pdf", "html"]

[variables]
font-family = "Inter, sans-serif"
accent-color = "#2563eb"
+++
```

## Global Configuration

Global settings are stored in `~/.config/resum8/config.json`:

```json
{
	"defaultStyle": "zurich",
	"styleVariables": {
		"zurich": {
			"font-family": "Inter, sans-serif"
		}
	}
}
```

Manage via the `style` command rather than editing directly.

The config directory can be overridden with the `RESUM8_CONFIG_DIR` environment variable.

## Output Naming

Output filenames are automatically determined:

| Scenario                  | Output                       |
| ------------------------- | ---------------------------- |
| 1 style, no roles         | `resume.pdf`                 |
| 1 style, with roles       | `resume-frontend.pdf`        |
| Multiple styles, no roles | `resume-zurich.pdf`          |
| Multiple styles + roles   | `frontend/resume-zurich.pdf` |
