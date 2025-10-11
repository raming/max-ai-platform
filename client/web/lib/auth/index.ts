/**
 * Authentication module exports
 * 
 * Provides OIDC token verification, middleware, and observability
 * for the Max AI platform authentication system.
 */

// Core types
export * from './types';

// OIDC verification service
export * from './oidc-verifier';

// Authentication middleware
export * from './middleware';
export { default as AuthMiddleware } from './middleware';

// Observability and audit logging
export * from './observability';