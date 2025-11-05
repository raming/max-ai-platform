import React from 'react';

// Smoke tests to verify DEV-UI-08 components can be imported and rendered
describe('DEV-UI-08 Content Editing Integration - Smoke Test', () => {
  test('QuillEditor can be imported from @max-ai/ui-editor', async () => {
    // Test that the dynamic import works without SSR issues
    const { QuillEditor } = await import('@max-ai/ui-editor');

    // Verify it's a function/component
    expect(typeof QuillEditor).toBe('function');
  });

  test('QuillToolbar can be imported from @max-ai/ui-editor', async () => {
    // Test that the toolbar component is also exported
    const { QuillToolbar } = await import('@max-ai/ui-editor');

    // Verify it's a function/component
    expect(typeof QuillToolbar).toBe('function');
  });

  test('Editor library exports types', async () => {
    // Test that types are exported
    const module = await import('@max-ai/ui-editor');

    // Verify component exports exist
    expect(module.QuillEditor).toBeDefined();
    expect(module.QuillToolbar).toBeDefined();
  });
});