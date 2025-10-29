#!/usr/bin/env node

/**
 * GoHighLevel Website Analysis Orchestrator
 *
 * Main script that coordinates website scraping, SEO auditing, and generates
 * comprehensive analysis reports with actionable recommendations
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { spawn } = require('child_process');

class SiteAnalyzer {
  constructor(config = {}) {
    this.config = {
      url: config.url || process.env.GHL_WEBSITE_URL,
      sessionToken: config.sessionToken || process.env.GHL_SESSION_TOKEN,
      dataDir: config.dataDir || './scraped-data',
      skipScrape: config.skipScrape || false,
      targetKeywords: config.targetKeywords || process.env.TARGET_KEYWORDS?.split(',') || [
        'ai assistant',
        'local seo',
        'ai marketing tools',
        'reputation management software'
      ]
    };

    this.results = {
      timestamp: new Date().toISOString(),
      website: this.config.url,
      phases: [],
      summary: {}
    };
  }

  async runCommand(command, args = [], description = '') {
    return new Promise((resolve, reject) => {
      const spinner = ora(description).start();

      const child = spawn(command, args, {
        cwd: path.join(__dirname),
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          spinner.succeed(description);
          resolve({ code, stdout, stderr });
        } else {
          spinner.fail(`${description} (exit code: ${code})`);
          reject(new Error(`Command failed: ${stderr || stdout}`));
        }
      });

      child.on('error', (error) => {
        spinner.fail(description);
        reject(error);
      });
    });
  }

  async phase1_ScrapeWebsite() {
    console.log(chalk.blue('\n🌐 Phase 1: Website Scraping\n'));

    const startTime = Date.now();

    try {
      // Check if we already have scraped data
      const fs = require('fs').promises;
      const path = require('path');
      const dataPath = path.join(this.config.dataDir, 'pages-data.json');

      let hasExistingData = false;
      try {
        await fs.access(dataPath);
        hasExistingData = true;
      } catch {
        hasExistingData = false;
      }

      if (hasExistingData && !this.config.skipScrape) {
        console.log(chalk.yellow('📋 Found existing scraped data - using simple scraper to refresh...\n'));
        // Use simple scraper to refresh data
        await this.runCommand('node', ['simple-scraper.js'], 'Refreshing website data with simple scraper');
      } else if (!this.config.skipScrape) {
        // Try simple scraper first as it's more reliable
        try {
          await this.runCommand('node', ['simple-scraper.js'], 'Scraping website with simple HTTP scraper');
        } catch (error) {
          console.log(chalk.yellow('⚠️  Simple scraper failed, trying Puppeteer...'));
          await this.runCommand('node', ['scrape-website.js'], 'Scraping website with Puppeteer');
        }
      } else {
        console.log(chalk.yellow('⏭️  Skipping scraping (using existing data)'));
      }

      const duration = (Date.now() - startTime) / 1000;
      this.results.phases.push({
        name: 'Website Scraping',
        status: 'completed',
        duration: `${duration.toFixed(1)}s`,
        description: hasExistingData ? 'Refreshed existing data' : 'Successfully scraped website pages'
      });

    } catch (error) {
      this.results.phases.push({
        name: 'Website Scraping',
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  async phase2_SEOAudit() {
    console.log(chalk.blue('\n🔍 Phase 2: SEO Analysis\n'));

    const startTime = Date.now();

    try {
      await this.runCommand('node', ['seo-audit.js'], 'Running comprehensive SEO audit');

      const duration = (Date.now() - startTime) / 1000;
      this.results.phases.push({
        name: 'SEO Analysis',
        status: 'completed',
        duration: `${duration.toFixed(1)}s`,
        description: 'Completed SEO audit with actionable recommendations'
      });

    } catch (error) {
      this.results.phases.push({
        name: 'SEO Analysis',
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  async phase3_LoadResults() {
    console.log(chalk.blue('\n📊 Phase 3: Loading Results\n'));

    try {
      // Load scraping results
      const pagesDataPath = path.join(this.config.dataDir, 'pages-data.json');
      const pagesData = JSON.parse(await fs.readFile(pagesDataPath, 'utf8'));

      // Load audit results
      const auditDataPath = path.join(this.config.dataDir, 'seo-audit-results.json');
      const auditData = JSON.parse(await fs.readFile(auditDataPath, 'utf8'));

      this.results.scraping = {
        totalPages: pagesData.length,
        pages: pagesData.map(p => ({
          url: p.url,
          title: p.title,
          wordCount: p.content?.wordCount || 0,
          h1Count: p.content?.h1Count || 0,
          images: p.images?.total || 0
        }))
      };

      this.results.audit = {
        overallScore: auditData.overall.averageScore,
        grade: auditData.overall.grade,
        totalIssues: auditData.overall.totalIssues,
        issueBreakdown: auditData.overall.issueCounts,
        recommendations: auditData.recommendations.length
      };

      this.results.phases.push({
        name: 'Results Loading',
        status: 'completed',
        description: 'Successfully loaded and processed all analysis data'
      });

    } catch (error) {
      this.results.phases.push({
        name: 'Results Loading',
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  async phase4_GenerateReport() {
    console.log(chalk.blue('\n📋 Phase 4: Generating Report\n'));

    try {
      await this.generateComprehensiveReport();
      await this.generateActionPlan();

      this.results.phases.push({
        name: 'Report Generation',
        status: 'completed',
        description: 'Generated comprehensive analysis report and action plan'
      });

    } catch (error) {
      this.results.phases.push({
        name: 'Report Generation',
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  async generateComprehensiveReport() {
    const report = {
      title: 'GoHighLevel Website SEO Analysis Report',
      generated: new Date().toISOString(),
      website: this.config.website,
      executive_summary: this.generateExecutiveSummary(),
      technical_details: {
        scraping: this.results.scraping,
        audit: this.results.audit
      },
      recommendations: await this.loadDetailedRecommendations(),
      next_steps: this.generateNextSteps()
    };

    await fs.writeFile(
      path.join(this.config.dataDir, 'comprehensive-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  generateExecutiveSummary() {
    const audit = this.results.audit;
    const scraping = this.results.scraping;

    return {
      overall_score: audit.overallScore,
      grade: audit.grade,
      pages_analyzed: scraping.totalPages,
      total_issues: audit.totalIssues,
      key_findings: [
        `Website scored ${audit.overallScore}/100 (${audit.grade} grade)`,
        `${audit.totalIssues} SEO issues identified across ${scraping.totalPages} pages`,
        `${audit.issueBreakdown.critical} critical issues require immediate attention`,
        `${audit.recommendations} actionable recommendations provided`
      ],
      strengths: this.identifyStrengths(),
      priorities: this.identifyPriorities()
    };
  }

  identifyStrengths() {
    const strengths = [];
    const audit = this.results.audit;

    if (audit.overallScore >= 80) {
      strengths.push('Strong overall SEO foundation');
    }

    if (audit.issueBreakdown.critical === 0) {
      strengths.push('No critical SEO issues found');
    }

    // Add more strength analysis based on specific metrics
    return strengths.length > 0 ? strengths : ['Analysis completed successfully'];
  }

  identifyPriorities() {
    const priorities = [];
    const audit = this.results.audit;

    if (audit.issueBreakdown.critical > 0) {
      priorities.push(`Fix ${audit.issueBreakdown.critical} critical issues immediately`);
    }

    if (audit.issueBreakdown.warnings > 0) {
      priorities.push(`Address ${audit.issueBreakdown.warnings} warnings`);
    }

    priorities.push('Implement top recommendations for quick wins');
    priorities.push('Monitor progress with regular audits');

    return priorities;
  }

  async loadDetailedRecommendations() {
    try {
      const auditDataPath = path.join(this.config.dataDir, 'seo-audit-results.json');
      const auditData = JSON.parse(await fs.readFile(auditDataPath, 'utf8'));
      return auditData.recommendations;
    } catch {
      return [];
    }
  }

  generateNextSteps() {
    return [
      {
        phase: 'Immediate Actions (Week 1)',
        tasks: [
          'Fix all critical SEO issues',
          'Update meta titles and descriptions',
          'Add missing H1 tags where needed',
          'Implement basic Schema.org markup'
        ]
      },
      {
        phase: 'Short-term Improvements (Weeks 2-4)',
        tasks: [
          'Optimize content for target keywords',
          'Improve internal linking structure',
          'Add alt text to images',
          'Enhance page load speed'
        ]
      },
      {
        phase: 'Long-term Strategy (Months 2-3)',
        tasks: [
          'Create comprehensive content marketing plan',
          'Build high-quality backlinks',
          'Expand social media presence',
          'Monitor and track SEO performance'
        ]
      }
    ];
  }

  async generateActionPlan() {
    const actionPlan = {
      title: 'SEO Improvement Action Plan',
      generated: new Date().toISOString(),
      website: this.config.url,
      phases: this.generateNextSteps(),
      timeline: {
        week1: 'Critical fixes and basic optimizations',
        week2: 'Content and technical improvements',
        week3: 'Advanced SEO implementation',
        week4: 'Monitoring and refinement'
      },
      success_metrics: [
        'Improve overall SEO score by 20+ points',
        'Fix all critical issues',
        'Increase organic search visibility',
        'Improve user engagement metrics'
      ]
    };

    await fs.writeFile(
      path.join(this.config.dataDir, 'action-plan.json'),
      JSON.stringify(actionPlan, null, 2)
    );
  }

  displaySummary() {
    console.log(chalk.green('\n🎉 Analysis Complete!\n'));

    const audit = this.results.audit;
    const scraping = this.results.scraping;

    console.log(chalk.yellow('📊 Executive Summary:'));
    console.log(`  Website: ${this.config.url}`);
    console.log(`  Pages Analyzed: ${scraping.totalPages}`);
    console.log(`  Overall Score: ${audit.overallScore}/100 (Grade ${audit.grade})`);
    console.log(`  Total Issues: ${audit.totalIssues}`);
    console.log(`  Critical Issues: ${audit.issueBreakdown.critical}`);
    console.log(`  Recommendations: ${audit.recommendations}\n`);

    console.log(chalk.blue('📁 Generated Files:'));
    console.log(`  • comprehensive-report.json - Full analysis report`);
    console.log(`  • action-plan.json - Step-by-step improvement plan`);
    console.log(`  • seo-audit-report.html - Visual audit report`);
    console.log(`  • seo-report.html - Technical SEO report\n`);

    console.log(chalk.green('🚀 Next Steps:'));
    console.log(`  1. Review the comprehensive report`);
    console.log(`  2. Follow the action plan timeline`);
    console.log(`  3. Run "npm run update" to implement fixes`);
    console.log(`  4. Re-audit in 4 weeks to measure progress\n`);
  }

  async run() {
    const startTime = Date.now();

    try {
      console.log(chalk.bold.blue('🚀 GoHighLevel Website SEO Analysis'));
      console.log(chalk.gray('=====================================\n'));

      // Validate configuration
      if (!this.config.url) {
        throw new Error('GHL_WEBSITE_URL environment variable is required');
      }

      await this.phase1_ScrapeWebsite();
      await this.phase2_SEOAudit();
      await this.phase3_LoadResults();
      await this.phase4_GenerateReport();

      const totalDuration = (Date.now() - startTime) / 1000;
      this.results.summary = {
        totalDuration: `${totalDuration.toFixed(1)}s`,
        status: 'completed',
        phasesCompleted: this.results.phases.filter(p => p.status === 'completed').length
      };

      this.displaySummary();

    } catch (error) {
      console.error(chalk.red('\n❌ Analysis failed:'), error.message);

      this.results.summary = {
        status: 'failed',
        error: error.message
      };

      throw error;
    } finally {
      // Save execution results
      await fs.writeFile(
        path.join(this.config.dataDir, 'analysis-execution.json'),
        JSON.stringify(this.results, null, 2)
      );
    }
  }
}

// Run if called directly
if (require.main === module) {
  const analyzer = new SiteAnalyzer();
  analyzer.run().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

module.exports = SiteAnalyzer;