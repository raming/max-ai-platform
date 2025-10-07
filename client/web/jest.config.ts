import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Next.js app lives under `src/app` in this project; point the helper at `src`
  dir: './src',
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
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
};

export default createJestConfig(config);
