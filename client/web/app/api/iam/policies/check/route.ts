// API route for policy check endpoint

import { NextRequest, NextResponse } from 'next/server';
import { RBACPolicyEngine, PolicyCheckRequest } from '../../../../../lib/rbac/policy-engine';
import { validateAuthzRequest, validateAuthzResponse, initializeContractValidators } from '../../../../../lib/contract-validation';

// Global policy engine instance
let policyEngine: RBACPolicyEngine | null = null;
let validatorsInitialized = false;

async function getPolicyEngine(): Promise<RBACPolicyEngine> {
  if (!policyEngine) {
    policyEngine = new RBACPolicyEngine();
    await policyEngine.initialize();
  }
  return policyEngine;
}

async function ensureValidatorsInitialized(): Promise<void> {
  if (!validatorsInitialized) {
    await initializeContractValidators();
    validatorsInitialized = true;
  }
}

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

  try {
    await ensureValidatorsInitialized();

    const body: PolicyCheckRequest = await request.json();

    // Validate request contract
    validateAuthzRequest(body);

    // Check policy
    const engine = await getPolicyEngine();
    const response = await engine.check(body, correlationId);

    // Validate response contract
    validateAuthzResponse(response);

    return NextResponse.json(response, {
      headers: { 'x-correlation-id': correlationId }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Policy check error', { error, correlationId });

    return NextResponse.json(
      { error: 'Policy check failed', message: errorMessage },
      { status: 500, headers: { 'x-correlation-id': correlationId } }
    );
  }
}