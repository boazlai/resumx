# Classes & IDs

Add classes, IDs, and HTML attributes to any Markdown element using curly-brace `{...}` syntax.

## Bracketed Spans

Wrap inline text in `[text]{...}` to produce a `<span>` with the given classes, IDs, or attributes:

| Markdown               | HTML                                    |
| ---------------------- | --------------------------------------- |
| `[text]{.right}`       | `<span class="right">text</span>`       |
| `[text]{#my-id}`       | `<span id="my-id">text</span>`          |
| `[text]{data-x="val"}` | `<span data-x="val">text</span>`        |
| `[text]{.a .b #id}`    | `<span class="a b" id="id">text</span>` |

This is the most common syntax in Resumx — used for applying [Tailwind CSS](/tailwind-css) classes, tagging content for [per-role output](/per-role-output), and more:

```markdown
### Google [2022 – Present]{.right}

_Senior Software Engineer_ [San Francisco, CA]{.right}
```

## Element Attributes

When `{...}` appears at the end of a block element without `[...]`, it applies to the whole element instead of wrapping text in a span:

```markdown
### Google {.small-caps}

## Experience

- Designed REST APIs with OpenAPI documentation {.role:backend}
- Built interactive dashboards with React and D3.js {.role:frontend}
- Led team of 5 engineers to deliver project 2 weeks early
```

## Fenced Divs

Use `:::` to wrap block content in a `<div>` with attributes — the block-level counterpart to bracketed spans:

```markdown
::: {.custom-class}
Content here
:::
```

Produces:

```html
<div class="custom-class">
	<p>Content here</p>
</div>
```

Useful for applying Tailwind or custom CSS to a group of elements.

### Nesting

Fenced divs can be nested. Using more colons for outer divs is optional but improves readability:

```markdown
:::: {.outer}
::: {.inner}
Content
:::
::::
```
