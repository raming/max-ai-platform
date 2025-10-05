"use strict";
// Jest setup file to configure mocks
jest.mock('uuid', () => ({
    v4: () => require('crypto').randomUUID(),
}));
//# sourceMappingURL=setup.js.map