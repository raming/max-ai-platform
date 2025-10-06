const { createGlobPatternsForDependencies } = require('@nx/jest');
const { join } = require('path');

module.exports = {
  displayName: 'client',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/client',
  
  // Test patterns and organization
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],
  
  // Coverage configuration for comprehensive reporting
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    'apps/**/*.{ts,js}',
    'libs/**/*.{ts,js}',
    '!**/*.spec.ts',
    '!**/*.test.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**'
  ],
  
  // Coverage thresholds (≥95% per QA requirements)
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // Individual file thresholds
    './src/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Test categories and organization
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 30000 // Longer timeout for integration tests
    },
    {
      displayName: 'contract',
      testMatch: ['<rootDir>/tests/contract/**/*.test.ts'],
      testEnvironment: 'node'
    },
    {
      displayName: 'security',
      testMatch: ['<rootDir>/tests/security/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 60000, // Longer timeout for security tests
      // Security tests may need special setup
      setupFilesAfterEnv: ['<rootDir>/tests/security/setup.ts']
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 120000, // Much longer timeout for E2E tests
      maxConcurrency: 1, // E2E tests should run sequentially
      setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.ts']
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 300000, // Very long timeout for performance tests (5 minutes)
      maxConcurrency: 1, // Performance tests should run in isolation
      setupFilesAfterEnv: ['<rootDir>/tests/performance/setup.ts']
    }
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts',
  
  // Test reporters for CI integration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '../coverage/client',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ],
    [
      'jest-html-reporters',
      {
        publicPath: '../coverage/client',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Resource Initialization Test Report',
        logoImgPath: undefined,
        inlineSource: false
      }
    ]
  ],
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'cobertura' // For CI systems
  ],
  
  // Module resolution for test dependencies
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Dependency patterns for Nx
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$)'
  ]
};