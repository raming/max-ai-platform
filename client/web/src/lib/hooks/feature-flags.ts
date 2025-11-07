'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Feature flags for UI gating
 */
export const FEATURES = {
  BETA_DASHBOARD: 'beta-dashboard',
  ADVANCED_ANALYTICS: 'advanced-analytics',
  AI_CONTENT_SUGGESTIONS: 'ai-content-suggestions',
  MULTI_LANGUAGE_SUPPORT: 'multi-language-support',
  DARK_MODE: 'dark-mode',
  CUSTOM_BRANDING: 'custom-branding',
  WEBHOOKS: 'webhooks',
  AUDIT_LOG: 'audit-log',
  SSO: 'sso',
  TWO_FACTOR_AUTH: '2fa',
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

interface FeatureFlagState {
  [key: string]: boolean;
}

/**
 * Mock feature flags - in production this would come from a server
 */
const MOCK_FEATURE_FLAGS: FeatureFlagState = {
  [FEATURES.BETA_DASHBOARD]: true,
  [FEATURES.ADVANCED_ANALYTICS]: true,
  [FEATURES.AI_CONTENT_SUGGESTIONS]: false,
  [FEATURES.MULTI_LANGUAGE_SUPPORT]: true,
  [FEATURES.DARK_MODE]: true,
  [FEATURES.CUSTOM_BRANDING]: false,
  [FEATURES.WEBHOOKS]: true,
  [FEATURES.AUDIT_LOG]: true,
  [FEATURES.SSO]: false,
  [FEATURES.TWO_FACTOR_AUTH]: true,
};

/**
 * Fetch feature flags from server
 * In production, this would call an API endpoint
 */
async function fetchFeatureFlags(): Promise<FeatureFlagState> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // In production: const response = await fetch('/api/features');
  // return response.json();

  return MOCK_FEATURE_FLAGS;
}

/**
 * Hook to get all feature flags
 */
export function useFeatureFlags() {
  const { data: flags = MOCK_FEATURE_FLAGS, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: fetchFeatureFlags,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return { flags, isLoading };
}

/**
 * Hook to check if a feature is enabled
 */
export function useFeatureEnabled(feature: Feature | Feature[]): boolean {
  const { flags } = useFeatureFlags();

  return useMemo(() => {
    const features = Array.isArray(feature) ? feature : [feature];
    return features.every((f) => flags[f] === true);
  }, [flags, feature]);
}

/**
 * Hook to check if any of the features are enabled
 */
export function useHasAnyFeature(features: Feature[]): boolean {
  const { flags } = useFeatureFlags();

  return useMemo(() => {
    return features.some((f) => flags[f] === true);
  }, [flags, features]);
}

/**
 * Hook to get enabled features
 */
export function useEnabledFeatures(): Feature[] {
  const { flags } = useFeatureFlags();

  return useMemo(() => {
    return Object.entries(flags)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature as Feature);
  }, [flags]);
}

/**
 * Context provider for feature flags (optional, for components that need flags)
 */
export function useFeatureFlagsContext() {
  return useFeatureFlags();
}
