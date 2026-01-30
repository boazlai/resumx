# Markdown Syntax Reference

## Table of Contents

- [Universal Markdown Syntax](#universal-markdown-syntax)
  - [`h1` Heading](#h1-heading)
  - [`h2` Heading](#h2-heading)
  - [`h3` Heading](#h3-heading)
  - [`h4` - `h6`](#h4---h6)
  - [Definition List](#definitioin-list)
  - [Table](#table)
  - [Link Reference](#link-reference)
- [Auto-Icons](#auto-icons)
- [Bracketed Span](#bracketed-span)
- [Expressions](#expressions) ⚠️ EXPERIMENTAL

## Universal Markdown Syntax {#universal-markdown-syntax}

### `h1` Heading

The `h1` heading is used to denote the name of the person.

```markdown
# John Doe
```

Use `title-caps` variable to control the capitalization of the heading.

```yaml
style: formal
outputName: John_Doe_Resume
formats: [pdf, html, docx]
variables:
  title-caps: small-caps # small-caps, petite-caps, all-caps
```

### `h2` Heading

The `h2` heading is used to denote the section title.

```markdown
## Experience
```

### `h3` Heading

The `h3` heading is used to denote the entry title.

```markdown
## Experience

### Google
```

### `h4` - `h6`

The `h4` - `h6` headings carry no special meaning.

### Definition List

The definition list are rendered in same same line and carry a multi-column layout.

```markdown
### Google [June 2022 - Present]{.right}

Senior Software Engineer
: Infrastructure Platform Team
: San Francisco, CA

- Built distributed systems...
```

> **Note**: You can treat it as a "flex" layout with "justify-content: space-between".

### Table

The table render without a border.
You can treat it as a "grid" layout.

```markdown
| Category   | Technologies            |
| ---------- | ----------------------- |
| Languages  | Python, TypeScript, Go  |
| Frameworks | React, FastAPI, Django  |
| Tools      | Docker, Kubernetes, AWS |
```

> **Note**: You can also add alignments to the table cells.

```markdown
| Left | Center | Right |
| :--- | :----: | ----: |
| L    |   C    |     R |
```

### Link Reference

The reference definition syntax being repurposed for cross-references.

```markdown
[P1]: **Eating is All You Need**
<u>Haha Ha</u>, San Zhang
_Conference on Nutritional Ingredients Processing Systems (NIPS), 2099_
```

Then elsewhere in the resume:

```
- Published novel approach to mushroom cutting (see [P1])
```

### Bold, Italics, Highlight, and Code

resum8 supports the bold, italics, highlight, and code syntax.

```markdown
**Bold**
**Bold**
_Italic_
\*Italic\_
**_Bold and italic_**
**_Bold and italic_**
==Highlight==
`Code`
```

### Comments

HTML comments are hide from the output HTML and other output formats.

If you write:

```markdown
- GPA: 3.8/4.0
- Honors: Dean's List (2018-2022), Regents' Scholar
<!-- - Undergraduate Research: Developed a distributed system for sensor data processing under Prof. Garcia -->
- Teaching Assistant: CS61A Structure and Interpretation of Computer Programs (Fall 2021)
```

The HTML output will be:

```html
<ul>
	<li>GPA: 3.8/4.0</li>
	<li>Honors: Dean's List (2018-2022), Regents' Scholar</li>
	<li>
		Teaching Assistant: CS61A Structure and Interpretation of Computer Programs
		(Fall 2021)
	</li>
</ul>
```

## Auto-Icons

resum8 automatically add icons before the link for the following domains:

| Domain                         | Icon                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mailto:`                      | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#555'><path d='M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'/></svg>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `tel:`                         | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#555'><path d='M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z'/></svg>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `linkedin.com`                 | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#0A66C2'><path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/></svg>                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `github.com`                   | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#333'><path d='M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z'/></svg>                                                                                                                                                                                   |
| `gitlab.com`                   | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#FC6D26'><path d='M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 00-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 00-.867 0L1.386 9.45.044 13.587a.924.924 0 00.331 1.023L12 23.054l11.625-8.443a.92.92 0 00.33-1.024'/></svg>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `youtube.com`                  | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#FF0000'><path d='M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/></svg>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `x.com`                        | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#000'><path d='M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'/></svg>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `stackoverflow.com`            | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#F48024'><path d='M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 19.731H16.85v-2.137H6.111v2.137zm.259-4.852l10.48 2.189.451-2.07-10.478-2.187-.453 2.068zm1.359-5.056l9.705 4.53.903-1.95-9.706-4.53-.902 1.936v.014zm2.715-4.785l8.217 6.855 1.359-1.62-8.216-6.853-1.35 1.617-.01.001zM15.751 0l-1.746 1.294 6.405 8.604 1.746-1.294L15.749 0h.002z'/></svg>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `dribble.com`                  | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#EA4C89'><path d='M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z'/></svg> |
| `behance.com`                  | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#1769FF'><path d='M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.34 1.05.34 1.73 0 .74-.17 1.36-.507 1.86-.338.5-.837.9-1.502 1.22.906.26 1.576.72 2.022 1.37.448.66.665 1.45.665 2.36 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-1.16 1.35-.48.348-1.05.6-1.67.767-.61.165-1.252.254-1.91.254H0V4.51h6.938v-.007zM6.545 9.64c.56 0 1.01-.13 1.36-.397.345-.264.52-.678.52-1.25 0-.3-.06-.56-.165-.76-.11-.2-.26-.36-.442-.477-.19-.12-.4-.2-.64-.24-.23-.04-.49-.06-.76-.06H3.41v3.19h3.13l.005-.005zm.2 5.97c.3 0 .58-.03.84-.09.27-.06.5-.15.7-.29.2-.14.36-.33.48-.57.12-.24.18-.54.18-.91 0-.72-.2-1.24-.59-1.55-.39-.31-.92-.47-1.59-.47H3.41v3.88h3.33l.005-.005z'/></svg>                                                                                                                                                                                                               |
| `medium.com`                   | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#000'><path d='M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z'/></svg>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `dev.to`                       | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#000'><path d='M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .65-.08.84-.23.2-.16.3-.44.3-.85v-2.2c0-.42-.1-.7-.3-.85zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-1.98.77H4.9V8.53h1.67c.92 0 1.54.18 1.98.77.44.58.64 1.49.64 2.72 0 1.23-.2 2.14-.63 2.28zm5.16-5.35H11.9v2.14h1.17v1.36H11.9v2.14h1.83v1.36H10.3V8.53h3.43v1.36l-.01.06zm4.74 5.63c-.34.62-.92.91-1.73.91-.8 0-1.38-.31-1.72-.93-.34-.62-.5-1.53-.5-2.73 0-1.2.17-2.1.51-2.73.34-.62.91-.93 1.71-.93.8 0 1.38.31 1.72.93.34.62.51 1.53.51 2.73.01 1.2-.16 2.12-.5 2.75zm-1.72-5.4c-.48 0-.8.33-.96 1-.16.66-.24 1.32-.24 1.97 0 .66.08 1.32.24 1.98.16.66.48 1 .96 1s.8-.33.96-1c.16-.66.24-1.32.24-1.98 0-.65-.08-1.31-.24-1.97-.16-.67-.48-1-.96-1z'/></svg>                                                                                                                                                                                    |
| `codenpen.io`                  | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#000'><path d='M18.144 13.067v-2.134L16.55 12zm1.715 1.135a1.165 1.165 0 01-.467.935l-6.39 4.258a1.165 1.165 0 01-1.292 0l-6.39-4.258a1.165 1.165 0 01-.467-.935V9.798c0-.39.178-.759.467-.935l6.39-4.258a1.165 1.165 0 011.292 0l6.39 4.258c.289.176.467.545.467.935v4.404zm-4.633-5.1L12 11.06l-3.226-1.958-2.093 1.388L12 13.677l5.319-3.187-2.093-1.388zm-8.67 2.898v2.134L5.141 12l1.415-.912zm3.443 2.09l-3.226 1.958 2.093 1.388L12 14.38l3.226 1.958 2.093-1.388-3.226-1.958L12 14.38z'/></svg>                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `bitbucket.org`                | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#0052CC'><path d='M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z'/></svg>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `marketplace.visualstudio.com` | <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='#007ACC'><path d='M17.583.063a1.5 1.5 0 00-1.032.392 1.5 1.5 0 00-.001 0L7.04 9.018 2.79 5.732a1 1 0 00-1.234.057l-1.36 1.234a1 1 0 000 1.483L3.79 12l-3.594 3.494a1 1 0 000 1.483l1.36 1.234a1 1 0 001.234.057l4.25-3.286 9.51 8.563a1.5 1.5 0 001.033.392c.058 0 .117-.003.175-.01a1.5 1.5 0 00.325-.081l4.621-1.772a1.5 1.5 0 001.296-1.487V2.588a1.5 1.5 0 00-1.296-1.487L18.083.329a1.5 1.5 0 00-.5-.266zm.417 4.188v15.499l-8-6.249V10.5z'/></svg>                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

You can disable them in the meta data section.

```yaml
variables:
  icons: hidden # show, hidden
```

## Bracketed Span with Tailwind CSS {#bracketed-span}

resum8 supports the bracketed span syntax for adding utilities classes or attribute to the element. resum8 fully support [Tailwind CSS](https://tailwindcss.com/docs/styling-with-utility-classes). Utilize their full ecosystem of utility classes to enrich your resume.

```markdown
## Projects

### Personal Website

[View Site](https://example.com){.after:content-['_↗'] .text-blue-600}

- Responsive design built with [React]{.bg-sky-300 .font-sans} and [Tailwind CSS]{.bg-sky-400 .font-sans}
- Deployed to Vercel with automated CI/CD
```

### Adding bracketed span to heading

Note that you do not need to warp heading in `[]`

**❌ Incorrect**

```
## Experience

### [Google]{.small-caps}
```

**✅ Correct**

```
## Experience

### [Google]{.small-caps}
```

## Emoji and Icons Shortcodes

resum8 support using short code for emojis and common icon.

Emoji shortcodes are written using the `:` syntax. For example, `That is so funny! :joy:` would rendered to "That is so funny 😂"

Icons are supported using the `::` syntax with [Iconify](https://iconify.design/) format (`prefix:name`). For example:

```markdown
Built with ::logos:react:: React, ::logos:typescript:: TypeScript, and ::logos:nodejs:: Node.js
```

Would render with properly aligned inline icons. Icons are automatically aligned with text using `vertical-align: -0.125em`.

Common icon prefixes:

- `logos:` - Technology logos (react, typescript, nodejs, python, etc.)
- `mdi:` - Material Design Icons
- `fa6-brands:` - Font Awesome 6 brands
- `heroicons:` - Heroicons

Browse all available icons at [icon-sets.iconify.design](https://icon-sets.iconify.design/).

## Expressions {#expressions}

> ⚠️ **EXPERIMENTAL**: The expression syntax and behavior are experimental and subject to change.

resum8 supports dynamic expressions using the `{{ }}` syntax. This allows you to embed JavaScript expressions directly in your markdown that will be evaluated during rendering.

### Basic Expression Syntax

```markdown
{{ expression }}
```

Frontmatter properties are directly accessible in expressions:

```markdown
---
outputName: John_Doe_Resume
variables:
  company: Google
---

# Resume for {{ outputName }}

Applying to {{ variables.company }}
```

### JavaScript Expressions

You can use any JavaScript expression:

```markdown
{{ new Date().getFullYear() }}
{{ 5 + 3 }}
{{ ['a', 'b', 'c'].join(', ') }}
```

### Async/Await Support

Expressions automatically await Promise results:

```markdown
{{ fetch('https://api.example.com/data').then(r => r.json()).then(d => d.name) }}
```

### Shell Command Shortcut

Use the `{{! }}` syntax to execute shell commands:

```markdown
{{! git log -1 --format="%h" }}
{{! date +%Y }}
```

This is equivalent to using the `exec()` function:

```markdown
{{ exec('git log -1 --format="%h"') }}
```

### Complex Expressions

You can use IIFEs (Immediately Invoked Function Expressions) for more complex logic:

```markdown
{{ (() => { const x = 5; return x * 2; })() }}
```

### Error Handling

If an expression fails to evaluate, it will:

- Return an empty string
- Log an error message to the console
- Continue rendering the rest of the document
