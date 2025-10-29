# GHL API Complete Integration Guide

Generated: 2025-10-21T23:31:47.586Z

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Headers](#headers)
4. [Endpoints](#endpoints)
5. [Error Handling](#error-handling)
6. [Implementation Examples](#implementation-examples)

## Overview

- **Total Endpoints**: 25
- **Primary Base URL**: https://backend.leadconnectorhq.com
- **Authentication**: Token-based (JWT)
- **Response Format**: JSON

## Authentication

### Token-ID Header Method (Primary)

All API calls require authentication via the `token-id` header:

```bash
curl -H "token-id: YOUR_TOKEN_HERE" ...
```

### Bearer Token Method (Alternative)

Some endpoints also accept Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" ...
```

## Headers

### Required Headers

| Header | Value | Purpose |
|--------|-------|----------|
| `token-id` | JWT Token | Authentication |
| `version` | "1.0" or "1" | API Version |
| `Content-Type` | application/json | Request format |

### Optional Headers

| Header | Value | Purpose |
|--------|-------|----------|
| `Accept` | application/json | Response format |
| `Authorization` | Bearer {token} | Alternative auth |
| `Channel` | string | Channel identifier |

## Endpoints

### User Endpoints

- `GET /users/me` - Get current user
- `GET /users/{userId}` - Get user by ID

### Location Endpoints

- `GET /location` - Get default location
- `GET /location/{id}` - Get location by ID
- `GET /locations` - List all locations

### Contact Endpoints

- `GET /contact` - List contacts
- `GET /contact/{id}` - Get contact
- `POST /contact` - Create contact
- `PUT /contact/{id}` - Update contact

### Page Endpoints

- `GET /page` - List pages
- `GET /page/{id}` - Get page
- `POST /page` - Create page
- `PUT /page/{id}` - Update page
- `POST /page/{id}/publish` - Publish page
- `DELETE /page/{id}` - Delete page

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Use response data |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Token expired or invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Endpoint or resource not found |
| 500 | Server Error | Retry or contact support |

## Implementation Examples

### JavaScript/Node.js

```javascript
const GHLAPIClient = require("./4-Sample-API-Client.js");
const client = new GHLAPIClient(tokenId);
const user = await client.getCurrentUser();
console.log(user);
```

### Python

```python
import requests

headers = {
    "token-id": token_id,
    "version": "1.0",
    "Content-Type": "application/json"
}

response = requests.get("https://backend.leadconnectorhq.com/users/me", headers=headers)
print(response.json())
```

### PHP

```php
$headers = [
    "token-id" => $token_id,
    "version" => "1.0",
    "Content-Type" => "application/json"
];

$ch = curl_init("https://backend.leadconnectorhq.com/users/me");
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
echo $response;
```

## Generated Files

1. **1-Endpoint-Registry.json** - Complete endpoint catalog
2. **2-Authentication-Patterns.json** - Auth method documentation
3. **3-Header-Patterns.json** - Header requirements
4. **4-Sample-API-Client.js** - Ready-to-use JavaScript client
5. **5-cURL-Examples.sh** - cURL command examples
6. **Complete-API-Guide.md** - This file

## Next Steps

1. Review `1-Endpoint-Registry.json` for all available endpoints
2. Use `4-Sample-API-Client.js` as a template for your implementation
3. Test endpoints with `5-cURL-Examples.sh`
4. Update your application with discovered patterns
5. Remember: `version` header must be included in all requests
