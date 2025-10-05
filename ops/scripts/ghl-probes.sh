#!/usr/bin/env bash
# GHL API probes — use server-side token only (never commit tokens)
# Usage:
#   export GHL_TOKEN="..." GHL_LOCATION_ID="..."
#   ./ops/scripts/ghl-probes.sh custom_fields
#   ./ops/scripts/ghl-probes.sh search_contacts "john@example.com"
#   ./ops/scripts/ghl-probes.sh update_contact "CONTACT_ID" '{"customField": "value"}'

set -euo pipefail

BASE_URL="https://services.leadconnectorhq.com"
HDRS=(-H "Authorization: Bearer ${GHL_TOKEN:-}" -H "Content-Type: application/json")

custom_fields() {
  curl -sS "${BASE_URL}/locations/${GHL_LOCATION_ID}/customFields" "${HDRS[@]}" | jq '.'
}

search_contacts() {
  local q="${1:-}"
  if [[ -z "$q" ]]; then echo "query required" && exit 1; fi
  curl -sS "${BASE_URL}/contacts?query=$(printf %s "$q" | sed 's/\s/%20/g')&locationId=${GHL_LOCATION_ID}" "${HDRS[@]}" | jq '.'
}

update_contact() {
  local id="${1:-}"; shift || true
  local body="${1:-}"
  if [[ -z "$id" || -z "$body" ]]; then echo "contact_id and JSON body required" && exit 1; fi
  curl -sS -X PATCH "${BASE_URL}/contacts/${id}" "${HDRS[@]}" -d "$body" | jq '.'
}

case "${1:-}" in
  custom_fields) custom_fields ;;
  search_contacts) shift; search_contacts "$@" ;;
  update_contact) shift; update_contact "$@" ;;
  *) echo "Usage: $0 {custom_fields|search_contacts <query>|update_contact <id> <json>}" ;;
 esac
