// API route for resource initialization

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseProviderAdapter } from '../../../../lib/adapters/supabase-provider';
import { SecretsManagerAdapter } from '../../../../lib/adapters/secrets-manager';
import { ResourceInitializationPlan } from '../../../../lib/ports/token-proxy';
import { validateContract } from '../../../../lib/contract-validation';

// Feature flag
const TOKEN_PROXY_ENABLED = process.env.FEATURE_TOKEN_PROXY === 'true';

export async function POST(request: NextRequest) {
  if (!TOKEN_PROXY_ENABLED) {
    return NextResponse.json({ error: 'Token proxy not enabled' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

    // Validate the request against the schema
    await validateContract(body, getResourceInitSchema(), 'resource-init-plan');

    const plan: ResourceInitializationPlan = body;

    // Initialize adapters
    const secretsManager = new SecretsManagerAdapter();
    const supabaseProvider = new SupabaseProviderAdapter();

    // Store tokens securely
    for (const resource of plan.resources) {
      if (resource.kind === 'supabase' && resource.supabase) {
        await secretsManager.storeToken(
          'tenant1', // TODO: get from auth context
          plan.clientId,
          'supabase',
          {
            projectUrl: resource.supabase.projectUrl,
            anonKey: resource.supabase.anonKey,
            serviceRoleKey: resource.supabase.serviceRoleKey
          },
          correlationId
        );
      }
    }

    // Initialize resources
    const result = await supabaseProvider.initializeResources(plan, correlationId);

    return NextResponse.json(result, {
      headers: { 'x-correlation-id': correlationId }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Resource initialization error', { error });

    return NextResponse.json(
      { error: 'Resource initialization failed', message: errorMessage },
      { status: 500 }
    );
  }
}

// Helper to get the schema (in production, load from file)
function getResourceInitSchema() {
  return {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "https://max-ai/contracts/resource-initialization-plan.schema.json",
    "title": "ResourceInitializationPlan",
    "type": "object",
    "required": ["id", "clientId", "resources"],
    "properties": {
      "id": {"type": "string"},
      "clientId": {"type": "string"},
      "resources": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["kind"],
          "properties": {
            "kind": {"enum": ["supabase", "storage", "other"]},
            "supabase": {
              "type": "object",
              "properties": {
                "projectUrl": {"type": "string"},
                "anonKey": {"type": "string"},
                "serviceRoleKey": {"type": "string"},
                "init": {
                  "type": "object",
                  "properties": {
                    "tables": {
                      "type": "array",
                      "items": {"type": "string"}
                    }
                  },
                  "additionalProperties": false
                }
              },
              "additionalProperties": false
            },
            "options": {"type": "object"}
          },
          "additionalProperties": false
        }
      }
    },
    "additionalProperties": false
  };
}