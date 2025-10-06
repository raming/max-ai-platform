import { SupabaseProvider } from './supabase.provider';
import { MemoryTokenStore } from '../adapters/token-store.memory';
import { ResourceInitializationPlan } from 'token-proxy-core';

describe('SupabaseProvider', () => {
  it('returns 401 when token is missing', async () => {
    const store = new MemoryTokenStore();
    const provider = new SupabaseProvider(store as any);
    const plan: ResourceInitializationPlan = {
      tenantId: 't1',
      provider: 'supabase',
      operations: [],
    };
    const res = await provider.init(plan, { correlationId: 'cid1' });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(401);
  });

  it('returns 202 when token is valid', async () => {
    const store = new MemoryTokenStore();
    const saved = await store.put({ provider: 'supabase', tenantId: 't1', secret: 'sb-secret' });
    const provider = new SupabaseProvider(store as any);
    const plan: ResourceInitializationPlan = {
      tenantId: 't1',
      provider: 'supabase',
      operations: [{ op: 'ping', params: {} }],
      tokenId: saved.id,
    };
    const res = await provider.init(plan, { correlationId: 'cid2' });
    expect(res.ok).toBe(true);
    expect(res.status).toBe(202);
  });
});