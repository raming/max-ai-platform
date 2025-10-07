/// <reference types="jest" />

// Mock next/server to avoid importing Next.js runtime in tests
jest.mock('next/server', () => {
  return {
    NextResponse: {
      next: jest.fn(() => ({ headers: { set: jest.fn() } })),
      json: jest.fn((payload: any, opts?: any) => ({ status: opts?.status ?? 200, payload }))
    }
  };
});

// Mock OIDCVerifier to control verifyToken behavior
jest.mock('../oidc-verifier', () => ({
  OIDCVerifier: jest.fn().mockImplementation(() => ({ verifyToken: jest.fn() }))
}));

const { OIDCVerifier } = require('../oidc-verifier');
const { AuthMiddleware } = require('../middleware');

describe('withAuth HOF', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const protectedFn = AuthMiddleware.withAuth(async (req: any, { subject }: any) => {
      return { status: 200 };
    });

    const req: any = {
      headers: {
        get: () => null
      },
      nextUrl: { pathname: '/api/protected' },
      method: 'GET'
    };

    const res = await protectedFn(req);

  // Handler should return 401-like object
  expect((res as any).status).toBe(401);
  });

  it('invokes handler when token is valid', async () => {
    // Arrange: mock verifier to return success
    const mockVerify = jest.fn().mockResolvedValue({ success: true, subject: { id: 'u1', tenantId: 't1', roles: [], groups: [], scopes: [], isServiceAccount: false, metadata: {} } });
    OIDCVerifier.mockImplementation(() => ({ verifyToken: mockVerify }));

  const handler = jest.fn(async (req: any, ctx: any) => ({ status: 200, payload: { ok: true, subjectId: ctx.subject.id } }));
    const protectedFn = AuthMiddleware.withAuth(handler);

    const req: any = {
      headers: {
        get: (name: string) => (name === 'authorization' ? 'Bearer faketoken' : null)
      },
      nextUrl: { pathname: '/api/protected' },
      method: 'GET'
    };

    const res = await protectedFn(req);

    expect(mockVerify).toHaveBeenCalled();
    // Handler should have been called and returned NextResponse
    expect(handler).toHaveBeenCalled();
    expect((res as any).status).toBe(200);
  });
});
