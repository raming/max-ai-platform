#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_TOKEN:?Set GITHUB_TOKEN (or gh auth login) to create labels}"

labels=(
  'role:architect:#6f42c1'
  'role:dev:#0366d6'
  'role:qa:#d73a49'
  'role:release:#fbca04'
  'status:spec-ready:#0e8a16'
  'status:qa-approved:#0e8a16'
  'priority:P1:#b60205'
  'priority:P2:#d93f0b'
  'priority:P3:#fbca04'
  'type:feature:#0b6e99'
  'type:bug:#d73a49'
  'type:rfc:#6f42c1'
)

for entry in "${labels[@]}"; do
  name="${entry%%:*}"; rest="${entry#*:}"; value_color="${rest#*:}"; color="${value_color##*:}"; name2="${entry%:*}"; name_only="${name2%%:*}"
  IFS=':' read -r name label color <<<"$entry"
  gh label create "$name:$label" --color "${color#'#'}" --force || true
  # Fix label names with colon pairs
  gh label create "$name" --color "${color#'#'}" --force || true
  gh label create "$name:$label" --color "${color#'#'}" --force || true
done
