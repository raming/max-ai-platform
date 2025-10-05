#!/usr/bin/env bash
# Decode JWT from stdin and print expiry in ISO8601
# Usage: echo "$TOKEN" | ./ops/scripts/jwt-expiry.sh
set -euo pipefail
read -r TOKEN
PAYLOAD=$(echo "$TOKEN" | awk -F '.' '{print $2}' | tr '_-' '/+' | sed -E 's/={0,2}$//')
if [[ -z "$PAYLOAD" ]]; then echo "invalid token" >&2; exit 1; fi
JSON=$(echo "$PAYLOAD" | base64 -D 2>/dev/null || echo "$PAYLOAD" | base64 -d 2>/dev/null)
EXP=$(echo "$JSON" | jq -r '.exp // empty')
if [[ -z "$EXP" || "$EXP" == "null" ]]; then echo "no exp claim" >&2; echo "$JSON"; exit 0; fi
DATE=$(date -u -r "$EXP" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -jf %s "$EXP" +"%Y-%m-%dT%H:%M:%SZ")
echo "exp: $EXP ($DATE)"
