export type ResourceInitializationPlan = {
  tenantId: string;
  provider: 'supabase' | string;
  operations: Array<{ op: string; params: Record<string, unknown> }>;
  // Optional reference to token/credential id managed by token store
  tokenId?: string;
};