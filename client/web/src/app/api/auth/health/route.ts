/**
 * Authentication health check and metrics endpoint
 * 
 * Provides observability data for monitoring authentication system health.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthHealthCheck, getAuthMetricsSummary } from '../../../../lib/auth/observability';

/**
 * GET /api/auth/health
 * 
 * Returns authentication system health status and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const health = getAuthHealthCheck();
    const metrics = getAuthMetricsSummary();

    return NextResponse.json({
      ...health,
      metrics,
      endpoint: '/api/auth/health',
      requestId: request.headers.get('x-request-id') || 'unknown'
    });

  } catch (error) {
    console.error('[AUTH-HEALTH] Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      endpoint: '/api/auth/health'
    }, { 
      status: 500 
    });
  }
}

/**
 * POST endpoint is not supported for health checks
 */
export async function POST() {
  return NextResponse.json({
    error: 'Method not allowed',
    message: 'Health check endpoint only supports GET requests'
  }, { 
    status: 405 
  });
}