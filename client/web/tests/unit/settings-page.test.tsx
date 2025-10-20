import React from 'react';

// Simple smoke test to verify DEV-UI-08 components can be imported
describe('DEV-UI-08 Content Editing Integration - Smoke Test', () => {
  test('QuillEditor can be dynamically imported', async () => {
    // Test that the dynamic import works without SSR issues
    const QuillEditor = (await import('@max-ai/ui-editor')).QuillEditor;

    // Verify it's a function/component
    expect(typeof QuillEditor).toBe('function');
  });

  test('Settings page can be imported', async () => {
    // Test that the settings page can be imported without errors
    const SettingsPage = (await import('../../app/(dashboard)/settings/page')).default;

    // Verify it's a function/component
    expect(typeof SettingsPage).toBe('function');
  });

  test('User profile page can be imported', async () => {
    // Test that the user profile page can be imported without errors
    const UserProfilePage = (await import('../../app/(dashboard)/users/[id]/page')).default;

    // Verify it's a function/component
    expect(typeof UserProfilePage).toBe('function');
  });
});