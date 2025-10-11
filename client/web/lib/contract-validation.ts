import Ajv from 'ajv';

// Feature flag for runtime contract validation
const CONTRACT_VALIDATION_ENABLED = process.env.NODE_ENV !== 'production' && process.env.CONTRACT_VALIDATION === 'true';

const ajv = new Ajv({ allErrors: true });

/**
 * Validates data against a JSON schema at runtime if validation is enabled
 * @param data - The data to validate
 * @param schema - The JSON schema
 * @param schemaId - Identifier for the schema (for error messages)
 * @throws Error if validation fails and CONTRACT_VALIDATION_ENABLED is true
 */
export function validateContract(data: any, schema: any, schemaId: string): void {
  if (!CONTRACT_VALIDATION_ENABLED) {
    return;
  }

  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    const errors = validate.errors?.map((err: any) => `${err.dataPath}: ${err.message}`).join(', ') || 'unknown error';
    throw new Error(`Contract validation failed for ${schemaId}: ${errors}`);
  }
}

// Pre-compiled validators for common schemas (to be loaded at startup)
let keycloakTokenClaimsValidator: any = null;
let authzRequestValidator: any = null;
let authzResponseValidator: any = null;

/**
 * Initialize contract validators by loading schemas
 * Call this at application startup
 */
export async function initializeContractValidators(): Promise<void> {
  if (!CONTRACT_VALIDATION_ENABLED) {
    return;
  }

  try {
    // Use embedded schemas
    keycloakTokenClaimsValidator = ajv.compile(KEYCLOAK_TOKEN_CLAIMS_SCHEMA);
    authzRequestValidator = ajv.compile(AUTHZ_REQUEST_SCHEMA);
    authzResponseValidator = ajv.compile(AUTHZ_RESPONSE_SCHEMA);
  } catch (error) {
    console.warn('Failed to initialize contract validators:', error);
  }
}

/**
 * Validate Keycloak token claims
 */
export function validateKeycloakTokenClaims(claims: any): void {
  if (!keycloakTokenClaimsValidator) return;
  if (!keycloakTokenClaimsValidator(claims)) {
    const errors = keycloakTokenClaimsValidator.errors?.map((err: any) => `${err.instancePath}: ${err.message}`).join(', ') || 'unknown error';
    throw new Error(`Keycloak token claims validation failed: ${errors}`);
  }
}

/**
 * Validate authorization request
 */
export function validateAuthzRequest(request: any): void {
  if (!authzRequestValidator) return;
  if (!authzRequestValidator(request)) {
    const errors = authzRequestValidator.errors?.map((err: any) => `${err.instancePath}: ${err.message}`).join(', ') || 'unknown error';
    throw new Error(`Authorization request validation failed: ${errors}`);
  }
}

/**
 * Validate authorization response
 */
export function validateAuthzResponse(response: any): void {
  if (!authzResponseValidator) return;
  if (!authzResponseValidator(response)) {
    const errors = authzResponseValidator.errors?.map((err: any) => `${err.instancePath}: ${err.message}`).join(', ') || 'unknown error';
    throw new Error(`Authorization response validation failed: ${errors}`);
  }
}

/**
 * Keycloak token claims JSON schema
 */
const KEYCLOAK_TOKEN_CLAIMS_SCHEMA = {
  "$id": "https://max-ai.platform/iam/keycloak-token-claims.schema.json",
  "title": "Keycloak Token Claims",
  "type": "object",
  "required": ["iss", "sub", "aud", "exp", "iat", "tenant"],
  "properties": {
    "iss": {"type": "string"},
    "sub": {"type": "string"},
    "aud": {"oneOf": [{"type": "string"}, {"type": "array", "items": {"type": "string"}}]},
    "exp": {"type": "integer", "minimum": 0},
    "nbf": {"type": "integer", "minimum": 0},
    "iat": {"type": "integer", "minimum": 0},
    "jti": {"type": "string"},
    "tenant": {"type": "string", "description": "Tenant/realm or org identifier"},
    "scope": {"type": "string"},
    "roles": {"type": "array", "items": {"type": "string"}},
    "groups": {"type": "array", "items": {"type": "string"}}
  },
  "additionalProperties": true
};

/**
 * Authorization request JSON schema
 */
const AUTHZ_REQUEST_SCHEMA = {
  "$id": "https://max-ai.platform/iam/authz-request.schema.json",
  "title": "Authorization Request",
  "type": "object",
  "required": ["subject", "resource", "action"],
  "properties": {
    "subject": {
      "type": "object",
      "required": ["id", "tenant"],
      "properties": {
        "id": {"type": "string"},
        "tenant": {"type": "string"},
        "roles": {"type": "array", "items": {"type": "string"}},
        "groups": {"type": "array", "items": {"type": "string"}},
        "scopes": {"type": "array", "items": {"type": "string"}}
      },
      "additionalProperties": true
    },
    "resource": {
      "type": "object",
      "required": ["type", "id"],
      "properties": {
        "type": {"type": "string"},
        "id": {"type": "string"},
        "ownerTenant": {"type": "string"}
      },
      "additionalProperties": true
    },
    "action": {"type": "string"},
    "context": {"type": "object", "additionalProperties": true}
  },
  "additionalProperties": false
};

/**
 * Authorization response JSON schema
 */
const AUTHZ_RESPONSE_SCHEMA = {
  "$id": "https://max-ai.platform/iam/authz-response.schema.json",
  "title": "Authorization Response",
  "type": "object",
  "required": ["decision"],
  "properties": {
    "decision": {"type": "string", "enum": ["allow", "deny"]},
    "reason": {"type": "string"},
    "policyRef": {"type": "string"},
    "obligations": {"type": "object", "additionalProperties": true}
  },
  "additionalProperties": false
};

/**
 * Resource initialization plan JSON schema
 */
const RESOURCE_INIT_SCHEMA = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://max-ai/contracts/resource-initialization-plan.schema.json",
  "title": "ResourceInitializationPlan",
  "type": "object",
  "required": ["id", "clientId", "resources"],
  "properties": {
    "id": {"type": "string"},
    "clientId": {"type": "string"},
    "resources": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["kind"],
        "properties": {
          "kind": {"enum": ["supabase", "storage", "other"]},
          "supabase": {
            "type": "object",
            "properties": {
              "projectUrl": {"type": "string"},
              "anonKey": {"type": "string"},
              "serviceRoleKey": {"type": "string"},
              "init": {
                "type": "object",
                "properties": {
                  "tables": {
                    "type": "array",
                    "items": {"enum": ["prompts", "documents"]}
                  }
                },
                "additionalProperties": false
              }
            },
            "additionalProperties": false
          },
          "options": {"type": "object"}
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
};

/**
 * Get the resource initialization plan schema
 * Returns the embedded schema for validation
 */
export function getResourceInitSchema(): any {
  return RESOURCE_INIT_SCHEMA;
}

/**
 * Get the Keycloak token claims schema
 */
export function getKeycloakTokenClaimsSchema(): any {
  return KEYCLOAK_TOKEN_CLAIMS_SCHEMA;
}

/**
 * Get the authorization request schema
 */
export function getAuthzRequestSchema(): any {
  return AUTHZ_REQUEST_SCHEMA;
}

/**
 * Get the authorization response schema
 */
export function getAuthzResponseSchema(): any {
  return AUTHZ_RESPONSE_SCHEMA;
}