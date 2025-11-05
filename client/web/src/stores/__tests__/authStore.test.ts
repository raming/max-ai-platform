/**
 * Auth Store Tests
 * Zustand store tests for authentication
 */

import { renderHook, act } from '@testing-library/react';
import { useAuthStore, useUser, useIsAuthenticated, useAuthLoading } from '@/stores/authStore';
import type { User } from '@/stores/authStore';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('setUser Action', () => {
    it('should set user and mark as authenticated', () => {
      const { result } = renderHook(() => useAuthStore());
      const testUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-1',
        roles: ['admin'],
      };

      act(() => {
        result.current.setUser(testUser);
      });

      expect(result.current.user).toEqual(testUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear user and mark as not authenticated when setting null', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login Action', () => {
    it('should set user, token, and authenticated state', () => {
      const { result } = renderHook(() => useAuthStore());
      const testUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-1',
        roles: ['admin'],
      };
      const token = 'test-token';

      act(() => {
        result.current.login(testUser, token);
      });

      expect(result.current.user).toEqual(testUser);
      expect(result.current.token).toBe(token);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('logout Action', () => {
    it('should clear user and token', () => {
      const { result } = renderHook(() => useAuthStore());
      const testUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-1',
        roles: ['admin'],
      };

      act(() => {
        result.current.login(testUser, 'token');
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeUndefined();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('updateUser Action', () => {
    it('should update user properties', () => {
      const { result } = renderHook(() => useAuthStore());
      const testUser: User = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-1',
        roles: ['admin'],
      };

      act(() => {
        result.current.setUser(testUser);
      });

      act(() => {
        result.current.updateUser({ name: 'Updated Name' });
      });

      expect(result.current.user?.name).toBe('Updated Name');
      expect(result.current.user?.email).toBe('test@example.com');
    });
  });

  describe('Selectors', () => {
    it('useUser should return only user', () => {
      const { result } = renderHook(() => useUser());
      expect(result.current).toBeNull();
    });

    it('useIsAuthenticated should return only auth status', () => {
      const { result } = renderHook(() => useIsAuthenticated());
      expect(result.current).toBe(false);
    });

    it('useAuthLoading should return only loading state', () => {
      const { result } = renderHook(() => useAuthLoading());
      expect(result.current).toBe(true);
    });
  });

  describe('reset Action', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(false);
        result.current.setError('Some error');
        result.current.reset();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });
});
