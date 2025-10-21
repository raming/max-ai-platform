# IAM API Contracts

## Overview

This document defines the REST API contracts for the IAM service, including endpoints, request/response DTOs, and JSON schemas for validation.

## Base Configuration

- **Base URL**: `/iam`
- **Protocol**: HTTPS only (TLS 1.3)
- **Content-Type**: `application/json`
- **Authentication**: Session cookie (user) or Bearer token (service)
- **Rate Limiting**: 100 req/min per IP (auth endpoints), 1000 req/min per service token

## Authentication Endpoints

### GET /auth/google
Initiate Google OAuth flow (redirect to Google).

**Request**:
```http
GET /iam/auth/google?redirect_uri=https://portal.example.com/dashboard
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `redirect_uri` | `string` | Yes | URL to redirect after successful auth |

**Response**: `302 Redirect` to Google OAuth consent screen

**State Parameter** (anti-CSRF):
- Generated server-side, stored in session
- Verified on callback

---

### GET /auth/google/callback
Handle OAuth callback from Google.

**Request**:
```http
GET /iam/auth/google/callback?code=AUTH_CODE&state=CSRF_TOKEN
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | Authorization code from Google |
| `state` | `string` | Yes | CSRF token (must match session) |

**Success Response**: `302 Redirect` to portal with session cookie set

**Error Response**: `302 Redirect` to error page with query param `?error=auth_failed`

**Set-Cookie**:
```
Set-Cookie: session=JWT_TOKEN; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/
```

---

### POST /auth/logout
Invalidate user session.

**Request**:
```http
POST /iam/auth/logout
Cookie: session=JWT_TOKEN
```

**Success Response**:
```json
{
  "message": "Logged out successfully"
}
```
Status: `200 OK`

**Clear-Cookie**:
```
Set-Cookie: session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
```

---

## User Endpoints

### GET /me
Get current authenticated user profile.

**Request**:
```http
GET /iam/me
Cookie: session=JWT_TOKEN
```

**Success Response**:
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "Jane Doe",
    "provider": "google"
  },
  "roles": [
    {
      "name": "client_admin",
      "tenant_id": "tenant_123",
      "client_id": "client_456",
      "expires_at": null
    }
  ],
  "permissions": [
    "read:client",
    "write:client",
    "read:prompt",
    "write:prompt"
  ],
  "context": {
    "tenant_id": "tenant_123",
    "tenant_name": "Acme Agency",
    "client_id": "client_456",
    "client_name": "North Region"
  }
}
```
Status: `200 OK`

**Error Responses**:
- `401 Unauthorized`: No valid session
- `401 token_expired`: Session expired

---

## Token Endpoints

### POST /tokens
Mint a service token (admin only).

**Request**:
```http
POST /iam/tokens
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "actor": "service:orchestrator",
  "scopes": ["read:workflow", "execute:workflow"],
  "expires_in": 3600
}
```

**Request Body Schema**:
```typescript
{
  actor: string;       // Service identifier (e.g., "service:orchestrator")
  scopes: string[];    // Requested permission scopes
  expires_in: number;  // Token lifetime in seconds (max: 3600)
}
```

**Success Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": "2025-10-21T12:00:00Z",
  "scopes": ["read:workflow", "execute:workflow"]
}
```
Status: `201 Created`

**Error Responses**:
- `401 Unauthorized`: No valid admin token
- `403 Forbidden`: Insufficient permissions (requires `manage:token` permission)
- `422 Validation Error`: Invalid scopes or expires_in

---

### POST /tokens/verify
Verify and decode a token (internal use).

**Request**:
```http
POST /iam/tokens/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response**:
```json
{
  "valid": true,
  "claims": {
    "sub": "user_123",
    "actor": "service:orchestrator",
    "scopes": ["read:workflow", "execute:workflow"],
    "tenant_id": "tenant_456",
    "iat": 1729512000,
    "exp": 1729515600
  }
}
```
Status: `200 OK`

**Error Responses**:
- `200 OK` with `"valid": false` - Invalid or expired token
- `422 Validation Error`: Missing token

---

## Policy Endpoints

### POST /policies/check
Check if subject can perform action on resource.

**Request**:
```http
POST /iam/policies/check
Authorization: Bearer SERVICE_TOKEN
Content-Type: application/json

