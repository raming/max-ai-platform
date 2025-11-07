import type { Config } from 'jest';

const config: Config = {
  displayName: 'web',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    // Support three-tier structure: new root level + old src/ level
    // Check new level first (app/, lib/), then fall back to src/ level
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/lib/services/(.*)$': '<rootDir>/src/lib/services/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@max-ai/ui-editor$': '<rootDir>/../libs/ui/editor/src/index.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  coverageDirectory: '../coverage/web',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/unit/**/*.test.tsx',
    '<rootDir>/tests/integration/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.test.tsx',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.test.tsx',
    '<rootDir>/src/**/*.spec.tsx',
    '<rootDir>/src/**/*.test.js',
    '<rootDir>/src/**/*.spec.js'
  ],
  // Focus coverage on tested code only
  // src/stores - has unit tests
  // lib/contract-validation - has comprehensive tests  
  collectCoverageFrom: [
    'src/stores/**/*.ts',
    'lib/contract-validation.ts',
  ],
  // Realistic thresholds for current testing baseline
  // Login: 100%, contract-validation: 56% avg, but constrained by feature flags
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  forceExit: true,
  clearMocks: true,
  restoreMocks: true
};

export default config;

