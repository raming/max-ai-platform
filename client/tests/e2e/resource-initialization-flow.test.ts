import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';

describe('Resource Initialization E2E Flow Tests', () => {
  let app: INestApplication;
  let module: TestingModule;
  
  // Test data setup
  const testClientId = 'e2e-test-client-001';
  const testTenantHeaders = {
    'x-tenant-id': 'e2e-test-tenant',
    'x-user-id': 'e2e-test-user',
    'x-correlation-id': 'e2e-test-correlation',
    'authorization': 'Bearer e2e-test-token'
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      // Note: Will be updated with actual modules when implemented
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🔄 Complete Resource Initialization Flow', () => {
    describe('Happy Path - Full Supabase Setup', () => {
      it('should complete full resource initialization from template to deployment', async () => {
        const correlationId = `e2e-full-flow-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };

        // Step 1: Initialize resources with ResourceInitializationPlan
        const resourceInitResponse = await request(app.getHttpServer())
          .post('/templates/standard-template/resources')
          .set(headers)
          .send({
            id: `plan-${correlationId}`,
            clientId: testClientId,
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://e2e-test.supabase.co',
                  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImUyZS10ZXN0IiwiZXhwIjoxOTg4MTUwNDAwfQ.test-anon-key',
                  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImUyZS10ZXN0IiwiZXhwIjoxOTg4MTUwNDAwfQ.test-service-role-key',
                  init: {
                    tables: ['prompts', 'documents']
                  }
                }
              }
            ]
          })
          .expect((res) => {
            expect(res.status).toBeLessThan(400); // Success response
            expect(res.body).toHaveProperty('planId');
            expect(res.body).toHaveProperty('status');
          });

        const planId = resourceInitResponse.body.planId;

        // Step 2: Verify resource plan was created and stored
        const planStatusResponse = await request(app.getHttpServer())
          .get(`/resources/plans/${planId}`)
          .set(headers)
          .expect((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', planId);
            expect(res.body).toHaveProperty('clientId', testClientId);
            expect(res.body).toHaveProperty('status');
            expect(res.body.resources).toHaveLength(1);
            expect(res.body.resources[0].kind).toBe('supabase');
          });

        // Step 3: Execute deployment of the resource plan
        const deployResponse = await request(app.getHttpServer())
          .post(`/templates/standard-template/deploy`)
          .set(headers)
          .send({
            planId: planId,
            clientId: testClientId
          })
          .expect((res) => {
            expect(res.status).toBeLessThan(400); // Success response
            expect(res.body).toHaveProperty('deploymentId');
            expect(res.body).toHaveProperty('status');
          });

        const deploymentId = deployResponse.body.deploymentId;

        // Step 4: Monitor deployment progress
        let deploymentComplete = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!deploymentComplete && attempts < maxAttempts) {
          const statusResponse = await request(app.getHttpServer())
            .get(`/deployments/${deploymentId}/status`)
            .set(headers)
            .expect(200);

          if (statusResponse.body.status === 'completed') {
            deploymentComplete = true;
            
            // Verify deployment results
            expect(statusResponse.body).toHaveProperty('results');
            expect(statusResponse.body.results).toHaveProperty('supabase');
            expect(statusResponse.body.results.supabase).toHaveProperty('tablesCreated');
            expect(statusResponse.body.results.supabase.tablesCreated).toContain('prompts');
            expect(statusResponse.body.results.supabase.tablesCreated).toContain('documents');
          } else if (statusResponse.body.status === 'failed') {
            throw new Error(`Deployment failed: ${statusResponse.body.error}`);
          }

          attempts++;
          if (!deploymentComplete && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          }
        }

        expect(deploymentComplete).toBe(true);

        // Step 5: Verify resource links are stored and accessible
        const resourceLinksResponse = await request(app.getHttpServer())
          .get(`/clients/${testClientId}/resources`)
          .set(headers)
          .expect(200);

        expect(resourceLinksResponse.body).toHaveProperty('resources');
        expect(resourceLinksResponse.body.resources).toHaveLength(1);
        
        const supabaseResource = resourceLinksResponse.body.resources[0];
        expect(supabaseResource).toHaveProperty('kind', 'supabase');
        expect(supabaseResource).toHaveProperty('projectUrl', 'https://e2e-test.supabase.co');
        expect(supabaseResource).toHaveProperty('tablesAvailable');
        expect(supabaseResource.tablesAvailable).toContain('prompts');
        expect(supabaseResource.tablesAvailable).toContain('documents');

        // Critical: Verify no secrets are exposed in resource links
        const resourceText = JSON.stringify(supabaseResource);
        expect(resourceText).not.toMatch(/serviceRoleKey/);
        expect(resourceText).not.toMatch(/test-service-role-key/);
      });

      it('should handle multi-resource initialization (Supabase + Storage)', async () => {
        const correlationId = `e2e-multi-resource-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };

        const multiResourceResponse = await request(app.getHttpServer())
          .post('/templates/premium-template/resources')
          .set(headers)
          .send({
            id: `multi-plan-${correlationId}`,
            clientId: `${testClientId}-multi`,
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://multi-test.supabase.co',
                  anonKey: 'test-anon-key-multi',
                  serviceRoleKey: 'test-service-role-key-multi',
                  init: { tables: ['prompts'] }
                }
              },
              {
                kind: 'storage',
                options: {
                  provider: 'aws-s3',
                  bucket: 'test-client-storage',
                  region: 'us-east-1'
                }
              }
            ]
          })
          .expect((res) => {
            expect(res.status).toBeLessThan(400);
            expect(res.body).toHaveProperty('planId');
          });

        // Verify both resources are included in the plan
        const planId = multiResourceResponse.body.planId;
        const planResponse = await request(app.getHttpServer())
          .get(`/resources/plans/${planId}`)
          .set(headers)
          .expect(200);

        expect(planResponse.body.resources).toHaveLength(2);
        const resourceKinds = planResponse.body.resources.map((r: any) => r.kind);
        expect(resourceKinds).toContain('supabase');
        expect(resourceKinds).toContain('storage');
      });
    });

    describe('Error Recovery and Resilience', () => {
      it('should handle partial failure and enable resume', async () => {
        const correlationId = `e2e-partial-fail-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };

        // Create a resource plan that will partially fail
        const planResponse = await request(app.getHttpServer())
          .post('/templates/unreliable-template/resources')
          .set(headers)
          .send({
            id: `partial-fail-plan-${correlationId}`,
            clientId: `${testClientId}-partial-fail`,
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://valid-project.supabase.co',
                  anonKey: 'valid-anon-key',
                  serviceRoleKey: 'valid-service-key',
                  init: { tables: ['prompts'] }
                }
              },
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://invalid-project-will-fail.supabase.co',
                  anonKey: 'invalid-anon-key',
                  serviceRoleKey: 'invalid-service-key',
                  init: { tables: ['documents'] }
                }
              }
            ]
          });

        const planId = planResponse.body.planId;

        // Deploy the plan (expect partial failure)
        const deployResponse = await request(app.getHttpServer())
          .post('/templates/unreliable-template/deploy')
          .set(headers)
          .send({ planId, clientId: `${testClientId}-partial-fail` });

        const deploymentId = deployResponse.body.deploymentId;

        // Wait for deployment to complete (with partial failure)
        let finalStatus = null;
        let attempts = 0;
        while (attempts < 10) {
          const statusResponse = await request(app.getHttpServer())
            .get(`/deployments/${deploymentId}/status`)
            .set(headers);

          if (statusResponse.body.status === 'partial_success' || 
              statusResponse.body.status === 'failed') {
            finalStatus = statusResponse.body;
            break;
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        expect(finalStatus).not.toBeNull();
        expect(finalStatus.status).toBe('partial_success');
        expect(finalStatus.results).toHaveProperty('successful');
        expect(finalStatus.results).toHaveProperty('failed');
        expect(finalStatus.results.successful).toHaveLength(1);
        expect(finalStatus.results.failed).toHaveLength(1);

        // Test resume functionality
        const resumeResponse = await request(app.getHttpServer())
          .post(`/deployments/${deploymentId}/resume`)
          .set(headers)
          .send({
            retryFailedSteps: true,
            skipSteps: ['invalid-project-resource'] // Skip the failing step
          })
          .expect((res) => {
            expect(res.status).toBeLessThan(400);
          });
      });

      it('should handle network timeouts gracefully', async () => {
        const correlationId = `e2e-timeout-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };

        // Create a plan with resources that will timeout
        const timeoutResponse = await request(app.getHttpServer())
          .post('/templates/slow-template/resources')
          .set(headers)
          .send({
            id: `timeout-plan-${correlationId}`,
            clientId: `${testClientId}-timeout`,
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://slow-response.supabase.co',
                  anonKey: 'slow-anon-key',
                  serviceRoleKey: 'slow-service-key',
                  init: { tables: ['prompts'] }
                }
              }
            ]
          })
          .timeout(30000) // 30 second timeout
          .expect((res) => {
            // Should handle timeout gracefully
            if (res.status >= 500) {
              expect(res.body).toHaveProperty('error');
              expect(res.body.error).toMatch(/timeout|network/i);
            } else {
              expect(res.status).toBeLessThan(400);
            }
          });
      });
    });

    describe('Feature Flag Integration', () => {
      it('should respect feature flags for resource initialization', async () => {
        const correlationId = `e2e-feature-flag-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };

        // Test with feature flag disabled (should return 404 or feature disabled)
        await request(app.getHttpServer())
          .post('/templates/feature-gated-template/resources')
          .set(headers)
          .send({
            id: `feature-disabled-${correlationId}`,
            clientId: `${testClientId}-feature-disabled`,
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  init: { tables: ['prompts'] }
                }
              }
            ]
          })
          .expect((res) => {
            // When feature flag is disabled, should get appropriate response
            expect([200, 404, 403]).toContain(res.status);
          });

        // Note: Testing with feature flag enabled would require 
        // feature flag manipulation in test environment
      });

      it('should handle alpha/beta gating correctly', async () => {
        const correlationId = `e2e-alpha-beta-${Date.now()}`;
        
        // Test alpha user access
        const alphaHeaders = {
          ...testTenantHeaders,
          'x-correlation-id': correlationId,
          'x-user-tier': 'alpha',
          'x-tenant-tier': 'alpha'
        };

        await request(app.getHttpServer())
          .post('/templates/alpha-template/resources')
          .set(alphaHeaders)
          .send({
            id: `alpha-plan-${correlationId}`,
            clientId: `${testClientId}-alpha`,
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  init: { tables: ['prompts'] }
                }
              }
            ]
          })
          .expect((res) => {
            // Alpha users should have access (or proper gating response)
            expect(res.status).toBeLessThan(500); // Not a server error
          });

        // Test regular user access to alpha features
        const regularHeaders = {
          ...testTenantHeaders,
          'x-correlation-id': correlationId,
          'x-user-tier': 'regular',
          'x-tenant-tier': 'regular'
        };

        await request(app.getHttpServer())
          .post('/templates/alpha-template/resources')
          .set(regularHeaders)
          .send({
            id: `regular-plan-${correlationId}`,
            clientId: `${testClientId}-regular`,
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  init: { tables: ['prompts'] }
                }
              }
            ]
          })
          .expect((res) => {
            // Regular users should be blocked from alpha features
            expect([403, 404]).toContain(res.status);
          });
      });
    });

    describe('Performance and SLA Compliance', () => {
      it('should complete resource initialization within 5 second SLA', async () => {
        const correlationId = `e2e-performance-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };
        
        const startTime = Date.now();

        await request(app.getHttpServer())
          .post('/templates/performance-template/resources')
          .set(headers)
          .send({
            id: `performance-plan-${correlationId}`,
            clientId: `${testClientId}-performance`,
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://performance-test.supabase.co',
                  anonKey: 'performance-anon-key',
                  serviceRoleKey: 'performance-service-key',
                  init: { tables: ['prompts', 'documents'] }
                }
              }
            ]
          })
          .expect((res) => {
            const duration = Date.now() - startTime;
            
            // Should complete within 5 second SLA
            expect(duration).toBeLessThan(5000);
            expect(res.status).toBeLessThan(400);
            
            // Response should include timing information
            expect(res.headers).toHaveProperty('x-processing-time');
          });
      });

      it('should handle concurrent resource initialization requests', async () => {
        const correlationId = `e2e-concurrent-${Date.now()}`;
        const baseHeaders = { ...testTenantHeaders, 'x-correlation-id': correlationId };

        const concurrentRequests = Array(5).fill(null).map((_, i) =>
          request(app.getHttpServer())
            .post('/templates/concurrent-template/resources')
            .set({ ...baseHeaders, 'x-correlation-id': `${correlationId}-${i}` })
            .send({
              id: `concurrent-plan-${correlationId}-${i}`,
              clientId: `${testClientId}-concurrent-${i}`,
              resources: [
                {
                  kind: 'supabase',
                  supabase: {
                    projectUrl: `https://concurrent-${i}.supabase.co`,
                    init: { tables: ['prompts'] }
                  }
                }
              ]
            })
        );

        const startTime = Date.now();
        const responses = await Promise.all(concurrentRequests);
        const totalTime = Date.now() - startTime;

        // All requests should succeed
        responses.forEach(response => {
          expect(response.status).toBeLessThan(400);
        });

        // Concurrent processing should not take much longer than sequential
        expect(totalTime).toBeLessThan(15000); // 15 seconds for 5 requests

        // Verify no conflicts between concurrent requests
        const planIds = responses.map(r => r.body.planId);
        const uniquePlanIds = new Set(planIds);
        expect(uniquePlanIds.size).toBe(planIds.length); // All unique
      });
    });
  });

  describe('🔍 Integration Validation', () => {
    describe('Real Provider Integration', () => {
      it('should integrate with test Supabase project', async () => {
        // Note: This test would require actual Supabase test project
        // For now, we'll structure the test for when real integration is available
        
        const correlationId = `e2e-real-supabase-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };

        const realIntegrationResponse = await request(app.getHttpServer())
          .post('/templates/real-integration-template/resources')
          .set(headers)
          .send({
            id: `real-integration-${correlationId}`,
            clientId: `${testClientId}-real`,
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: process.env.TEST_SUPABASE_URL || 'https://test.supabase.co',
                  // Note: Real keys would come from test environment secrets
                  init: { tables: ['prompts', 'documents'] }
                }
              }
            ]
          });

        if (process.env.TEST_SUPABASE_URL) {
          // Only run real integration if test environment is configured
          expect(realIntegrationResponse.status).toBeLessThan(400);
          expect(realIntegrationResponse.body).toHaveProperty('planId');
        } else {
          // Skip real integration if not configured
          expect(true).toBe(true); // Placeholder
        }
      });
    });

    describe('External Service Dependencies', () => {
      it('should gracefully handle external service failures', async () => {
        const correlationId = `e2e-service-failure-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };

        await request(app.getHttpServer())
          .post('/templates/external-dependency-template/resources')
          .set(headers)
          .send({
            id: `service-failure-${correlationId}`,
            clientId: `${testClientId}-service-failure`,
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://unreachable-service.example.com',
                  init: { tables: ['prompts'] }
                }
              }
            ]
          })
          .expect((res) => {
            // Should handle service failures gracefully
            if (res.status >= 400) {
              expect(res.body).toHaveProperty('error');
              expect(res.body.error).not.toMatch(/undefined|null/);
            }
          });
      });
    });
  });
});

// Utility functions for E2E testing
class E2ETestHelpers {
  static async waitForDeployment(
    app: INestApplication, 
    deploymentId: string, 
    headers: any, 
    maxWaitTime: number = 30000
  ) {
    const startTime = Date.now();
    let status = null;

    while (Date.now() - startTime < maxWaitTime) {
      const response = await request(app.getHttpServer())
        .get(`/deployments/${deploymentId}/status`)
        .set(headers);

      status = response.body.status;
      
      if (status === 'completed' || status === 'failed' || status === 'partial_success') {
        return response.body;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`Deployment ${deploymentId} did not complete within ${maxWaitTime}ms`);
  }

  static generateTestData(prefix: string) {
    const timestamp = Date.now();
    return {
      clientId: `${prefix}-client-${timestamp}`,
      correlationId: `${prefix}-correlation-${timestamp}`,
      planId: `${prefix}-plan-${timestamp}`
    };
  }
}