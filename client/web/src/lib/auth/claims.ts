// Claim extraction utilities for JWT tokens

export interface TokenClaims {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  nbf?: number;
  jti?: string;
  tenant: string;
  scope?: string;
  roles?: string[];
  groups?: string[];
}

export interface ExtractedClaims {
  subject: {
    id: string;
    tenant: string;
    roles: string[];
    groups: string[];
    scopes: string[];
  };
}

/**
 * Extract and validate claims from a JWT token
 * @param token - JWT token string
 * @returns Extracted claims
 */
export function extractClaims(token: string): ExtractedClaims {
  // In production, this would verify the JWT signature and decode
  // For now, we'll decode the payload without verification (NOT SECURE - for development only)
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // Validate required claims
    if (!payload.sub || !payload.tenant) {
      throw new Error('Missing required claims: sub or tenant');
    }

    // Validate expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    // Validate not before
    if (payload.nbf && payload.nbf > Math.floor(Date.now() / 1000)) {
      throw new Error('Token not yet valid');
    }

    return {
      subject: {
        id: payload.sub,
        tenant: payload.tenant,
        roles: payload.roles || [],
        groups: payload.groups || [],
        scopes: payload.scope ? payload.scope.split(' ') : []
      }
    };
  } catch (error) {
    throw new Error(`Failed to extract claims: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract tenant ID from claims
 */
export function extractTenantId(claims: ExtractedClaims): string {
  return claims.subject.tenant;
}

/**
 * Extract client ID from claims (if present in context)
 */
export function extractClientId(claims: ExtractedClaims): string | null {
  // In a real implementation, this might come from a specific claim
  // For now, return null as it's not in the standard claims
  return null;
}

/**
 * Extract roles from claims
 */
export function extractRoles(claims: ExtractedClaims): string[] {
  return claims.subject.roles;
}

/**
 * Extract scopes from claims
 */
export function extractScopes(claims: ExtractedClaims): string[] {
  return claims.subject.scopes;
}

/**
 * Check if claims have a specific role
 */
export function hasRole(claims: ExtractedClaims, role: string): boolean {
  return claims.subject.roles.includes(role);
}

/**
 * Check if claims have a specific scope
 */
export function hasScope(claims: ExtractedClaims, scope: string): boolean {
  return claims.subject.scopes.includes(scope);
}