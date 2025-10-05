import { SupabaseOperation } from '../types/providers.js';
import { SupabaseCredentials } from './secrets.service.js';

export interface ISupabaseClient {
  execute(operation: SupabaseOperation, credentials: SupabaseCredentials): Promise<any>;
}
