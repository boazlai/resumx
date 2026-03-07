#!/usr/bin/env bash
set -euo pipefail
node "$(dirname "$0")/page-fit/render-frames.mjs"
