/**
 * TIER 2: Established/Stable Packages Jest Configuration
 * 
 * Use this template for packages in active maintenance with good test coverage.
 * Coverage threshold: 85-90% (steady improvement toward 95%)
 * 
 * Characteristics:
 * - Well-tested core functionality
 * - Some legacy code or edge cases still being covered
 * - Active development with incremental improvements
 * - Goal: Reach Tier 3 (95%+) within 2-3 releases
 * 
 * Migration Path:
 * 1. Start at Tier 1 (60-70%) for older code
 * 2. Move to Tier 2 (85-90%) when adding active development
 * 3. Promote to Tier 3 (95%+) when fully tested
 * 
 * IMPORTANT: Record the tier level in .coverage-tiers.json
 */

import type { Config } from 'jest';

const config: Config = {
  displayName: 'established-package', // Update to your package name
  preset: '../../jest.preset.js', // Adjust path as needed
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/established-package', // Update path
  
  // TIER 2: Established Package Coverage Enforcement (85-90% minimum)
  // Rationale: Mature packages with good test coverage. Gradual improvement
  // toward new Tier 3 standard. Track quarterly for promotion readiness.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 88,
      lines: 90,
      statements: 90,
    },
  },
  
  // OPTIONAL: Exempt specific modules if they're being refactored.
  // Document in PR and commit to reaching 85-90% overall.
  // Once exempted modules are tested, raise global threshold to 95%.
  //
  // './src/complex-util/**': {
  //   branches: 70,
  //   functions: 75,
  //   lines: 80,
  //   statements: 80,
  // },
  //
  // NOTE: When ready to promote to Tier 3, increase all to 95+
};

export default config;
