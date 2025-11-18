#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

if ! command -v pnpm >/dev/null; then
  echo "pnpm is required. Install via corepack enable pnpm" >&2
  exit 1
fi

if ! command -v poetry >/dev/null; then
  echo "Poetry is required. See https://python-poetry.org/docs/" >&2
  exit 1
fi

cd "$ROOT_DIR"
pnpm install

pushd services/orchestrator >/dev/null
poetry install
popd >/dev/null

pushd agents/livekit >/dev/null
poetry install
popd >/dev/null

echo "Tooling installation complete."
