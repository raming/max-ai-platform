/**
 * Authentication Query Hooks
 * TanStack Query hooks for authentication operations
 * Reference: /docs/design/ui-framework-spec.md - Section 5
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { mockAuthService } from '@/lib/services/mock-api';

/**
 * Query keys factory for auth-related queries
 */
export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'currentUser'] as const,
};

/**
 * Hook to fetch current user with automatic persistence
 */
export function useCurrentUser() {
  const { token } = useAuthStore();

  return useQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const { user } = await mockAuthService.getCurrentUser(token);
      return user;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 401/403 (auth errors)
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook for user login mutation with optimistic updates
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const { login: storeLogin, setError: setStoreError, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { user, token } = await mockAuthService.login(email, password);
      return { user, token };
    },
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      const { user, token } = data;
      storeLogin(user, token);
      // Invalidate queries after successful login
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.all,
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Login failed';
      setStoreError(message);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

/**
 * Hook for user logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const { logout: storeLogout, token } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('No token to logout');
      await mockAuthService.logout(token);
    },
    onSuccess: () => {
      storeLogout();
      // Clear all auth-related queries
      queryClient.removeQueries({
        queryKey: authQueryKeys.all,
      });
    },
  });
}

/**
 * Hook for user profile updates
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      // Simulate profile update API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(updates);
        }, 400);
      });
    },
    onMutate: (updates) => {
      // Optimistic update
      const previousUser = queryClient.getQueryData(authQueryKeys.currentUser());
      updateUser(updates as Parameters<typeof updateUser>[0]);
      return previousUser;
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context) {
        queryClient.setQueryData(authQueryKeys.currentUser(), context);
      }
    },
    onSuccess: () => {
      // Invalidate queries after update
      queryClient.invalidateQueries({
        queryKey: authQueryKeys.currentUser(),
      });
    },
  });
}
