/**
 * Authentication Zustand Store
 * Manages user authentication state with persistence
 * Reference: /docs/design/ui-framework-spec.md - Section 4.3
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * User interface representing authenticated user
 */
export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
  avatar?: string;
  lastLogin?: Date;
}

/**
 * Auth Store Interface
 * Manages authentication state
 */
export interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token?: string;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  reset: () => void;
}

/**
 * Create Zustand auth store with persistence middleware
 * Persists user info and token to localStorage
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      token: undefined,

      // Actions
      setUser: (user) => {
        const isAuth = user !== null;
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Auth Store] setUser:', { user, isAuthenticated: isAuth });
        }
        set({ user, isAuthenticated: isAuth });
      },

      setLoading: (isLoading) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Auth Store] setLoading:', { isLoading });
        }
        set({ isLoading });
      },

      setError: (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Auth Store] setError:', { error });
        }
        set({ error });
      },

      setToken: (token) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Auth Store] setToken');
        }
        set({ token });
      },

      login: (user, token) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Auth Store] login:', { user });
        }
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      logout: () => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Auth Store] logout');
        }
        set({
          user: null,
          token: undefined,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      updateUser: (updates) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Auth Store] updateUser:', { updates });
        }
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      reset: () => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Auth Store] reset');
        }
        set({
          user: null,
          isAuthenticated: false,
          isLoading: true,
          error: null,
          token: undefined,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Selector hook for authentication state
 */
export const useAuthState = () =>
  useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
  }));

/**
 * Selector hook for user info only
 */
export const useUser = () => useAuthStore((state) => state.user);

/**
 * Selector hook for authentication status
 */
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);

/**
 * Selector hook for loading state
 */
export const useAuthLoading = () =>
  useAuthStore((state) => state.isLoading);
