import { jwtVerify, createRemoteJWKSet, JWTPayload } from 'jose';
import { 
  AuthConfig, 
  AuthResult, 
  AuthError, 
  AuthErrorCode,
  OIDCDiscovery,
  TokenClaims,
  SubjectContext
} from './types';
import { validateTokenClaimsRuntime } from './contracts/validator';
import { AuthLogger, AuthTimer } from './observability';

/**
 * OIDC Token Verifier Service
 * 
 * Handles JWT token verification using OIDC discovery and JWKS.
 * Validates tokens against Keycloak and extracts subject context.
 */
export class OIDCVerifier {
  private discoveryCache: Map<string, { discovery: OIDCDiscovery; expires: number }> = new Map();
  private logger: AuthLogger;

  constructor(private config: AuthConfig, logger?: AuthLogger) {
    this.logger = logger || new AuthLogger();
  }

  /**
   * Verify a JWT token and extract subject context
   */
  async verifyToken(token: string): Promise<AuthResult> {
    const timer = new AuthTimer('token-verification');
    
    try {
      // Step 1: Get OIDC discovery document
      const discovery = await this.getDiscoveryDocument();
      
  // Step 2: Get JWKS and create verification function
  const remoteJwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
      
      // Step 3: Verify JWT signature and claims
      const { payload } = await jwtVerify(token, remoteJwks, {
        issuer: discovery.issuer,
        audience: Array.isArray(this.config.audience) ? this.config.audience : [this.config.audience],
        clockTolerance: this.config.clockTolerance
      });

      // Step 4: Validate token claims against contract
      const tokenClaims = this.validateTokenClaims(payload);
      
      // Step 5: Build subject context
      const subject = this.buildSubjectContext(tokenClaims);

      // Record successful verification
      timer.end();
      this.logger.logTokenVerified(subject, {
        issuer: discovery.issuer,
        tokenType: 'access_token'
      });

      return {
        success: true,
        subject
      };

    } catch (error) {
      timer.end();
      const authError = this.handleVerificationError(error);
      
      this.logger.logTokenVerificationFailed(
        authError.code,
        authError.message,
        {
          issuer: this.config.keycloakBaseUrl,
          errorDetails: authError.details
        }
      );
      
      return {
        success: false,
        error: authError
      };
    }
  }

  /**
   * Get OIDC discovery document with caching
   */
  private async getDiscoveryDocument(): Promise<OIDCDiscovery> {
    const discoveryUrl = this.buildDiscoveryUrl();
    const cached = this.discoveryCache.get(discoveryUrl);
    
    if (cached && cached.expires > Date.now()) {
      return cached.discovery;
    }

    try {
      const response = await fetch(discoveryUrl);
      if (!response.ok) {
        throw new Error(`Discovery endpoint returned ${response.status}: ${response.statusText}`);
      }
      
      const discovery: OIDCDiscovery = await response.json();
      
      // Cache for 1 hour
      this.discoveryCache.set(discoveryUrl, {
        discovery,
        expires: Date.now() + (60 * 60 * 1000)
      });

      return discovery;
    } catch (error) {
      const e = error as any;
      throw this.createAuthError(
        AuthErrorCode.DISCOVERY_FAILED,
        `Failed to fetch OIDC discovery document: ${e?.message ?? String(e)}`,
        { discoveryUrl, originalError: e }
      );
    }
  }

  /**
   * Build OIDC discovery URL
   */
  private buildDiscoveryUrl(): string {
    const baseUrl = this.config.keycloakBaseUrl.replace(/\/$/, '');
    
    if (this.config.realm) {
      return `${baseUrl}/realms/${this.config.realm}/.well-known/openid-configuration`;
    }
    
    // If no realm specified, assume it's in the base URL
    return `${baseUrl}/.well-known/openid-configuration`;
  }

