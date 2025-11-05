# 🚀 API Monitoring Session - What To Do Now

## Current Status
✅ Monitor is **RUNNING** in the background  
✅ Browser should have **OPENED** automatically  
✅ You should see login screen at **https://app.1prompt.com/login**

## What Happens Next

### 1. 🔐 Log In
- Enter your GHL admin credentials if not auto-filled
- Browser will be monitored for ALL API calls from this point forward

### 2. 🗺️ Navigate the Admin Console
To capture a comprehensive set of APIs, navigate to:

#### Dashboard
- [ ] Click Dashboard
- [ ] Wait for it to load completely
- [ ] Watch for API calls in terminal

#### Contacts/Leads
- [ ] Go to Contacts or Leads section
- [ ] View contact list
- [ ] Click on individual contacts to view details
- [ ] Look for any search/filter functionality

#### Campaigns
- [ ] Browse Campaigns section
- [ ] Create new campaign (or edit existing)
- [ ] Check campaign analytics
- [ ] View campaign details

#### Automations
- [ ] Go to Automations/Funnels
- [ ] View automation workflows
- [ ] Check automation statistics

#### Settings
- [ ] Go to Settings
- [ ] Check API Keys section
- [ ] View billing/account settings
- [ ] Check integrations

#### Pages/Website
- [ ] Go to Landing Pages or Website section
- [ ] Create/edit a page
- [ ] Publish changes
- [ ] Check page analytics

#### Conversations
- [ ] Go to Conversations/Messages
- [ ] Open conversations
- [ ] Send a message (if possible)
- [ ] Check message history

### 3. 📡 Monitor Terminal Output
You'll see output like:
```
📡 [200] GET /contact/12345
📡 [200] POST /campaigns/create
📡 [401] GET /webhook/status
```

Each line shows:
- **[STATUS]** - HTTP status code
- **METHOD** - GET, POST, PUT, DELETE, etc.
- **ENDPOINT** - API endpoint being called

### 4. 🛑 Stop When Done
When you've navigated enough sections (5-10 minutes minimum):

```bash
# Press Ctrl+C in the terminal
```

The monitor will:
1. Stop capturing
2. Save all API documentation files
3. Create sample code
4. Generate analysis report

## Expected Output Files

After pressing Ctrl+C, check `/Users/rayg/repos/max-ai/website/scripts/GHL-Integration/api-documentation/`:

```
1-API-Calls-Complete-Log.json      ← Every API call captured
2-Authentication-Patterns.json     ← How auth works
3-Header-Patterns.json             ← What headers are used
4-Endpoint-Registry.json           ← Complete API catalog
5-Token-Refresh-Events.json        ← Token lifecycle
6-Sample-API-Client.js             ← Ready-to-use code
README.md                          ← Complete guide
```

## Key Data to Collect

The monitor captures:
- ✅ **Endpoint URLs** - Exact paths called
- ✅ **HTTP Methods** - GET, POST, PUT, DELETE
- ✅ **Headers** - Including version, token-id, authorization
- ✅ **Status Codes** - Success/error patterns
- ✅ **Auth Methods** - How authentication works
- ✅ **Token Refresh** - When/how tokens refresh
- ✅ **Body Data** - POST/PUT data (sanitized)

## Terminal Window
Should show output like:
```
🚀 GHL API Monitor v2
📧 User: ageramik@gmail.com
💾 Output: /Users/rayg/repos/max-ai/website/scripts/GHL-Integration/api-documentation

🌐 Launching browser...
🔐 Navigating to login...
⏳ Waiting for login form...
🔑 Entering credentials...
🚀 Submitting login...

✅ Browser ready for monitoring!
📋 Interact with the admin console to record API calls
Press Ctrl+C to stop and save documentation

📡 [200] GET /users/me
📡 [200] GET /dashboard/stats
📡 [201] POST /api/campaigns
...
```

## Browser Window
A **Chrome/Chromium window** should have opened showing:
1. 1prompt.com login page
2. Your GHL admin console after login
3. Any pages/sections you navigate to

## Troubleshooting

### Browser doesn't open
- Sometimes Puppeteer takes time to launch
- Wait 10-15 seconds for it to appear
- Check if a Chrome window opened elsewhere

### No API calls showing
- Make sure you're navigating pages after login
- Clicking buttons and links generates API calls
- Waiting for pages to fully load is important

### Terminal shows errors
- Connection errors are okay, just keep navigating
- The monitor still captures successful calls
- Only fatal errors will stop the process

## After Collection

### 1. Stop the Monitor
Press `Ctrl+C` in the terminal where the monitor is running

### 2. Check Generated Files
```bash
cd /Users/rayg/repos/max-ai/website/scripts/GHL-Integration/api-documentation
ls -la
```

### 3. Review Key Findings
```bash
# See all API calls
cat 1-API-Calls-Complete-Log.json | head -50

# See authentication methods
cat 2-Authentication-Patterns.json

# See version header!
cat 3-Header-Patterns.json | grep -A5 "version"

# See endpoint catalog
cat 4-Endpoint-Registry.json | head -30
```

### 4. Use Sample Code
```bash
# View generated client code
cat 6-Sample-API-Client.js

# Update your implementation with these patterns
# Update update-pages.js with correct headers
```

## Version Header Solution
Once collection is complete, the `3-Header-Patterns.json` will show:
- Exact format of version header (e.g., "1", "2", "1.0", etc.)
- How often it's used
- Which endpoints require it
- Sample values seen in real requests

This **SOLVES your "version header is invalid" issue**!

---

## Next Steps After Monitoring

1. **Review** `4-Endpoint-Registry.json` - See all available endpoints
2. **Check** `2-Authentication-Patterns.json` - Understand auth flow
3. **Study** `3-Header-Patterns.json` - Find version header solution
4. **Test** `6-Sample-API-Client.js` - Use it as template
5. **Update** your `update-pages.js` with correct headers
6. **Apply** SEO fixes using working API

---

## Browser Tips

- Don't close the browser window - it's actively monitoring
- Navigate slowly, letting pages fully load
- Click on multiple items (contacts, campaigns, pages)
- Try different actions (create, edit, delete if possible)
- The longer you navigate (5-15 min), the more APIs captured

## Save Terminal Output

Keep your terminal running to see real-time API calls as you navigate. This helps you understand which page loads trigger which APIs.

---

**Ready? Start navigating the GHL admin console now!** 🎯
