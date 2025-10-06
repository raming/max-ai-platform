import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { performance } from 'perf_hooks';
import { ConfigModule } from '@nestjs/config';

describe('Resource Initialization Performance Tests', () => {
  let app: INestApplication;
  let module: TestingModule;

  // Performance test configuration
  const SLA_TARGET = 5000; // 5 seconds per ResourceInitializationPlan
  const CONCURRENT_LOAD_TARGET = 10; // Number of concurrent requests to handle
  const STRESS_TEST_DURATION = 30000; // 30 seconds stress test
  
  const testTenantHeaders = {
    'x-tenant-id': 'perf-test-tenant',
    'x-user-id': 'perf-test-user',
    'authorization': 'Bearer perf-test-token'
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

  describe('🚀 SLA Compliance Tests', () => {
    describe('Resource Initialization Response Time', () => {
      it('should complete single resource initialization within 5 second SLA', async () => {
        const correlationId = `perf-single-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };
        
        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .post('/templates/performance-template/resources')
          .set(headers)
          .send({
            id: `single-resource-plan-${correlationId}`,
            clientId: 'single-perf-client',
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://single-perf.supabase.co',
                  anonKey: 'single-perf-anon',
                  serviceRoleKey: 'single-perf-service',
                  init: { tables: ['prompts'] }
                }
              }
            ]
          });

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(SLA_TARGET);
        expect(response.status).toBeLessThan(400);
        
        // Response should include timing information
        expect(response.headers).toHaveProperty('x-processing-time');
        
        console.log(`Single resource initialization took ${duration.toFixed(2)}ms`);
      });

      it('should complete multi-resource initialization within SLA', async () => {
        const correlationId = `perf-multi-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };
        
        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .post('/templates/multi-resource-template/resources')
          .set(headers)
          .send({
            id: `multi-resource-plan-${correlationId}`,
            clientId: 'multi-perf-client',
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://multi-perf-1.supabase.co',
                  anonKey: 'multi-perf-anon-1',
                  serviceRoleKey: 'multi-perf-service-1',
                  init: { tables: ['prompts'] }
                }
              },
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://multi-perf-2.supabase.co',
                  anonKey: 'multi-perf-anon-2',
                  serviceRoleKey: 'multi-perf-service-2',
                  init: { tables: ['documents'] }
                }
              },
              {
                kind: 'storage',
                options: {
                  provider: 'aws-s3',
                  bucket: 'multi-perf-storage'
                }
              }
            ]
          });

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(SLA_TARGET);
        expect(response.status).toBeLessThan(400);
        
        console.log(`Multi-resource initialization took ${duration.toFixed(2)}ms`);
      });

      it('should maintain performance with complex resource plans', async () => {
        const correlationId = `perf-complex-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };
        
        // Create a complex plan with many resources
        const complexResources = Array(5).fill(null).map((_, i) => ({
          kind: 'supabase' as const,
          supabase: {
            projectUrl: `https://complex-perf-${i}.supabase.co`,
            anonKey: `complex-anon-${i}`,
            serviceRoleKey: `complex-service-${i}`,
            init: { tables: ['prompts', 'documents'] }
          }
        }));

        const startTime = performance.now();

        const response = await request(app.getHttpServer())
          .post('/templates/complex-template/resources')
          .set(headers)
          .send({
            id: `complex-plan-${correlationId}`,
            clientId: 'complex-perf-client',
            resources: complexResources
          });

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(SLA_TARGET * 1.5); // Allow some overhead for complex plans
        expect(response.status).toBeLessThan(400);
        
        console.log(`Complex resource plan (5 resources) took ${duration.toFixed(2)}ms`);
      });
    });

    describe('Deployment Performance', () => {
      it('should complete full deployment cycle within performance targets', async () => {
        const correlationId = `perf-deployment-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };
        
        // Step 1: Create resource plan
        const planStartTime = performance.now();
        
        const planResponse = await request(app.getHttpServer())
          .post('/templates/deployment-perf-template/resources')
          .set(headers)
          .send({
            id: `deployment-perf-plan-${correlationId}`,
            clientId: 'deployment-perf-client',
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://deployment-perf.supabase.co',
                  anonKey: 'deployment-perf-anon',
                  serviceRoleKey: 'deployment-perf-service',
                  init: { tables: ['prompts', 'documents'] }
                }
              }
            ]
          });

        const planEndTime = performance.now();
        const planDuration = planEndTime - planStartTime;
        
        expect(planResponse.status).toBeLessThan(400);
        const planId = planResponse.body.planId;
        
        // Step 2: Deploy the plan
        const deployStartTime = performance.now();
        
        const deployResponse = await request(app.getHttpServer())
          .post('/templates/deployment-perf-template/deploy')
          .set(headers)
          .send({
            planId: planId,
            clientId: 'deployment-perf-client'
          });

        const deployEndTime = performance.now();
        const deployDuration = deployEndTime - deployStartTime;
        
        expect(deployResponse.status).toBeLessThan(400);
        
        const totalDuration = planDuration + deployDuration;
        
        // Total deployment cycle should complete within reasonable time
        expect(totalDuration).toBeLessThan(SLA_TARGET * 2); // 10 seconds total
        
        console.log(`Plan creation: ${planDuration.toFixed(2)}ms, Deployment: ${deployDuration.toFixed(2)}ms, Total: ${totalDuration.toFixed(2)}ms`);
      });
    });
  });

  describe('🔥 Load Testing', () => {
    describe('Concurrent Request Handling', () => {
      it('should handle multiple concurrent resource initialization requests', async () => {
        const baseCorrelationId = `load-concurrent-${Date.now()}`;
        const concurrentCount = CONCURRENT_LOAD_TARGET;
        
        const concurrentRequests = Array(concurrentCount).fill(null).map((_, i) => {
          const headers = { 
            ...testTenantHeaders, 
            'x-correlation-id': `${baseCorrelationId}-${i}` 
          };
          
          return request(app.getHttpServer())
            .post('/templates/concurrent-load-template/resources')
            .set(headers)
            .send({
              id: `concurrent-plan-${baseCorrelationId}-${i}`,
              clientId: `concurrent-client-${i}`,
              resources: [
                {
                  kind: 'supabase',
                  supabase: {
                    projectUrl: `https://concurrent-${i}.supabase.co`,
                    anonKey: `concurrent-anon-${i}`,
                    serviceRoleKey: `concurrent-service-${i}`,
                    init: { tables: ['prompts'] }
                  }
                }
              ]
            });
        });

        const startTime = performance.now();
        const responses = await Promise.all(concurrentRequests);
        const endTime = performance.now();
        
        const totalDuration = endTime - startTime;
        const avgResponseTime = totalDuration / concurrentCount;

        // All requests should succeed
        responses.forEach((response, index) => {
          expect(response.status).toBeLessThan(400);
          expect(response.body).toHaveProperty('planId');
        });

        // Concurrent processing should not significantly degrade individual response times
        expect(avgResponseTime).toBeLessThan(SLA_TARGET);
        expect(totalDuration).toBeLessThan(SLA_TARGET * 2); // Total time shouldn't be much more than sequential

        // Verify all plan IDs are unique (no race conditions)
        const planIds = responses.map(r => r.body.planId);
        const uniquePlanIds = new Set(planIds);
        expect(uniquePlanIds.size).toBe(planIds.length);

        console.log(`${concurrentCount} concurrent requests completed in ${totalDuration.toFixed(2)}ms (avg: ${avgResponseTime.toFixed(2)}ms per request)`);
      });

      it('should handle burst traffic gracefully', async () => {
        const burstCorrelationId = `load-burst-${Date.now()}`;
        const burstSize = 20; // Larger burst
        
        const burstRequests = Array(burstSize).fill(null).map((_, i) => {
          const headers = { 
            ...testTenantHeaders, 
            'x-correlation-id': `${burstCorrelationId}-${i}` 
          };
          
          return {
            request: request(app.getHttpServer())
              .post('/templates/burst-load-template/resources')
              .set(headers)
              .send({
                id: `burst-plan-${burstCorrelationId}-${i}`,
                clientId: `burst-client-${i}`,
                resources: [
                  {
                    kind: 'supabase',
                    supabase: {
                      projectUrl: `https://burst-${i}.supabase.co`,
                      anonKey: `burst-anon-${i}`,
                      serviceRoleKey: `burst-service-${i}`,
                      init: { tables: ['prompts'] }
                    }
                  }
                ]
              }),
            startTime: performance.now()
          };
        });

        // Execute all requests
        const results = await Promise.allSettled(
          burstRequests.map(req => req.request)
        );

        // Analyze results
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.status < 400).length;
        const errorCount = results.length - successCount;
        const successRate = (successCount / results.length) * 100;

        // Should handle at least 80% of burst requests successfully
        expect(successRate).toBeGreaterThan(80);
        
        // Rate limiting should kick in for excessive requests
        if (errorCount > 0) {
          const rateLimitErrors = results.filter(r => 
            r.status === 'fulfilled' && r.value.status === 429
          ).length;
          
          // Some errors should be rate limiting (not system failures)
          expect(rateLimitErrors).toBeGreaterThan(0);
        }

        console.log(`Burst test: ${successCount}/${burstSize} requests succeeded (${successRate.toFixed(1)}%), ${errorCount} rate limited`);
      });
    });

    describe('Sustained Load Testing', () => {
      it('should maintain performance under sustained load', async () => {
        const testDuration = Math.min(STRESS_TEST_DURATION, 15000); // Cap at 15s for CI
        const requestInterval = 500; // 500ms between requests
        const expectedRequests = Math.floor(testDuration / requestInterval);
        
        const results: Array<{ duration: number; success: boolean; timestamp: number }> = [];
        const startTime = Date.now();
        
        let requestCount = 0;
        
        const sustainedTest = async (): Promise<void> => {
          while (Date.now() - startTime < testDuration) {
            const requestStart = performance.now();
            const correlationId = `sustained-${Date.now()}-${requestCount}`;
            
            try {
              const response = await request(app.getHttpServer())
                .post('/templates/sustained-load-template/resources')
                .set({
                  ...testTenantHeaders,
                  'x-correlation-id': correlationId
                })
                .send({
                  id: `sustained-plan-${correlationId}`,
                  clientId: `sustained-client-${requestCount}`,
                  resources: [
                    {
                      kind: 'supabase',
                      supabase: {
                        projectUrl: `https://sustained-${requestCount}.supabase.co`,
                        anonKey: `sustained-anon-${requestCount}`,
                        serviceRoleKey: `sustained-service-${requestCount}`,
                        init: { tables: ['prompts'] }
                      }
                    }
                  ]
                });
              
              const requestEnd = performance.now();
              const duration = requestEnd - requestStart;
              
              results.push({
                duration,
                success: response.status < 400,
                timestamp: Date.now() - startTime
              });
              
              requestCount++;
              
            } catch (error) {
              const requestEnd = performance.now();
              results.push({
                duration: requestEnd - requestStart,
                success: false,
                timestamp: Date.now() - startTime
              });
              requestCount++;
            }
            
            // Wait before next request
            await new Promise(resolve => setTimeout(resolve, requestInterval));
          }
        };

        await sustainedTest();

        // Analyze sustained load results
        const successfulRequests = results.filter(r => r.success);
        const successRate = (successfulRequests.length / results.length) * 100;
        
        const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.duration, 0) / successfulRequests.length;
        const maxResponseTime = Math.max(...successfulRequests.map(r => r.duration));
        const minResponseTime = Math.min(...successfulRequests.map(r => r.duration));
        
        // Performance should remain stable under sustained load
        expect(successRate).toBeGreaterThan(90); // 90% success rate
        expect(avgResponseTime).toBeLessThan(SLA_TARGET); // Average within SLA
        expect(maxResponseTime).toBeLessThan(SLA_TARGET * 2); // Max not too degraded
        
        console.log(`Sustained load test (${testDuration}ms):`);
        console.log(`- Requests: ${results.length}`);
        console.log(`- Success rate: ${successRate.toFixed(1)}%`);
        console.log(`- Avg response time: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`- Min/Max response time: ${minResponseTime.toFixed(2)}ms / ${maxResponseTime.toFixed(2)}ms`);
      }, 20000); // Longer timeout for sustained test
    });
  });

  describe('📊 Resource Usage Monitoring', () => {
    describe('Memory Usage', () => {
      it('should not have significant memory leaks during resource initialization', async () => {
        const initialMemory = process.memoryUsage();
        const iterationCount = 50;
        
        for (let i = 0; i < iterationCount; i++) {
          const correlationId = `memory-test-${Date.now()}-${i}`;
          
          await request(app.getHttpServer())
            .post('/templates/memory-test-template/resources')
            .set({
              ...testTenantHeaders,
              'x-correlation-id': correlationId
            })
            .send({
              id: `memory-plan-${correlationId}`,
              clientId: `memory-client-${i}`,
              resources: [
                {
                  kind: 'supabase',
                  supabase: {
                    projectUrl: `https://memory-test-${i}.supabase.co`,
                    anonKey: `memory-anon-${i}`,
                    serviceRoleKey: `memory-service-${i}`,
                    init: { tables: ['prompts'] }
                  }
                }
              ]
            });
          
          // Force garbage collection if available (for testing)
          if (global.gc) {
            global.gc();
          }
        }
        
        const finalMemory = process.memoryUsage();
        const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
        const memoryGrowthMB = memoryGrowth / (1024 * 1024);
        
        // Memory growth should be reasonable (less than 50MB for 50 requests)
        expect(memoryGrowthMB).toBeLessThan(50);
        
        console.log(`Memory usage after ${iterationCount} requests:`);
        console.log(`- Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        console.log(`- Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        console.log(`- Growth: ${memoryGrowthMB.toFixed(2)}MB`);
      });
    });

    describe('Database Connection Handling', () => {
      it('should efficiently manage database connections under load', async () => {
        const connectionTestCount = 20;
        const concurrentConnections = Array(connectionTestCount).fill(null).map((_, i) => 
          request(app.getHttpServer())
            .post('/templates/connection-test-template/resources')
            .set({
              ...testTenantHeaders,
              'x-correlation-id': `connection-test-${Date.now()}-${i}`
            })
            .send({
              id: `connection-plan-${Date.now()}-${i}`,
              clientId: `connection-client-${i}`,
              resources: [
                {
                  kind: 'supabase',
                  supabase: {
                    projectUrl: `https://connection-test-${i}.supabase.co`,
                    anonKey: `connection-anon-${i}`,
                    serviceRoleKey: `connection-service-${i}`,
                    init: { tables: ['prompts'] }
                  }
                }
              ]
            })
        );

        const startTime = performance.now();
        const responses = await Promise.all(concurrentConnections);
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        const successCount = responses.filter(r => r.status < 400).length;
        
        // All connections should be handled successfully
        expect(successCount).toBe(connectionTestCount);
        
        // Should handle connections efficiently (not linearly scaling with connection count)
        const avgTimePerConnection = duration / connectionTestCount;
        expect(avgTimePerConnection).toBeLessThan(SLA_TARGET / 2); // Efficient connection handling
        
        console.log(`${connectionTestCount} concurrent DB operations completed in ${duration.toFixed(2)}ms`);
        console.log(`Average time per operation: ${avgTimePerConnection.toFixed(2)}ms`);
      });
    });
  });

  describe('🎯 Performance Edge Cases', () => {
    describe('Large Payload Handling', () => {
      it('should handle large resource plans efficiently', async () => {
        const largeResourceCount = 25;
        const largeResources = Array(largeResourceCount).fill(null).map((_, i) => ({
          kind: 'supabase' as const,
          supabase: {
            projectUrl: `https://large-plan-${i}.supabase.co`,
            anonKey: `large-anon-key-${i}-${'x'.repeat(100)}`, // Larger payload
            serviceRoleKey: `large-service-key-${i}-${'y'.repeat(100)}`, // Larger payload
            init: { tables: ['prompts', 'documents'] }
          }
        }));
        
        const correlationId = `large-payload-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };
        
        const startTime = performance.now();
        
        const response = await request(app.getHttpServer())
          .post('/templates/large-payload-template/resources')
          .set(headers)
          .send({
            id: `large-payload-plan-${correlationId}`,
            clientId: 'large-payload-client',
            resources: largeResources
          });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(response.status).toBeLessThan(400);
        
        // Large payloads should still complete within reasonable time
        expect(duration).toBeLessThan(SLA_TARGET * 3); // Allow more time for large payloads
        
        console.log(`Large payload (${largeResourceCount} resources) processed in ${duration.toFixed(2)}ms`);
      });
    });

    describe('Network Resilience', () => {
      it('should handle slow network responses gracefully', async () => {
        const correlationId = `slow-network-${Date.now()}`;
        const headers = { ...testTenantHeaders, 'x-correlation-id': correlationId };
        
        const startTime = performance.now();
        
        const response = await request(app.getHttpServer())
          .post('/templates/slow-network-template/resources')
          .set(headers)
          .send({
            id: `slow-network-plan-${correlationId}`,
            clientId: 'slow-network-client',
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://slow-network-simulation.supabase.co',
                  anonKey: 'slow-network-anon',
                  serviceRoleKey: 'slow-network-service',
                  init: { tables: ['prompts'] }
                }
              }
            ]
          })
          .timeout(SLA_TARGET * 2); // Allow extra time for slow network simulation
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Should handle slow networks without complete failure
        if (response.status >= 400) {
          // If it fails, should be a timeout, not a system error
          expect([408, 504]).toContain(response.status); // Request timeout or gateway timeout
        } else {
          expect(response.body).toHaveProperty('planId');
        }
        
        console.log(`Slow network simulation took ${duration.toFixed(2)}ms with status ${response.status}`);
      });
    });
  });
});

// Performance test utilities
class PerformanceTestUtils {
  static calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
  
  static generatePerformanceReport(results: Array<{ duration: number; success: boolean }>) {
    const successful = results.filter(r => r.success);
    const durations = successful.map(r => r.duration);
    
    if (durations.length === 0) {
      return { message: 'No successful requests to analyze' };
    }
    
    return {
      totalRequests: results.length,
      successfulRequests: successful.length,
      successRate: (successful.length / results.length) * 100,
      avgResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      minResponseTime: Math.min(...durations),
      maxResponseTime: Math.max(...durations),
      p50ResponseTime: this.calculatePercentile(durations, 50),
      p95ResponseTime: this.calculatePercentile(durations, 95),
      p99ResponseTime: this.calculatePercentile(durations, 99)
    };
  }
}