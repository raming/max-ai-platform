import { ISecretsService, SupabaseCredentials } from '../../ports/secrets.service.js';

export class EnvSecretsService implements ISecretsService {
  async getSupabaseCredentials(): Promise<SupabaseCredentials> {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }
    return { url, key };
  }
}
