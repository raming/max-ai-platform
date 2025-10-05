# GCP Bootstrap for ARCH-14 (Cloud Run + Secret Manager)

Purpose
Provision a minimal GCP project for webhook validation (Cloud Run) and secrets (Secret Manager), then deploy the webhook-echo service to validate GHL payloads.

Prereqs
- gcloud CLI authenticated: gcloud auth login
- Set env vars (example):
  - export PROJECT_ID=my-maxai-arch14
  - export REGION=us-central1
  - export GCP_BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX (ask your GCP admin)
  - Optional (org): export ORG_ID=123456789012

Steps
1) Bootstrap project and APIs
- ./ops/gcp/bootstrap-project.sh

2) Deploy webhook echo (Cloud Run)
- gcloud config set project $PROJECT_ID
- gcloud config set run/region $REGION
- ./ops/gcp/deploy-webhook-echo.sh

3) Validate
- curl -s $CLOUD_RUN_URL/healthz | jq
- Point GHL webhook actions to $CLOUD_RUN_URL/webhook/ghl

4) Secret Manager (optional initial setup)
- ./ops/gcp/secrets.sh create-secret GHL_TOKEN
- ./ops/gcp/secrets.sh create-secret GHL_LOCATION_ID
- ./ops/gcp/secrets.sh add-version GHL_TOKEN  # you will be prompted to paste; CTRL-D to end
- ./ops/gcp/secrets.sh add-version GHL_LOCATION_ID

Security notes
- Keep tokens in Secret Manager; do not echo secrets to terminal or commit them.
- Webhook-echo requires no secrets; it only validates payloads against our schema.
