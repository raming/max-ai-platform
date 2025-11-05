/**
 * Dashboard Zustand Store
 * Manages dashboard UI state (active tab, sidebar, filters)
 * Reference: /docs/design/ui-framework-spec.md - Section 4.3
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Dashboard UI state
 */
export interface DashboardUIState {
  activeTab: string;
  sidebarOpen: boolean;
  selectedFilters: Record<string, string[]>;
  sortBy: 'name' | 'date' | 'status';
  sortOrder: 'asc' | 'desc';
}

/**
 * Dashboard data state (from API)
 */
export interface DashboardData {
  totalUsers: number;
  totalContents: number;
  totalSettings: number;
  recentActivity: Array<{
    id: string;
    type: 'content' | 'user' | 'setting';
    title: string;
    timestamp: string;
  }>;
  stats: {
    contentCreatedToday: number;
    usersActiveToday: number;
    settingsChangedToday: number;
  };
}

/**
 * Dashboard Store Interface
 */
export interface DashboardStore {
  // UI State
  ui: DashboardUIState;
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;

  // UI Actions
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setFilters: (filters: Record<string, string[]>) => void;
  setSortBy: (sortBy: 'name' | 'date' | 'status') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;

  // Data Actions
  setData: (data: DashboardData) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Combined actions
  reset: () => void;
}

const defaultUIState: DashboardUIState = {
  activeTab: 'overview',
  sidebarOpen: true,
  selectedFilters: {},
  sortBy: 'date',
  sortOrder: 'desc',
};

/**
 * Create Zustand dashboard store with persistence
 */
export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      // Initial state
      ui: defaultUIState,
      data: null,
      isLoading: false,
      error: null,

      // UI Actions
      setActiveTab: (tab) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Dashboard Store] setActiveTab:', { tab });
        }
        set((state) => ({
          ui: { ...state.ui, activeTab: tab },
        }));
      },

      toggleSidebar: () => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Dashboard Store] toggleSidebar');
        }
        set((state) => ({
          ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
        }));
      },

      setSidebarOpen: (open) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Dashboard Store] setSidebarOpen:', { open });
        }
        set((state) => ({
          ui: { ...state.ui, sidebarOpen: open },
        }));
      },

      setFilters: (filters) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Dashboard Store] setFilters:', { filters });
        }
        set((state) => ({
          ui: { ...state.ui, selectedFilters: filters },
        }));
      },

      setSortBy: (sortBy) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Dashboard Store] setSortBy:', { sortBy });
        }
        set((state) => ({
          ui: { ...state.ui, sortBy },
        }));
      },

      setSortOrder: (order) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Dashboard Store] setSortOrder:', { order });
        }
        set((state) => ({
          ui: { ...state.ui, sortOrder: order },
        }));
      },

      // Data Actions
      setData: (data) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Dashboard Store] setData:', { data });
        }
        set({ data, error: null });
      },

      setLoading: (isLoading) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Dashboard Store] setLoading:', { isLoading });
        }
        set({ isLoading });
      },

      setError: (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Dashboard Store] setError:', { error });
        }
        set({ error });
      },

      reset: () => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Dashboard Store] reset');
        }
        set({
          ui: defaultUIState,
          data: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'dashboard-storage',
      partialize: (state) => ({
        ui: state.ui,
      }),
    }
  )
);

/**
 * Selector hook for dashboard UI state
 */
export const useDashboardUI = () =>
  useDashboardStore((state) => state.ui);

/**
 * Selector hook for dashboard data
 */
export const useDashboardData = () =>
  useDashboardStore((state) => ({
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
  }));

/**
 * Selector hook for sidebar state
 */
export const useSidebarOpen = () =>
  useDashboardStore((state) => state.ui.sidebarOpen);
