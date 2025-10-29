# GoHighLevel SEO Analysis & Optimization Tool

A comprehensive tool for analyzing and optimizing GoHighLevel websites for SEO using Puppeteer and the GoHighLevel API.

## Features

- **Website Scraping**: Automated crawling of your GoHighLevel website with session authentication
- **SEO Audit**: Comprehensive analysis of meta tags, content, images, and technical SEO elements
- **Content Analysis**: Keyword optimization analysis against target keywords
- **Automated Updates**: Apply SEO fixes directly to your website via GoHighLevel API
- **Detailed Reports**: HTML and JSON reports with actionable recommendations

## Target Keywords

This tool is optimized for the following target keywords from your SEO strategy:
- `ai assistant`
- `local seo`
- `ai marketing tools`
- `reputation management software`

## Prerequisites

- Node.js 16+
- GoHighLevel account with API access
- Website hosted on GoHighLevel custom domain

## Installation

1. Navigate to the scripts directory:
```bash
cd scripts/ghl-seo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your GoHighLevel credentials:
```env
# Your GoHighLevel website URL
GHL_WEBSITE_URL=https://yourdomain.gohighlevel.com

# GoHighLevel API Key (get from Settings > API Keys)
GHL_API_KEY=your_api_key_here

# Location ID (found in URL when managing your location)
GHL_LOCATION_ID=your_location_id_here

# Session token for authenticated scraping (optional but recommended)
GHL_SESSION_TOKEN=your_session_token_here

# Target keywords for SEO analysis
TARGET_KEYWORDS=ai assistant,local seo,ai marketing tools,reputation management software
```

## Getting Your GoHighLevel Credentials

### API Key
1. Log into your GoHighLevel account
2. Go to Settings > API Keys
3. Create a new API key with appropriate permissions
4. Copy the key to your `.env` file

### Location ID
1. In GoHighLevel, go to Locations
2. Select your location
3. The Location ID is in the URL: `.../locations/LOCATION_ID/...`

### Session Token (for authenticated scraping)
1. Log into your GoHighLevel website admin
2. Open browser developer tools (F12)
3. Go to Application/Storage > Cookies
4. Find the session token cookie
5. Copy the value to your `.env` file

## Usage

### Quick API Discovery & Testing

Since API endpoints need manual discovery, use this streamlined process:

#### 1. Discover APIs (Manual)
1. Open https://app.1prompt.com/
2. Login: `ageramik@gmail.com` / `1Prompt$2025`
3. Press F12 → Network tab → Check 'Preserve log'
4. Navigate to Websites/Pages section
5. Edit a page and watch for API calls
6. Look for URLs containing 'api' or 'pages'

#### 2. Test Discovered Endpoints
```bash
# Interactive testing
npm run quick-test interactive

# Test specific endpoint
npm run quick-test GET /locations

# Test with data
npm run quick-test POST /websites/pages/123 '{"title":"New Title"}'

# Show common patterns
npm run quick-test patterns
```

#### 3. Save Working Endpoints
```bash
npm run manage-apis
```
Choose option 1 to add discovered endpoints.

### 1. Complete Website Analysis
Run the full analysis pipeline:
```bash
npm run analyze
```

This will:
- Scrape your website with HTTP requests
- Run comprehensive SEO audit
- Generate detailed reports
- Create action plan

### 2. Individual Steps

#### Scrape Website Only
```bash
npm run scrape
```

#### Run SEO Audit Only
```bash
npm run seo-audit
```

#### Update Pages (Apply Fixes)
```bash
npm run update
```

#### Test API Endpoints
```bash
npm run test-apis
```

#### Manage Discovered APIs
```bash
npm run manage-apis
```

#### Quick API Testing
```bash
npm run quick-test
```

### 3. Dry Run Mode
Test updates without applying them:
```bash
node update-pages.js --dry-run
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run analyze` | Full website analysis pipeline |
| `npm run scrape` | Scrape website content |
| `npm run seo-audit` | Generate SEO audit report |
| `npm run update` | Apply SEO fixes (requires discovered APIs) |
| `npm run test-apis` | Test saved API endpoints |
| `npm run manage-apis` | Manage discovered API endpoints |
| `npm run quick-test` | Quick API endpoint testing |
| `npm run discover` | Analyze codebase for API patterns |

## Current Status

- ✅ Website analysis: Complete (32/100 score, 124 issues)
- ✅ SEO audit tools: Ready
- 🔄 API discovery: Manual exploration needed
- ⏳ Automated fixes: Waiting for API endpoints

## Key Findings

- **SEO Score**: 32/100 (needs improvement)
- **Issues Found**: 124 SEO problems
- **Target Keywords**: ai assistant, local seo, ai marketing tools, reputation management software
- **Missing**: Page titles, meta descriptions, H1 tags, alt text

## SEO Analysis Coverage

The tool analyzes:

### Technical SEO
- Meta titles and descriptions
- H1/H2/H3 tag structure
- Canonical URLs
- Open Graph tags
- Schema markup

### Content SEO
- Keyword optimization
- Content length analysis
- Internal linking structure
- Image alt text

### Performance
- Page load analysis
- Mobile responsiveness
- Core Web Vitals (basic)

### On-Page SEO
- Title tag optimization
- Meta description quality
- Heading hierarchy
- Content relevance

## Automated Updates

The update script can automatically fix:

- Missing or poor meta titles
- Missing or inadequate meta descriptions
- Missing H1 tags
- Multiple H1 tag issues
- Missing image alt text
- Basic Schema.org markup
- Keyword optimization suggestions

## Next Steps

1. **Discover API endpoints** through browser exploration (see Quick API Discovery above)
2. **Test and validate** endpoints with `npm run quick-test`
3. **Save working endpoints** with `npm run manage-apis`
4. **Run automated fixes** with `npm run update` to apply all 124 SEO improvements
5. **Re-run analysis** in 4 weeks to measure progress

## Integration with Daily Marketing Plan

This tool integrates with your existing SEO strategy:

- **Month 1 Focus**: Technical SEO fixes and basic optimization
- **Month 2 Focus**: Content optimization and keyword targeting
- **Month 3 Focus**: Advanced SEO and performance monitoring

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Verify your API key is correct
   - Check that your IP is whitelisted in GoHighLevel
   - Ensure your location ID is valid

2. **Scraping Fails**
   - Check your website URL
   - Verify session token is current
   - Ensure your website is publicly accessible

3. **Updates Not Applied**
   - Run in dry-run mode first to see proposed changes
   - Check GoHighLevel API permissions
   - Verify website is in published state

### Debug Mode

Enable verbose logging:
```bash
DEBUG=1 npm run analyze
```

## Security Notes

- Never commit your `.env` file to version control
- Rotate API keys regularly
- Use read-only API keys when possible
- Keep session tokens current (they expire)

## Support

For issues with:
- GoHighLevel API: Check their developer documentation
- Puppeteer scraping: See Puppeteer troubleshooting guide
- SEO analysis: Review the generated reports for specific recommendations

## Next Steps

After running the analysis:

1. Review the HTML reports in your browser
2. Follow the action plan timeline
3. Apply automated updates where appropriate
4. Re-run analysis in 4 weeks to measure progress
5. Integrate findings with your daily marketing tasks

---

**Built for Max AI - Professional SEO Analysis & Optimization**