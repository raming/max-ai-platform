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
    const errors = validate.errors?.map(err => `${err.instancePath}: ${err.message}`).join(', ') || 'unknown error';
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
    // Load schemas from ops/docs/contracts/iam/
    const keycloakSchema = loadSchemaFromFilesystem('/ops/docs/contracts/iam/keycloak-token-claims.schema.json');
    const authzRequestSchema = loadSchemaFromFilesystem('/ops/docs/contracts/iam/authz-request.schema.json');
    const authzResponseSchema = loadSchemaFromFilesystem('/ops/docs/contracts/iam/authz-response.schema.json');

    keycloakTokenClaimsValidator = ajv.compile(keycloakSchema);
    authzRequestValidator = ajv.compile(authzRequestSchema);
    authzResponseValidator = ajv.compile(authzResponseSchema);
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

// Helper to load schema from filesystem (server-side)
function loadSchemaFromFilesystem(relativePath: string): any {
  const fs = require('fs');
  const path = require('path');

  try {
    // Navigate from client/web/src/lib to the ops directory
    const schemaPath = path.join(process.cwd(), '../../../ops', relativePath);
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    return JSON.parse(schemaContent);
  } catch (error) {
    throw new Error(`Failed to load schema ${relativePath}: ${error}`);
  }
}

/**
 * Get the resource initialization plan schema
 * Server-side function to load schema from filesystem
 */
export function getResourceInitSchema(): any {
  // In Next.js API routes, we can read from the filesystem
  // The schema is located at ops/docs/contracts/resource-initialization-plan.schema.json
  const fs = require('fs');
  const path = require('path');

  try {
    const schemaPath = path.join(process.cwd(), '../../../ops/docs/contracts/resource-initialization-plan.schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    return JSON.parse(schemaContent);
  } catch (error) {
    throw new Error(`Failed to load resource initialization schema: ${error}`);
  }
}