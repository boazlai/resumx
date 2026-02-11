# Agent Skills

Resumx ships with [Agent Skills](https://agentskills.io/home) — so AI editors like Cursor, Claude Code, and Copilot understand your resume's syntax, layout options, and conventions out of the box.

## Installation

```bash
npx skills add ocmrz/resumx
```

The [skills CLI](https://github.com/vercel-labs/skills) auto-detects your installed agents and places files in the right locations.

## What's Included

- **writing-resume** — Interactive resume creation. Collects your info step-by-step and generates properly formatted Resumx markdown.
- **json-resume-to-markdown** — Converts between [JSON Resume](https://jsonresume.org/) and Resumx markdown in either direction.

The agent checks for relevant skills automatically. Just describe what you want — _"create a resume"_, _"convert resume.json to markdown"_, _"tailor this for a backend role"_ — and the right skill activates.