{
  "subject": "user:550e8400-e29b-41d4-a716-446655440000",
  "action": "write",
  "resource": "prompt:123",
  "context": {
    "tenant_id": "tenant_456",
    "client_id": "client_789"
  }
}
```

**Request Body Schema**:
```typescript
{
  subject: string;       // User or service identifier
  action: string;        // Action being attempted (e.g., "read", "write", "delete")
  resource: string;      // Resource being accessed (e.g., "prompt:123")
  context: {
    tenant_id?: string;  // Tenant scope (required for tenant/client resources)
    client_id?: string;  // Client scope (required for client resources)
    [key: string]: any;  // Additional context attributes
  }
}
```

**Success Response (Allowed)**:
```json
{
  "allow": true,
  "reason": "User has role 'client_admin' with permission 'write:prompt' in client 'client_789'"
}
```
Status: `200 OK`

**Success Response (Denied)**:
```json
{
  "allow": false,
  "reason": "User lacks permission 'write:prompt' in client 'client_789'"
}
```
Status: `200 OK`

**Error Responses**:
- `400 Invalid Request`: Missing required fields
- `401 Unauthorized`: No valid service token
- `422 Validation Error`: Invalid subject/action/resource format

---

## Role Management Endpoints (Admin)

### POST /roles/assign
Assign a role to a user.

**Request**:
```http
POST /iam/roles/assign
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "role_name": "client_admin",
  "tenant_id": "tenant_456",
  "client_id": "client_789",
  "expires_at": null
}
```

**Request Body Schema**:
```typescript
{
  user_id: string;       // User receiving role
  role_name: string;     // Role to assign (e.g., "client_admin")
  tenant_id?: string;    // Tenant scope (required for tenant/client roles)
  client_id?: string;    // Client scope (required for client roles)
  expires_at?: string;   // Optional expiration (ISO 8601)
}
```

**Success Response**:
```json
{
  "assignment": {
    "id": "assign_123",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "role_id": "role_456",
    "role_name": "client_admin",
    "tenant_id": "tenant_456",
    "client_id": "client_789",
    "expires_at": null,
    "created_at": "2025-10-21T10:00:00Z",
    "created_by": "admin_user_789"
  }
}
```
Status: `201 Created`

**Error Responses**:
- `401 Unauthorized`: No valid admin token
- `403 Forbidden`: Insufficient permissions (requires `manage:role` permission)
- `409 Conflict`: Role already assigned to user in that scope
- `422 Validation Error`: Invalid role name, missing scope, or scope mismatch

---

### DELETE /roles/assign/:assignment_id
Revoke a role assignment.

**Request**:
```http
DELETE /iam/roles/assign/assign_123
Authorization: Bearer ADMIN_TOKEN
```

**Success Response**:
```json
{
  "message": "Role assignment revoked successfully"
}
```
Status: `200 OK`

**Error Responses**:
- `401 Unauthorized`: No valid admin token
- `403 Forbidden`: Insufficient permissions (requires `manage:role` permission)
- `404 Not Found`: Assignment ID does not exist

---

### GET /roles
List all available roles.

**Request**:
```http
GET /iam/roles?scope=client
Authorization: Bearer SERVICE_TOKEN
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scope` | `enum` | No | Filter by scope: `platform`, `tenant`, `client` |

**Success Response**:
```json
{
  "roles": [
    {
      "id": "role_123",
      "name": "client_admin",
      "description": "Manage client users, prompts, workflows",
      "scope": "client",
      "permissions": [
        "read:client",
        "write:client",
        "read:prompt",
        "write:prompt",
        "manage:user"
      ]
    },
    {
      "id": "role_456",
      "name": "agent",
      "description": "Use portal, execute workflows",
      "scope": "client",
      "permissions": [
        "read:client",
        "read:prompt",
        "execute:workflow"
      ]
    }
  ]
}
```
Status: `200 OK`

---

## Audit Endpoints (Admin)

### GET /audit
Query audit logs.

**Request**:
```http
GET /iam/audit?actor_id=user_123&from=2025-10-01T00:00:00Z&to=2025-10-21T23:59:59Z&limit=100
Authorization: Bearer ADMIN_TOKEN
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actor_id` | `string` | No | Filter by user ID |
| `resource` | `string` | No | Filter by resource (e.g., `user:123`) |
| `action` | `string` | No | Filter by action (e.g., `role.assign`) |
| `tenant_id` | `string` | No | Filter by tenant |
| `client_id` | `string` | No | Filter by client |
| `from` | `string` | No | Start time (ISO 8601) |
| `to` | `string` | No | End time (ISO 8601) |
| `limit` | `number` | No | Max results (default: 100, max: 1000) |

**Success Response**:
```json
{
  "events": [
    {
      "id": "audit_123",
      "at": "2025-10-21T10:15:30Z",
      "actor_id": "user_456",
      "actor_email": "admin@example.com",
      "action": "role.assign",
      "resource": "user:550e8400-e29b-41d4-a716-446655440000",
      "metadata": {
        "role": "client_admin",
        "tenant_id": "tenant_456",
        "client_id": "client_789"
      },
      "correlation_id": "req_abc123",
      "tenant_id": "tenant_456",
      "client_id": "client_789"
    }
  ],
  "total": 1,
  "limit": 100
}
```
Status: `200 OK`

**Error Responses**:
- `401 Unauthorized`: No valid admin token
- `403 Forbidden`: Insufficient permissions (requires `read:audit` permission)
- `422 Validation Error`: Invalid date format or limit

---

## Error Response Format

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "unauthorized",
    "message": "No valid session or token provided",
    "details": {
      "required": "session cookie or Bearer token"
    },
    "correlation_id": "req_abc123",
    "timestamp": "2025-10-21T10:15:30Z"
  }
}
```

