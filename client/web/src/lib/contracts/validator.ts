import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';

// Import schema files
import keycloakTokenClaimsSchema from './iam/keycloak-token-claims.schema.json';
import authzRequestSchema from './iam/authz-request.schema.json';
import authzResponseSchema from './iam/authz-response.schema.json';

// Type definitions based on schemas
export interface KeycloakTokenClaims {
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
  [key: string]: any;
}

export interface AuthzRequest {
  subject: {
    id: string;
    tenant: string;
    roles?: string[];
    groups?: string[];
    scopes?: string[];
    [key: string]: any;
  };
  resource: {
    type: string;
    id: string;
    ownerTenant?: string;
    [key: string]: any;
  };
  action: string;
  context?: { [key: string]: any };
}

export interface AuthzResponse {
  decision: 'allow' | 'deny';
  reason?: string;
  policyRef?: string;
  obligations?: { [key: string]: any };
}

// Feature flag for runtime validation - moved to runtime evaluation

export class ContractValidator {
  private ajv: Ajv;
  private validateKeycloakTokenClaims: any;
  private validateAuthzRequest: any;
  private validateAuthzResponse: any;

  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true, 
      verbose: true,
      strict: false, // Disable strict mode to be more permissive
      validateFormats: false, // Disable format validation for now
      validateSchema: false // Skip schema validation
    });
    addFormats(this.ajv);

    // Compile validators
    this.validateKeycloakTokenClaims = this.ajv.compile(keycloakTokenClaimsSchema);
    this.validateAuthzRequest = this.ajv.compile(authzRequestSchema);
    this.validateAuthzResponse = this.ajv.compile(authzResponseSchema);
  }

  /**
   * Validate Keycloak token claims
   */
  validateTokenClaims(data: unknown): { valid: boolean; errors?: any[] } {
    const valid = this.validateKeycloakTokenClaims(data);
    return {
      valid,
      errors: valid ? undefined : this.validateKeycloakTokenClaims.errors
    };
  }

  /**
   * Validate authorization request
   */
  validateAuthorizationRequest(data: unknown): { valid: boolean; errors?: any[] } {
    const valid = this.validateAuthzRequest(data);
    return {
      valid,
      errors: valid ? undefined : this.validateAuthzRequest.errors
    };
  }

  /**
   * Validate authorization response
   */
  validateAuthorizationResponse(data: unknown): { valid: boolean; errors?: any[] } {
    const valid = this.validateAuthzResponse(data);
    return {
      valid,
      errors: valid ? undefined : this.validateAuthzResponse.errors
    };
  }

  /**
   * Runtime validation wrapper (only runs in non-prod when enabled)
   */
  validateInRuntime<T>(
    data: unknown, 
    validatorFn: (data: unknown) => { valid: boolean; errors?: any[] },
    context: string
  ): T {
    // Evaluate feature flag at runtime, not module load time
    const isRuntimeValidationEnabled = process.env.NODE_ENV !== 'production' && 
      process.env.ENABLE_CONTRACT_VALIDATION === 'true';
    
    if (!isRuntimeValidationEnabled) {
      return data as T;
    }

    const result = validatorFn(data);
    if (!result.valid) {
      const errorMessage = `Contract validation failed for ${context}: ${JSON.stringify(result.errors)}`;
      console.error(errorMessage, { data, errors: result.errors });
      throw new Error(errorMessage);
    }

    return data as T;
  }
}

// Singleton instance
export const contractValidator = new ContractValidator();

// Convenience functions
export const validateKeycloakTokenClaims = (data: unknown) => 
  contractValidator.validateTokenClaims(data);

export const validateAuthzRequest = (data: unknown) => 
  contractValidator.validateAuthorizationRequest(data);

export const validateAuthzResponse = (data: unknown) => 
  contractValidator.validateAuthorizationResponse(data);

// Runtime validation helpers
export const validateTokenClaimsRuntime = (data: unknown): KeycloakTokenClaims =>
  contractValidator.validateInRuntime(data, validateKeycloakTokenClaims, 'Keycloak Token Claims');

export const validateAuthzRequestRuntime = (data: unknown): AuthzRequest =>
  contractValidator.validateInRuntime(data, validateAuthzRequest, 'Authorization Request');

export const validateAuthzResponseRuntime = (data: unknown): AuthzResponse =>
  contractValidator.validateInRuntime(data, validateAuthzResponse, 'Authorization Response');