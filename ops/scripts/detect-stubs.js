#!/usr/bin/env node

/**
 * Stub Method Detection Script
 *
 * Scans the codebase for unimplemented methods marked with NotImplementedError
 * or similar patterns. This helps track prototype/scaffolding code that needs
 * to be revisited during feature implementation.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StubDetector {
  constructor() {
    this.stubPatterns = [
      // JavaScript/TypeScript
      /throw new NotImplementedError\(['"`]([^'"`]+)['"`]\)/g,
      /throw new Error\(['"`]([^'"`]*not yet implemented[^'"`]*?)['"`]\)/gi,
      /throw new Error\(['"`]([^'"`]*not implemented[^'"`]*?)['"`]\)/gi,
      /throw new Error\(['"`]([^'"`]*TODO[^'"`]*?)['"`]\)/gi,

      // Python
      /raise NotImplementedError\(['"`]([^'"`]+)['"`]\)/g,
      /raise NotImplementedError\(["']([^"']*?)["']\)/g,

      // Go
      /return nil, fmt\.Errorf\(['"`]([^'"`]*not yet implemented[^'"`]*?)['"`]\)/g,
      /return nil, fmt\.Errorf\(['"`]([^'"`]*not implemented[^'"`]*?)['"`]\)/g,

      // Java
      /throw new UnsupportedOperationException\(['"`]([^'"`]+)['"`]\)/g,
      /throw new RuntimeException\(['"`]([^'"`]*not yet implemented[^'"`]*?)['"`]\)/g,

      // C#
      /throw new NotImplementedException\(['"`]([^'"`]+)['"`]\)/g,
      /throw new NotSupportedException\(['"`]([^'"`]*not yet implemented[^'"`]*?)['"`]\)/g,
    ];

    this.excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /\.next/,
      /coverage/,
      /\.DS_Store/,
      /__pycache__/,
      /\.pyc$/,
      /\.class$/,
      /\.md$/,  // Exclude documentation files
    ];
  }

  shouldExclude(filePath) {
    return this.excludePatterns.some(pattern => pattern.test(filePath));
  }

  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stubs = [];

      this.stubPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const message = match[1] || match[0];
          const lineNumber = content.substring(0, match.index).split('\n').length;

          stubs.push({
            file: path.relative(process.cwd(), filePath),
            line: lineNumber,
            message: message.trim(),
            type: this.getStubType(message)
          });
        }
      });

      return stubs;
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
      return [];
    }
  }

  getStubType(message) {
    if (message.toLowerCase().includes('not yet implemented')) return 'not_yet_implemented';
    if (message.toLowerCase().includes('not implemented')) return 'not_implemented';
    if (message.toLowerCase().includes('todo')) return 'todo';
    return 'stub';
  }

  scanDirectory(dirPath) {
    const results = [];

    function scan(dir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (this.shouldExclude(fullPath)) {
          continue;
        }

        if (stat.isDirectory()) {
          scan.call(this, fullPath);
        } else if (stat.isFile()) {
          const stubs = this.scanFile(fullPath);
          results.push(...stubs);
        }
      }
    }

    scan.call(this, dirPath);
    return results;
  }

  generateReport(stubs) {
    if (stubs.length === 0) {
      console.log('✅ No stub methods found in the codebase.');
      return;
    }

    console.log(`🔍 Found ${stubs.length} stub method(s) in the codebase:\n`);

    // Group by file
    const byFile = stubs.reduce((acc, stub) => {
      if (!acc[stub.file]) acc[stub.file] = [];
      acc[stub.file].push(stub);
      return acc;
    }, {});

    Object.entries(byFile).forEach(([file, fileStubs]) => {
      console.log(`📁 ${file}:`);
      fileStubs.forEach(stub => {
        const typeEmoji = {
          not_yet_implemented: '⏳',
          not_implemented: '❌',
          todo: '📝',
          stub: '🏗️'
        }[stub.type] || '🏗️';

        console.log(`  ${typeEmoji} Line ${stub.line}: ${stub.message}`);
      });
      console.log('');
    });

    console.log('💡 Tip: Review these methods when implementing the corresponding features.');
    console.log('   Use the standardized error format: "{MethodName}: {description} not yet implemented"');
  }

  run() {
    const targetDir = process.argv[2] || '.';
    console.log(`Scanning for stub methods in: ${path.resolve(targetDir)}\n`);

    const stubs = this.scanDirectory(targetDir);
    this.generateReport(stubs);

    // Exit with error code if stubs found (for CI)
    if (stubs.length > 0) {
      console.log(`\n❌ Found ${stubs.length} stub method(s). Review and implement before completing the task.`);
      process.exit(1);
    } else {
      console.log('\n✅ All methods are implemented!');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const detector = new StubDetector();
  detector.run();
}

module.exports = StubDetector;