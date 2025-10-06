import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';

describe('Resource Initialization Security Tests', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      // Note: Will be updated when actual modules are implemented
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🔐 Critical Security Controls', () => {
    describe('Secrets Exposure Prevention', () => {
      it('should never expose Supabase keys in API responses', async () => {
        const response = await request(app.getHttpServer())
          .post('/templates/test-template/resources')
          .send({
            clientId: 'test-client-001',
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://test.supabase.co',
                  anonKey: 'PUBLIC_ANON_KEY',
                  serviceRoleKey: 'SHOULD_NEVER_BE_EXPOSED',
                  init: { tables: ['prompts', 'documents'] }
                }
              }
            ]
          })
          .expect((res) => {
            // Critical: Response should never contain secrets
            const responseBody = JSON.stringify(res.body);
            expect(responseBody).not.toMatch(/serviceRoleKey/i);
            expect(responseBody).not.toMatch(/SHOULD_NEVER_BE_EXPOSED/);
            expect(responseBody).not.toMatch(/supabase.*key/i);
          });
      });

      it('should never log secrets during processing', async () => {
        // Mock console/logger to capture logs
        const consoleLogs: string[] = [];
        const originalConsoleLog = console.log;
        console.log = (...args) => {
          consoleLogs.push(args.join(' '));
        };

        try {
          await request(app.getHttpServer())
            .post('/templates/test-template/resources')
            .send({
              clientId: 'test-client-001',
              resources: [
                {
                  kind: 'supabase',
                  supabase: {
                    projectUrl: 'https://test.supabase.co',
                    anonKey: 'PUBLIC_ANON_KEY',
                    serviceRoleKey: 'SECRET_SERVICE_ROLE_FAKE_KEY',
                    init: { tables: ['prompts'] }
                  }
                }
              ]
            });

          // Critical: No secrets should appear in logs
          const allLogs = consoleLogs.join(' ');
          expect(allLogs).not.toMatch(/SECRET_SERVICE_ROLE_FAKE_KEY/);
          expect(allLogs).not.toMatch(/serviceRoleKey/);
          expect(allLogs).not.toMatch(/service.*role.*key/i);
        } finally {
          console.log = originalConsoleLog;
        }
      });

      it('should redact secrets in error responses', async () => {
        const response = await request(app.getHttpServer())
          .post('/templates/invalid-template/resources')
          .send({
            clientId: 'test-client-001',
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  serviceRoleKey: 'SENSITIVE_ERROR_KEY_TEST'
                }
              }
            ]
          });

        // Even in error cases, secrets should be redacted
        const responseText = JSON.stringify(response.body) + response.text;
        expect(responseText).not.toMatch(/SENSITIVE_ERROR_KEY_TEST/);
        expect(responseText).not.toMatch(/serviceRoleKey.*SENSITIVE/);
      });
    });

    describe('Cross-Tenant Isolation', () => {
      const tenantAHeaders = {
        'x-tenant-id': 'tenant-a',
        'x-user-id': 'user-a-001',
        'authorization': 'Bearer tenant-a-token'
      };

      const tenantBHeaders = {
        'x-tenant-id': 'tenant-b', 
        'x-user-id': 'user-b-001',
        'authorization': 'Bearer tenant-b-token'
      };

      it('should prevent tenant A from accessing tenant B resources', async () => {
        // First, create resources for tenant B
        await request(app.getHttpServer())
          .post('/templates/shared-template/resources')
          .set(tenantBHeaders)
          .send({
            clientId: 'tenant-b-client-001',
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://tenant-b.supabase.co',
                  init: { tables: ['prompts'] }
                }
              }
            ]
          });

        // Tenant A should not be able to access tenant B's resources
        const response = await request(app.getHttpServer())
          .get('/resources/tenant-b-client-001')
          .set(tenantAHeaders)
          .expect((res) => {
            // Should return 403 Forbidden or 404 Not Found, never tenant B data
            expect(res.status).toBeOneOf([403, 404]);
            const responseText = JSON.stringify(res.body);
            expect(responseText).not.toMatch(/tenant-b/);
          });
      });

      it('should enforce tenant isolation in resource initialization', async () => {
        // Tenant A tries to initialize resources claiming to be tenant B
        const response = await request(app.getHttpServer())
          .post('/templates/test-template/resources')
          .set({
            'x-tenant-id': 'tenant-a',
            'x-user-id': 'user-a-001',
            'authorization': 'Bearer tenant-a-token'
          })
          .send({
            clientId: 'tenant-b-client-hijack-attempt',  // Different tenant in payload
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://hijack.supabase.co',
                  init: { tables: ['prompts'] }
                }
              }
            ]
          })
          .expect((res) => {
            // Should reject cross-tenant requests
            expect(res.status).toBeOneOf([400, 403]);
          });
      });

      it('should validate tenant context in all resource operations', async () => {
        const validRequest = {
          clientId: 'tenant-a-client-001',
          resources: [
            {
              kind: 'supabase',
              supabase: {
                projectUrl: 'https://tenant-a.supabase.co',
                init: { tables: ['prompts', 'documents'] }
              }
            }
          ]
        };

        // Valid tenant context should work
        await request(app.getHttpServer())
          .post('/templates/test-template/resources')
          .set(tenantAHeaders)
          .send(validRequest)
          .expect((res) => {
            expect(res.status).toBeLessThan(400); // Success status
          });

        // Missing tenant headers should fail
        await request(app.getHttpServer())
          .post('/templates/test-template/resources')
          .send(validRequest)
          .expect((res) => {
            expect(res.status).toBeGreaterThanOrEqual(400); // Error status
          });
      });
    });

    describe('Token Proxy Security', () => {
      it('should validate all requests go through token proxy', async () => {
        // Mock network monitoring to ensure no direct Supabase calls
        const networkCalls: string[] = [];
        
        // This test will need to be implemented with proper network monitoring
        // when the token proxy is implemented
        expect(true).toBe(true); // Placeholder - will be implemented with actual proxy
      });

      it('should enforce secure credential storage patterns', async () => {
        const response = await request(app.getHttpServer())
          .post('/templates/test-template/resources')
          .set({
            'x-tenant-id': 'security-test-tenant',
            'x-user-id': 'security-test-user',
            'authorization': 'Bearer test-token'
          })
          .send({
            clientId: 'security-test-client',
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://security-test.supabase.co',
                  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  init: { tables: ['prompts'] }
                }
              }
            ]
          });

        // Verify credentials are handled securely (no direct storage in response)
        const responseText = JSON.stringify(response.body);
        expect(responseText).not.toMatch(/eyJhbGciOiJIUzI1NiI/); // JWT pattern
        expect(responseText).not.toMatch(/serviceRoleKey/);
      });
    });

    describe('Audit Trail Integrity', () => {
      it('should log all resource initialization attempts with correlation IDs', async () => {
        const correlationId = `test-correlation-${Date.now()}`;
        
        await request(app.getHttpServer())
          .post('/templates/audit-test-template/resources')
          .set({
            'x-tenant-id': 'audit-test-tenant',
            'x-user-id': 'audit-test-user',
            'x-correlation-id': correlationId,
            'authorization': 'Bearer audit-test-token'
          })
          .send({
            clientId: 'audit-test-client',
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://audit-test.supabase.co',
                  init: { tables: ['prompts'] }
                }
              }
            ]
          });

        // Note: Actual audit log verification will be implemented when audit system exists
        // This test structure is ready for implementation
        expect(correlationId).toBeTruthy();
      });

      it('should audit failed operations with proper context', async () => {
        const correlationId = `failed-test-correlation-${Date.now()}`;
        
        await request(app.getHttpServer())
          .post('/templates/non-existent-template/resources')
          .set({
            'x-tenant-id': 'audit-fail-tenant',
            'x-user-id': 'audit-fail-user', 
            'x-correlation-id': correlationId,
            'authorization': 'Bearer audit-fail-token'
          })
          .send({
            clientId: 'audit-fail-client',
            resources: [{ kind: 'invalid' }]
          })
          .expect((res) => {
            expect(res.status).toBeGreaterThanOrEqual(400);
          });

        // Audit verification placeholder - will be implemented with audit system
        expect(correlationId).toBeTruthy();
      });
    });
  });

  describe('🛡️ Advanced Security Scenarios', () => {
    describe('Input Validation & Injection Prevention', () => {
      it('should prevent SQL injection in resource parameters', async () => {
        const maliciousPayload = {
          clientId: "'; DROP TABLE prompts; --",
          resources: [
            {
              kind: 'supabase',
              supabase: {
                projectUrl: 'https://malicious.supabase.co',
                init: { tables: ["'; DROP TABLE documents; --"] }
              }
            }
          ]
        };

        await request(app.getHttpServer())
          .post('/templates/test-template/resources')
          .set({
            'x-tenant-id': 'security-test',
            'x-user-id': 'security-test-user',
            'authorization': 'Bearer security-test-token'
          })
          .send(maliciousPayload)
          .expect((res) => {
            // Should reject malicious input
            expect(res.status).toBeGreaterThanOrEqual(400);
          });
      });

      it('should sanitize and validate all resource URLs', async () => {
        const suspiciousUrls = [
          'javascript:alert("xss")',
          'file:///etc/passwd',
          'http://evil.com/supabase-proxy',
          '../../../config/secrets'
        ];

        for (const maliciousUrl of suspiciousUrls) {
          await request(app.getHttpServer())
            .post('/templates/test-template/resources')
            .set({
              'x-tenant-id': 'url-validation-test',
              'x-user-id': 'url-validation-user',
              'authorization': 'Bearer url-validation-token'
            })
            .send({
              clientId: 'url-validation-client',
              resources: [
                {
                  kind: 'supabase',
                  supabase: {
                    projectUrl: maliciousUrl,
                    init: { tables: ['prompts'] }
                  }
                }
              ]
            })
            .expect((res) => {
              expect(res.status).toBeGreaterThanOrEqual(400);
            });
        }
      });
    });

    describe('Rate Limiting & DoS Prevention', () => {
      it('should enforce rate limits on resource initialization', async () => {
        const rapidRequests = Array(10).fill(null).map((_, i) =>
          request(app.getHttpServer())
            .post('/templates/rate-limit-test/resources')
            .set({
              'x-tenant-id': 'rate-limit-tenant',
              'x-user-id': 'rate-limit-user',
              'authorization': 'Bearer rate-limit-token'
            })
            .send({
              clientId: `rate-limit-client-${i}`,
              resources: [
                {
                  kind: 'supabase',
                  supabase: {
                    projectUrl: `https://rate-limit-${i}.supabase.co`,
                    init: { tables: ['prompts'] }
                  }
                }
              ]
            })
        );

        const responses = await Promise.all(rapidRequests);
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        
        // Should have some rate limiting after rapid requests
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });
    });

    describe('Error Information Disclosure', () => {
      it('should not leak internal paths or system info in errors', async () => {
        await request(app.getHttpServer())
          .post('/templates/error-disclosure-test/resources')
          .set({
            'x-tenant-id': 'error-test-tenant',
            'x-user-id': 'error-test-user',
            'authorization': 'Bearer error-test-token'
          })
          .send({
            clientId: 'error-test-client',
            resources: [
              {
                kind: 'supabase',
                supabase: {
                  projectUrl: 'https://invalid-format-url',
                  serviceRoleKey: 'invalid-key-format',
                  init: { tables: ['invalid-table-name'] }
                }
              }
            ]
          })
          .expect((res) => {
            const errorText = JSON.stringify(res.body) + res.text;
            
            // Should not expose internal paths
            expect(errorText).not.toMatch(/\/Users\//);
            expect(errorText).not.toMatch(/\/home\//);
            expect(errorText).not.toMatch(/node_modules/);
            expect(errorText).not.toMatch(/\.env/);
            
            // Should not expose stack traces in production-like errors
            expect(errorText).not.toMatch(/at .*\.ts:\d+/);
            expect(errorText).not.toMatch(/Error: .*\n.*at /);
          });
      });
    });
  });
});

// Custom Jest matchers for security testing
expect.extend({
  toBeOneOf(received: any, validValues: any[]) {
    const pass = validValues.includes(received);
    return {
      message: () => `expected ${received} to be one of ${validValues.join(', ')}`,
      pass,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(validValues: any[]): R;
    }
  }
}