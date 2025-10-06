export function sharedContracts(): string {
  return 'shared-contracts';
}

/**
 * Schema validation utilities
 * These functions will be used by development tasks for contract validation
 */
export interface SchemaValidationResult {
  valid: boolean;
  errors?: any[];
}

/**
 * Validates data against a JSON schema
 * This is a placeholder that development tasks will implement with AJV or similar
 */
export function validateSchema(data: any, schemaPath: string): SchemaValidationResult {
  // Placeholder implementation - development tasks will add proper validation
  console.log(`Validating data against schema: ${schemaPath}`);
  return { valid: true };
}

/**
 * Gets the full path to a schema file
 */
export function getSchemaPath(schemaName: string): string {
  return `schemas/${schemaName}`;
}

/**
 * Schema categories for organization
 */
export const SchemaCategories = {
  IAM: ['user', 'role', 'roleAssignment'],
  PROMPT: ['template', 'instance'],
  BILLING: ['appointment', 'review'],
  CLIENT: ['client', 'solutionPack'],
} as const;
