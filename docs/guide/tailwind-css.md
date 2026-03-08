# Tailwind CSS

::: info New to Tailwind?
[Tailwind CSS](https://tailwindcss.com/) is a utility-first CSS framework — apply classes like `text-blue-800` or `px-2` directly to elements instead of writing custom CSS. See Tailwind's [Styling with utility classes](https://tailwindcss.com/docs/styling-with-utility-classes) to learn more.
:::

Resumx compiles [Tailwind CSS v4](https://tailwindcss.com/) on-the-fly. Apply classes to any element using the [Attributes syntax](/guide/syntax#attributes).

## Using Tailwind in Markdown

### Inline Spans

```markdown
Built with [React]{.bg-blue-100 .text-blue-800 .px-2 .rounded}
[View Site](https://example.com){.text-blue-600 .after:content-['_↗']}
```

### Headings

```markdown
### Google {.text-gray-600 .font-normal}
```

### Block Content

Style a list or other single block element directly (no wrapper needed):

<!-- prettier-ignore-start -->
```markdown
::: {.grid .grid-cols-3 .gap-x-4 .list-none}
- JavaScript
- TypeScript
- Python
- React
- Node.js
- PostgreSQL
:::
```
<!-- prettier-ignore-end -->

Wrap multiple elements in a styled container:

<!-- prettier-ignore-start -->
```markdown
::: div {.bg-gray-50 .p-4 .rounded-lg}
## Section Title

Content with a styled container
:::
```
<!-- prettier-ignore-end -->

### Layout

Combine fenced divs with Tailwind layout utilities. Child elements can use bracketed spans or attribute lists:

<!-- prettier-ignore-start -->
```markdown
::: div {.flex .gap-4}
## Title {.flex-1}

[Button]{.self-end}
:::
```
<!-- prettier-ignore-end -->

## Arbitrary Values

Use square brackets for one-off values outside the default theme:

```markdown
[Custom color]{.text-[#ff6600]}
[After arrow]{.after:content-['↗']}
```

## Built-in Utility Classes

In addition to Tailwind, Resumx provides a few utility classes of its own:

| Class                | Effect                                        |
| -------------------- | --------------------------------------------- |
| `.small-caps`        | Apply `font-variant-caps: small-caps`         |
| `.sr-only`           | Visually hidden, accessible to screen readers |
| `.max-1` – `.max-16` | Hide children beyond the Nth                  |

### Capping Visible Children

The `max-N` classes hide all children of an element beyond the Nth. This is useful when composite tag views combine many tagged bullets and produce more content than fits well on the page.

Apply via an unnamed fenced div so the class falls through to the `<ul>` (single child):

<!-- prettier-ignore-start -->
```markdown
::: {.max-3}
- Most important bullet
- Second most important
- Third most important
- ...remaining bullets hidden beyond 3rd
:::
```
<!-- prettier-ignore-end -->

Order bullets from most important to least important within each entry, so the cap always keeps the strongest content visible.
