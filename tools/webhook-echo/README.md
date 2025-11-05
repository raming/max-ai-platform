# Webhook Echo (GHL) — Cloud Run quickstart

Purpose
Deploy a minimal echo endpoint that validates GHL webhook payloads against our schema.

Build & deploy (Cloud Run)

1) Enable services and set defaults
- gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
- gcloud config set project $PROJECT_ID
- gcloud config set run/region $REGION

2) Build
- gcloud builds submit ops/tools/webhook-echo --tag gcr.io/$PROJECT_ID/ghl-webhook-echo:latest

3) Deploy
- gcloud run deploy ghl-webhook-echo --image gcr.io/$PROJECT_ID/ghl-webhook-echo:latest --allow-unauthenticated

4) Verify
- curl -s $CLOUD_RUN_URL/healthz | jq

5) Configure GHL webhook actions
- Use $CLOUD_RUN_URL/webhook/ghl as target URL for relevant triggers (contact_created, appointment_booked, etc.)

Notes
- No secrets stored here. Validation uses ops/docs/contracts/ghl-event.schema.json packaged with the image.
