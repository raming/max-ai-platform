import { ITokenStore, TokenRecord } from 'token-proxy-core';

function genId(): string {
  return `tok_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export class MemoryTokenStore implements ITokenStore {
  private store = new Map<string, TokenRecord>();

  async put(record: Omit<TokenRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<TokenRecord> {
    const id = genId();
    const now = new Date().toISOString();
    const rec: TokenRecord = { id, createdAt: now, updatedAt: now, ...record };
    this.store.set(id, rec);
    return rec;
  }

  async get(id: string): Promise<TokenRecord | null> {
    return this.store.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}