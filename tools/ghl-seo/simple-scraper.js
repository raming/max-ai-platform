#!/usr/bin/env node

/**
 * Simple HTTP-based GoHighLevel Website Scraper
 * Fallback scraper using axios and cheerio for basic HTML analysis
 */

require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

class SimpleGHLScraper {
  constructor(config = {}) {
    this.config = {
      url: config.url || process.env.GHL_WEBSITE_URL,
      outputDir: config.outputDir || './scraped-data',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    this.pages = [];
  }

  async initialize() {
    console.log(chalk.blue('🌐 Initializing Simple GHL Website Scraper...\n'));

    // Create output directory
    await fs.mkdir(this.config.outputDir, { recursive: true });
  }

  async scrapeHomepage() {
    const spinner = ora('Fetching homepage...').start();

    try {
      const response = await axios.get(this.config.url, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 30000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);

      // Extract page data
      const pageData = this.extractPageData($, response.data);

      this.pages.push({
        url: this.config.url,
        title: 'Homepage',
        ...pageData,
        response: {
          status: response.status,
          headers: response.headers,
          contentLength: response.data.length
        }
      });

      spinner.succeed('Homepage fetched successfully');
      return pageData;

    } catch (error) {
      spinner.fail('Failed to fetch homepage');
      console.error(chalk.red('Error:'), error.message);
      throw error;
    }
  }

  extractPageData($, html) {
    // Extract meta tags
    const getMeta = (name) => {
      const meta = $(`meta[name="${name}"], meta[property="${name}"]`).first();
      return meta.attr('content') || null;
    };

    // Extract all headings
    const headings = {
      h1: $('h1').map((i, el) => $(el).text().trim()).get(),
      h2: $('h2').map((i, el) => $(el).text().trim()).get(),
      h3: $('h3').map((i, el) => $(el).text().trim()).get(),
    };

    // Extract links
    const links = $('a[href]').map((i, el) => {
      const $link = $(el);
      const href = $link.attr('href');
      return {
        text: $link.text().trim(),
        href: href,
        isInternal: href && (href.startsWith('/') || href.startsWith(this.config.url))
      };
    }).get();

    // Extract images
    const images = $('img').map((i, el) => {
      const $img = $(el);
      return {
        src: $img.attr('src'),
        alt: $img.attr('alt') || '',
        width: $img.attr('width'),
        height: $img.attr('height'),
        hasAlt: !!$img.attr('alt')
      };
    }).get();

    // Extract structured data
    const structuredData = $('script[type="application/ld+json"]').map((i, el) => {
      try {
        return JSON.parse($(el).html());
      } catch {
        return null;
      }
    }).get().filter(Boolean);

    // Get page content
    const bodyText = $('body').text();
    const wordCount = bodyText.trim().split(/\s+/).length;

    return {
      meta: {
        title: $('title').text().trim(),
        description: getMeta('description'),
        keywords: getMeta('keywords'),
        ogTitle: getMeta('og:title'),
        ogDescription: getMeta('og:description'),
        ogImage: getMeta('og:image'),
        twitterCard: getMeta('twitter:card'),
        viewport: getMeta('viewport'),
        robots: getMeta('robots'),
      },
      headings,
      links: {
        total: links.length,
        internal: links.filter(l => l.isInternal).length,
        external: links.filter(l => !l.isInternal).length,
        list: links
      },
      images: {
        total: images.length,
        withAlt: images.filter(img => img.hasAlt).length,
        withoutAlt: images.filter(img => !img.hasAlt).length,
        list: images
      },
      content: {
        wordCount,
        hasH1: headings.h1.length > 0,
        h1Count: headings.h1.length,
        paragraphCount: $('p').length
      },
      structuredData,
      url: this.config.url,
      canonical: $('link[rel="canonical"]').attr('href') || null
    };
  }

  async discoverPages() {
    const spinner = ora('Discovering internal pages...').start();

    try {
      const homepage = this.pages[0];
      const internalLinks = homepage.links.list
        .filter(link => link.isInternal)
        .map(link => {
          if (link.href.startsWith('/')) {
            return new URL(link.href, this.config.url).href;
          }
          return link.href;
        });

      // Remove duplicates and filter out anchors
      const uniquePages = [...new Set(internalLinks)]
        .filter(url => !url.includes('#'))
        .filter(url => url !== this.config.url)
        .slice(0, 10); // Limit to 10 pages for now

      spinner.succeed(`Found ${uniquePages.length} internal pages`);
      return uniquePages;

    } catch (error) {
      spinner.fail('Failed to discover pages');
      throw error;
    }
  }

  async scrapePage(url) {
    const spinner = ora(`Fetching ${new URL(url).pathname}...`).start();

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': this.config.url
        },
        timeout: 20000,
        maxRedirects: 3
      });

      const $ = cheerio.load(response.data);
      const pageData = this.extractPageData($, response.data);

      const title = $('title').text().trim() || new URL(url).pathname;

      this.pages.push({
        url,
        title,
        ...pageData,
        response: {
          status: response.status,
          headers: response.headers,
          contentLength: response.data.length
        }
      });

      spinner.succeed(`Fetched ${title}`);

    } catch (error) {
      spinner.fail(`Failed to fetch ${url}`);
      console.error(chalk.red(`Error fetching ${url}:`), error.message);
    }
  }

  async scrapeAllPages() {
    console.log(chalk.blue('\n📄 Fetching all pages...\n'));

    // Scrape homepage first
    await this.scrapeHomepage();

    // Discover other pages
    const pages = await this.discoverPages();

    // Scrape each page
    for (const pageUrl of pages) {
      try {
        await this.scrapePage(pageUrl);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(chalk.red(`Error scraping ${pageUrl}:`, error.message));
      }
    }
  }

  async saveResults() {
    const spinner = ora('Saving results...').start();

    try {
      // Save raw page data
      await fs.writeFile(
        path.join(this.config.outputDir, 'pages-data.json'),
        JSON.stringify(this.pages, null, 2)
      );

      // Generate basic HTML report
      await this.generateBasicReport();

      spinner.succeed('Results saved successfully');

    } catch (error) {
      spinner.fail('Failed to save results');
      throw error;
    }
  }

  async generateBasicReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Basic SEO Analysis - ${new URL(this.config.url).hostname}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .page-section { margin: 20px 0; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; }
        .page-title { font-size: 20px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
        .page-url { color: #7f8c8d; font-size: 14px; margin-bottom: 15px; }
        .meta-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .stat { display: inline-block; margin: 10px; padding: 10px; background: #e9ecef; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Basic SEO Analysis Report</h1>
        <p><strong>Website:</strong> ${this.config.url}</p>
        <p><strong>Analysis Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Pages Analyzed:</strong> ${this.pages.length}</p>

        <h2>📊 Summary</h2>
        <div class="stat">Total Pages: ${this.pages.length}</div>
        <div class="stat">Total Links: ${this.pages.reduce((sum, p) => sum + p.links.total, 0)}</div>
        <div class="stat">Total Images: ${this.pages.reduce((sum, p) => sum + p.images.total, 0)}</div>

        <h2>📄 Page Details</h2>
        ${this.pages.map(page => `
            <div class="page-section">
                <div class="page-title">${page.title}</div>
                <div class="page-url">${page.url}</div>

                <div class="meta-info">
                    <strong>Title:</strong> ${page.meta.title || 'Missing'}<br>
                    <strong>Description:</strong> ${page.meta.description || 'Missing'}<br>
                    <strong>H1 Tags:</strong> ${page.headings.h1.length} | <strong>Word Count:</strong> ${page.content.wordCount}
                </div>

                <table>
                    <tr><th>Metric</th><th>Value</th></tr>
                    <tr><td>Internal Links</td><td>${page.links.internal}</td></tr>
                    <tr><td>External Links</td><td>${page.links.external}</td></tr>
                    <tr><td>Images with Alt</td><td>${page.images.withAlt}/${page.images.total}</td></tr>
                    <tr><td>H2 Tags</td><td>${page.headings.h2.length}</td></tr>
                    <tr><td>H3 Tags</td><td>${page.headings.h3.length}</td></tr>
                </table>
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;

    await fs.writeFile(
      path.join(this.config.outputDir, 'basic-report.html'),
      html
    );
  }

  async run() {
    try {
      await this.initialize();
      await this.scrapeAllPages();
      await this.saveResults();

      console.log(chalk.green('\n✅ Basic scraping complete!\n'));
      console.log(chalk.blue('Results saved to:'), this.config.outputDir);
      console.log(chalk.blue('Open basic-report.html to view the report\n'));

      // Display summary
      console.log(chalk.yellow('Summary:'));
      console.log(`  Pages fetched: ${this.pages.length}`);
      console.log(`  Total links: ${this.pages.reduce((sum, p) => sum + p.links.total, 0)}`);
      console.log(`  Total images: ${this.pages.reduce((sum, p) => sum + p.images.total, 0)}\n`);

    } catch (error) {
      console.error(chalk.red('\n❌ Scraping failed:'), error.message);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const scraper = new SimpleGHLScraper();
  scraper.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = SimpleGHLScraper;