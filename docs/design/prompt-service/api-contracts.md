# Prompt Service - API Contracts

**Version**: 1.0  
**Last Updated**: 2025-10-21  
**Status**: Specification  

## Purpose

This document defines the REST API endpoints, request/response schemas, and error handling for the Prompt Service.

## Base URL

```
Production: https://api.platform.example.com/v1/prompts
Development: http://localhost:3002/v1/prompts
```

## Authentication

All endpoints require authentication via session token from IAM Service.

**Headers**:
```http
Authorization: Bearer {session_token}
X-Tenant-ID: {tenant_uuid}
Content-Type: application/json
```

## API Endpoints

### Template Management

#### 1. List Templates

**GET** `/templates`

List all templates for the authenticated tenant.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter by category (system, campaign, support, sales) |
| status | string | No | Filter by status (draft, active, archived) |
| search | string | No | Search in name/description |
| tags | string | No | Comma-separated tag filters (e.g., "env:prod,team:sales") |
| page | number | No | Page number (default: 1) |
| limit | number | No | Page size (default: 20, max: 100) |

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Customer Support Agent",
      "description": "Handles general customer inquiries",
      "category": "support",
      "currentVersion": "1.2.0",
      "status": "active",
      "createdAt": "2025-10-15T10:30:00Z",
      "updatedAt": "2025-10-20T14:45:00Z",
      "createdBy": {
        "id": "uuid",
        "name": "John Doe"
      },
      "tags": [
        {"name": "env", "value": "production"},
        {"name": "team", "value": "support"}
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### 2. Get Template by ID

**GET** `/templates/:id`

Retrieve a specific template with current version.

**Path Parameters**:
- `id` (string, required): Template UUID

**Response** `200 OK`:
```json
{
  "id": "uuid",
  "name": "Customer Support Agent",
  "description": "Handles general customer inquiries",
  "category": "support",
  "currentVersion": "1.2.0",
  "status": "active",
  "content": {
    "systemPrompt": "You are a helpful customer support agent...",
    "userPrompt": "Customer: {{customerMessage}}",
    "assistantPrompt": "Agent: ",
    "examples": [
      {
        "user": "What are your business hours?",
        "assistant": "We're open Monday-Friday, 9am-5pm EST."
      }
    ],
    "constraints": [
      "Never share customer PII",
      "Escalate billing issues to finance team"
    ],
    "tone": "professional"
  },
  "variables": [
    {
      "name": "customerName",
      "type": "string",
      "required": true,
      "description": "Customer's full name"
    },
    {
      "name": "customerMessage",
      "type": "string",
      "required": true,
      "description": "Customer's inquiry or message"
    }
  ],
  "metadata": {
    "lastPublished": "2025-10-20T14:45:00Z",
    "publishCount": 12
  },
  "createdAt": "2025-10-15T10:30:00Z",
  "updatedAt": "2025-10-20T14:45:00Z",
  "createdBy": {
    "id": "uuid",
    "name": "John Doe"
  }
}
```

#### 3. Create Template

**POST** `/templates`

Create a new prompt template.

**Request Body**:
```json
{
  "name": "Sales Outreach Agent",
  "description": "Engages leads with personalized outreach",
  "category": "sales",
  "content": {
    "systemPrompt": "You are a persuasive sales agent...",
    "userPrompt": "Lead: {{leadMessage}}",
    "tone": "friendly"
  },
  "variables": [
    {
      "name": "leadName",
      "type": "string",
      "required": true,
      "description": "Lead's first name"
    },
    {
      "name": "companyName",
      "type": "string",
      "required": false,
      "defaultValue": "your company"
    }
  ],
  "tags": [
    {"name": "env", "value": "staging"},
    {"name": "team", "value": "sales"}
  ]
}
```

**Response** `201 Created`:
```json
{
  "id": "uuid",
  "name": "Sales Outreach Agent",
  "currentVersion": "1.0.0",
  "status": "draft",
  "createdAt": "2025-10-21T09:00:00Z",
  "message": "Template created successfully"
}
```

**Errors**:
- `400`: Validation failed (missing required fields, invalid content)
- `403`: Unauthorized (missing `prompt:create` permission)
- `409`: Conflict (template name already exists)

#### 4. Update Template

**PUT** `/templates/:id`

Update an existing template (creates new version).

**Path Parameters**:
- `id` (string, required): Template UUID

**Request Body**:
```json
{
  "name": "Customer Support Agent v2",
  "description": "Updated with enhanced empathy",
  "content": {
    "systemPrompt": "You are an empathetic customer support agent...",
    "constraints": [
      "Never share customer PII",
      "Escalate billing issues to finance team",
      "Express empathy before offering solutions"
    ]
  },
  "changeSummary": "Added empathy constraint, updated system prompt"
}
```

**Response** `200 OK`:
```json
{
  "id": "uuid",
  "currentVersion": "1.3.0",
  "previousVersion": "1.2.0",
  "updatedAt": "2025-10-21T10:15:00Z",
  "message": "Template updated successfully"
}
```

**Errors**:
- `400`: Validation failed
- `403`: Unauthorized (missing `prompt:update` permission)
- `404`: Template not found
- `409`: Concurrent update conflict

#### 5. Delete Template

**DELETE** `/templates/:id`

Soft delete a template (marks as archived).

**Path Parameters**:
- `id` (string, required): Template UUID

**Response** `204 No Content`

**Errors**:
- `403`: Unauthorized (missing `prompt:delete` permission)
- `404`: Template not found

### Version Management

#### 6. List Template Versions

**GET** `/templates/:id/versions`

Get version history for a template.

**Path Parameters**:
- `id` (string, required): Template UUID

**Query Parameters**:
- `limit` (number, optional): Max versions to return (default: 50)

**Response** `200 OK`:
```json
{
  "templateId": "uuid",
  "versions": [
    {
      "id": "uuid",
      "version": "1.3.0",
      "changeSummary": "Added empathy constraint",
      "status": "published",
      "createdAt": "2025-10-21T10:15:00Z",
      "createdBy": {
        "id": "uuid",
        "name": "Jane Smith"
      },
      "publishCount": 2
    },
    {
      "id": "uuid",
      "version": "1.2.0",
      "changeSummary": "Updated examples",
      "status": "published",
      "createdAt": "2025-10-20T14:45:00Z",
      "createdBy": {
        "id": "uuid",
        "name": "John Doe"
      },
      "publishCount": 5
    }
  ]
}
```

#### 7. Get Specific Version

**GET** `/templates/:id/versions/:version`

Retrieve a specific version of a template.

**Path Parameters**:
- `id` (string, required): Template UUID
- `version` (string, required): Semantic version (e.g., "1.2.0")

**Response** `200 OK`:
```json
{
  "id": "uuid",
  "templateId": "uuid",
  "version": "1.2.0",
  "content": {
    "systemPrompt": "...",
    "userPrompt": "...",
    "examples": [...]
  },
  "variables": [...],
  "changeSummary": "Updated examples",
  "status": "published",
  "createdAt": "2025-10-20T14:45:00Z",
  "createdBy": {
    "id": "uuid",
    "name": "John Doe"
  }
}
```

#### 8. Compare Versions

**GET** `/templates/:id/versions/:v1/compare/:v2`

Get diff between two versions.

**Path Parameters**:
- `id` (string, required): Template UUID
- `v1` (string, required): Base version
- `v2` (string, required): Target version

**Response** `200 OK`:
```json
{
  "baseVersion": "1.1.0",
  "targetVersion": "1.2.0",
  "diff": {
    "content": {
      "systemPrompt": {
        "added": ["Express empathy before offering solutions"],
        "removed": [],
        "changed": false
      },
      "examples": {
        "added": [
          {
            "user": "What are your business hours?",
            "assistant": "We're open Monday-Friday, 9am-5pm EST."
          }
        ],
        "removed": [],
        "changed": true
      }
    },
    "variables": {
      "added": [],
      "removed": [],
      "changed": false
    }
  }
}
```

#### 9. Rollback to Version

**POST** `/templates/:id/rollback`

Create new version by rolling back to a previous version.

**Request Body**:
```json
{
  "targetVersion": "1.1.0",
  "changeSummary": "Rollback to stable version due to production issues"
}
```

**Response** `201 Created`:
```json
{
  "newVersion": "1.4.0",
  "rolledBackTo": "1.1.0",
  "message": "Successfully rolled back to version 1.1.0"
}
```

### Publishing

#### 10. Publish Template

**POST** `/templates/:id/publish`

Publish a template version to external platform.

**Path Parameters**:
- `id` (string, required): Template UUID

**Request Body**:
```json
{
  "version": "1.2.0",
  "platform": "retell",
  "platformConfig": {
    "agentId": "retell-agent-123",
    "llmId": "gpt-4",
    "voice": {
      "provider": "elevenlabs",
      "voiceId": "21m00Tcm4TlvDq8ikWAM"
    },
    "temperature": 0.7,
    "maxTokens": 500
  }
}
```

**Response** `202 Accepted`:
```json
{
  "publishEventId": "uuid",
  "status": "pending",
  "message": "Publishing job queued",
  "estimatedCompletion": "2025-10-21T10:20:00Z"
}
```

**Errors**:
- `400`: Invalid platform or config
- `403`: Unauthorized (missing `prompt:publish` permission)
- `404`: Template or version not found

#### 11. Get Publishing Status

**GET** `/templates/:id/publish/:eventId`

Check status of a publishing job.

**Path Parameters**:
- `id` (string, required): Template UUID
- `eventId` (string, required): Publish event UUID

**Response** `200 OK`:
```json
{
  "id": "uuid",
  "status": "success",
  "platform": "retell",
  "version": "1.2.0",
  "publishedAt": "2025-10-21T10:18:30Z",
  "artifactUrl": "https://storage.googleapis.com/templates/uuid/1.2.0/retell.json",
  "publishedBy": {
    "id": "uuid",
    "name": "Jane Smith"
  }
}
```

**Possible Statuses**:
- `pending`: Job queued
- `processing`: Currently publishing
- `success`: Successfully published
- `failed`: Publishing failed (see `errorDetails`)

#### 12. List Publishing History

**GET** `/templates/:id/publish-history`

Get publishing history for a template.

**Query Parameters**:
- `platform` (string, optional): Filter by platform
- `status` (string, optional): Filter by status
- `limit` (number, optional): Max events (default: 50)

**Response** `200 OK`:
```json
{
  "events": [
    {
      "id": "uuid",
      "version": "1.2.0",
      "platform": "retell",
      "status": "success",
      "publishedAt": "2025-10-21T10:18:30Z",
      "publishedBy": {
        "id": "uuid",
        "name": "Jane Smith"
      }
    },
    {
      "id": "uuid",
      "version": "1.1.0",
      "platform": "n8n",
      "status": "failed",
      "publishedAt": "2025-10-20T15:00:00Z",
      "errorDetails": {
        "code": "PLATFORM_API_ERROR",
        "message": "n8n API returned 503"
      }
    }
  ]
}
```

### Variable Management

#### 13. Validate Template

**POST** `/templates/:id/validate`

Validate template content and variable references.

**Request Body**:
```json
{
  "content": {
    "systemPrompt": "You are {{role}} for {{companyName}}...",
    "userPrompt": "{{invalidVariable}}"
  },
  "variables": [
    {
      "name": "role",
      "type": "string",
      "required": true
    },
    {
      "name": "companyName",
      "type": "string",
      "required": true
    }
  ]
}
```

**Response** `200 OK`:
```json
{
  "valid": false,
  "errors": [
    {
      "field": "content.userPrompt",
      "message": "Variable '{{invalidVariable}}' is referenced but not defined",
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "field": "variables.role",
      "message": "Variable 'role' has no default value and is required",
      "severity": "warning"
    }
  ]
}
```

#### 14. Test Variable Substitution

**POST** `/templates/:id/test-substitution`

Test template rendering with sample variable values.

**Request Body**:
```json
{
  "version": "1.2.0",
  "variableValues": {
    "customerName": "Alice Johnson",
    "customerMessage": "When will my order arrive?"
  }
}
```

**Response** `200 OK`:
```json
{
  "rendered": {
    "systemPrompt": "You are a helpful customer support agent...",
    "userPrompt": "Customer: When will my order arrive?",
    "assistantPrompt": "Agent: "
  },
  "missingVariables": [],
  "unusedVariables": []
}
```

## Common Response Schemas

### Error Response

All error responses follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Template validation failed",
    "details": [
      {
        "field": "content.systemPrompt",
        "message": "System prompt is required",
        "constraint": "required"
      }
    ]
  },
  "requestId": "uuid",
  "timestamp": "2025-10-21T10:30:00Z"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Missing or invalid session token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (duplicate name, concurrent update) |
