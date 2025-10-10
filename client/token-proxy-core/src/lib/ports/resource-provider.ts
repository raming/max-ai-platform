import { ResourceInitializationPlan } from '../types';

export interface ProviderResult<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export interface IResourceProvider {
  // Execute an initialization plan using provider credentials fetched via token store
  init(plan: ResourceInitializationPlan, opts: { correlationId: string }): Promise<ProviderResult>;
}