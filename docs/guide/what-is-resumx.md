# What is Resumx?

Resumx is a CLI that renders resumes from Markdown to PDF, HTML, and DOCX.

<ResumeDemo />

## How It Works

Your resume is a single Markdown file. Headings become sections, list items become bullet points, and YAML frontmatter controls rendering. A plain `cat resume.md` reads like a resume.

<!-- prettier-ignore-start -->
```markdown
---
pages: 1
---
# Jane Doe

jane@example.com | github.com/jane | linkedin.com/in/jane

## Experience

### Meta || June 2022 - Present
_Senior Software Engineer_

- Built distributed systems serving 1M requests/day
- Built interactive dashboards using TypeScript and React
```
<!-- prettier-ignore-end -->

Run `resumx resume.md` and you get a PDF.

## One File, Every Application

Most people keep one generic resume because tailoring means duplicating files and re-fighting layout for each version. Resumx treats your Markdown as a database of everything you've done. Each job application is a query against it.

Tag content for specific audiences, and Resumx includes or excludes it per render:

```markdown
- Built distributed systems serving 1M requests/day {.@backend}
- Built interactive dashboards using TypeScript {.@frontend}
```

`resumx resume.md --tag backend` produces a backend-focused PDF. `--tag frontend` produces a frontend one. Same file, different output, no copy-paste.

## Auto Page Fitting

Set `pages: 1` in frontmatter and add or remove content freely. Resumx scales spacing, margins, and typography so your resume always lands on exactly the page count you set, without you touching layout.

## Next Steps

- **New here?** [Quick Start](/guide/quick-start) gets you rendering in under a minute.
- **Want to understand the syntax?** [Syntax](/guide/syntax) covers headings, entries, and contact info.
- **Ready to tailor?** [How Tailoring Works](/guide/tailoring) explains tags, views, and variables.
- **Styling?** [Customizing Your Resume](/guide/customizing-your-resume) covers style options, Tailwind CSS, and custom CSS.
