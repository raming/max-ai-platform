// Supabase resource provider adapter

import { IResourceProvider, ResourceInitializationPlan, InitializationResult, ProviderRequest, ProviderResponse } from '../ports/token-proxy';

export class SupabaseProviderAdapter implements IResourceProvider {
  async initializeResources(
    plan: ResourceInitializationPlan,
    correlationId: string
  ): Promise<InitializationResult> {
    try {
      for (const resource of plan.resources) {
        if (resource.kind === 'supabase') {
          await this.initializeSupabaseResource(plan.clientId, resource, correlationId);
        }
        // Add other providers as needed
      }

      return {
        success: true,
        message: 'Resources initialized successfully',
        details: { planId: plan.id, clientId: plan.clientId }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Resource initialization failed', { error, correlationId });
      return {
        success: false,
        message: `Resource initialization failed: ${errorMessage}`,
        details: { error: errorMessage }
      };
    }
  }

  async proxyRequest(
    tenantId: string,
    clientId: string,
    provider: string,
    request: ProviderRequest,
    correlationId: string
  ): Promise<ProviderResponse> {
    if (provider !== 'supabase') {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // In production: retrieve token from secrets manager
    // For now: use environment variables (not secure)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const url = `${supabaseUrl}${request.path}`;

    try {
      const response = await fetch(url, {
        method: request.method,
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          ...request.headers
        },
        body: request.body ? JSON.stringify(request.body) : undefined
      });

      const responseBody = await response.text();

      // Audit log
      console.log(`AUDIT: Proxied request to ${provider}`, {
        tenantId,
        clientId,
        correlationId,
        action: 'proxy_request',
        resource: provider,
        method: request.method,
        path: request.path,
        status: response.status,
        outcome: response.ok ? 'success' : 'error'
      });

      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody ? JSON.parse(responseBody) : null
      };
    } catch (error) {
      console.error('Proxy request failed', { error, correlationId });
      throw error;
    }
  }

  private async initializeSupabaseResource(
    clientId: string,
    resource: any,
    correlationId: string
  ): Promise<void> {
    const { supabase } = resource;

    if (!supabase) {
      throw new Error('Supabase configuration missing');
    }

    // In production: store tokens in secrets manager
    // For now: validate configuration
    if (!supabase.projectUrl || !supabase.serviceRoleKey) {
      throw new Error('Supabase project URL and service role key required');
    }

    // Initialize tables if specified
    if (supabase.init?.tables) {
      for (const table of supabase.init.tables) {
        await this.createTableIfNotExists(supabase, table, correlationId);
      }
    }

    console.log(`AUDIT: Initialized Supabase resource for client ${clientId}`, {
      correlationId,
      action: 'resource_init',
      resource: 'supabase',
      tables: supabase.init?.tables || []
    });
  }

  private async createTableIfNotExists(
    supabase: any,
    tableName: string,
    correlationId: string
  ): Promise<void> {
    // In a real implementation, this would use Supabase client to create tables
    // For now, just log the intent
    console.log(`Would create table ${tableName} in Supabase`, { correlationId });
  }
}