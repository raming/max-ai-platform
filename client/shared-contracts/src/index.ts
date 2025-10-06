export * from './lib/shared-contracts';

// Re-export schema types and validators
export { sharedContracts } from './lib/shared-contracts';

// Export schema paths for runtime loading
export const SchemaPaths = {
  appointment: 'appointment.schema.json',
  review: 'review.schema.json',
  user: 'iam/user.schema.json',
  role: 'iam/role.schema.json',
  roleAssignment: 'iam/role-assignment.schema.json',
  template: 'prompt/template.schema.json',
  instance: 'prompt/instance.schema.json',
  client: 'client.schema.json',
  solutionPack: 'solution-pack.schema.json',
} as const;

// Export schema directory for runtime access
export const SCHEMAS_DIR = 'schemas';
