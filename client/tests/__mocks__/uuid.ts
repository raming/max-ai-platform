import { randomUUID } from 'crypto';

// Mock the uuid module to use Node.js crypto instead of ES modules
export const v4 = (): string => {
  return randomUUID();
};

export const uuidv4 = v4;