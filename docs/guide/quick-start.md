# Quick Start

Install Resumx and render your first resume in under a minute.

```bash
npm install -g @resumx/resumx
npx playwright install chromium # install the browser for rendering PDFs
```

### Optional extras

<div style="border-radius: 10px; border: 1px solid #e0e0e0; padding: 0px 20px 5px; margin: 15px 0;">

**DOCX export** — install pdf2docx

```bash
pip install pdf2docx
```

**Agent Skill** — let your AI agent understand Resumx syntax

```bash
npx skills add resumx/resumx
```

**Git integration**

Set up the `git resumx` alias:

```bash
git config alias.resumx '!f() { spec="$1"; shift; case "$spec" in *:*) ;; *) spec="$spec:resume.md";; esac; tag="${spec%%:*}"; header=$(git tag -l --format="%(refname:short)" "$tag" 2>/dev/null); subject=$(git tag -l --format="%(contents:subject)" "$tag" 2>/dev/null); [ -n "$header" ] && printf "\033[2m%s\033[0m\n\033[1m%s\033[0m\n\n" "$header" "$subject"; git show "$spec" | resumx "$@"; }; f'
```

then use it like `resumx`, but with `ref:file` as the first argument:

```sh
git resumx <ref>:<file> [options]

git resumx sent/stripe-2026-02:resume.md    # render a tagged submission
git resumx a3f1c2d:resume.md --format html  # specific commit as HTML
git resumx :resume.md -o resume-staged      # staged changes (empty ref = index)
```

</div>

Then create and render:

```bash
resumx init resume.md  # Generate a template resume
resumx resume.md       # Render to PDF
```
