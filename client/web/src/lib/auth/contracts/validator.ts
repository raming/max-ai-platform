/**
 * Minimal shim for contract validator used in auth package.
 *
 * In full implementation this would perform JSON Schema validation against
 * the Keycloak token claims contract. Here we provide a lightweight
 * runtime validator and type for local type-checking and tests.
 */
export interface KeycloakTokenClaims {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  tenant?: string;
  scope?: string;
  roles?: string[];
  [key: string]: any;
}

export function validateTokenClaimsRuntime(payload: unknown): asserts payload is KeycloakTokenClaims {
  // Lightweight runtime checks used for tests and local type-safety.
  if (!payload || typeof payload !== 'object') {
    throw new Error('Token payload must be an object');
  }

  const p = payload as Record<string, any>;
  const required = ['iss', 'sub', 'aud', 'exp', 'iat'];
  for (const r of required) {
    if (!(r in p)) throw new Error(`Missing required claim: ${r}`);
  }
}
