#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:?Set PROJECT_ID}" 
: "${REGION:?Set REGION}" 
: "${GCP_BILLING_ACCOUNT:?Set GCP_BILLING_ACCOUNT}" 

NAME="${PROJECT_ID}"

echo "Creating project $PROJECT_ID (if not exists)"
if [[ "${SKIP_CREATE:-}" == "true" ]]; then
  echo "SKIP_CREATE=true; skipping gcloud projects create"
else
  if [[ -n "${ORG_ID:-}" ]]; then
    gcloud projects create "$PROJECT_ID" --name="$NAME" --organization="$ORG_ID" || true
  else
    gcloud projects create "$PROJECT_ID" --name="$NAME" || true
  fi
fi

echo "Linking billing account"
gcloud beta billing projects link "$PROJECT_ID" --billing-account="$GCP_BILLING_ACCOUNT" || true

echo "Setting config"
gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"

echo "Enabling APIs"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com iam.googleapis.com logging.googleapis.com

echo "Creating Artifact Registry repo (containers) in $REGION"
gcloud artifacts repositories create containers --repository-format=docker --location="$REGION" --description="Containers for Cloud Run" || true

echo "Bootstrap complete"
