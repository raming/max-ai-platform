import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  displayName: 'web',
  preset: '../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../coverage/web',
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/app/onboarding/store.ts',
    'src/lib/contracts/**/*.ts',
    '!src/lib/contracts/**/*.spec.ts',
    '!src/lib/contracts/**/*.test.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  testMatch: [
    '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
    '<rootDir>/../tests/**/*.{spec,test}.{ts,tsx}',
  ],
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
};

export default createJestConfig(config);
