# API Gateway (Token Proxy)

Purpose
- Implements TokenProxyService following ports/adapters
- Enforces tenant isolation, secrets access via port, and structured audit logging (no secrets)

Run
- Install deps: `npm install`
- Test: `npm run test`
- Build: `npm run build`

Notes
- No direct provider clients or secrets are implemented here; use ports for adapters
- Tests validate: tenant isolation, audit logging without secrets, and provider execution routing
