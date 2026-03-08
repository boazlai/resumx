# Syntax

Resumx uses standard [Markdown](https://www.markdownguide.org/basic-syntax/) with a few resume-specific extensions. This page covers how Markdown maps to resume structure, and the extensions that make layout and data display easier.

## Structure

Your resume is a hierarchy, and headings create it. `h1` is your name, `h2` starts a section, `h3` starts an entry within a section. `h4`–`h6` have no special meaning.

```markdown
# John Doe

## Experience

### Google
```

Every resume follows this pattern: a name at the top, sections that group related content, and entries within each section.

## Inline Columns

Entries usually need a date or location on the right side. Use `||` to split a line into columns, pushing them to opposite edges.

<!-- prettier-ignore-start -->
:::: code-group
```markdown [Markdown]
### Google || Jan 2020 - Present
*Senior Software Engineer* || San Francisco, CA
```

```html [HTML]
<h3>
	<span class="col">Google</span>
	<span class="col">Jan 2020 - Present</span>
</h3>
<p>
	<span class="col"><em>Senior Software Engineer</em></span>
	<span class="col">San Francisco, CA</span>
</p>
```
::::
<!-- prettier-ignore-end -->

![Inline Columns](/images/inline-columns-demo.png)

You can have more than two columns. Each `||` adds another column, spread evenly across the line.

## Attributes

Sometimes you need to lay out a skills list in columns, apply custom styling to a specific element, or group content into a block. Curly braces `{...}` let you attach classes and attributes to any Markdown element, which is how [Tailwind CSS](/guide/tailwind-css) hooks in.

### On inline text

Wrap text in `[text]{.class}` to style just that portion of a line:

```markdown
### Google [Remote]{.text-sm .text-gray-500}
```

![Inline Attributes](/images/inline-attribute.png)

---

### On a whole element

Append `{...}` at the end of any block element to apply it to the
element itself, not a span inside it:

```markdown
- Increased system throughput by 40% {.underline}
```

![Element Attributes](/images/element-attribute.png)

---

### On a group of elements

Wrap content in `:::` fences when you need attributes on a group:

```markdown
::: {.grid .grid-cols-3}

- JavaScript
- TypeScript
- Python
- React
- Node.js
- PostgreSQL
  :::
```

![Grid skills layout](/images/grid-bullet-with-fence.png)

## Label Lists

Using Markdown's [definition list](https://www.markdownguide.org/extended-syntax/#definition-lists) syntax, a term followed by `: value` lines. Instead of stacking vertically,
the term renders as a bold label with all values laid out inline beside it.

```markdown
Languages
: JavaScript, TypeScript, Python, SQL

Frameworks
: React, Node.js, Express, FastAPI
```

![Label Lists](/images/label-lists-demo.png)
