import { ISupabaseClient } from '../../ports/supabase.client.js';
import { SupabaseOperation } from '../../types/providers.js';
import { SupabaseCredentials } from '../../ports/secrets.service.js';

export class StubSupabaseClient implements ISupabaseClient {
  async execute(operation: SupabaseOperation, _credentials: SupabaseCredentials): Promise<any> {
    // This is a stub; real implementation would call Supabase REST/RPC
    if (operation.type === 'create_table') {
      return { created: true, table: operation.payload?.name };
    }
    return { ok: true, type: operation.type };
  }
}
