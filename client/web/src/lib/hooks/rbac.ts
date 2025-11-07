'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/stores';

/**
 * Available permissions for role-based access control
 */
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_EDIT: 'dashboard:edit',

  // Content
  CONTENT_CREATE: 'content:create',
  CONTENT_READ: 'content:read',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',
  CONTENT_PUBLISH: 'content:publish',

  // Users
  USERS_MANAGE: 'users:manage',
  USERS_VIEW: 'users:view',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',

  // Analytics
  ANALYTICS_VIEW: 'analytics:view',

  // Admin
  ADMIN_PANEL: 'admin:panel',
  ADMIN_SETTINGS: 'admin:settings',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Role-to-permissions mapping
 */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(PERMISSIONS),
  editor: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.CONTENT_PUBLISH,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  author: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  viewer: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
};

/**
 * Hook to get user permissions based on their roles
 */
export function usePermissions(): Permission[] {
  const { user } = useAuthStore();

  return useMemo(() => {
    if (!user?.roles) return [];

    const permissions = new Set<Permission>();

    user.roles.forEach((role) => {
      const rolePerms = ROLE_PERMISSIONS[role.toLowerCase()];
      if (rolePerms) {
        rolePerms.forEach((perm) => permissions.add(perm));
      }
    });

    return Array.from(permissions);
  }, [user?.roles]);
}

/**
 * Hook to check if user has specific permission
 */
export function useHasPermission(permission: Permission | Permission[]): boolean {
  const permissions = usePermissions();
  const requiredPermissions = Array.isArray(permission) ? permission : [permission];

  return requiredPermissions.every((perm) =>
    permissions.includes(perm)
  );
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const userPermissions = usePermissions();
  return permissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Hook to get user roles
 */
export function useRoles(): string[] {
  const { user } = useAuthStore();
  return user?.roles ?? [];
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(role: string | string[]): boolean {
  const roles = useRoles();
  const requiredRoles = Array.isArray(role) ? role : [role];

  return requiredRoles.some((r) =>
    roles.some((userRole) => userRole.toLowerCase() === r.toLowerCase())
  );
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): boolean {
  return useHasRole('admin');
}
