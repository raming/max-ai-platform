import { extractClaims, extractTenantId, extractRoles, extractScopes, hasRole, hasScope } from '../claims';

describe('Claim Extraction', () => {
  describe('extractClaims', () => {
    it('should extract valid claims from JWT', () => {
      // Create a mock JWT (header.payload.signature)
      const payload = {
        iss: 'https://keycloak.example.com',
        sub: 'user123',
        aud: 'client-id',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        tenant: 'tenant1',
        roles: ['admin', 'user'],
        groups: ['group1'],
        scope: 'read write'
      };

      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64');
      const token = `${header}.${payloadEncoded}.signature`;

      const claims = extractClaims(token);

      expect(claims.subject.id).toBe('user123');
      expect(claims.subject.tenant).toBe('tenant1');
      expect(claims.subject.roles).toEqual(['admin', 'user']);
      expect(claims.subject.groups).toEqual(['group1']);
      expect(claims.subject.scopes).toEqual(['read', 'write']);
    });

    it('should throw error for missing required claims', () => {
      const payload = {
        iss: 'https://keycloak.example.com',
        aud: 'client-id',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
        // Missing sub and tenant
      };

      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64');
      const token = `${header}.${payloadEncoded}.signature`;

      expect(() => extractClaims(token)).toThrow('Missing required claims');
    });

    it('should throw error for expired token', () => {
      const payload = {
        iss: 'https://keycloak.example.com',
        sub: 'user123',
        aud: 'client-id',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired
        iat: Math.floor(Date.now() / 1000) - 7200,
        tenant: 'tenant1'
      };

      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64');
      const token = `${header}.${payloadEncoded}.signature`;

      expect(() => extractClaims(token)).toThrow('Token expired');
    });

    it('should throw error for invalid JWT format', () => {
      expect(() => extractClaims('invalid.token')).toThrow('Invalid JWT format');
    });
  });

  describe('extractTenantId', () => {
    it('should extract tenant ID from claims', () => {
      const claims = {
        subject: {
          id: 'user123',
          tenant: 'tenant1',
          roles: [],
          groups: [],
          scopes: []
        }
      };

      expect(extractTenantId(claims)).toBe('tenant1');
    });
  });

  describe('extractRoles', () => {
    it('should extract roles from claims', () => {
      const claims = {
        subject: {
          id: 'user123',
          tenant: 'tenant1',
          roles: ['admin', 'user'],
          groups: [],
          scopes: []
        }
      };

      expect(extractRoles(claims)).toEqual(['admin', 'user']);
    });
  });

  describe('extractScopes', () => {
    it('should extract scopes from claims', () => {
      const claims = {
        subject: {
          id: 'user123',
          tenant: 'tenant1',
          roles: [],
          groups: [],
          scopes: ['read', 'write']
        }
      };

      expect(extractScopes(claims)).toEqual(['read', 'write']);
    });
  });

  describe('hasRole', () => {
    it('should return true if role exists', () => {
      const claims = {
        subject: {
          id: 'user123',
          tenant: 'tenant1',
          roles: ['admin', 'user'],
          groups: [],
          scopes: []
        }
      };

      expect(hasRole(claims, 'admin')).toBe(true);
    });

    it('should return false if role does not exist', () => {
      const claims = {
        subject: {
          id: 'user123',
          tenant: 'tenant1',
          roles: ['user'],
          groups: [],
          scopes: []
        }
      };

      expect(hasRole(claims, 'admin')).toBe(false);
    });
  });

  describe('hasScope', () => {
    it('should return true if scope exists', () => {
      const claims = {
        subject: {
          id: 'user123',
          tenant: 'tenant1',
          roles: [],
          groups: [],
          scopes: ['read', 'write']
        }
      };

      expect(hasScope(claims, 'read')).toBe(true);
    });

    it('should return false if scope does not exist', () => {
      const claims = {
        subject: {
          id: 'user123',
          tenant: 'tenant1',
          roles: [],
          groups: [],
          scopes: ['read']
        }
      };

      expect(hasScope(claims, 'write')).toBe(false);
    });
  });
});