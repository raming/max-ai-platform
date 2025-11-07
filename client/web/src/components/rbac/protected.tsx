'use client';

import React, { ReactNode } from 'react';
import { useHasPermission, useHasRole, Permission } from '@/lib/hooks/rbac';
import { useFeatureEnabled, Feature } from '@/lib/hooks/feature-flags';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface ProtectedComponentProps {
  children: ReactNode;
  requiredPermissions?: Permission | Permission[];
  requiredRoles?: string | string[];
  requiredFeatures?: Feature | Feature[];
  fallback?: ReactNode;
  showLocked?: boolean;
}

/**
 * Component wrapper that protects content based on permissions, roles, and features
 */
export function Protected({
  children,
  requiredPermissions,
  requiredRoles,
  requiredFeatures,
  fallback,
  showLocked = true,
}: ProtectedComponentProps) {
  // Always call hooks at the top level, not conditionally
  const hasPermission = useHasPermission(requiredPermissions ?? []);
  const hasRole = useHasRole(requiredRoles ?? []);
  const hasFeature = useFeatureEnabled(requiredFeatures ?? []);

  const isAllowed = hasPermission && hasRole && hasFeature;

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showLocked) {
    return null;
  }

  return (
    <Card className="border-dashed border-yellow-300 bg-yellow-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-yellow-600" />
          <CardTitle className="text-sm text-yellow-900">Access Restricted</CardTitle>
        </div>
        <CardDescription className="text-yellow-800">
          You don&apos;t have permission to view this content.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

interface ProtectedActionProps {
  onClick: () => void;
  children: ReactNode;
  requiredPermissions?: Permission | Permission[];
  requiredRoles?: string | string[];
  requiredFeatures?: Feature | Feature[];
  disabledMessage?: string;
  className?: string;
}

/**
 * Button wrapper that shows disabled state when user lacks permissions
 */
export function ProtectedAction({
  onClick,
  children,
  requiredPermissions,
  requiredRoles,
  requiredFeatures,
  disabledMessage,
  className,
}: ProtectedActionProps) {
  // Always call hooks at the top level, not conditionally
  const hasPermission = useHasPermission(requiredPermissions ?? []);
  const hasRole = useHasRole(requiredRoles ?? []);
  const hasFeature = useFeatureEnabled(requiredFeatures ?? []);

  const isAllowed = hasPermission && hasRole && hasFeature;

  return (
    <div
      className={className}
      title={!isAllowed ? disabledMessage || 'You do not have permission to perform this action' : undefined}
    >
      <button
        onClick={onClick}
        disabled={!isAllowed}
        className={`${!isAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {children}
      </button>
    </div>
  );
}

interface FeatureGatedProps {
  children: ReactNode;
  feature: Feature | Feature[];
  fallback?: ReactNode;
}

/**
 * Component that only renders if feature flag is enabled
 */
export function FeatureGated({ children, feature, fallback }: FeatureGatedProps) {
  const isEnabled = useFeatureEnabled(feature);

  return isEnabled ? <>{children}</> : <>{fallback || null}</>;
}

interface RoleBasedProps {
  children: ReactNode;
  roles: string | string[];
  fallback?: ReactNode;
}

/**
 * Component that only renders for specific roles
 */
export function RoleBased({ children, roles, fallback }: RoleBasedProps) {
  const hasRole = useHasRole(roles);

  return hasRole ? <>{children}</> : <>{fallback || null}</>;
}