  /**
   * Validate token claims against schema and requirements
   */
  private validateTokenClaims(payload: JWTPayload): TokenClaims {
    // First validate against the contract schema (if enabled)
    try {
      validateTokenClaimsRuntime(payload);
    } catch (error) {
      const e = error as any;
      throw this.createAuthError(
        AuthErrorCode.INVALID_TOKEN_FORMAT,
        `Token claims failed contract validation: ${e?.message ?? String(e)}`,
        { payload, validationError: e }
      );
    }

    // Check required claims
    const requiredClaims = ['iss', 'sub', 'aud', 'exp', 'iat', 'tenant', ...this.config.requiredClaims];
    const missingClaims = requiredClaims.filter(claim => !(claim in payload));
    
    if (missingClaims.length > 0) {
      throw this.createAuthError(
        AuthErrorCode.MISSING_REQUIRED_CLAIMS,
        `Token missing required claims: ${missingClaims.join(', ')}`,
        { missingClaims, payload }
      );
    }

    return payload as TokenClaims;
  }

  /**
   * Build subject context from verified token claims
   */
  private buildSubjectContext(claims: TokenClaims): SubjectContext {
    // Parse scopes from space-separated string
    const scopes = claims.scope ? claims.scope.split(' ').filter(s => s.length > 0) : [];
    
    // Determine if this is a service account (common pattern: service accounts have no email)
    const isServiceAccount = !claims.email && (claims.sub.startsWith('service-') || scopes.includes('service'));

    return {
      id: claims.sub,
      tenantId: claims.tenant,
      email: claims.email || claims.preferred_username,
      displayName: claims.name || claims.given_name ? `${claims.given_name} ${claims.family_name}`.trim() : undefined,
      roles: claims.roles || [],
      groups: claims.groups || [],
      scopes,
      isServiceAccount,
      metadata: {
        iss: claims.iss,
        aud: claims.aud,
        iat: claims.iat,
        exp: claims.exp,
        jti: claims.jti
      }
    };
  }

  /**
   * Handle verification errors and convert to AuthError
   */
  private handleVerificationError(error: any): AuthError {
    // Handle jose library specific errors
    if (error?.code === 'ERR_JWT_EXPIRED' || error?.name === 'TokenExpiredError') {
      return this.createAuthError(AuthErrorCode.TOKEN_EXPIRED, 'Token has expired', error);
    }
    
    if (error?.code === 'ERR_JWT_INVALID' || error?.name === 'JWTInvalid' || error?.name === 'JsonWebTokenError') {
      return this.createAuthError(AuthErrorCode.INVALID_TOKEN_FORMAT, 'Token format is invalid', error);
    }
    
    if (error?.code === 'ERR_JWKS_NO_MATCHING_KEY' || error?.name === 'JWKSMissingKeyError') {
      return this.createAuthError(AuthErrorCode.INVALID_SIGNATURE, 'No matching key found for token signature', error);
    }
    
    if (error?.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED' || error?.name === 'ClaimValidationFailed') {
      return this.createAuthError(AuthErrorCode.INVALID_AUDIENCE, 'Token audience validation failed', error);
    }

    // Handle our custom auth errors
    if (error.code && Object.values(AuthErrorCode).includes(error.code)) {
      return error;
    }

    // Default unknown error
    return this.createAuthError(
      AuthErrorCode.UNKNOWN_ERROR,
      `Token verification failed: ${error.message}`,
      error
    );
  }

  /**
   * Create a consistent AuthError
   */
  private createAuthError(code: AuthErrorCode, message: string, details?: any): AuthError {
    return { code, message, details };
  }


  /**
   * Extract token from Authorization header
   */
  static extractBearerToken(authHeader?: string | null): string | undefined {
    if (!authHeader) return undefined;

    const matches = authHeader.match(/^Bearer\s+(.+)$/i);
    return matches ? matches[1] : undefined;
  }

  /**
   * Create default auth configuration
   */
  static createDefaultConfig(keycloakBaseUrl: string, audience: string): AuthConfig {
    return {
      keycloakBaseUrl,
      audience,
      clockTolerance: 60, // 60 seconds
      cacheTtl: 3600, // 1 hour
      enableLogging: process.env.NODE_ENV !== 'production',
      requiredClaims: []
    };
  }
}