# Icons

Use the `:icon:` syntax to add icons inline. Click any icon below to copy its syntax.

<IconGallery />

### Iconify {#iconify-icons}

Need something not in the gallery? Use the `set/name` syntax for access to [200,000+ Iconify icons](https://icon-sets.iconify.design/):

- `:devicon/react:` -- <img src="/icons/devicon:react.svg" alt="devicon/react" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `:logos/kubernetes:` -- <img src="/icons/logos:kubernetes.svg" alt="logos/kubernetes" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `:simple-icons/docker:` -- <img src="/icons/simple-icons:docker.svg" alt="simple-icons/docker" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `:mdi/work:` -- <img src="/icons/mdi:work.svg" alt="mdi/work" style="display: inline-block; height: 1.25em; vertical-align: text-top;">

::: info
Iconify icons may need **internet access** the first time. Resumx caches fetched icons, so later renders usually work offline.
:::

### Custom Icons {#custom-icons}

Define your own icons in frontmatter. Values can be raw SVG, a URL, or a `data:` URI.

```markdown
---
icons:
  mycompany: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
  partner: 'https://example.com/partner-logo.svg'
  badge: 'data:image/svg+xml;base64,PHN2Zz4uLi48L3N2Zz4='
---

Worked at :mycompany: in partnership with :partner:.
```

Custom icons override built-in and Iconify icons with the same name.

### Auto-Icons {#auto-icons}

Links to recognized domains automatically get their platform icon. No syntax needed.

```markdown
[jane@example.com](mailto:jane@example.com) | [linkedin.com/in/jane](https://linkedin.com/in/jane) | [github.com/jane](https://github.com/jane)
```

Supports `mailto:`, `tel:`, LinkedIn, GitHub, GitLab, Bitbucket, Stack Overflow, X, YouTube, Dribbble, Behance, Medium, DEV, CodePen, and VS Code Marketplace.

To disable, set `style.auto-icons` to `none` in frontmatter.
