# STORY-ONB-05 — Portal Connect Accounts Wizard

Summary
Build the Connect Accounts wizard (Google, Microsoft, Retell, Twilio, GHL proxy) in portal. Display connection status, and store tokens server-side.

Inputs/Outputs
- Input: user actions to connect providers
- Output: tokens stored server-side; status badges updated

Ports/Adapters
- api-gateway OAuth proxy for Google/Microsoft; provider token proxy for GHL/Retell/Twilio

Error handling
- OAuth cancellations and errors handled; show retry

Observability
- Audit token events; no tokens in logs; redaction

Test plan
- E2E: connect Google and Retell in sandbox; verify tokens stored and usable

Acceptance criteria
- Wizard available; connections succeed; statuses persist across sessions