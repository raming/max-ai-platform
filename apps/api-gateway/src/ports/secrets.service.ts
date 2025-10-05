export type SupabaseCredentials = {
  url: string;
  key: string; // service role or scoped key; must never be logged
};

export interface ISecretsService {
  getSupabaseCredentials(): Promise<SupabaseCredentials>;
}
