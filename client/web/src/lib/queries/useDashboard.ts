/**
 * Dashboard Query Hooks
 * TanStack Query hooks for dashboard data operations
 * Reference: /docs/design/ui-framework-spec.md - Section 5
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { mockDashboardService } from '@/lib/services/mock-api';

/**
 * Query keys factory for dashboard-related queries
 */
export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  data: () => [...dashboardQueryKeys.all, 'data'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch dashboard data with automatic store sync
 */
export function useDashboardQuery() {
  const { setData, setLoading, setError } = useDashboardStore();

  const query = useQuery({
    queryKey: dashboardQueryKeys.data(),
    queryFn: async () => {
      const { data } = await mockDashboardService.getDashboardData();
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount) => failureCount < 3,
  });

  // Sync with store
  useEffect(() => {
    if (query.isSuccess && query.data) {
      setData(query.data);
      setError(null);
    } else if (query.isError) {
      const message = query.error instanceof Error ? query.error.message : 'Failed to fetch dashboard data';
      setError(message);
    }

    setLoading(query.isLoading);
  }, [query.data, query.isSuccess, query.isError, query.error, query.isLoading, setData, setError, setLoading]);

  return query;
}

/**
 * Hook to manually refresh dashboard data
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  const { setLoading } = useDashboardStore();

  return async () => {
    setLoading(true);
    try {
      await queryClient.refetchQueries({
        queryKey: dashboardQueryKeys.data(),
      });
    } finally {
      setLoading(false);
    }
  };
}

/**
 * Hook to prefetch dashboard data (useful for route prefetching)
 */
export function usePrefetchDashboard() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.prefetchQuery({
      queryKey: dashboardQueryKeys.data(),
      queryFn: async () => {
        const { data } = await mockDashboardService.getDashboardData();
        return data;
      },
      staleTime: 1000 * 60 * 2,
    });
  };
}

/**
 * Hook to invalidate all dashboard queries
 */
export function useInvalidateDashboard() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.all,
    });
  };
}
