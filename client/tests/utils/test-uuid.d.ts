/**
 * Generate a new UUID v4 using Node.js crypto module
 * This avoids ES module issues in Jest tests
 */
export declare function generateTestUuid(): string;
/**
 * Validate UUID format for testing
 */
export declare function isValidTestUuid(uuid: string): boolean;
//# sourceMappingURL=test-uuid.d.ts.map