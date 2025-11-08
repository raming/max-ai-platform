/**
 * TIER 1: Legacy/Old Patches Jest Configuration
 * 
 * Use this template for older packages that haven't been fully tested yet.
 * Coverage threshold: 60-70% (maintenance mode)
 * 
 * Migration Path:
 * 1. Legacy package stays at Tier 1 until active refactoring
 * 2. When adding new features → move to Tier 2 (85-90%)
 * 3. When comprehensive tests added → move to Tier 3 (95%+)
 * 4. Quarterly reviews to promote mature packages
 * 
 * IMPORTANT: Record the tier level in .coverage-tiers.json
 */

import type { Config } from 'jest';

const config: Config = {
  displayName: 'legacy-package', // Update to your package name
  preset: '../../jest.preset.js', // Adjust path as needed
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/legacy-package', // Update path
  
  // TIER 1: Legacy Package Coverage Enforcement (60-70% minimum)
  // Rationale: Older, partially tested code. No regressions allowed.
  // Improvements tracked quarterly for potential Tier 2 promotion.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 65,
      lines: 70,
      statements: 70,
    },
  },
  
  // NOTE: If this package is in the process of being refactored,
  // you can exempt specific modules and track them for improvement:
  // 
  // './src/legacy-util/**': {
  //   branches: 0,
  //   functions: 0,
  //   lines: 0,
  //   statements: 0,
  // },
  // 
  // Then add a TODO to increase coverage as part of refactoring.
};

export default config;
