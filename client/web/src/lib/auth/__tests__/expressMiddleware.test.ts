import { AuthMiddleware } from '../middleware';
import { OIDCVerifier } from '../oidc-verifier';

// Minimal express mock helpers
function mockReq(headers: Record<string, any> = {}) {
  return {
    headers,
    path: '/api/protected',
    method: 'GET',
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' }
  } as any;
}

function mockRes() {
  const headers: Record<string, any> = {};
  return {
    setHeader: (k: string, v: any) => { headers[k] = v; },
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: any) { this.payload = payload; return this; },
    headers
  } as any;
}

describe('expressMiddleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when missing token', async () => {
    const mockVerify = jest.fn();
    (OIDCVerifier as any) = jest.fn().mockImplementation(() => ({ verifyToken: mockVerify }));

    const middleware = new AuthMiddleware(new OIDCVerifier({ keycloakBaseUrl: 'https://auth' as any, audience: 'a' as any, clockTolerance: 60, cacheTtl: 3600, enableLogging: true, requiredClaims: [] } as any));

    const req = mockReq({});
    const res = mockRes();

    const fn = middleware.expressMiddleware();
    await fn(req, res, () => {});

    expect(res.statusCode).toBe(401);
    expect(res.payload).toHaveProperty('error');
  });

  it('calls next on valid token', async () => {
    const mockVerify = jest.fn().mockResolvedValue({ success: true, subject: { id: 'u1', tenantId: 't1', roles: [], groups: [], scopes: [], isServiceAccount: false, metadata: {} } });
    (OIDCVerifier as any) = jest.fn().mockImplementation(() => ({ verifyToken: mockVerify }));

    const middleware = new AuthMiddleware(new OIDCVerifier({ keycloakBaseUrl: 'https://auth' as any, audience: 'a' as any, clockTolerance: 60, cacheTtl: 3600, enableLogging: true, requiredClaims: [] } as any));

    const req = mockReq({ authorization: 'Bearer faketoken' });
    const res = mockRes();

    const next = jest.fn();
    const fn = middleware.expressMiddleware();
    await fn(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.subject).toBeDefined();
    expect(res.headers['x-subject-id']).toBe('u1');
  });
});
