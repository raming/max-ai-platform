import { randomUUID } from 'crypto';

/**
 * Generate a new UUID v4 using Node.js crypto module
 * This avoids ES module issues in Jest tests
 */
export function generateTestUuid(): string {
  return randomUUID();
}

/**
 * UUID validation regex pattern
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format for testing
 */
export function isValidTestUuid(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}