import { IResourceProvider, ProviderResult, ResourceInitializationPlan } from 'token-proxy-core';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SupabaseProvider implements IResourceProvider {
  private readonly logger = new Logger(SupabaseProvider.name);
  constructor(@Inject('ITokenStore') private readonly tokenStore: any) {}

  async init(plan: ResourceInitializationPlan, opts: { correlationId: string }): Promise<ProviderResult> {
    try {
      if (!plan.tokenId) {
        return { ok: false, status: 401, error: 'missing tokenId' };
      }
      const token = await this.tokenStore.get(plan.tokenId);
      if (!token || token.provider !== 'supabase' || token.tenantId !== plan.tenantId) {
        return { ok: false, status: 401, error: 'invalid token' };
      }
      // Simulate executing operations against Supabase; in real impl we'd use the token.secret
      for (const op of plan.operations ?? []) {
        this.logger.debug(JSON.stringify({ msg: 'supabase.op', op: op.op, correlationId: opts.correlationId }));
      }
      return { ok: true, status: 202 };
    } catch (e: any) {
      this.logger.error(JSON.stringify({ msg: 'supabase.error', correlationId: opts.correlationId }));
      return { ok: false, status: 502, error: e?.message ?? 'proxy error' };
    }
  }
}