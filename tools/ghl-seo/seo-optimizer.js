#!/usr/bin/env node

/**
 * SEO Optimizer for GHL Website
 * 
 * Generates optimized page content with:
 * - Meta titles (50-60 chars, keyword-rich)
 * - Meta descriptions (150-160 chars)
 * - H1 tags with primary keywords
 * - Target keywords naturally integrated
 * - Schema.org structured data
 * - Open Graph tags for social sharing
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_WEBSITE_ID = process.env.GHL_WEBSITE_ID;

// Target keywords from environment
const TARGET_KEYWORDS = [
  'ai assistant',
  'local seo',
  'ai marketing tools',
  'reputation management software'
];

// Service-specific optimizations
const SERVICE_OPTIMIZATIONS = {
  'homepage': {
    title: 'AI Assistant & Local SEO Solutions | Max AI',
    description: 'AI-powered local SEO and reputation management tools. Boost your business with intelligent customer engagement and automated review management.',
    h1: 'AI-Powered Local Business Growth Platform',
    keywords: ['ai assistant', 'local seo', 'reputation management software'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Max AI Assistant',
      'description': 'AI-powered local SEO and business growth platform',
      'url': 'https://maxaiassistant.com',
      'logo': 'https://maxaiassistant.com/logo.png',
      'sameAs': [
        'https://www.facebook.com/maxai',
        'https://www.linkedin.com/company/max-ai'
      ],
      'offers': [
        {
          '@type': 'Service',
          'name': 'AI Web Chat',
          'description': 'Answer questions, book jobs with AI chatbot'
        },
        {
          '@type': 'Service',
          'name': 'Review Management',
          'description': 'Automate review requests and build stellar reputation'
        },
        {
          '@type': 'Service',
          'name': 'Customer Engagement',
          'description': 'Guide customers through their journey with AI'
        }
      ]
    }
  },
  'automotive-services': {
    title: 'Automotive Services | AI-Powered Local Solutions',
    description: 'Local automotive services with AI-powered customer engagement. Get more inquiries with intelligent chatbots and reputation management.',
    h1: 'Professional Automotive Services with AI Advantage',
    keywords: ['automotive services', 'local seo', 'ai customer engagement'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': 'Automotive Services',
      'service': ['Auto Repair', 'Auto Collision', 'Tire Sales'],
      'areaServed': 'Local',
      'priceRange': 'Variable'
    }
  },
  'auto-repair': {
    title: 'Auto Repair Services | Local AI Solutions',
    description: 'Professional auto repair with AI-powered customer engagement. Book appointments, get reviews, and grow your auto repair business locally.',
    h1: 'Expert Auto Repair with Smart AI Tools',
    keywords: ['auto repair', 'local seo', 'ai marketing tools'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': 'Auto Repair Services',
      '@type': 'AutomotiveRepair',
      'description': 'Professional auto repair shop with AI customer engagement'
    }
  },
  'electrician': {
    title: 'Licensed Electrician | Local AI Marketing Solutions',
    description: 'Local electrician services enhanced with AI tools. Get more customers with intelligent lead management and online reputation.',
    h1: 'Professional Electrician Services in Your Area',
    keywords: ['electrician', 'local seo', 'ai marketing tools'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': 'Electrician Services',
      'areaServed': 'Local'
    }
  },
  'hvac': {
    title: 'HVAC Services | AI-Enhanced Local Solutions',
    description: 'HVAC heating and cooling services with AI-powered lead generation. Increase customer engagement and online reputation today.',
    h1: 'Reliable HVAC Services with AI Customer Connection',
    keywords: ['hvac', 'local seo', 'reputation management software'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': 'HVAC Services',
      'areaServed': 'Local'
    }
  },
  'carpet-cleaning': {
    title: 'Professional Carpet Cleaning | Local AI Marketing',
    description: 'Professional carpet cleaning with AI-powered booking and customer engagement. Get more jobs with smart marketing solutions.',
    h1: 'Expert Carpet Cleaning with AI Convenience',
    keywords: ['carpet cleaning', 'local seo', 'ai assistant'],
    schema: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': 'Carpet Cleaning Services',
      'areaServed': 'Local'
    }
  }
};

class SEOOptimizer {
  constructor() {
    this.apiBaseUrl = process.env.GHL_API_BASE_URL || 'https://backend.leadconnectorhq.com';
    this.apiVersion = process.env.GHL_API_VERSION || '2021-07-28';
    this.token = process.env.GHL_TOKEN;
    this.locationId = GHL_LOCATION_ID;
    this.websiteId = GHL_WEBSITE_ID;
  }

  // Generate optimized content for a page
  generateOptimizations(pageTitle, currentContent = {}) {
    // Try to find service-specific optimization
    const serviceKey = Object.keys(SERVICE_OPTIMIZATIONS).find(key =>
      pageTitle.toLowerCase().includes(key.replace('-', ' ')) || pageTitle.toLowerCase().includes(key)
    );

    let optimization = SERVICE_OPTIMIZATIONS[serviceKey] || {
      title: this.generateTitle(pageTitle),
      description: this.generateDescription(pageTitle),
      h1: this.generateH1(pageTitle),
      keywords: TARGET_KEYWORDS,
      schema: this.generateSchema(pageTitle)
    };

    return optimization;
  }

  generateTitle(pageTitle) {
    // Keep under 60 chars
    if (pageTitle.includes('Service') || pageTitle.includes('service')) {
      return `${pageTitle} | AI-Powered Local Solutions`;
    }
    return `${pageTitle} | Local AI Solutions`;
  }

  generateDescription(pageTitle) {
    // 150-160 characters
    const descriptions = {
      default: `Professional ${pageTitle} with AI-powered customer engagement and reputation management. Grow your local business today.`,
      short: `Get more ${pageTitle} customers with AI marketing tools and local SEO solutions.`
    };
    return descriptions.short;
  }

  generateH1(pageTitle) {
    return `${pageTitle} with AI Advantage`;
  }

  generateSchema(pageTitle) {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': pageTitle,
      'description': this.generateDescription(pageTitle),
      'areaServed': 'Local',
      'knowsAbout': ['Customer Service', 'AI Technology', 'Local Marketing']
    };
  }

  // Generate update payload for GHL API
  async generateUpdatePayload(pages) {
    const updates = [];

    for (const page of pages) {
      if (!page.title || page.title === 'Homepage' || page.title === '/homepage') {
        continue; // Skip pages without clear titles
      }

      const optimization = this.generateOptimizations(page.title);

      const payload = {
        seoTitle: optimization.title,
        seoDescription: optimization.description,
        seoKeywords: optimization.keywords.join(', '),
        htmlStructured: `<script type="application/ld+json">${JSON.stringify(optimization.schema)}</script>`,
        pageContent: {
          h1: optimization.h1,
          ogTitle: optimization.title,
          ogDescription: optimization.description,
          ogImage: 'https://maxaiassistant.com/og-image.png',
          canonicalUrl: `https://maxaiassistant.com/${page.title.toLowerCase().replace(/\s+/g, '-')}`
        }
      };

      updates.push({
        pageTitle: page.title,
        originalUrl: page.url,
        updatePayload: payload
      });
    }

    return updates;
  }

  // Save optimizations for reference
  async saveOptimizations(pages) {
    const outputPath = path.join(__dirname, 'scraped-data', 'seo-optimizations.json');
    const updates = await this.generateUpdatePayload(pages);

    await fs.writeFile(outputPath, JSON.stringify(updates, null, 2));
    return outputPath;
  }

  // Display optimization summary
  displaySummary(updates) {
    console.log(chalk.bold.cyan('\n📊 SEO Optimization Summary'));
    console.log(chalk.gray('='.repeat(80)));
    console.log(`\n${chalk.green('✓')} Generated optimizations for ${updates.length} pages\n`);

    updates.slice(0, 10).forEach((update, idx) => {
      console.log(chalk.bold(`${idx + 1}. ${update.pageTitle}`));
      console.log(`   📝 Title: ${update.updatePayload.seoTitle}`);
      console.log(`   📄 Description: ${update.updatePayload.seoDescription.substring(0, 60)}...`);
      console.log(`   🏷️  Keywords: ${update.updatePayload.seoKeywords}`);
      console.log();
    });

    if (updates.length > 10) {
      console.log(chalk.gray(`... and ${updates.length - 10} more pages\n`));
    }

    console.log(chalk.gray('='.repeat(80)));
    console.log(chalk.blue(`\n💡 Next: Review and push these optimizations to GHL via API`));
    console.log(chalk.blue(`   $ node update-pages-with-seo.js\n`));
  }

  async run() {
    try {
      const dataPath = path.join(__dirname, 'scraped-data', 'pages-data.json');
      const pagesData = JSON.parse(await fs.readFile(dataPath, 'utf8'));

      console.log(chalk.bold.cyan('\n🚀 SEO Optimizer\n'));
      console.log(chalk.gray(`Location ID: ${this.locationId}`));
      console.log(chalk.gray(`Website ID: ${this.websiteId}`));
      console.log(chalk.gray(`Target Keywords: ${TARGET_KEYWORDS.join(', ')}\n`));

      const optimizationsPath = await this.saveOptimizations(pagesData);
      console.log(chalk.green(`✓ Optimizations saved to: ${optimizationsPath}\n`));

      const updates = await this.generateUpdatePayload(pagesData);
      this.displaySummary(updates);

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const optimizer = new SEOOptimizer();
  optimizer.run();
}

module.exports = SEOOptimizer;