| PLATFORM_API_ERROR | 502 | External platform API error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

## Rate Limiting

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|--------|
| **Read Operations** (GET) | 100 requests | 1 minute |
| **Write Operations** (POST, PUT, DELETE) | 20 requests | 1 minute |
| **Publishing** (POST /publish) | 10 requests | 5 minutes |

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1697887200
```

**Rate Limit Exceeded Response** `429`:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 45 seconds.",
    "retryAfter": 45
  }
}
```

## Pagination

All list endpoints support cursor-based pagination:

**Request**:
```http
GET /templates?page=2&limit=20
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 145,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## Webhook Notifications

Optionally configure webhooks for template events:

**Event Types**:
- `template.created`
- `template.updated`
- `template.deleted`
- `template.published`
- `publish.success`
- `publish.failed`

**Webhook Payload**:
```json
{
  "event": "template.published",
  "timestamp": "2025-10-21T10:18:30Z",
  "data": {
    "templateId": "uuid",
    "version": "1.2.0",
    "platform": "retell",
    "publishedBy": "uuid"
  }
}
```

## OpenAPI Specification

Full OpenAPI 3.0 specification available at:
```
GET /api-docs/openapi.json
```

Interactive API documentation:
```
GET /api-docs/
```

## Related Documentation

- [Overview](./overview.md) - Component architecture
- [Data Model](./data-model.md) - Database schema
- [Versioning](./versioning.md) - Version strategy
- [Publishing](./adapter-publishing.md) - Platform delivery
- [Validation](./validation.md) - Template validation rules
