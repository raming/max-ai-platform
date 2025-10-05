#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}"
: "${REGION:?Set REGION}"

gcloud config set project "$PROJECT_ID"

REPO_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/containers"
IMAGE="${REPO_PATH}/ghl-webhook-echo:latest"

echo "Building to Artifact Registry: $IMAGE"
gcloud builds submit ops/tools/webhook-echo --tag "$IMAGE"

echo "Deploying Cloud Run service (ghl-webhook-echo)"
gcloud run deploy ghl-webhook-echo --image "$IMAGE" --allow-unauthenticated --region "$REGION"

echo "Fetch service URL"
gcloud run services describe ghl-webhook-echo --region "$REGION" --format 'value(status.url)'
