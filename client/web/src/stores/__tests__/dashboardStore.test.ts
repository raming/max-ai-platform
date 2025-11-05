/**
 * Dashboard Store Tests
 * Zustand store tests for dashboard state
 */

import { renderHook, act } from '@testing-library/react';
import { useDashboardStore, useDashboardUI, useSidebarOpen } from '@/stores/dashboardStore';

describe('Dashboard Store', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useDashboardStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial State', () => {
    it('should initialize with default UI state', () => {
      const { result } = renderHook(() => useDashboardStore());
      expect(result.current.ui.activeTab).toBe('overview');
      expect(result.current.ui.sidebarOpen).toBe(true);
      expect(result.current.ui.sortBy).toBe('date');
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('UI State Actions', () => {
    it('should set active tab', () => {
      const { result } = renderHook(() => useDashboardStore());
      act(() => {
        result.current.setActiveTab('analytics');
      });
      expect(result.current.ui.activeTab).toBe('analytics');
    });

    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useDashboardStore());
      expect(result.current.ui.sidebarOpen).toBe(true);
      act(() => {
        result.current.toggleSidebar();
      });
      expect(result.current.ui.sidebarOpen).toBe(false);
      act(() => {
        result.current.toggleSidebar();
      });
      expect(result.current.ui.sidebarOpen).toBe(true);
    });

    it('should set sidebar open state', () => {
      const { result } = renderHook(() => useDashboardStore());
      act(() => {
        result.current.setSidebarOpen(false);
      });
      expect(result.current.ui.sidebarOpen).toBe(false);
    });

    it('should set sort options', () => {
      const { result } = renderHook(() => useDashboardStore());
      act(() => {
        result.current.setSortBy('name');
        result.current.setSortOrder('asc');
      });
      expect(result.current.ui.sortBy).toBe('name');
      expect(result.current.ui.sortOrder).toBe('asc');
    });

    it('should set filters', () => {
      const { result } = renderHook(() => useDashboardStore());
      const filters = { status: ['active'], type: ['content'] };
      act(() => {
        result.current.setFilters(filters);
      });
      expect(result.current.ui.selectedFilters).toEqual(filters);
    });
  });

  describe('Data State Actions', () => {
    it('should set dashboard data', () => {
      const { result } = renderHook(() => useDashboardStore());
      const mockData = {
        totalUsers: 100,
        totalContents: 50,
        totalSettings: 10,
        stats: {
          contentCreatedToday: 5,
          usersActiveToday: 20,
          settingsChangedToday: 2,
        },
        recentActivity: [],
      };

      act(() => {
        result.current.setData(mockData);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useDashboardStore());
      act(() => {
        result.current.setLoading(true);
      });
      expect(result.current.isLoading).toBe(true);
    });

    it('should set error state', () => {
      const { result } = renderHook(() => useDashboardStore());
      const errorMsg = 'Failed to load data';
      act(() => {
        result.current.setError(errorMsg);
      });
      expect(result.current.error).toBe(errorMsg);
    });
  });

  describe('Selectors', () => {
    it('useDashboardUI should return only UI state', () => {
      const { result } = renderHook(() => useDashboardUI());
      expect(result.current.activeTab).toBe('overview');
      expect(result.current.sidebarOpen).toBe(true);
    });

    it('useSidebarOpen should return only sidebar state', () => {
      const { result } = renderHook(() => useSidebarOpen());
      expect(result.current).toBe(true);
    });
  });

  describe('reset Action', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useDashboardStore());

      act(() => {
        result.current.setActiveTab('analytics');
        result.current.setSidebarOpen(false);
        result.current.setLoading(true);
        result.current.reset();
      });

      expect(result.current.ui.activeTab).toBe('overview');
      expect(result.current.ui.sidebarOpen).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeNull();
    });
  });
});
