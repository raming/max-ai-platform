import {
  usePermissions,
  useHasPermission,
  useHasAnyPermission,
  useRoles,
  useHasRole,
  useIsAdmin,
  PERMISSIONS,
} from '../rbac';

// Test the RBAC hooks directly since they depend on Zustand store
// The store is tested separately in stores/__tests__/authStore.test.ts
describe('RBAC Hooks', () => {
  describe('PERMISSIONS constant', () => {
    it('exports all permission types', () => {
      expect(PERMISSIONS).toHaveProperty('DASHBOARD_VIEW');
      expect(PERMISSIONS).toHaveProperty('CONTENT_CREATE');
      expect(PERMISSIONS).toHaveProperty('CONTENT_PUBLISH');
      expect(PERMISSIONS).toHaveProperty('USERS_MANAGE');
      expect(PERMISSIONS).toHaveProperty('SETTINGS_EDIT');
      expect(PERMISSIONS).toHaveProperty('ANALYTICS_VIEW');
      expect(PERMISSIONS).toHaveProperty('ADMIN_PANEL');
    });

    it('has unique permission values', () => {
      const values = Object.values(PERMISSIONS);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });

    it('permission values follow naming convention', () => {
      Object.values(PERMISSIONS).forEach((perm) => {
        expect(perm).toMatch(/^[a-z]+:[a-z_]+$/);
      });
    });
  });

  describe('Permission type', () => {
    it('is defined correctly', () => {
      const testPerm: typeof PERMISSIONS[keyof typeof PERMISSIONS] = PERMISSIONS.DASHBOARD_VIEW;
      expect(testPerm).toBeDefined();
      expect(typeof testPerm).toBe('string');
    });
  });

  describe('Role-based permissions structure', () => {
    it('has valid permission exports', () => {
      expect(typeof PERMISSIONS.DASHBOARD_VIEW).toBe('string');
      expect(typeof PERMISSIONS.CONTENT_CREATE).toBe('string');
      expect(typeof PERMISSIONS.ADMIN_PANEL).toBe('string');
    });
  });

  describe('RBAC hook definitions', () => {
    it('usePermissions is a function', () => {
      expect(typeof usePermissions).toBe('function');
    });

    it('useHasPermission is a function', () => {
      expect(typeof useHasPermission).toBe('function');
    });

    it('useHasAnyPermission is a function', () => {
      expect(typeof useHasAnyPermission).toBe('function');
    });

    it('useRoles is a function', () => {
      expect(typeof useRoles).toBe('function');
    });

    it('useHasRole is a function', () => {
      expect(typeof useHasRole).toBe('function');
    });

    it('useIsAdmin is a function', () => {
      expect(typeof useIsAdmin).toBe('function');
    });
  });

  describe('Permission categorization', () => {
    it('has dashboard permissions', () => {
      expect(PERMISSIONS.DASHBOARD_VIEW).toBe('dashboard:view');
      expect(PERMISSIONS.DASHBOARD_EDIT).toBe('dashboard:edit');
    });

    it('has content permissions', () => {
      expect(PERMISSIONS.CONTENT_CREATE).toBe('content:create');
      expect(PERMISSIONS.CONTENT_READ).toBe('content:read');
      expect(PERMISSIONS.CONTENT_UPDATE).toBe('content:update');
      expect(PERMISSIONS.CONTENT_DELETE).toBe('content:delete');
      expect(PERMISSIONS.CONTENT_PUBLISH).toBe('content:publish');
    });

    it('has user management permissions', () => {
      expect(PERMISSIONS.USERS_MANAGE).toBe('users:manage');
      expect(PERMISSIONS.USERS_VIEW).toBe('users:view');
    });

    it('has settings permissions', () => {
      expect(PERMISSIONS.SETTINGS_VIEW).toBe('settings:view');
      expect(PERMISSIONS.SETTINGS_EDIT).toBe('settings:edit');
    });

    it('has analytics permissions', () => {
      expect(PERMISSIONS.ANALYTICS_VIEW).toBe('analytics:view');
    });

    it('has admin permissions', () => {
      expect(PERMISSIONS.ADMIN_PANEL).toBe('admin:panel');
      expect(PERMISSIONS.ADMIN_SETTINGS).toBe('admin:settings');
    });
  });
});
