/**
 * Index for all Zustand stores
 * Centralizes store exports for easy importing
 */

export { useAuthStore, useAuthState, useUser, useIsAuthenticated, useAuthLoading } from './authStore';
export type { AuthState, User } from './authStore';

export {
  useDashboardStore,
  useDashboardUI,
  useDashboardData,
  useSidebarOpen,
} from './dashboardStore';
export type { DashboardStore, DashboardUIState, DashboardData } from './dashboardStore';

export { useSettingsStore, useSettings, useTheme, useLocale, useNotificationSettings } from './settingsStore';
export type { SettingsStore, AppSettings } from './settingsStore';

export { useContentStore, useContentState, useCurrentContent, useContentLoading } from './contentStore';
export type { ContentStore } from './contentStore';
