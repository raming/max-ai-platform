import type { Config } from 'jest';

const config: Config = {
  displayName: 'web',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
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
  collectCoverageFrom: [
    'app/auth/login/page.tsx',
    'lib/contract-validation.ts',
  ],
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
