/**
 * Content Zustand Store
 * Client-side state management for content editor
 * Reference: /docs/design/content-editing/DEV-UI-08-specification.md - Section 4.3
 */

import { create } from 'zustand';
import { ContentDTO } from '@/types/content';

/**
 * Content Store Interface
 * Manages client-side state for the content editor
 */
export interface ContentStore {
  // State
  currentContent: ContentDTO | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  unsavedChanges: boolean;
  editMode: 'edit' | 'preview';

  // Actions - Content Management
  setCurrentContent: (content: ContentDTO | null) => void;
  setContent: (html: string) => void; // Updates content and marks unsavedChanges
  resetContent: () => void;

  // Actions - UI State
  setLoading: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  setEditMode: (mode: 'edit' | 'preview') => void;

  // Actions - Combined operations
  resetUnsavedChanges: () => void;
  reset: () => void; // Reset entire store
}

/**
 * Create Zustand store for content state
 * Debug logging enabled for development
 */
export const useContentStore = create<ContentStore>((set) => {
  const logger = (action: string, newState: Partial<ContentStore>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Content Store] ${action}:`, newState);
    }
  };

  return {
    // Initial state
    currentContent: null,
    isLoading: false,
    isSaving: false,
    error: null,
    unsavedChanges: false,
    editMode: 'edit',

    // Content Management Actions
    setCurrentContent: (content) => {
      logger('setCurrentContent', { currentContent: content });
      set({ currentContent: content, unsavedChanges: false });
    },

    setContent: (html) => {
      set((state) => {
        logger('setContent', { unsavedChanges: true });
        if (state.currentContent) {
          return {
            currentContent: {
              ...state.currentContent,
              content: html,
            },
            unsavedChanges: true,
          };
        }
        return { unsavedChanges: true };
      });
    },

    resetContent: () => {
      logger('resetContent', { currentContent: null });
      set({ currentContent: null, unsavedChanges: false });
    },

    // UI State Actions
    setLoading: (isLoading) => {
      logger('setLoading', { isLoading });
      set({ isLoading });
    },

    setSaving: (isSaving) => {
      logger('setSaving', { isSaving });
      set({ isSaving });
    },

    setError: (error) => {
      logger('setError', { error });
      set({ error });
    },

    setUnsavedChanges: (hasChanges) => {
      logger('setUnsavedChanges', { unsavedChanges: hasChanges });
      set({ unsavedChanges: hasChanges });
    },

    setEditMode: (mode) => {
      logger('setEditMode', { editMode: mode });
      set({ editMode: mode });
    },

    // Combined operations
    resetUnsavedChanges: () => {
      logger('resetUnsavedChanges', { unsavedChanges: false });
      set({ unsavedChanges: false });
    },

    reset: () => {
      logger('reset', {
        currentContent: null,
        isLoading: false,
        isSaving: false,
        error: null,
        unsavedChanges: false,
        editMode: 'edit',
      });
      set({
        currentContent: null,
        isLoading: false,
        isSaving: false,
        error: null,
        unsavedChanges: false,
        editMode: 'edit',
      });
    },
  };
});

/**
 * Hook to subscribe to specific store selectors
 * Use this to avoid unnecessary re-renders by selecting only needed state
 */
export const useContentState = () => useContentStore((state) => ({
  currentContent: state.currentContent,
  isLoading: state.isLoading,
  isSaving: state.isSaving,
  error: state.error,
  unsavedChanges: state.unsavedChanges,
  editMode: state.editMode,
}));

/**
 * Hook to select current content only
 */
export const useCurrentContent = () =>
  useContentStore((state) => state.currentContent);

/**
 * Hook to select loading state only
 */
export const useContentLoading = () =>
  useContentStore((state) => ({
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
  }));
