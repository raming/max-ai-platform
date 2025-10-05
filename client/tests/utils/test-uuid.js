"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestUuid = generateTestUuid;
exports.isValidTestUuid = isValidTestUuid;
const crypto_1 = require("crypto");
/**
 * Generate a new UUID v4 using Node.js crypto module
 * This avoids ES module issues in Jest tests
 */
function generateTestUuid() {
    return (0, crypto_1.randomUUID)();
}
/**
 * UUID validation regex pattern
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * Validate UUID format for testing
 */
function isValidTestUuid(uuid) {
    return UUID_REGEX.test(uuid);
}
//# sourceMappingURL=test-uuid.js.map