# GoHighLevel Token Extraction Guide

This guide explains how to automatically discover and extract authentication tokens from GoHighLevel for automated SEO updates.

## Overview

GoHighLevel uses session-based authentication stored in browser storage (localStorage/sessionStorage) rather than API keys. The `extract-tokens.js` script automates the discovery of these tokens and their refresh mechanisms.

## Quick Start

1. **Run the token extraction script:**
   ```bash
   npm run extract-tokens
   ```

2. **Follow the prompts:**
   - The script will launch a browser
   - Login to GoHighLevel manually when prompted
   - The script will automatically analyze browser storage and network requests
   - Tokens will be extracted and saved to `tokens.json`

## How It Works

### Browser Storage Analysis
The script monitors:
- **localStorage**: Persistent storage across browser sessions
- **sessionStorage**: Temporary storage for the current session
- **Cookies**: HTTP cookies for authentication
- **Network Requests**: Real-time capture of API calls with authorization headers

### Token Pattern Recognition
Automatically identifies:
- Authentication tokens (Bearer tokens, API keys)
- Session identifiers
- Refresh tokens
- CSRF tokens
- Firebase authentication tokens

### Refresh Mechanism Discovery
Analyzes how tokens are refreshed:
- Automatic token renewal patterns
- Expiration handling
- Network requests that refresh tokens
- Browser storage updates

## Output Files

### `tokens.json`
Contains all discovered tokens with metadata:
```json
{
  "tokens": [
    {
      "key": "authToken",
      "value": "eyJhbGciOiJIUzI1NiIs...",
      "storage": "localStorage",
      "domain": "app.gohighlevel.com",
      "expires": "2024-12-31T23:59:59Z",
      "refreshable": true
    }
  ],
  "refreshPatterns": [
    {
      "endpoint": "/oauth/token/refresh",
      "method": "POST",
      "headers": {"Authorization": "Bearer {token}"}
    }
  ]
}
```

### `token-analysis.json`
Detailed analysis of token usage patterns and recommendations.

## Manual Token Discovery

If automated extraction fails, you can manually inspect:

1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Check localStorage and sessionStorage for keys containing:
   - `token`, `auth`, `session`
   - `firebase`, `ghl`, `gohighlevel`
4. Look in Network tab for API calls with Authorization headers

## Integration with SEO Tools

Once tokens are extracted, they can be used by:

- `update-pages.js`: Automated page content updates
- `test-apis.js`: API endpoint testing
- `manage-apis.js`: Interactive API management

## Troubleshooting

### Common Issues

**Browser doesn't launch:**
- Ensure Chrome/Chromium is installed
- Check Puppeteer version compatibility

**Login fails:**
- Verify credentials: ageramik@gmail.com / 1Prompt$2025
- Check for CAPTCHA or 2FA requirements

**No tokens found:**
- Ensure you're logged into the admin panel
- Try refreshing the page after login
- Check if tokens are stored in different storage types

**Tokens expire quickly:**
- The script identifies refresh mechanisms
- Implement automatic token renewal in your scripts

### Debug Mode

Run with debug logging:
```bash
DEBUG=* npm run extract-tokens
```

## Security Notes

- Tokens are stored locally in `tokens.json`
- Never commit token files to version control
- Tokens expire and should be refreshed regularly
- Use environment variables for production deployments

## Next Steps

After token extraction:

1. **Test API access:**
   ```bash
   npm run quick-test
   ```

2. **Run SEO updates:**
   ```bash
   npm run update
   ```

3. **Monitor token expiration:**
   - Check `tokens.json` for expiration dates
   - Re-run extraction when tokens expire

## Learning from Previous Work

This approach builds on authentication patterns from `/Users/rayg/repos/max-ai/platform/tools`, applying automated discovery to eliminate manual token identification challenges.