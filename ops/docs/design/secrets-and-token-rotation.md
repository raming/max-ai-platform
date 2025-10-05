# Secrets and Token Rotation Policy

Purpose
Define how we manage provider tokens and environment variables as a single JSON bundle in Secret Manager, including expiry tracking and rotation.

Secret bundle (JSON)
- Stored in Google Secret Manager as a single JSON document; validated against secret-bundle.schema.json
- Example fields (extend as needed):
```json
{
  "GHL": {
    "TOKEN": "<redacted>",
    "TOKEN_TYPE": "admin_user|subaccount",
    "LOCATION_ID": "<redacted>",
    "EXPIRES_AT": "2025-10-31T23:59:59Z"
  },
  "TWILIO": {
    "ACCOUNT_SID": "<redacted>",
    "AUTH_TOKEN": "<redacted>"
  },
  "RETELL": {
    "API_KEY": "<redacted>"
  },
  "SUPABASE": {
    "PROJECT_URL": "https://...",
    "ANON_KEY": "<redacted>",
    "SERVICE_ROLE_KEY": "<redacted>"
  }
}
```

Token expiry
- If the token is a JWT, decode locally and read the `exp` claim to set EXPIRES_AT (do not upload the decoded payload to logs)
- If expiry is not present or unknown, set a manual EXPIRES_AT and rotation calendar reminder

Rotation
- Update the JSON bundle by adding a new Secret Manager version
- Consumers should load secrets at startup and avoid logging values
- Redactors must be in place for logs; audits record read/write without content

Usage
- Services should read the JSON in-memory at startup (or via sidecar) and map values to env vars if needed
- Never echo secrets to terminal; avoid plaintext in logs and PRs

References
- Schema: ../contracts/secret-bundle.schema.json
- GCP Secrets tooling: ../../gcp/secrets.sh (single secrets), consider adding a JSON import helper
