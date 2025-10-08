// API route for policy check endpoint

import { NextRequest, NextResponse } from 'next/server';
import { RBACPolicyEngine, PolicyCheckRequest } from '../../../../../lib/rbac/policy-engine';

// Global policy engine instance
let policyEngine: RBACPolicyEngine | null = null;

async function getPolicyEngine(): Promise<RBACPolicyEngine> {
  if (!policyEngine) {
    policyEngine = new RBACPolicyEngine();
    await policyEngine.initialize();
  }
  return policyEngine;
}

export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

  try {
    const body: PolicyCheckRequest = await request.json();

    // Validate required fields
    if (!body.subject || !body.resource || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, resource, action' },
        { status: 400, headers: { 'x-correlation-id': correlationId } }
      );
    }

    // Check policy
    const engine = await getPolicyEngine();
    const response = await engine.check(body, correlationId);

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