# GHL OAuth Proxy Sequence Diagrams

**Status**: Draft  
**Related**: [ARCH-03 — GHL Encapsulation Strategy](https://github.com/raming/max-ai-platform/issues/56)  
**Linked ADR**: [ADR-0001: GHL Encapsulation Strategy](/ops/docs/adr/adr-0001-ghl-encapsulation.md)

## Overview

Note on abstraction: These flows are implemented via the IGHLAuthPort. The current concrete adapter is AdminUserSeedAuthAdapter (admin-user token as seed). A future AgencyApiKeyAuthAdapter can be swapped in via DI without changes to consumers.

This document defines the OAuth proxy sequence flows for connecting client accounts to GHL services while maintaining server-side token storage and zero client exposure to GHL URLs or credentials.

## Connect Reviews Flow

```mermaid
sequenceDiagram
    participant Client as Client Portal
    participant API as API Gateway
    participant IAM as IAM Service
    participant TokenVault as Token Vault<br/>(Secret Manager)
    participant GHLProxy as GHL OAuth Proxy
    participant GHL as GHL API
    participant ReviewsDB as Reviews Database

    Note over Client, ReviewsDB: Initial OAuth Connection

    Client->>API: POST /integrations/reviews/connect
    Note right of Client: User clicks "Connect Reviews"
    
    API->>IAM: validateSession(bearerToken)
    IAM->>API: {userId, tenantId, permissions}
    
    API->>GHLProxy: initiateOAuth(tenantId, scopes: ["reviews.read"])
    GHLProxy->>GHL: GET /oauth/chooselocation
    Note right of GHLProxy: Uses existing admin token from vault
    
    GHL->>GHLProxy: {locations: [...], authUrl: "..."}
    GHLProxy->>API: {authUrl: "proxy.maxai.com/ghl-auth/...", state: "encrypted"}
    
    API->>Client: 302 Redirect {authUrl}
    Client->>GHLProxy: GET /ghl-auth/{state}
    Note right of Client: User completes OAuth in our proxy
    
    GHLProxy->>GHL: POST /oauth/token (authorization_code)
    GHL->>GHLProxy: {access_token, refresh_token, location_id}
    
    GHLProxy->>TokenVault: storeClientTokens(tenantId, tokens)
    Note right of TokenVault: Encrypted storage per tenant
    
    GHLProxy->>Client: 302 Redirect portal.maxai.com/integrations?status=connected
    
    Note over Client, ReviewsDB: Reviews Data Sync

    Client->>API: GET /reviews
    API->>IAM: validateSession(bearerToken)
    API->>GHLProxy: fetchReviews(tenantId, params)
    
    GHLProxy->>TokenVault: getClientTokens(tenantId)
    TokenVault->>GHLProxy: {access_token, refresh_token, location_id}
    
    alt Token valid
        GHLProxy->>GHL: GET /locations/{location_id}/reviews
        GHL->>GHLProxy: {reviews: [...]}
    else Token expired
        GHLProxy->>GHL: POST /oauth/refresh_token
        GHL->>GHLProxy: {new_access_token}
        GHLProxy->>TokenVault: updateClientTokens(tenantId, newTokens)
        GHLProxy->>GHL: GET /locations/{location_id}/reviews
        GHL->>GHLProxy: {reviews: [...]}
    end
    
    GHLProxy->>GHLProxy: normalizeReviews(ghlData)
    Note right of GHLProxy: Transform to canonical format
    
    GHLProxy->>ReviewsDB: upsertReviews(normalizedData)
    GHLProxy->>API: {reviews: canonical_format}
    API->>Client: {reviews: [...]}
```

## Connect Calendar Flow

```mermaid
sequenceDiagram
    participant Client as Client Portal
    participant API as API Gateway
    participant IAM as IAM Service
    participant TokenVault as Token Vault<br/>(Secret Manager)
    participant GHLProxy as GHL OAuth Proxy
    participant GHL as GHL API
    participant CalendarDB as Calendar Database
    participant WebhookSvc as Webhook Service

    Note over Client, WebhookSvc: Initial OAuth Connection

    Client->>API: POST /integrations/calendar/connect
    Note right of Client: User clicks "Connect Calendar"
    
    API->>IAM: validateSession(bearerToken)
    IAM->>API: {userId, tenantId, permissions}
    
    API->>GHLProxy: initiateOAuth(tenantId, scopes: ["calendar.read", "calendar.write"])
    GHLProxy->>GHL: GET /oauth/chooselocation
    
    GHL->>GHLProxy: {locations: [...], authUrl: "..."}
    GHLProxy->>API: {authUrl: "proxy.maxai.com/ghl-auth/...", state: "encrypted"}
    
    API->>Client: 302 Redirect {authUrl}
    Client->>GHLProxy: GET /ghl-auth/{state}
    
    GHLProxy->>GHL: POST /oauth/token (authorization_code)
    GHL->>GHLProxy: {access_token, refresh_token, location_id}
    
    GHLProxy->>TokenVault: storeClientTokens(tenantId, tokens)
    GHLProxy->>WebhookSvc: registerCalendarWebhooks(tenantId, location_id)
    
    WebhookSvc->>GHL: POST /webhooks (calendar events)
    GHL->>WebhookSvc: {webhook_id, url: "webhook.maxai.com/ghl"}
    
    GHLProxy->>Client: 302 Redirect portal.maxai.com/integrations?status=connected

    Note over Client, WebhookSvc: Calendar Operations

    Client->>API: POST /calendar/appointments
    API->>IAM: validateSession(bearerToken)
    API->>GHLProxy: createAppointment(tenantId, appointmentData)
    
    GHLProxy->>TokenVault: getClientTokens(tenantId)
    TokenVault->>GHLProxy: {access_token, location_id}
    
    GHLProxy->>GHLProxy: validateAppointment(appointmentData)
    GHLProxy->>GHL: POST /locations/{location_id}/appointments
    GHL->>GHLProxy: {appointment_id, status: "created"}
    
    GHLProxy->>GHLProxy: normalizeAppointment(ghlResponse)
    GHLProxy->>CalendarDB: storeAppointment(normalizedData)
    GHLProxy->>API: {appointment: canonical_format}
    API->>Client: {success: true, appointment: {...}}

    Note over Client, WebhookSvc: Real-time Updates

    GHL->>WebhookSvc: POST /webhooks/ghl (appointment.updated)
    WebhookSvc->>WebhookSvc: validateSignature(webhook)
    WebhookSvc->>WebhookSvc: normalizeEvent(ghlWebhook)
    
    WebhookSvc->>CalendarDB: updateAppointment(normalizedEvent)
    WebhookSvc->>Client: Server-Sent Event {type: "appointment.updated"}
```

## Token Management Integration

Both flows leverage the existing [GHL Token Management Architecture](/ops/docs/design/ghl-token-management-architecture.md):

### Token Storage Pattern
```typescript
interface ClientTokenSet {
  tenantId: string;
  locationId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
  connectedAt: Date;
}
```

### Automatic Token Refresh
- **50-minute refresh cycle** prevents expiration
- **Exponential backoff** on refresh failures  
- **Re-authentication flow** when refresh fails permanently
- **Health monitoring** with < 10 minute alerts

### Security Considerations

1. **Zero Client Exposure**: No GHL URLs or tokens ever sent to client
2. **Encrypted State**: OAuth state parameters encrypted with tenant-specific keys  
3. **Scoped Access**: Minimum required permissions per integration
4. **Audit Trail**: All OAuth flows and token operations logged
5. **Token Rotation**: Refresh tokens rotated on each use

## Fallback Strategies

### API Gaps Handling
```mermaid
graph TD
    A[API Request] --> B{GHL API Available?}
    B -->|Yes| C[Use OAuth Proxy]
    B -->|No| D{Critical Feature?}
    D -->|Yes| E[Guided Manual Flow]
    D -->|No| F[Feature Disabled Message]
    
    E --> G[Step-by-step instructions]
    G --> H[Manual completion in GHL]
    H --> I[Sync result via webhook]
```

### Degraded Mode Operations
- **Read-only mode**: When write APIs unavailable
- **Cached data**: Serve stale data with staleness indicators
- **Manual sync**: Trigger manual data refresh
- **Feature flags**: Graceful degradation per tenant

## Implementation Notes

### Proxy Endpoints
- `POST /integrations/{service}/connect` - Initiate OAuth
- `GET /ghl-auth/{encrypted_state}` - Handle OAuth callback
- `POST /integrations/{service}/disconnect` - Revoke tokens
- `GET /integrations/{service}/status` - Connection health

### Error Handling
- **401 Unauthorized**: Trigger token refresh
- **403 Forbidden**: Check scope requirements
- **429 Rate Limited**: Implement backoff with jitter
- **500 Server Error**: Fall back to cached data

### Monitoring Metrics
- OAuth success/failure rates per tenant
- Token refresh success rates  
- API response times and error rates
- Client connection status distribution

---

**References:**
- [GHL Token Management Architecture](/ops/docs/design/ghl-token-management-architecture.md)
- [ADR-0001: GHL Encapsulation Strategy](/ops/docs/adr/adr-0001-ghl-encapsulation.md)
- [Authentication Helper Tool](/ops/tools/ghl-token-investigation/authenticate-ghl.js)