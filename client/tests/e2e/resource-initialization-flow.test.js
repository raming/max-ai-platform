"use strict";
/**
 * End-to-End Feature Flags Framework Test
 *
 * Tests complete flow: Feature flag evaluation, bulk operations, and integration
 *
 * Reference: DEV-RES-03, Feature Flags Framework Implementation for Resource Gates
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../../src/index");
const feature_flag_1 = require("../../src/domain/feature-flag");
const test_uuid_1 = require("../utils/test-uuid");
// E2E Test Configuration
const E2E_CONFIG = {
    // Test identifiers
    TEST_TENANT_ID: (0, test_uuid_1.generateTestUuid)(),
    TEST_USER_ID: (0, test_uuid_1.generateTestUuid)(),
    TEST_FLAG_NAME: 'resource_initialization_m1',
    // Test flags for bootstrap verification
    BOOTSTRAP_FLAGS: ['feature-flags-framework', 'resource-init-token-proxy', 'template-resource-init'],
    // Performance thresholds
    MAX_EVALUATION_TIME: 100, // 100ms for flag evaluation
    MAX_BULK_EVALUATION_TIME: 500, // 500ms for bulk evaluation
};
describe('End-to-End Feature Flags Framework', () => {
    let app;
    let featureFlagsApp;
    beforeAll(async () => {
        // Set up Feature Flags App instance with test configuration
        featureFlagsApp = new index_1.FeatureFlagsApp({
            port: 0, // Use random port for testing
            databaseFile: ':memory:', // Use in-memory database for tests
            environment: feature_flag_1.Environment.DEVELOPMENT
        });
        await featureFlagsApp.initialize();
        app = featureFlagsApp.getExpressApp();
    });
    afterAll(async () => {
        // Clean up Feature Flags App instance
        if (featureFlagsApp) {
            // The shutdown method calls process.exit which we don't want in tests
            // For now, we don't need explicit cleanup since we use in-memory DB
        }
    });
    describe('Bootstrap Flag Verification', () => {
        test('Bootstrap flags are created and available', async () => {
            // Verify all bootstrap flags exist
            for (const flagName of E2E_CONFIG.BOOTSTRAP_FLAGS) {
                const response = await (0, supertest_1.default)(app)
                    .get(`/api/flags/exists/${flagName}`)
                    .query({ environment: feature_flag_1.Environment.DEVELOPMENT })
                    .expect(200);
                expect(response.body).toMatchObject({
                    flagName,
                    environment: feature_flag_1.Environment.DEVELOPMENT,
                    exists: true,
                    correlationId: expect.any(String),
                    timestamp: expect.any(String)
                });
            }
        });
        test('Bootstrap flags can be evaluated successfully', async () => {
            const startTime = Date.now();
            // Test POST evaluation endpoint
            const response = await (0, supertest_1.default)(app)
                .post('/api/flags/evaluate')
                .send({
                flagName: E2E_CONFIG.BOOTSTRAP_FLAGS[0], // 'feature-flags-framework'
                tenantId: E2E_CONFIG.TEST_TENANT_ID,
                userId: E2E_CONFIG.TEST_USER_ID
            })
                .query({ environment: feature_flag_1.Environment.DEVELOPMENT })
                .expect(200);
            expect(response.body).toMatchObject({
                flagName: E2E_CONFIG.BOOTSTRAP_FLAGS[0],
                enabled: expect.any(Boolean),
                evaluatedAt: expect.any(String),
                correlationId: expect.any(String)
            });
            const evaluationTime = Date.now() - startTime;
            expect(evaluationTime).toBeLessThan(E2E_CONFIG.MAX_EVALUATION_TIME);
        });
        test('Error handling: Non-existent flag evaluation', async () => {
            // Test evaluating a flag that doesn't exist
            const response = await (0, supertest_1.default)(app)
                .post('/api/flags/evaluate')
                .send({
                flagName: 'non-existent-flag',
                tenantId: E2E_CONFIG.TEST_TENANT_ID
            })
                .query({ environment: feature_flag_1.Environment.DEVELOPMENT })
                .expect(200); // Should return with enabled: false (fail-safe)
            expect(response.body).toMatchObject({
                flagName: 'non-existent-flag',
                enabled: false, // Should default to disabled for unknown flags
                evaluatedAt: expect.any(String),
                correlationId: expect.any(String)
            });
            // Verify exists endpoint reports correctly
            const existsResponse = await (0, supertest_1.default)(app)
                .get('/api/flags/exists/non-existent-flag')
                .query({ environment: feature_flag_1.Environment.DEVELOPMENT })
                .expect(200);
            expect(existsResponse.body.exists).toBe(false);
        });
    });
    describe('Bulk Evaluation Operations', () => {
        test('Bulk flag evaluation with multiple flags', async () => {
            const startTime = Date.now();
            const response = await (0, supertest_1.default)(app)
                .post('/api/flags/evaluate/bulk')
                .send({
                flagNames: E2E_CONFIG.BOOTSTRAP_FLAGS,
                tenantId: E2E_CONFIG.TEST_TENANT_ID,
                userId: E2E_CONFIG.TEST_USER_ID
            })
                .query({ environment: feature_flag_1.Environment.DEVELOPMENT })
                .expect(200);
            expect(response.body).toMatchObject({
                results: expect.arrayContaining(E2E_CONFIG.BOOTSTRAP_FLAGS.map(flagName => expect.objectContaining({
                    flagName,
                    enabled: expect.any(Boolean),
                    evaluatedAt: expect.any(String)
                }))),
                correlationId: expect.any(String),
                evaluatedAt: expect.any(String)
            });
            const evaluationTime = Date.now() - startTime;
            expect(evaluationTime).toBeLessThan(E2E_CONFIG.MAX_BULK_EVALUATION_TIME);
        });
        test('Get enabled flags endpoint', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/flags/enabled')
                .query({
                environment: feature_flag_1.Environment.DEVELOPMENT,
                tenantId: E2E_CONFIG.TEST_TENANT_ID,
                userId: E2E_CONFIG.TEST_USER_ID
            })
                .expect(200);
            expect(response.body).toMatchObject({
                enabledFlags: expect.any(Array),
                correlationId: expect.any(String),
                evaluatedAt: expect.any(String)
            });
            // Since bootstrap flags are alpha and require allowlist, enabled flags may be empty
            // This is expected behavior for security
        });
    });
    describe('API Health and Alternative Endpoints', () => {
        test('Health endpoint returns system status', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/health')
                .expect(200);
            expect(response.body).toMatchObject({
                status: 'healthy',
                timestamp: expect.any(String),
                environment: feature_flag_1.Environment.DEVELOPMENT,
                version: expect.any(String)
            });
        });
        test('GET evaluation endpoint works correctly', async () => {
            const flagName = E2E_CONFIG.BOOTSTRAP_FLAGS[0];
            const response = await (0, supertest_1.default)(app)
                .get(`/api/flags/evaluate/${flagName}`)
                .query({
                environment: feature_flag_1.Environment.DEVELOPMENT,
                tenantId: E2E_CONFIG.TEST_TENANT_ID,
                userId: E2E_CONFIG.TEST_USER_ID
            })
                .expect(200);
            expect(response.body).toMatchObject({
                flagName,
                enabled: expect.any(Boolean),
                evaluatedAt: expect.any(String),
                correlationId: expect.any(String)
            });
        });
    });
});
// Additional test suite for validation edge cases
describe('Validation and Edge Cases', () => {
    let app;
    let featureFlagsApp;
    beforeAll(async () => {
        // Set up Feature Flags App instance with test configuration
        featureFlagsApp = new index_1.FeatureFlagsApp({
            port: 0,
            databaseFile: ':memory:',
            environment: feature_flag_1.Environment.DEVELOPMENT
        });
        await featureFlagsApp.initialize();
        app = featureFlagsApp.getExpressApp();
    });
    test('Invalid request validation', async () => {
        // Test POST evaluation with missing required fields
        const response = await (0, supertest_1.default)(app)
            .post('/api/flags/evaluate')
            .send({})
            .expect(400);
        expect(response.body).toMatchObject({
            error: 'VALIDATION_ERROR',
            message: expect.any(String),
            correlationId: expect.any(String),
            timestamp: expect.any(String)
        });
    });
    test('Invalid environment parameter handling', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/flags/evaluate')
            .send({
            flagName: 'test-flag',
            tenantId: E2E_CONFIG.TEST_TENANT_ID
        })
            .query({ environment: 'invalid-environment' })
            .expect(400); // Should fail validation with 400 Bad Request
        expect(response.body).toMatchObject({
            error: 'VALIDATION_ERROR',
            message: expect.any(String),
            correlationId: expect.any(String),
            timestamp: expect.any(String)
        });
    });
    test('Bulk evaluation with empty flag list', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/flags/evaluate/bulk')
            .send({
            flagNames: [],
            tenantId: E2E_CONFIG.TEST_TENANT_ID
        })
            .query({ environment: feature_flag_1.Environment.DEVELOPMENT })
            .expect(200); // Empty array is actually valid - returns empty results
        expect(response.body).toMatchObject({
            results: [],
            correlationId: expect.any(String),
            evaluatedAt: expect.any(String)
        });
    });
});
//# sourceMappingURL=resource-initialization-flow.test.js.map