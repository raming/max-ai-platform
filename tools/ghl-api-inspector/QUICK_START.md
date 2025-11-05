# GHL API Inspector - Quick Start Guide

**TL;DR**: 5 minutes to setup, 15 minutes to run, 30 minutes to analyze

---

## Quick Reference

### Installation (One-time)
```bash
cd /Users/rayg/repos/max-ai/platform/tools/ghl-api-inspector
npm install
cp .env.template .env
# Edit .env with your GHL email/password
```

### Run Inspection
```bash
npm run inspect
```

### Results
- **Output**: `ghl-capture.json` (API data)
- **Log**: `ghl-capture.log` (execution details)
- **Time**: ~10-15 minutes

### Analyze Results
```bash
# Count API calls per endpoint
cat ghl-capture.json | jq '.summary'

# List unique API endpoints
cat ghl-capture.json | jq -r '.api_calls[].url' | sort | uniq

# Extract rate limit info
cat ghl-capture.json | jq '.rate_limit_headers[0]'
```

---

## Expected Output

```json
{
  "summary": {
    "total_api_calls": 347,
    "unique_endpoints": 52,
    "unique_domains": 3,
    "rate_limit_headers_found": 12,
    "websocket_connections": 2,
    "errors": 3,
    "oauth_endpoints_found": 4,
    "token_patterns_found": 2
  }
}
```

---

## File Locations

**Tool**: `/tools/ghl-api-inspector/`
- `puppeteer-capture.js` - Main script
- `package.json` - Dependencies
- `README.md` - Detailed guide
- `.env.template` - Config template

**Output**: Same directory
- `ghl-capture.json` - API capture (commit if needed)
- `ghl-capture.log` - Execution log

**Documentation**: `/docs/design/ghl-limitations/`
- `00-pre-work-phase.md` - Scope & methodology
- `PROGRESS.md` - This session's progress

---

## Next Steps

1. ✅ **Pre-work**: COMPLETE (you are here)
2. ⏳ **Run inspection**: `npm run inspect`
3. ⏳ **Analyze data**: Extract API patterns
4. ⏳ **Create docs**: 6 architecture documents
5. ⏳ **Close issue**: GitHub Issue #14

---

## Troubleshooting

**"Cannot find module puppeteer"**
```bash
npm install
```

**"Authentication failed"**
- Check `.env` credentials
- Verify GHL account access
- Try interactive mode: `npm run inspect:interactive`

**"Timeout"**
- GHL may be slow
- Increase timeout: `GHL_TIMEOUT=60000 npm run inspect`

**More help**: See `/tools/ghl-api-inspector/README.md`

---

## Key Contacts

- **Architect**: architect.morgan-lee
- **Issue**: #14 (GitHub)
- **Related**: Issues #148 (System Arch), #156 (Adapters)

---

**Status**: 🟢 Ready to Execute  
**Effort**: ~4-5 hours total (pre-work done)  
**Output**: 6 detailed architecture documents + 1 ADR