### Error Codes

| HTTP Status | Error Code | Description |
|------------|-----------|-------------|
| `400` | `invalid_request` | Malformed request (missing fields, invalid JSON) |
| `401` | `unauthorized` | No valid credentials provided |
| `401` | `token_expired` | Session or token has expired |
| `403` | `forbidden` | Valid credentials but insufficient permissions |
| `404` | `not_found` | Resource does not exist |
| `409` | `role_assignment_conflict` | Duplicate role assignment |
| `422` | `validation_error` | Request validation failed |
| `500` | `identity_provider_error` | Google OAuth failed |
| `500` | `audit_write_failed` | Audit event could not be logged |
| `503` | `service_unavailable` | Database or Redis unavailable |

---

## JSON Schemas

### User Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://api.maxai.com/schemas/user.json",
  "type": "object",
  "required": ["id", "email", "name", "provider"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique user identifier"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "User email address"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255,
      "description": "User display name"
    },
    "provider": {
      "type": "string",
      "enum": ["google", "local"],
      "description": "Identity provider"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

### Role Assignment Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://api.maxai.com/schemas/role-assignment.json",
  "type": "object",
  "required": ["user_id", "role_name"],
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid"
    },
    "role_name": {
      "type": "string",
      "enum": ["super_admin", "tenant_admin", "client_admin", "agent", "viewer"]
    },
    "tenant_id": {
      "type": "string",
      "format": "uuid"
    },
    "client_id": {
      "type": "string",
      "format": "uuid"
    },
    "expires_at": {
      "type": ["string", "null"],
      "format": "date-time"
    }
  }
}
```

### Policy Check Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://api.maxai.com/schemas/policy-check.json",
  "type": "object",
  "required": ["subject", "action", "resource"],
  "properties": {
    "subject": {
      "type": "string",
      "pattern": "^(user|service):[a-zA-Z0-9_-]+$",
      "description": "Subject identifier (user:ID or service:NAME)"
    },
    "action": {
      "type": "string",
      "enum": ["read", "write", "delete", "execute", "manage"],
      "description": "Action being attempted"
    },
    "resource": {
      "type": "string",
      "pattern": "^[a-z_]+:[a-zA-Z0-9_-]+$",
      "description": "Resource identifier (type:ID)"
    },
    "context": {
      "type": "object",
      "properties": {
        "tenant_id": { "type": "string", "format": "uuid" },
        "client_id": { "type": "string", "format": "uuid" }
      }
    }
  }
}
```

---

## Authentication Flows

### Session Cookie Flow (User Login)
```
User → Portal: Click "Login with Google"
Portal → IAM: GET /iam/auth/google?redirect_uri=...
IAM → Google: Redirect to OAuth consent
Google → User: Login prompt
User → Google: Approve
Google → IAM: GET /iam/auth/google/callback?code=...&state=...
IAM → Google: POST /token (exchange code)
Google → IAM: ID token + profile
IAM → DB: Find or create user
IAM → Portal: Redirect with session cookie
```

### Service Token Flow (Inter-Service Auth)
```
Orchestrator → IAM: POST /iam/tokens (admin token)
IAM: Verify admin token, check permissions
IAM: Mint service token (JWT)
IAM → Orchestrator: Return service token

Orchestrator → Prompt Service: GET /prompts/123 (Bearer token)
Prompt Service → IAM: POST /iam/tokens/verify
IAM: Verify signature, decode claims
IAM → Prompt Service: Token valid + claims
Prompt Service: Process request
```

---

## Rate Limiting

| Endpoint Pattern | Limit | Window | Scope |
|-----------------|-------|--------|-------|
| `/auth/google/*` | 10 | 1 minute | Per IP |
| `/auth/logout` | 10 | 1 minute | Per session |
| `/me` | 100 | 1 minute | Per session |
| `/tokens/*` | 100 | 1 minute | Per service token |
| `/policies/check` | 1000 | 1 minute | Per service token |
| `/roles/*` | 100 | 1 minute | Per admin token |
| `/audit` | 50 | 1 minute | Per admin token |

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1729512060
```

**Rate Limit Exceeded**:
```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests",
    "retry_after": 60
  }
}
```
Status: `429 Too Many Requests`

---

## References

- [Overview](./overview.md) - Component architecture
- [Data Model](./data-model.md) - Database schema
- [Authentication](./authentication.md) - SSO implementation details
- [Authorization](./authorization.md) - RBAC engine
- [Security](./security.md) - API security controls
- JSON Schemas: `docs/contracts/*.schema.json`
