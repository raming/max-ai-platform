/**
 * Settings Zustand Store
 * Manages application settings and preferences
 * Reference: /docs/design/ui-framework-spec.md - Section 4.3
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Application Settings
 */
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  locale: string;
  pageSize: number;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
  };
}

/**
 * Settings Store Interface
 */
export interface SettingsStore {
  // State
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateLocale: (locale: string) => void;
  updatePageSize: (pageSize: number) => void;
  updateNotifications: (notifications: Partial<AppSettings['notifications']>) => void;
  updatePrivacy: (privacy: Partial<AppSettings['privacy']>) => void;
  setLoading: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  locale: 'en-US',
  pageSize: 20,
  notifications: {
    email: true,
    push: false,
    inApp: true,
  },
  privacy: {
    dataCollection: false,
    analytics: false,
  },
};

/**
 * Create Zustand settings store with persistence
 */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Initial state
      settings: defaultSettings,
      isLoading: false,
      isSaving: false,
      error: null,

      // Actions
      updateSettings: (updates) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Settings Store] updateSettings:', { updates });
        }
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      updateTheme: (theme) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Settings Store] updateTheme:', { theme });
        }
        set((state) => ({
          settings: { ...state.settings, theme },
        }));
      },

      updateLocale: (locale) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Settings Store] updateLocale:', { locale });
        }
        set((state) => ({
          settings: { ...state.settings, locale },
        }));
      },

      updatePageSize: (pageSize) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Settings Store] updatePageSize:', { pageSize });
        }
        set((state) => ({
          settings: { ...state.settings, pageSize },
        }));
      },

      updateNotifications: (notifications) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Settings Store] updateNotifications:', { notifications });
        }
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: { ...state.settings.notifications, ...notifications },
          },
        }));
      },

      updatePrivacy: (privacy) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Settings Store] updatePrivacy:', { privacy });
        }
        set((state) => ({
          settings: {
            ...state.settings,
            privacy: { ...state.settings.privacy, ...privacy },
          },
        }));
      },

      setLoading: (isLoading) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Settings Store] setLoading:', { isLoading });
        }
        set({ isLoading });
      },

      setSaving: (isSaving) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Settings Store] setSaving:', { isSaving });
        }
        set({ isSaving });
      },

      setError: (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Settings Store] setError:', { error });
        }
        set({ error });
      },

      reset: () => {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Settings Store] reset');
        }
        set({
          settings: defaultSettings,
          isLoading: false,
          isSaving: false,
          error: null,
        });
      },
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);

/**
 * Selector hook for all settings
 */
export const useSettings = () =>
  useSettingsStore((state) => state.settings);

/**
 * Selector hook for theme setting
 */
export const useTheme = () =>
  useSettingsStore((state) => state.settings.theme);

/**
 * Selector hook for locale setting
 */
export const useLocale = () =>
  useSettingsStore((state) => state.settings.locale);

/**
 * Selector hook for notification settings
 */
export const useNotificationSettings = () =>
  useSettingsStore((state) => state.settings.notifications);
