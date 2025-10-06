export interface TokenRecord {
  id: string; // opaque identifier
  provider: 'supabase' | string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  // Never log any of these values
  secret: string;
}

export interface ITokenStore {
  put(record: Omit<TokenRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<TokenRecord>;
  get(id: string): Promise<TokenRecord | null>;
  delete(id: string): Promise<void>;
}