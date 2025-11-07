'use client';

import { useAuthStore } from '@/stores';
import { apiClient } from '@/lib/api/client';

/**
 * Audit log event types
 */
export const AUDIT_EVENTS = {
  // Authentication
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_SESSION_EXPIRED: 'auth.session_expired',

  // Content
  CONTENT_CREATE: 'content.create',
  CONTENT_UPDATE: 'content.update',
  CONTENT_DELETE: 'content.delete',
  CONTENT_PUBLISH: 'content.publish',
  CONTENT_UNPUBLISH: 'content.unpublish',

  // User Management
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role_change',

  // Settings
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_SECURITY_CHANGE: 'settings.security_change',

  // Security
  SECURITY_2FA_ENABLED: 'security.2fa_enabled',
  SECURITY_2FA_DISABLED: 'security.2fa_disabled',
  SECURITY_PASSWORD_CHANGED: 'security.password_changed',
  SECURITY_API_KEY_CREATED: 'security.api_key_created',
  SECURITY_API_KEY_REVOKED: 'security.api_key_revoked',
} as const;

export type AuditEvent = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS];

/**
 * Audit log entry
 */
interface AuditLogEntry {
  event: AuditEvent;
  timestamp: string;
  userId?: string;
  tenantId?: string;
  resourceId?: string;
  resourceType?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

/**
 * Audit logging service
 * Logs sensitive user actions for compliance and security
 */
class AuditLogger {
  /**
   * Log an audit event
   */
  async log(
    event: AuditEvent,
    options: {
      resourceId?: string;
      resourceType?: string;
      changes?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      status?: 'success' | 'failure';
      errorMessage?: string;
      correlationId?: string;
    } = {}
  ): Promise<void> {
    try {
      const { user } = useAuthStore.getState();
      const now = new Date().toISOString();

      const entry: AuditLogEntry = {
        event,
        timestamp: now,
        userId: user?.id,
        tenantId: user?.tenantId,
        resourceId: options.resourceId,
        resourceType: options.resourceType,
        changes: options.changes,
        metadata: options.metadata,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        status: options.status || 'success',
        errorMessage: options.errorMessage,
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUDIT]', entry);
      }

      // Send to server for persistence
      await apiClient.post('/audit-logs', entry, {
        correlationId: options.correlationId,
      });
    } catch (error) {
      // Don't throw errors from audit logging - it shouldn't block user actions
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    event: AuditEvent,
    status: 'success' | 'failure' = 'success',
    errorMessage?: string
  ): Promise<void> {
    return this.log(event, {
      resourceType: 'auth',
      status,
      errorMessage,
    });
  }

  /**
   * Log content operation
   */
  async logContentEvent(
    event: AuditEvent,
    contentId: string,
    changes?: Record<string, unknown>
  ): Promise<void> {
    return this.log(event, {
      resourceId: contentId,
      resourceType: 'content',
      changes,
    });
  }

  /**
   * Log user management event
   */
  async logUserEvent(
    event: AuditEvent,
    userId: string,
    changes?: Record<string, unknown>
  ): Promise<void> {
    return this.log(event, {
      resourceId: userId,
      resourceType: 'user',
      changes,
    });
  }

  /**
   * Log settings change
   */
  async logSettingsEvent(
    event: AuditEvent,
    changes: Record<string, unknown>
  ): Promise<void> {
    return this.log(event, {
      resourceType: 'settings',
      changes,
    });
  }
}

/**
 * Singleton audit logger instance
 */
export const auditLogger = new AuditLogger();

/**
 * Hook to use audit logger
 */
export function useAuditLogger() {
  return auditLogger;
}
