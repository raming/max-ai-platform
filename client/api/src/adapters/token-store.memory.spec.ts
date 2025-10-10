import { MemoryTokenStore } from './token-store.memory';

describe('MemoryTokenStore', () => {
  it('put/get/delete works', async () => {
    const store = new MemoryTokenStore();
    const saved = await store.put({ provider: 'supabase', tenantId: 't1', secret: 's3cr3t' });
    expect(saved.id).toBeTruthy();
    const loaded = await store.get(saved.id);
    expect(loaded?.secret).toBe('s3cr3t');
    await store.delete(saved.id);
    expect(await store.get(saved.id)).toBeNull();
  });
});