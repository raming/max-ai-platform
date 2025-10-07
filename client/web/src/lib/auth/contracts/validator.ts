/**
 * Runtime validator for Keycloak token claims using Ajv and the canonical
 * JSON Schema located under `ops/docs/contracts/iam/keycloak-token-claims.schema.json`.
 *
 * This keeps runtime validation aligned with the platform contract while
 * remaining lightweight for local tests.
 */
import Ajv, { ValidateFunction } from 'ajv';
import fs from 'fs';
import path from 'path';

export interface KeycloakTokenClaims {
  iss: string;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  tenant?: string;
  scope?: string;
  roles?: string[];
  groups?: string[];
  jti?: string;
  [key: string]: any;
}

let validator: ValidateFunction | null = null;

function getValidator(): ValidateFunction {
  if (!validator) {
    const ajv = new Ajv({ strict: false });
    // Load the canonical schema from the ops/docs folder at runtime. Using
    // a filesystem read avoids TypeScript/tsconfig resolution issues for
    // package-local JSON imports across workspace boundaries.
    const schemaPath = path.resolve(__dirname, '../../../../../../ops/docs/contracts/iam/keycloak-token-claims.schema.json');
    let raw: string;
    try {
      raw = fs.readFileSync(schemaPath, 'utf8');
    } catch (err) {
      throw new Error(`Failed to load token claims schema at ${schemaPath}: ${err}`);
    }
    let schemaObj: unknown;
    try {
      schemaObj = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Failed to parse token claims schema JSON: ${err}`);
    }
    validator = ajv.compile(schemaObj as object);
  }
  return validator!;
}

export function validateTokenClaimsRuntime(payload: unknown): asserts payload is KeycloakTokenClaims {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Token payload must be an object');
  }

  const validate = getValidator();
  const ok = validate(payload);
  if (!ok) {
    const msg = validate.errors?.map(e => `${e.instancePath || '/'} ${e.message}`).join('; ') || 'validation failed';
    throw new Error(`Token claims validation failed: ${msg}`);
  }
}
