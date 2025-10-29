#!/usr/bin/env node

/**
 * SEO Audit Analyzer for GoHighLevel Websites
 *
 * Analyzes scraped website data for SEO issues and generates actionable recommendations
 * Integrates with target keywords from SEO strategy documents
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

class SEOAuditor {
  constructor(config = {}) {
    this.config = {
      dataDir: config.dataDir || './scraped-data',
      targetKeywords: config.targetKeywords || process.env.TARGET_KEYWORDS?.split(',') || [
        'ai assistant',
        'local seo',
        'ai marketing tools',
        'reputation management software'
      ],
      outputFile: config.outputFile || 'seo-audit-results.json'
    };

    this.auditResults = {
      timestamp: new Date().toISOString(),
      website: '',
      pages: [],
      overall: {},
      recommendations: []
    };
  }

  async loadScrapedData() {
    const spinner = ora('Loading scraped website data...').start();

    try {
      const pagesDataPath = path.join(this.config.dataDir, 'pages-data.json');

      if (!await this.fileExists(pagesDataPath)) {
        throw new Error('No scraped data found. Run scrape-website.js first.');
      }

      const pagesData = JSON.parse(await fs.readFile(pagesDataPath, 'utf8'));
      this.auditResults.website = pagesData[0]?.url || 'Unknown';
      this.auditResults.pages = pagesData;

      spinner.succeed('Data loaded successfully');
      return pagesData;

    } catch (error) {
      spinner.fail('Failed to load data');
      throw error;
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async auditPage(page) {
    const issues = {
      critical: [],
      warnings: [],
      opportunities: []
    };

    // Title tag analysis
    if (!page.meta?.title) {
      issues.critical.push({
        type: 'missing_title',
        message: 'Missing title tag',
        impact: 'high',
        fix: 'Add a descriptive title tag (50-60 characters)'
      });
    } else {
      const titleLength = page.meta.title.length;
      if (titleLength < 30) {
        issues.warnings.push({
          type: 'title_too_short',
          message: `Title too short (${titleLength} chars)`,
          impact: 'medium',
          fix: 'Expand title to 50-60 characters'
        });
      } else if (titleLength > 60) {
        issues.warnings.push({
          type: 'title_too_long',
          message: `Title too long (${titleLength} chars)`,
          impact: 'medium',
          fix: 'Shorten title to under 60 characters'
        });
      }

      // Check keyword inclusion
      const titleKeywords = this.checkKeywordInclusion(page.meta.title, this.config.targetKeywords);
      if (titleKeywords.length === 0) {
        issues.opportunities.push({
          type: 'title_no_target_keywords',
          message: 'Title does not include target keywords',
          impact: 'high',
          fix: `Include primary keywords: ${this.config.targetKeywords.slice(0, 2).join(', ')}`
        });
      }
    }

    // Meta description analysis
    if (!page.meta?.description) {
      issues.critical.push({
        type: 'missing_description',
        message: 'Missing meta description',
        impact: 'high',
        fix: 'Add compelling meta description (150-160 characters)'
      });
    } else {
      const descLength = page.meta.description.length;
      if (descLength < 120) {
        issues.warnings.push({
          type: 'description_too_short',
          message: `Meta description too short (${descLength} chars)`,
          impact: 'medium',
          fix: 'Expand description to 150-160 characters'
        });
      } else if (descLength > 160) {
        issues.warnings.push({
          type: 'description_too_long',
          message: `Meta description too long (${descLength} chars)`,
          impact: 'medium',
          fix: 'Shorten description to under 160 characters'
        });
      }
    }

    // H1 analysis
    if (!page.content?.hasH1) {
      issues.critical.push({
        type: 'missing_h1',
        message: 'Missing H1 tag',
        impact: 'high',
        fix: 'Add exactly one H1 tag with primary keyword'
      });
    } else if (page.content.h1Count > 1) {
      issues.warnings.push({
        type: 'multiple_h1',
        message: `Multiple H1 tags found (${page.content.h1Count})`,
        impact: 'medium',
        fix: 'Use only one H1 tag per page'
      });
    }

    // Heading structure
    const h2Count = page.headings?.h2?.length || 0;
    const h3Count = page.headings?.h3?.length || 0;

    if (h2Count === 0) {
      issues.opportunities.push({
        type: 'no_h2_tags',
        message: 'No H2 tags found',
        impact: 'medium',
        fix: 'Add H2 tags to structure content sections'
      });
    }

    // Content length
    if (page.content?.wordCount < 300) {
      issues.warnings.push({
        type: 'low_word_count',
        message: `Low word count (${page.content.wordCount})`,
        impact: 'medium',
        fix: 'Aim for at least 500-1000 words for better SEO'
      });
    }

    // Image optimization
    const imagesWithoutAlt = page.images?.withoutAlt || 0;
    if (imagesWithoutAlt > 0) {
      issues.warnings.push({
        type: 'missing_alt_text',
        message: `${imagesWithoutAlt} images missing alt text`,
        impact: 'medium',
        fix: 'Add descriptive alt text to all images'
      });
    }

    // Internal linking
    const internalLinks = page.links?.internal || 0;
    if (internalLinks < 3) {
      issues.opportunities.push({
        type: 'few_internal_links',
        message: `Few internal links (${internalLinks})`,
        impact: 'low',
        fix: 'Add more internal links to improve site structure'
      });
    }

    // Open Graph tags
    if (!page.meta?.ogTitle || !page.meta?.ogDescription) {
      issues.opportunities.push({
        type: 'missing_open_graph',
        message: 'Missing Open Graph tags',
        impact: 'low',
        fix: 'Add og:title, og:description, and og:image for better social sharing'
      });
    }

    // Canonical URL
    if (!page.canonical) {
      issues.opportunities.push({
        type: 'missing_canonical',
        message: 'Missing canonical URL',
        impact: 'medium',
        fix: 'Add canonical URL to prevent duplicate content issues'
      });
    }

    // Structured data
    if (!page.structuredData || page.structuredData.length === 0) {
      issues.opportunities.push({
        type: 'no_structured_data',
        message: 'No structured data found',
        impact: 'medium',
        fix: 'Add Schema.org markup for rich snippets'
      });
    }

    // Keyword analysis in content
    const contentKeywords = this.analyzeContentKeywords(page);
    if (contentKeywords.length > 0) {
      issues.opportunities.push(...contentKeywords);
    }

    return issues;
  }

  checkKeywordInclusion(text, keywords) {
    const found = [];
    const lowerText = text.toLowerCase();

    keywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        found.push(keyword);
      }
    });

    return found;
  }

  analyzeContentKeywords(page) {
    const opportunities = [];
    const bodyText = this.extractBodyText(page);

    if (!bodyText) return opportunities;

    const lowerBody = bodyText.toLowerCase();
    const wordCount = lowerBody.split(/\s+/).length;

    this.config.targetKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const occurrences = (lowerBody.match(new RegExp(keywordLower, 'g')) || []).length;

      if (occurrences === 0) {
        opportunities.push({
          type: 'keyword_not_in_content',
          message: `Target keyword "${keyword}" not found in content`,
          impact: 'high',
          fix: `Include "${keyword}" naturally in content (aim for 0.5-1% density)`
        });
      } else {
        const density = (occurrences / wordCount) * 100;
        if (density > 2) {
          opportunities.push({
            type: 'keyword_density_high',
            message: `Keyword "${keyword}" density too high (${density.toFixed(1)}%)`,
            impact: 'medium',
            fix: 'Reduce keyword density to avoid over-optimization'
          });
        }
      }
    });

    return opportunities;
  }

  extractBodyText(page) {
    // This is a simplified extraction - in real implementation,
    // you'd want to clean HTML and extract meaningful text
    return page.headings?.h1?.join(' ') +
           page.headings?.h2?.join(' ') +
           page.headings?.h3?.join(' ') || '';
  }

  async auditAllPages() {
    console.log(chalk.blue('\n🔍 Running comprehensive SEO audit...\n'));

    const pages = this.auditResults.pages;
    const auditPromises = pages.map(async (page) => {
      const issues = await this.auditPage(page);
      return {
        url: page.url,
        title: page.title,
        issues,
        score: this.calculatePageScore(issues)
      };
    });

    const auditedPages = await Promise.all(auditPromises);
    this.auditResults.pages = auditedPages;
    this.auditResults.overall = this.calculateOverallScore(auditedPages);

    return auditedPages;
  }

  calculatePageScore(issues) {
    let score = 100;

    // Critical issues (high impact)
    score -= issues.critical.length * 20;

    // Warnings (medium impact)
    score -= issues.warnings.length * 10;

    // Opportunities (low impact)
    score -= issues.opportunities.length * 2;

    return Math.max(0, Math.min(100, score));
  }

  calculateOverallScore(auditedPages) {
    const totalPages = auditedPages.length;
    const averageScore = auditedPages.reduce((sum, page) => sum + page.score, 0) / totalPages;

    const allIssues = auditedPages.flatMap(page => [
      ...page.issues.critical,
      ...page.issues.warnings,
      ...page.issues.opportunities
    ]);

    const issueCounts = {
      critical: allIssues.filter(i => i.impact === 'high').length,
      warnings: allIssues.filter(i => i.impact === 'medium').length,
      opportunities: allIssues.filter(i => i.impact === 'low').length
    };

    return {
      averageScore: Math.round(averageScore),
      totalIssues: allIssues.length,
      issueCounts,
      grade: this.getGrade(averageScore)
    };
  }

  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  generateRecommendations() {
    const recommendations = [];
    const auditedPages = this.auditResults.pages;

    // Group issues by type
    const issueGroups = {};

    auditedPages.forEach(page => {
      ['critical', 'warnings', 'opportunities'].forEach(severity => {
        page.issues[severity].forEach(issue => {
          const key = issue.type;
          if (!issueGroups[key]) {
            issueGroups[key] = {
              type: key,
              message: issue.message,
              impact: issue.impact,
              fix: issue.fix,
              pages: []
            };
          }
          issueGroups[key].pages.push({
            url: page.url,
            title: page.title
          });
        });
      });
    });

    // Convert to recommendations with priority
    Object.values(issueGroups).forEach(group => {
      const priority = group.impact === 'high' ? 'high' :
                      group.impact === 'medium' ? 'medium' : 'low';

      recommendations.push({
        priority,
        issue: group.message,
        affectedPages: group.pages.length,
        pages: group.pages,
        solution: group.fix,
        impact: group.impact
      });
    });

    // Sort by priority and impact
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    this.auditResults.recommendations = recommendations;
    return recommendations;
  }

  async saveResults() {
    const spinner = ora('Saving audit results...').start();

    try {
      await fs.writeFile(
        path.join(this.config.dataDir, this.config.outputFile),
        JSON.stringify(this.auditResults, null, 2)
      );

      await this.generateHTMLReport();

      spinner.succeed('Audit results saved');

    } catch (error) {
      spinner.fail('Failed to save results');
      throw error;
    }
  }

  async generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO Audit Report - ${new URL(this.auditResults.website).hostname}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        .score-card { text-align: center; margin: 30px 0; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; }
        .score-number { font-size: 72px; font-weight: bold; margin: 10px 0; }
        .score-grade { font-size: 24px; opacity: 0.9; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #dee2e6; }
        .stat-number { font-size: 32px; font-weight: bold; color: #495057; }
        .stat-label { color: #6c757d; margin-top: 5px; }
        .recommendations { margin: 40px 0; }
        .recommendation { margin: 20px 0; padding: 20px; border-radius: 8px; border-left: 4px solid; }
        .high { border-left-color: #dc3545; background: #f8d7da; }
        .medium { border-left-color: #ffc107; background: #fff3cd; }
        .low { border-left-color: #17a2b8; background: #d1ecf1; }
        .priority-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .high .priority-badge { background: #dc3545; color: white; }
        .medium .priority-badge { background: #ffc107; color: black; }
        .low .priority-badge { background: #17a2b8; color: white; }
        .affected-pages { margin-top: 10px; font-size: 14px; color: #6c757d; }
        .page-list { margin-top: 10px; }
        .page-item { display: inline-block; background: #e9ecef; padding: 2px 6px; margin: 2px; border-radius: 3px; font-size: 12px; }
        .timestamp { color: #6c757d; font-size: 14px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 SEO Audit Report</h1>
        <div class="timestamp">Generated on ${new Date(this.auditResults.timestamp).toLocaleString()}</div>
        <p><strong>Website:</strong> ${this.auditResults.website}</p>

        <div class="score-card">
            <div>Overall SEO Score</div>
            <div class="score-number">${this.auditResults.overall.averageScore}</div>
            <div class="score-grade">Grade ${this.auditResults.overall.grade}</div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${this.auditResults.overall.totalIssues}</div>
                <div class="stat-label">Total Issues</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.auditResults.overall.issueCounts.critical}</div>
                <div class="stat-label">Critical Issues</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.auditResults.overall.issueCounts.warnings}</div>
                <div class="stat-label">Warnings</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.auditResults.overall.issueCounts.opportunities}</div>
                <div class="stat-label">Opportunities</div>
            </div>
        </div>

        <div class="recommendations">
            <h2>📋 Actionable Recommendations</h2>
            ${this.auditResults.recommendations.map(rec => `
                <div class="recommendation ${rec.priority}">
                    <span class="priority-badge ${rec.priority}">${rec.priority} Priority</span>
                    <h3>${rec.issue}</h3>
                    <p><strong>Solution:</strong> ${rec.solution}</p>
                    <div class="affected-pages">
                        Affects ${rec.affectedPages} page${rec.affectedPages !== 1 ? 's' : ''}
                        <div class="page-list">
                            ${rec.pages.slice(0, 5).map(page => `<span class="page-item">${page.title}</span>`).join('')}
                            ${rec.pages.length > 5 ? `<span class="page-item">+${rec.pages.length - 5} more</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `;

    await fs.writeFile(
      path.join(this.config.dataDir, 'seo-audit-report.html'),
      html
    );
  }

  async run() {
    try {
      await this.loadScrapedData();
      await this.auditAllPages();
      this.generateRecommendations();
      await this.saveResults();

      console.log(chalk.green('\n✅ SEO audit complete!\n'));
      console.log(chalk.blue('Results saved to:'), path.join(this.config.dataDir, this.config.outputFile));
      console.log(chalk.blue('Open seo-audit-report.html to view the full report\n'));

      // Display summary
      const overall = this.auditResults.overall;
      console.log(chalk.yellow('Audit Summary:'));
      console.log(`  Overall Score: ${overall.averageScore}/100 (Grade ${overall.grade})`);
      console.log(`  Total Issues: ${overall.totalIssues}`);
      console.log(`  Critical: ${overall.issueCounts.critical}`);
      console.log(`  Warnings: ${overall.issueCounts.warnings}`);
      console.log(`  Opportunities: ${overall.issueCounts.opportunities}\n`);

    } catch (error) {
      console.error(chalk.red('\n❌ Audit failed:'), error.message);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const auditor = new SEOAuditor();
  auditor.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = SEOAuditor;