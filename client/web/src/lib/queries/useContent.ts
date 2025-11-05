/**
 * Content Query Hooks
 * TanStack Query hooks for content operations with optimistic updates
 * Reference: /docs/design/ui-framework-spec.md - Section 5
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useContentStore } from '@/stores/contentStore';
import { mockContentService } from '@/lib/services/mock-api';
import { ContentDTO } from '@/types/content';
import { useEffect } from 'react';

/**
 * Query keys factory for content-related queries
 */
export const contentQueryKeys = {
  all: ['content'] as const,
  lists: () => [...contentQueryKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...contentQueryKeys.lists(), { filters }] as const,
  details: () => [...contentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentQueryKeys.details(), id] as const,
};

/**
 * Hook to fetch all contents with store sync
 */
export function useContents() {
  const { setLoading, setError } = useContentStore();

  const query = useQuery({
    queryKey: contentQueryKeys.lists(),
    queryFn: async () => {
      const { contents } = await mockContentService.getContents();
      return contents;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount) => failureCount < 3,
  });

  useEffect(() => {
    setLoading(query.isLoading);
    if (query.isError) {
      const message = query.error instanceof Error ? query.error.message : 'Failed to fetch contents';
      setError(message);
    }
  }, [query.isLoading, query.isError, query.error, setLoading, setError]);

  return query;
}

/**
 * Hook to fetch a single content by ID
 */
export function useContent(id: string) {
  const { setCurrentContent, setLoading, setError } = useContentStore();

  const query = useQuery({
    queryKey: contentQueryKeys.detail(id),
    queryFn: async () => {
      const { content } = await mockContentService.getContent(id);
      return content;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: (failureCount) => failureCount < 2,
  });

  useEffect(() => {
    if (query.isSuccess && query.data) {
      setCurrentContent(query.data);
      setError(null);
    } else if (query.isError) {
      const message = query.error instanceof Error ? query.error.message : 'Failed to fetch content';
      setError(message);
    }
    setLoading(query.isLoading);
  }, [query.data, query.isSuccess, query.isError, query.error, query.isLoading, setCurrentContent, setError, setLoading]);

  return query;
}

/**
 * Hook for creating new content with optimistic updates
 */
export function useCreateContent() {
  const queryClient = useQueryClient();
  const { setLoading: setStoreLoading, setSaving } = useContentStore();

  return useMutation({
    mutationFn: async (data: Omit<ContentDTO, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'sanitizedContent'>) => {
      setSaving(true);
      try {
        const { content } = await mockContentService.createContent(data);
        return content;
      } finally {
        setSaving(false);
      }
    },
    onMutate: (newContent) => {
      setStoreLoading(true);
      // Optimistic update - add to list
      queryClient.setQueryData<ContentDTO[]>(
        contentQueryKeys.lists(),
        (old) =>
          old
            ? [
                ...old,
                {
                  ...newContent,
                  id: `temp-${Date.now()}`,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  version: 1,
                  sanitizedContent: newContent.content,
                },
              ]
            : undefined
      );
    },
    onError: () => {
      // Invalidate list on error to refetch
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.lists(),
      });
    },
    onSuccess: () => {
      // Invalidate all content queries to refetch
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.all,
      });
    },
    onSettled: () => {
      setStoreLoading(false);
    },
  });
}

/**
 * Hook for updating content with optimistic updates
 */
export function useUpdateContent(id: string) {
  const queryClient = useQueryClient();
  const { setSaving } = useContentStore();

  return useMutation({
    mutationFn: async (updates: Partial<Omit<ContentDTO, 'id' | 'userId'>>) => {
      setSaving(true);
      try {
        const { content } = await mockContentService.updateContent(id, updates);
        return content;
      } finally {
        setSaving(false);
      }
    },
    onMutate: (updates) => {
      // Save old data for rollback
      const previous = queryClient.getQueryData(contentQueryKeys.detail(id));

      // Optimistic update
      queryClient.setQueryData<ContentDTO>(contentQueryKeys.detail(id), (old) =>
        old
          ? {
              ...old,
              ...updates,
              updatedAt: new Date(),
            }
          : undefined
      );

      return previous;
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context) {
        queryClient.setQueryData(contentQueryKeys.detail(id), context);
      }
    },
    onSuccess: (data) => {
      // Update detail query
      queryClient.setQueryData(contentQueryKeys.detail(id), data);
      // Invalidate list to reflect changes
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.lists(),
      });
    },
  });
}

/**
 * Hook for deleting content
 */
export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await mockContentService.deleteContent(id);
    },
    onSuccess: (_data, variables) => {
      // Remove from detail query
      queryClient.removeQueries({
        queryKey: contentQueryKeys.detail(variables),
      });
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.lists(),
      });
    },
  });
}
