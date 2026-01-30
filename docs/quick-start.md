# Quick Start

Get from zero to a rendered resume in a few minutes.

## 1. Install the CLI

```bash
npm install -g resumx
```

PDF rendering uses [Playwright](https://playwright.dev/) with a bundled Chromium, installed automatically when you run `npm install`.

## 2. Create Your First Resume

```bash
m8 init resume.md   # Generate a template resume
m8 resume.md        # Render to PDF
```

## 3. (Optional) Customize Output

```bash
m8 resume.md --style formal   # Use a different style
m8 resume.md --html           # Generate HTML
m8 resume.md --docx           # Generate DOCX (requires pdf2docx)
m8 resume.md --all            # PDF, HTML, and DOCX
m8 resume.md --watch          # Auto-rebuild on changes
```

## Next Steps

- Read [What is Resumx?](/what-is-resumx) for the full picture.
- See [Markdown Examples](/markdown-examples) and [Runtime API Examples](/api-examples) for syntax and features.
- Use frontmatter in your markdown to set style, output name, and formats—see the main [README](https://github.com/ocmrz/resumx) for details.
