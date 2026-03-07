#!/usr/bin/env bash
set -euo pipefail

DEMO_DIR="/tmp/resumx-git-demo"

# Clean up any previous run
rm -rf "$DEMO_DIR"
mkdir -p "$DEMO_DIR"

cp "$(dirname "$0")/resume.md" "$DEMO_DIR/"
cd "$DEMO_DIR"

git init -q
git add .
git commit -q -m init
git tag -a sent/stripe-2026-02 -m 'Tailored for L5 infra, emphasized Kafka + distributed systems'

git config alias.resumx '!f() { spec="$1"; shift; case "$spec" in *:*) ;; *) spec="$spec:resume.md";; esac; tag="${spec%%:*}"; header=$(git tag -l --format="%(refname:short)" "$tag" 2>/dev/null); subject=$(git tag -l --format="%(contents:subject)" "$tag" 2>/dev/null); [ -n "$header" ] && printf "\033[2m%s\033[0m\n\033[1m%s\033[0m\n\n" "$header" "$subject"; git show "$spec" | resumx "$@"; }; f'
