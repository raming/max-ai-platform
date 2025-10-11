// Port interfaces for token proxy functionality

export interface ITokenStore {
  /**
   * Store a provider token securely
   * @param tenantId - Tenant identifier
   * @param clientId - Client identifier
   * @param provider - Provider name (e.g., 'supabase')
   * @param tokenData - Token data to store
   * @param correlationId - Correlation ID for audit
   */
  storeToken(
    tenantId: string,
    clientId: string,
    provider: string,
    tokenData: TokenData,
    correlationId: string
  ): Promise<void>;

  /**
   * Retrieve a provider token
   * @param tenantId - Tenant identifier
   * @param clientId - Client identifier
   * @param provider - Provider name
   * @param correlationId - Correlation ID for audit
   */
  retrieveToken(
    tenantId: string,
    clientId: string,
    provider: string,
    correlationId: string
  ): Promise<TokenData | null>;

  /**
   * Rotate a provider token
   * @param tenantId - Tenant identifier
   * @param clientId - Client identifier
   * @param provider - Provider name
   * @param newTokenData - New token data
   * @param correlationId - Correlation ID for audit
   */
  rotateToken(
    tenantId: string,
    clientId: string,
    provider: string,
    newTokenData: TokenData,
    correlationId: string
  ): Promise<void>;
}

export interface IResourceProvider {
  /**
   * Initialize resources for a client
   * @param plan - Resource initialization plan
   * @param correlationId - Correlation ID for audit
   */
  initializeResources(
    plan: ResourceInitializationPlan,
    correlationId: string
  ): Promise<InitializationResult>;

  /**
   * Proxy a request to the provider
   * @param tenantId - Tenant identifier
   * @param clientId - Client identifier
   * @param provider - Provider name
   * @param request - Request details
   * @param correlationId - Correlation ID for audit
   */
  proxyRequest(
    tenantId: string,
    clientId: string,
    provider: string,
    request: ProviderRequest,
    correlationId: string
  ): Promise<ProviderResponse>;
}

// Data types

export interface TokenData {
  projectUrl?: string;
  anonKey?: string;
  serviceRoleKey?: string;
  [key: string]: any;
}

export interface ResourceInitializationPlan {
  id: string;
  clientId: string;
  resources: ResourceSpec[];
}

export interface ResourceSpec {
  kind: 'supabase' | 'storage' | 'other';
  supabase?: SupabaseConfig;
  options?: Record<string, any>;
}

export interface SupabaseConfig {
  projectUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  init?: {
    tables: string[];
  };
}

export interface InitializationResult {
  success: boolean;
  message: string;
  details?: any;
}

export interface ProviderRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface ProviderResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}