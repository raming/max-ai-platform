# GHL API - cURL Examples

Generated: 2025-10-21T23:31:47.585Z

## Authentication Setup

```bash
# Store your token and version
TOKEN_ID="your-token-id-here"
VERSION="1.0"
BASE_URL="https://backend.leadconnectorhq.com"
```

## User Endpoints

### Get Current User

```bash
curl -X GET \
  "$BASE_URL/users/me" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### Get User by ID

```bash
curl -X GET \
  "$BASE_URL/users/{userId}" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

## Location Endpoints

### Get Default Location

```bash
curl -X GET \
  "$BASE_URL/location" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### List Locations

```bash
curl -X GET \
  "$BASE_URL/locations" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

## Contact Endpoints

### List Contacts

```bash
curl -X GET \
  "$BASE_URL/contact" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### Get Contact

```bash
curl -X GET \
  "$BASE_URL/contact/{id}" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### Create Contact

```bash
curl -X POST \
  "$BASE_URL/contact" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### Update Contact

```bash
curl -X PUT \
  "$BASE_URL/contact/{id}" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

## Page Endpoints

### List Pages

```bash
curl -X GET \
  "$BASE_URL/page" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### Get Page

```bash
curl -X GET \
  "$BASE_URL/page/{id}" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### Create Page

```bash
curl -X POST \
  "$BASE_URL/page" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### Publish Page

```bash
curl -X POST \
  "$BASE_URL/page/{id}/publish" \
  -H "token-id: $TOKEN_ID" \
  -H "version: $VERSION" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

