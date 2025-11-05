export default {
  displayName: 'api',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/api',
  transformIgnorePatterns: [
    'node_modules/(?!(isomorphic-dompurify|jsdom)/)',
  ],
  moduleNameMapper: {
    '^isomorphic-dompurify$': '<rootDir>/src/content/__tests__/__mocks__/isomorphic-dompurify.ts',
  },
};
