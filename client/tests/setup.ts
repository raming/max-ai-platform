// Jest setup file to configure mocks
jest.mock('uuid', () => ({
  v4: () => require('crypto').randomUUID(),
}));