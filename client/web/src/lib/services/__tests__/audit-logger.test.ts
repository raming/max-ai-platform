import { AUDIT_EVENTS, AuditEvent, auditLogger } from '../audit-logger';

describe('Audit Logger', () => {
  describe('AUDIT_EVENTS constant', () => {
    it('exports all audit event types', () => {
      expect(AUDIT_EVENTS).toHaveProperty('AUTH_LOGIN');
      expect(AUDIT_EVENTS).toHaveProperty('AUTH_LOGOUT');
      expect(AUDIT_EVENTS).toHaveProperty('AUTH_LOGIN_FAILED');
      expect(AUDIT_EVENTS).toHaveProperty('AUTH_SESSION_EXPIRED');
      expect(AUDIT_EVENTS).toHaveProperty('CONTENT_CREATE');
      expect(AUDIT_EVENTS).toHaveProperty('CONTENT_UPDATE');
      expect(AUDIT_EVENTS).toHaveProperty('CONTENT_DELETE');
      expect(AUDIT_EVENTS).toHaveProperty('CONTENT_PUBLISH');
      expect(AUDIT_EVENTS).toHaveProperty('CONTENT_UNPUBLISH');
    });

    it('has unique event values', () => {
      const values = Object.values(AUDIT_EVENTS);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });

    it('event values follow dot notation convention', () => {
      Object.values(AUDIT_EVENTS).forEach((event) => {
        expect(event).toMatch(/^[a-z_]+\.[a-z0-9_]+$/);
      });
    });
  });

  describe('AuditEvent type', () => {
    it('is defined correctly', () => {
      const testEvent: AuditEvent = AUDIT_EVENTS.AUTH_LOGIN;
      expect(testEvent).toBeDefined();
      expect(typeof testEvent).toBe('string');
    });
  });

  describe('Event categorization', () => {
    it('has authentication events', () => {
      expect(AUDIT_EVENTS.AUTH_LOGIN).toBe('auth.login');
      expect(AUDIT_EVENTS.AUTH_LOGOUT).toBe('auth.logout');
      expect(AUDIT_EVENTS.AUTH_LOGIN_FAILED).toBe('auth.login_failed');
      expect(AUDIT_EVENTS.AUTH_SESSION_EXPIRED).toBe('auth.session_expired');
    });

    it('has content events', () => {
      expect(AUDIT_EVENTS.CONTENT_CREATE).toBe('content.create');
      expect(AUDIT_EVENTS.CONTENT_UPDATE).toBe('content.update');
      expect(AUDIT_EVENTS.CONTENT_DELETE).toBe('content.delete');
      expect(AUDIT_EVENTS.CONTENT_PUBLISH).toBe('content.publish');
      expect(AUDIT_EVENTS.CONTENT_UNPUBLISH).toBe('content.unpublish');
    });

    it('has user management events', () => {
      expect(AUDIT_EVENTS.USER_CREATE).toBe('user.create');
      expect(AUDIT_EVENTS.USER_UPDATE).toBe('user.update');
      expect(AUDIT_EVENTS.USER_DELETE).toBe('user.delete');
      expect(AUDIT_EVENTS.USER_ROLE_CHANGE).toBe('user.role_change');
    });

    it('has settings events', () => {
      expect(AUDIT_EVENTS.SETTINGS_UPDATE).toBe('settings.update');
      expect(AUDIT_EVENTS.SETTINGS_SECURITY_CHANGE).toBe('settings.security_change');
    });
  });

  describe('auditLogger singleton', () => {
    it('exports auditLogger instance', () => {
      expect(auditLogger).toBeDefined();
      expect(typeof auditLogger).toBe('object');
    });

    it('has logging methods', () => {
      expect(typeof auditLogger.log).toBe('function');
      expect(typeof auditLogger.logAuthEvent).toBe('function');
      expect(typeof auditLogger.logContentEvent).toBe('function');
      expect(typeof auditLogger.logUserEvent).toBe('function');
      expect(typeof auditLogger.logSettingsEvent).toBe('function');
    });
  });

  describe('logging methods', () => {
    it('log method is callable', () => {
      expect(typeof auditLogger.log).toBe('function');
    });

    it('logAuthEvent method is callable', () => {
      expect(typeof auditLogger.logAuthEvent).toBe('function');
    });

    it('logContentEvent method is callable', () => {
      expect(typeof auditLogger.logContentEvent).toBe('function');
    });

    it('logUserEvent method is callable', () => {
      expect(typeof auditLogger.logUserEvent).toBe('function');
    });

    it('logSettingsEvent method is callable', () => {
      expect(typeof auditLogger.logSettingsEvent).toBe('function');
    });
  });

  describe('event types count', () => {
    it('defines at least 16 audit event types', () => {
      const eventCount = Object.keys(AUDIT_EVENTS).length;
      expect(eventCount).toBeGreaterThanOrEqual(16);
    });
  });

  describe('security events', () => {
    it('has 2FA events', () => {
      expect(AUDIT_EVENTS.SECURITY_2FA_ENABLED).toBe('security.2fa_enabled');
      expect(AUDIT_EVENTS.SECURITY_2FA_DISABLED).toBe('security.2fa_disabled');
    });

    it('has password change events', () => {
      expect(AUDIT_EVENTS.SECURITY_PASSWORD_CHANGED).toBe('security.password_changed');
    });

    it('has API key events', () => {
      expect(AUDIT_EVENTS.SECURITY_API_KEY_CREATED).toBe('security.api_key_created');
      expect(AUDIT_EVENTS.SECURITY_API_KEY_REVOKED).toBe('security.api_key_revoked');
    });
  });
});
