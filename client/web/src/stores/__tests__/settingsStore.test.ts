/**
 * Settings Store Tests
 * Zustand store tests for application settings
 */

import { renderHook, act } from '@testing-library/react';
import { useSettingsStore, useSettings, useTheme, useNotificationSettings } from '@/stores/settingsStore';

describe('Settings Store', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useSettingsStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial State', () => {
    it('should initialize with default settings', () => {
      const { result } = renderHook(() => useSettingsStore());
      expect(result.current.settings.theme).toBe('system');
      expect(result.current.settings.locale).toBe('en-US');
      expect(result.current.settings.pageSize).toBe(20);
      expect(result.current.settings.notifications.email).toBe(true);
      expect(result.current.settings.notifications.push).toBe(false);
    });
  });

  describe('Update Settings', () => {
    it('should update theme', () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => {
        result.current.updateTheme('dark');
      });
      expect(result.current.settings.theme).toBe('dark');
    });

    it('should update locale', () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => {
        result.current.updateLocale('es-ES');
      });
      expect(result.current.settings.locale).toBe('es-ES');
    });

    it('should update page size', () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => {
        result.current.updatePageSize(50);
      });
      expect(result.current.settings.pageSize).toBe(50);
    });

    it('should update notification settings', () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => {
        result.current.updateNotifications({ push: true, email: false });
      });
      expect(result.current.settings.notifications.push).toBe(true);
      expect(result.current.settings.notifications.email).toBe(false);
    });

    it('should update privacy settings', () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => {
        result.current.updatePrivacy({ dataCollection: true });
      });
      expect(result.current.settings.privacy.dataCollection).toBe(true);
    });

    it('should update multiple settings at once', () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => {
        result.current.updateSettings({
          theme: 'light',
          locale: 'fr-FR',
          pageSize: 100,
        });
      });
      expect(result.current.settings.theme).toBe('light');
      expect(result.current.settings.locale).toBe('fr-FR');
      expect(result.current.settings.pageSize).toBe(100);
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => {
        result.current.setLoading(true);
      });
      expect(result.current.isLoading).toBe(true);
    });

    it('should set saving state', () => {
      const { result } = renderHook(() => useSettingsStore());
      act(() => {
        result.current.setSaving(true);
      });
      expect(result.current.isSaving).toBe(true);
    });

    it('should set error state', () => {
      const { result } = renderHook(() => useSettingsStore());
      const errorMsg = 'Failed to save settings';
      act(() => {
        result.current.setError(errorMsg);
      });
      expect(result.current.error).toBe(errorMsg);
    });
  });

  describe('Selectors', () => {
    it('useSettings should return all settings', () => {
      const { result } = renderHook(() => useSettings());
      expect(result.current.theme).toBe('system');
      expect(result.current.pageSize).toBe(20);
    });

    it('useTheme should return only theme', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current).toBe('system');
    });

    it('useNotificationSettings should return only notifications', () => {
      const { result } = renderHook(() => useNotificationSettings());
      expect(result.current.email).toBe(true);
      expect(result.current.push).toBe(false);
    });
  });

  describe('reset Action', () => {
    it('should reset to default settings', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.updateTheme('dark');
        result.current.updateLocale('es-ES');
        result.current.setLoading(true);
        result.current.reset();
      });

      expect(result.current.settings.theme).toBe('system');
      expect(result.current.settings.locale).toBe('en-US');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
