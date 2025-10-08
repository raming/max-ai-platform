import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '../../../lib/auth/middleware';
import { Logger } from '../../../lib/logger/logger';

/**
 * Sample protected API route demonstrating OIDC authentication
 * 
 * This endpoint requires a valid JWT token in the Authorization header
 * and demonstrates how to access the authenticated subject context.
 */

export const GET = AuthMiddleware.withAuth(async (req: NextRequest, { subject }) => {
  const logger = Logger.fromRequest(req);
  logger.info('Protected resource accessed', { userId: subject.id });

  // The subject context is automatically injected by the middleware
  const response = {
    message: 'Hello from protected endpoint!',
    timestamp: new Date().toISOString(),
    subject: {
      id: subject.id,
      tenantId: subject.tenantId,
      email: subject.email,
      displayName: subject.displayName,
      roles: subject.roles,
      groups: subject.groups,
      scopes: subject.scopes,
      isServiceAccount: subject.isServiceAccount
    }
  };

  return NextResponse.json(response);
});

export const POST = AuthMiddleware.withAuth(async (req: NextRequest, { subject }) => {
  try {
    const body = await req.json();
    
    const response = {
      message: 'Protected POST endpoint accessed successfully',
      timestamp: new Date().toISOString(),
      subject: {
        id: subject.id,
        tenantId: subject.tenantId,
        roles: subject.roles
      },
      receivedData: body
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        timestamp: new Date().toISOString() 
      },
      { status: 400 }
    );
  }
});