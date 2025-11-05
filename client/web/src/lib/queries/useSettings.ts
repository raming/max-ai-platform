/**
 * Settings Query Hooks
 * TanStack Query hooks for settings operations
 * Reference: /docs/design/ui-framework-spec.md - Section 5
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/settingsStore';
import { mockSettingsService } from '@/lib/services/mock-api';
import { useEffect } from 'react';

/**
 * Query keys factory for settings-related queries
 */
export const settingsQueryKeys = {
  all: ['settings'] as const,
  list: () => [...settingsQueryKeys.all, 'list'] as const,
  detail: (key?: string) =>
    key ? [...settingsQueryKeys.all, 'detail', key] : [...settingsQueryKeys.all, 'detail'] as const,
};

/**
 * Hook to fetch all settings with store sync
 */
export function useSettings() {
  const { updateSettings, setLoading, setError } = useSettingsStore();

  const query = useQuery({
    queryKey: settingsQueryKeys.list(),
    queryFn: async () => {
      const { settings } = await mockSettingsService.getSettings();
      return settings;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: (failureCount) => failureCount < 2,
  });

  useEffect(() => {
    if (query.isSuccess && query.data) {
      updateSettings(query.data);
      setError(null);
    } else if (query.isError) {
      const message = query.error instanceof Error ? query.error.message : 'Failed to fetch settings';
      setError(message);
    }
    setLoading(query.isLoading);
  }, [query.data, query.isSuccess, query.isError, query.error, query.isLoading, updateSettings, setError, setLoading]);

  return query;
}

/**
 * Hook for updating settings with optimistic updates
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { updateSettings: updateLocalSettings, setSaving, setError } = useSettingsStore();

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { settings } = await mockSettingsService.updateSettings(updates);
      return settings;
    },
    onMutate: (updates) => {
      // Save old settings for rollback
      const previousSettings = queryClient.getQueryData(settingsQueryKeys.list());

      // Optimistic update local store
      updateLocalSettings(updates);

      return previousSettings;
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context) {
        queryClient.setQueryData(settingsQueryKeys.list(), context);
        if (context && typeof context === 'object') {
          updateLocalSettings(context as Record<string, unknown>);
        }
      }
      setError('Failed to update settings');
    },
    onSuccess: (data) => {
      // Update query cache
      queryClient.setQueryData(settingsQueryKeys.list(), data);
      setSaving(false);
      setError(null);
    },
    onSettled: () => {
      setSaving(false);
    },
  });
}

/**
 * Hook to reset settings to defaults
 */
export function useResetSettings() {
  const queryClient = useQueryClient();
  const { reset: resetStore } = useSettingsStore();

  return useMutation({
    mutationFn: async () => {
      // Simulate API reset call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            theme: 'system',
            locale: 'en-US',
            pageSize: 20,
          });
        }, 300);
      });
    },
    onSuccess: () => {
      resetStore();
      queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.all,
      });
    },
  });
}

/**
 * Hook to check if settings have been loaded
 */
export function useSettingsLoaded() {
  return useQuery({
    queryKey: settingsQueryKeys.list(),
    queryFn: async () => {
      const { settings } = await mockSettingsService.getSettings();
      return !!settings;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  }).isSuccess;
}
