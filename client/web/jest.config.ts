import type { Config } from 'jest';

const config: Config = {
  displayName: 'web',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../coverage/web',
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.test.js',
    '<rootDir>/src/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/app/**/*.ts',
    'tests/unit/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 45,
      lines: 45,
      statements: 45,
    },
  },
  forceExit: true,
  clearMocks: true,
  restoreMocks: true
};

export default config;
