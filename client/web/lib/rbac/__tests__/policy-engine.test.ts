import { RBACPolicyEngine } from '../policy-engine';

describe('RBAC Policy Engine', () => {
  let engine: RBACPolicyEngine;

  beforeAll(async () => {
    engine = new RBACPolicyEngine();
    await engine.initialize();
  });

  describe('policy checks', () => {
    it('should allow admin to write flows', async () => {
      const request = {
        subject: {
          id: 'alice@example.com',
          tenant: 'tenant1',
          roles: ['admin'],
          groups: [],
          scopes: []
        },
        resource: {
          type: 'flow',
          id: 'flow123'
        },
        action: 'write'
      };

      const response = await engine.check(request, 'test-correlation-id');

      expect(response.decision).toBe('allow');
      expect(response.reason).toBe('Policy matched');
    });

    it('should allow flow_manager to write flows', async () => {
      const request = {
        subject: {
          id: 'bob@example.com',
          tenant: 'tenant1',
          roles: ['flow_manager'],
          groups: [],
          scopes: []
        },
        resource: {
          type: 'flow',
          id: 'flow123'
        },
        action: 'write'
      };

      const response = await engine.check(request, 'test-correlation-id');

      expect(response.decision).toBe('allow');
    });

    it('should deny user from writing flows', async () => {
      const request = {
        subject: {
          id: 'dave@example.com',
          tenant: 'tenant1',
          roles: ['user'],
          groups: [],
          scopes: []
        },
        resource: {
          type: 'flow',
          id: 'flow123'
        },
        action: 'write'
      };

      const response = await engine.check(request, 'test-correlation-id');

      expect(response.decision).toBe('deny');
      expect(response.reason).toBe('Policy denied');
    });

    it('should allow admin to mint IAM tokens', async () => {
      const request = {
        subject: {
          id: 'alice@example.com',
          tenant: 'tenant1',
          roles: ['admin'],
          groups: [],
          scopes: []
        },
        resource: {
          type: 'iam_token',
          id: 'token123'
        },
        action: 'mint'
      };

      const response = await engine.check(request, 'test-correlation-id');

      expect(response.decision).toBe('allow');
    });

    it('should deny non-admin from minting IAM tokens', async () => {
      const request = {
        subject: {
          id: 'bob@example.com',
          tenant: 'tenant1',
          roles: ['flow_manager'],
          groups: [],
          scopes: []
        },
        resource: {
          type: 'iam_token',
          id: 'token123'
        },
        action: 'mint'
      };

      const response = await engine.check(request, 'test-correlation-id');

      expect(response.decision).toBe('deny');
    });

    it('should allow billing_admin to write payments', async () => {
      const request = {
        subject: {
          id: 'charlie@example.com',
          tenant: 'tenant1',
          roles: ['billing_admin'],
          groups: [],
          scopes: []
        },
        resource: {
          type: 'payment',
          id: 'payment123'
        },
        action: 'write'
      };

      const response = await engine.check(request, 'test-correlation-id');

      expect(response.decision).toBe('allow');
    });

    it('should deny non-billing_admin from writing payments', async () => {
      const request = {
        subject: {
          id: 'dave@example.com',
          tenant: 'tenant1',
          roles: ['user'],
          groups: [],
          scopes: []
        },
        resource: {
          type: 'payment',
          id: 'payment123'
        },
        action: 'write'
      };

      const response = await engine.check(request, 'test-correlation-id');

      expect(response.decision).toBe('deny');
    });

    it('should deny by default for unknown resource', async () => {
      const request = {
        subject: {
          id: 'alice@example.com',
          tenant: 'tenant1',
          roles: ['admin'],
          groups: [],
          scopes: []
        },
        resource: {
          type: 'unknown_resource',
          id: 'resource123'
        },
        action: 'read'
      };

      const response = await engine.check(request, 'test-correlation-id');

      expect(response.decision).toBe('deny');
    });
  });

  describe('role management', () => {
    it('should get roles for user', async () => {
      const roles = await engine.getRolesForUser('alice@example.com');
      expect(roles).toContain('admin');
    });

    it('should add role for user', async () => {
      const added = await engine.addRoleForUser('test@example.com', 'user');
      expect(added).toBe(true);

      const roles = await engine.getRolesForUser('test@example.com');
      expect(roles).toContain('user');
    });

    it('should add policy', async () => {
      const added = await engine.addPolicy('test_role', 'test_resource', 'test_action');
      expect(added).toBe(true);
    });
  });
});