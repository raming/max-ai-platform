/**
 * Authentication types for OIDC middleware
 * Based on IAM foundation spec from #54
 */

// Token claims interface (extends the contract validation schema)
export interface TokenClaims {
  iss: string;                    // Issuer (Keycloak base URL)
  sub: string;                    // Subject (user ID)
  aud: string | string[];         // Audience
  exp: number;                    // Expiry timestamp
  iat: number;                    // Issued at timestamp
  nbf?: number;                   // Not before timestamp
  jti?: string;                   // JWT ID
  tenant: string;                 // Tenant/realm identifier
  scope?: string;                 // Scopes (space-separated)
  roles?: string[];               // User roles within tenant
  groups?: string[];              // User groups within tenant
  [key: string]: any;             // Additional claims
}

// Subject context injected into request
export interface SubjectContext {
  id: string;                     // User ID (sub claim)
  tenantId: string;               // Tenant ID
  email?: string;                 // User email if available
  displayName?: string;           // Display name if available
  roles: string[];                // User roles
  groups: string[];               // User groups  
  scopes: string[];               // Parsed scopes
  isServiceAccount: boolean;      // Whether this is a service account token
  metadata?: Record<string, any>; // Additional metadata
}

// OIDC discovery document
export interface OIDCDiscovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  userinfo_endpoint: string;
  id_token_signing_alg_values_supported: string[];
  subject_types_supported: string[];
  response_types_supported: string[];
  claims_supported?: string[];
}

// JWKS response structure
export interface JWKS {
  keys: JWK[];
}

export interface JWK {
  kty: string;                    // Key type
  alg?: string;                   // Algorithm
  use?: string;                   // Key use
  kid?: string;                   // Key ID
  n?: string;                     // RSA modulus
  e?: string;                     // RSA exponent
  x5c?: string[];                 // X.509 certificate chain
  x5t?: string;                   // X.509 thumbprint
}

// Authentication configuration
export interface AuthConfig {
  keycloakBaseUrl: string;        // Keycloak base URL for discovery
  realm?: string;                 // Keycloak realm (optional, can be in token)
  audience: string | string[];    // Expected audience(s)
  clockTolerance: number;         // Clock skew tolerance in seconds (default: 60)
  cacheTtl: number;               // JWKS cache TTL in seconds (default: 3600)
  enableLogging: boolean;         // Enable detailed auth logging
  requiredClaims: string[];       // Additional required claims beyond standard
}

// Authentication result
export interface AuthResult {
  success: boolean;
  subject?: SubjectContext;
  error?: AuthError;
}

// Authentication errors
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: any;
}

export enum AuthErrorCode {
  MISSING_TOKEN = 'MISSING_TOKEN',
  INVALID_TOKEN_FORMAT = 'INVALID_TOKEN_FORMAT',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_NOT_YET_VALID = 'TOKEN_NOT_YET_VALID',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  INVALID_ISSUER = 'INVALID_ISSUER',
  INVALID_AUDIENCE = 'INVALID_AUDIENCE',
  MISSING_REQUIRED_CLAIMS = 'MISSING_REQUIRED_CLAIMS',
  JWKS_FETCH_FAILED = 'JWKS_FETCH_FAILED',
  DISCOVERY_FAILED = 'DISCOVERY_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Express request extension for subject context
declare module 'express' {
  interface Request {
    subject?: SubjectContext;
  }
}

// Re-export contract validation types for convenience
export type { KeycloakTokenClaims } from './contracts/validator';