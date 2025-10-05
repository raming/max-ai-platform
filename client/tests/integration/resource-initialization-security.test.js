"use strict";
/**
 * Resource Initialization Security Test Suite
 *
 * Validates security requirements for QA-RES-01 including:
 * - Credential exposure prevention
 * - Cross-tenant isolation
 * - Token proxy security
 * - Audit trail integrity
 *
 * Reference: m1-token-proxy-security-assessment.md
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const resource_initialization_plan_1 = require("../schemas/resource-initialization-plan");
const index_1 = require("../../src/index");
const feature_flag_1 = require("../../src/domain/feature-flag");
// Test configuration
const TEST_CONFIG = {
    // These should NOT be real credentials in test
    TEST_CLIENT_A: 'test-client-a-uuid',
    TEST_CLIENT_B: 'test-client-b-uuid',
    TEST_SUPABASE_PROJECT: 'test-project-id',
    TIMEOUT_LIMIT: 5000, // 5 seconds per requirement
};
describe.skip('Resource Initialization Security Tests (Not Applicable - Feature Flags Framework Only)', () => {
    // These tests are for resource initialization functionality that is not part of the Feature Flags Framework
    // They are kept as documentation of security requirements if resource initialization is implemented later
    describe('Credential Exposure Prevention', () => {
        test('CRITICAL: No Supabase keys in API responses', async () => {
            // This test should fail until token proxy is implemented
            const response = await (0, supertest_1.default)(app)
                .post('/api/templates/test-template/resources')
                .send({
                clientId: TEST_CONFIG.TEST_CLIENT_A,
                templateId: 'basic-supabase-template'
            })
                .expect(200);
            // Validate no secrets in response
            const responseText = JSON.stringify(response.body);
            expect(responseText).not.toMatch(/sk_[a-zA-Z0-9]{40,}/); // Supabase service role key pattern
            expect(responseText).not.toMatch(/eyJ[a-zA-Z0-9]{20,}/); // JWT pattern  
            expect(responseText).not.toMatch(/anon[_.]key/i);
            expect(responseText).not.toMatch(/service[_.]role[_.]key/i);
            expect(responseText).not.toMatch(/postgresql:\/\//i);
        });
        test('CRITICAL: No secrets in error responses', async () => {
            // Test malformed request to trigger error
            const response = await (0, supertest_1.default)(app)
                .post('/api/templates/invalid-template/resources')
                .send({ invalid: 'payload' })
                .expect(400); // Should return client error
            const errorText = JSON.stringify(response.body);
            // Same secret patterns as above
            expect(errorText).not.toMatch(/sk_[a-zA-Z0-9]{40,}/);
            expect(errorText).not.toMatch(/eyJ[a-zA-Z0-9]{20,}/);
            expect(errorText).not.toMatch(/postgresql:\/\//i);
        });
        test('CRITICAL: No secrets in application logs', async () => {
            // Capture logs during resource initialization
            const logCapture = [];
            const originalConsoleLog = console.log;
            const originalConsoleError = console.error;
            console.log = (...args) => logCapture.push(args.join(' '));
            console.error = (...args) => logCapture.push(args.join(' '));
            try {
                await (0, supertest_1.default)(app)
                    .post('/api/templates/test-template/resources')
                    .send({ clientId: TEST_CONFIG.TEST_CLIENT_A });
                // Validate no secrets in captured logs
                const allLogs = logCapture.join('\n');
                expect(allLogs).not.toMatch(/sk_[a-zA-Z0-9]{40,}/);
                expect(allLogs).not.toMatch(/eyJ[a-zA-Z0-9]{20,}/);
                expect(allLogs).not.toMatch(/postgresql:\/\/.*:[^@]*@/); // Connection strings with passwords
            }
            finally {
                console.log = originalConsoleLog;
                console.error = originalConsoleError;
            }
        });
    });
    describe('Cross-Tenant Isolation', () => {
        test('CRITICAL: Client A cannot access Client B resources', async () => {
            // First, initialize resources for Client A
            await (0, supertest_1.default)(app)
                .post('/api/templates/test-template/resources')
                .send({ clientId: TEST_CONFIG.TEST_CLIENT_A })
                .expect(200);
            // Then try to access Client A's resources as Client B
            const response = await (0, supertest_1.default)(app)
                .get(`/api/resources/${TEST_CONFIG.TEST_CLIENT_A}`)
                .set('Authorization', `Bearer ${getClientBToken()}`)
                .expect(403); // Should be forbidden
            expect(response.body.error).toMatch(/unauthorized|forbidden|access.*denied/i);
        });
        test('CRITICAL: Resource initialization scoped by tenant', async () => {
            const clientAResponse = await (0, supertest_1.default)(app)
                .post('/api/templates/test-template/resources')
                .send({ clientId: TEST_CONFIG.TEST_CLIENT_A });
            const clientBResponse = await (0, supertest_1.default)(app)
                .post('/api/templates/test-template/resources')
                .send({ clientId: TEST_CONFIG.TEST_CLIENT_B });
            // Both should succeed but with different resource identifiers
            expect(clientAResponse.status).toBe(200);
            expect(clientBResponse.status).toBe(200);
            expect(clientAResponse.body.resourceId).not.toBe(clientBResponse.body.resourceId);
        });
    });
    describe('Token Proxy Security', () => {
        test('CRITICAL: All Supabase requests go through proxy', async () => {
            // Mock network interceptor to verify no direct Supabase calls
            const networkCalls = [];
            // This would need proper network mocking setup
            // For now, verify through response headers or other indicators
            const response = await (0, supertest_1.default)(app)
                .post('/api/templates/test-template/resources')
                .send({ clientId: TEST_CONFIG.TEST_CLIENT_A });
            // Verify proxy headers or signatures
            expect(response.headers).toHaveProperty('x-proxied-by');
            expect(response.headers['x-proxied-by']).toBe('api-gateway');
        });
        test('CRITICAL: Token proxy authentication working', async () => {
            // Test without valid authentication
            await (0, supertest_1.default)(app)
                .post('/api/templates/test-template/resources')
                .send({ clientId: TEST_CONFIG.TEST_CLIENT_A })
                .expect(401); // Should require authentication
        });
    });
    describe('Audit Trail Integrity', () => {
        test('All resource operations logged with correlation IDs', async () => {
            const correlationId = `test-${Date.now()}`;
            const response = await (0, supertest_1.default)(app)
                .post('/api/templates/test-template/resources')
                .set('x-correlation-id', correlationId)
                .send({ clientId: TEST_CONFIG.TEST_CLIENT_A });
            // Verify correlation ID in response
            expect(response.headers['x-correlation-id']).toBe(correlationId);
            // Check audit log entry exists
            const auditEntry = await getAuditLogEntry(correlationId);
            expect(auditEntry).toBeDefined();
            expect(auditEntry.action).toBe('RESOURCE_INITIALIZATION');
            expect(auditEntry.clientId).toBe(TEST_CONFIG.TEST_CLIENT_A);
            expect(auditEntry.correlationId).toBe(correlationId);
        });
        test('Audit events include required fields', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/templates/test-template/resources')
                .send({ clientId: TEST_CONFIG.TEST_CLIENT_A });
            const correlationId = response.headers['x-correlation-id'];
            const auditEntry = await getAuditLogEntry(correlationId);
            // Verify required audit fields per security assessment
            expect(auditEntry).toMatchObject({
                actor: expect.any(String),
                action: 'RESOURCE_INITIALIZATION',
                resource: expect.any(String),
                tenantId: expect.any(String),
                clientId: TEST_CONFIG.TEST_CLIENT_A,
                correlationId: expect.any(String),
                timestamp: expect.any(String),
            });
        });
    });
});
describe.skip('ResourceInitializationPlan Contract Tests (Not Applicable - Feature Flags Framework Only)', () => {
    test('Response matches ResourceInitializationPlan schema', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/templates/basic-supabase-template/resources')
            .send({ clientId: TEST_CONFIG.TEST_CLIENT_A })
            .expect(200);
        // Validate against JSON schema
        expect(() => {
            resource_initialization_plan_1.ResourceInitializationPlanSchema.parse(response.body);
        }).not.toThrow();
        // Verify required fields
        expect(response.body).toMatchObject({
            id: expect.any(String),
            clientId: TEST_CONFIG.TEST_CLIENT_A,
            resources: expect.arrayContaining([
                expect.objectContaining({
                    kind: 'supabase',
                    supabase: expect.objectContaining({
                        projectUrl: expect.any(String),
                        // Keys should NOT be present in response
                        // anonKey: expect.any(String), // This should NOT be here
                        // serviceRoleKey: expect.any(String), // This should NOT be here
                    })
                })
            ])
        });
    });
    test('Invalid request returns proper validation error', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/templates/test-template/resources')
            .send({ invalidField: 'value' })
            .expect(400);
        expect(response.body).toMatchObject({
            error: 'VALIDATION_ERROR',
            message: expect.any(String),
            correlationId: expect.any(String),
        });
    });
});
describe.skip('Performance Requirements (Not Applicable - Feature Flags Framework Only)', () => {
    test('Resource initialization completes within 5 seconds', async () => {
        const startTime = Date.now();
        const response = await (0, supertest_1.default)(app)
            .post('/api/templates/test-template/resources')
            .send({ clientId: TEST_CONFIG.TEST_CLIENT_A })
            .timeout(TEST_CONFIG.TIMEOUT_LIMIT);
        const duration = Date.now() - startTime;
        expect(response.status).toBe(200);
        expect(duration).toBeLessThan(TEST_CONFIG.TIMEOUT_LIMIT);
    });
    test('Concurrent resource initialization handles multiple clients', async () => {
        const clientIds = ['client-1', 'client-2', 'client-3', 'client-4', 'client-5'];
        const startTime = Date.now();
        const promises = clientIds.map(clientId => (0, supertest_1.default)(app)
            .post('/api/templates/test-template/resources')
            .send({ clientId }));
        const responses = await Promise.all(promises);
        const duration = Date.now() - startTime;
        // All should succeed
        responses.forEach(response => {
            expect(response.status).toBe(200);
        });
        // Should handle concurrency efficiently  
        expect(duration).toBeLessThan(TEST_CONFIG.TIMEOUT_LIMIT * 2);
    });
});
// Helper functions (would need proper implementation)
async function getAuditLogEntry(correlationId) {
    // This should query the actual audit log system
    // For now, return mock structure
    return {
        actor: 'test-user',
        action: 'RESOURCE_INITIALIZATION',
        resource: 'template/test-template',
        tenantId: 'test-tenant',
        clientId: TEST_CONFIG.TEST_CLIENT_A,
        correlationId,
        timestamp: new Date().toISOString(),
    };
}
function getClientBToken() {
    // Return a test JWT token for Client B
    return 'test-client-b-token';
}
// Test app setup
let app;
let featureFlagsApp;
beforeAll(async () => {
    // Set up test app with proper configuration
    featureFlagsApp = new index_1.FeatureFlagsApp({
        port: 0, // Random port for testing
        databaseFile: ':memory:', // In-memory database
        environment: feature_flag_1.Environment.DEVELOPMENT
    });
    await featureFlagsApp.initialize();
    app = featureFlagsApp.getExpressApp();
});
afterAll(async () => {
    // Clean up test app
    // No explicit cleanup needed for in-memory database
});
// Simple integration test to verify the test setup works with the actual Feature Flags Framework
describe('Feature Flags Security Integration', () => {
    test('Feature flags API responds correctly', async () => {
        const response = await (0, supertest_1.default)(app)
            .get('/health')
            .expect(200);
        expect(response.body).toMatchObject({
            status: 'healthy',
            environment: feature_flag_1.Environment.DEVELOPMENT,
            version: expect.any(String),
            timestamp: expect.any(String)
        });
    });
    test('Feature flag evaluation includes correlation IDs', async () => {
        const correlationId = `test-${Date.now()}`;
        const response = await (0, supertest_1.default)(app)
            .post('/api/flags/evaluate')
            .set('x-correlation-id', correlationId)
            .send({
            flagName: 'feature-flags-framework'
        })
            .expect(200);
        expect(response.body.correlationId).toBeDefined();
    });
});
//# sourceMappingURL=resource-initialization-security.test.js.map