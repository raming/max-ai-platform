# GoHighLevel API Discovery Guide

## 🎯 Current Status
- ✅ **Credentials Available**: Admin login credentials configured
- ✅ **Authentication Patterns**: Session tokens and API keys identified
- ❌ **API Endpoints**: Need to be discovered through manual exploration

## 🔍 Manual API Discovery Process

### Step 1: Access GHL Admin Interface
1. Open browser and go to: `https://app.1prompt.com/`
2. Login with credentials:
   - Email: `ageramik@gmail.com`
   - Password: `1Prompt$2025`

### Step 2: Enable Developer Tools
1. Press `F12` or right-click → "Inspect"
2. Go to **Network** tab
3. Check "Preserve log" to keep requests
4. Filter by "XHR" or "Fetch" to see API calls

### Step 3: Navigate to Website Management
1. Look for "Websites", "Sites", or "Pages" in the navigation
2. Click to access website management area
3. **Watch the Network tab** - note any API calls that load page data

### Step 4: Edit a Page (Critical for SEO APIs)
1. Find and click "Edit" on any page
2. Look for these elements in the editor:
   - **Title field** - API call when changed
   - **Meta description field** - API call when changed
   - **H1 heading** - API call when changed
   - **Content editor** - API calls when content changes

### Step 5: Capture API Calls
For each action, note:
- **URL**: The API endpoint
- **Method**: GET, POST, PUT, PATCH
- **Headers**: Especially Authorization headers
- **Request Body**: What data is sent
- **Response**: What data comes back

### Key API Calls to Capture

#### Page Meta Data Updates
- When changing page title
- When changing meta description
- When updating SEO settings

#### Content Updates
- When saving page content
- When adding/removing elements
- When updating headings

#### Page Management
- Creating new pages
- Deleting pages
- Changing page URLs

## 📋 What to Look For

### Authentication Headers
```
Authorization: Bearer <token>
X-API-Key: <key>
Cookie: session=<session_id>
```

### Common API Patterns
```
POST https://api.gohighlevel.com/v1/websites/pages
PUT https://api.gohighlevel.com/v1/websites/pages/{page_id}
GET https://api.gohighlevel.com/v1/websites/{site_id}/pages
```

### Request Payload Examples
```json
{
  "title": "New Page Title",
  "meta_description": "New meta description",
  "content": "<h1>Updated H1</h1><p>Content</p>",
  "seo_settings": {
    "title_tag": "SEO Title",
    "meta_description": "SEO Description"
  }
}
```

## 🛠️ Tools to Use

### Browser Developer Tools
- **Network Tab**: Capture all API requests
- **Application Tab**: Check session storage/cookies
- **Console Tab**: Watch for JavaScript API calls

### Browser Extensions (Optional)
- **Postman Interceptor**: Capture requests for testing
- **API Discovery tools**: Automatically detect APIs

## 📝 Documentation Template

For each API call you discover, document:

```
API Endpoint: [URL]
Method: [GET/POST/PUT/DELETE]
Purpose: [What it does]
Headers:
  Authorization: Bearer [token]
  Content-Type: application/json

Request Body:
{
  [example payload]
}

Response:
{
  [example response]
}
```

## 🎯 Next Steps After Discovery

Once you have the API endpoints:

1. **Update the update-pages.js script** with real endpoints
2. **Test API calls** with your credentials
3. **Implement automated SEO fixes**
4. **Run the update script** to fix website issues

## 🚨 Important Notes

- **Don't modify live pages** during discovery unless you have backups
- **Test on development/staging** if available
- **Document everything** - we'll need this for automation
- **Look for batch operations** - updating multiple pages at once

## 💡 Pro Tips

1. **Use the search/filter** in Network tab for "api" or "page"
2. **Clear network log** between actions to isolate calls
3. **Try different page types** (homepage, service pages, etc.)
4. **Check for GraphQL endpoints** - some platforms use GraphQL
5. **Look for webhook endpoints** for real-time updates

---

**Ready to explore?** Go to https://app.1prompt.com/ and start the discovery process. I'll help you build the automation script once we have the API endpoints! 🔍