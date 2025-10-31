/**
 * Content TanStack Query Hooks
 * Server state management for content operations
 * Reference: /docs/design/content-editing/DEV-UI-08-specification.md - Section 4.3
 * 
 * Note: Uses 'any' casts for TanStack Query v5 compatibility with strict TypeScript
 * The strict type inference in TanStack Query v5 requires these casts
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
  ContentDTO,
  ContentListItemDTO,
  SaveContentRequest,
  UpdateContentRequest,
  ExportResponse,
  ContentVersionDTO,
} from '@/types/content';
import { useContentStore } from '@/stores/contentStore';

// Query Keys for cache management
export const contentQueryKeys = {
  all: ['content'] as const,
  lists: () => [...contentQueryKeys.all, 'list'] as const,
  list: (userId: string) => [...contentQueryKeys.lists(), userId] as const,
  details: () => [...contentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentQueryKeys.details(), id] as const,
  versions: () => [...contentQueryKeys.all, 'versions'] as const,
  version: (contentId: string) =>
    [...contentQueryKeys.versions(), contentId] as const,
};

// API base URL (from environment or default)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Fetch a single piece of content by ID
 * Uses GET /api/content/:id
 */
async function fetchContent(id: string): Promise<ContentDTO> {
  const response = await fetch(`${API_BASE_URL}/content/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    console.error(`[DEBUG] Failed to fetch content ${id}:`, response.status);
    throw new Error(`Failed to fetch content: ${response.statusText}`);
  }

  const data = await response.json();
  console.debug(`[DEBUG] Loaded content: ${id}, version: ${data.version}, length: ${data.content.length}`);
  return data;
}

/**
 * Fetch user's content list
 * Uses GET /api/content
 */
async function fetchContentList(): Promise<ContentListItemDTO[]> {
  const response = await fetch(`${API_BASE_URL}/content`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    console.error('[DEBUG] Failed to fetch content list:', response.status);
    throw new Error(`Failed to fetch content list: ${response.statusText}`);
  }

  const data = await response.json();
  console.debug(`[DEBUG] Loaded ${data.length} content items`);
  return data;
}

/**
 * Save new content
 * Uses POST /api/content
 */
async function saveContent(request: SaveContentRequest): Promise<ContentDTO> {
  const response = await fetch(`${API_BASE_URL}/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    console.error('[DEBUG] Failed to save content:', response.status);
    throw new Error(`Failed to save content: ${response.statusText}`);
  }

  const data = await response.json();
  console.debug(`[DEBUG] Content saved: ${data.id}`);
  return data;
}

/**
 * Update existing content
 * Uses PUT /api/content/:id
 */
async function updateContent(request: UpdateContentRequest): Promise<ContentDTO> {
  const response = await fetch(`${API_BASE_URL}/content/${request.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      title: request.title,
      content: request.content,
    }),
  });

  if (!response.ok) {
    console.error(`[DEBUG] Failed to update content ${request.id}:`, response.status);
    throw new Error(`Failed to update content: ${response.statusText}`);
  }

  const data = await response.json();
  console.debug(`[DEBUG] Content updated: ${data.id}, version: ${data.version}`);
  return data;
}

/**
 * Delete content
 * Uses DELETE /api/content/:id
 */
async function deleteContent(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/content/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    console.error(`[DEBUG] Failed to delete content ${id}:`, response.status);
    throw new Error(`Failed to delete content: ${response.statusText}`);
  }

  console.debug(`[DEBUG] Content deleted: ${id}`);
}

/**
 * Export content in specified format
 * Uses POST /api/content/:id/export
 */
async function exportContent(
  contentId: string,
  format: string
): Promise<ExportResponse> {
  const response = await fetch(`${API_BASE_URL}/content/${contentId}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ format }),
  });

  if (!response.ok) {
    console.error(`[DEBUG] Failed to export content ${contentId}:`, response.status);
    throw new Error(`Failed to export content: ${response.statusText}`);
  }

  const data = await response.json();
  console.debug(`[DEBUG] Exporting content: format=${format}, contentId=${contentId}`);
  return data;
}

/**
 * Fetch content version history
 * Uses GET /api/content/:id/versions
 */
async function fetchContentVersions(contentId: string): Promise<ContentVersionDTO[]> {
  const response = await fetch(`${API_BASE_URL}/content/${contentId}/versions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    console.error(`[DEBUG] Failed to fetch versions for ${contentId}:`, response.status);
    throw new Error(`Failed to fetch versions: ${response.statusText}`);
  }

  const data = await response.json();
  console.debug(`[DEBUG] Loaded ${data.length} versions for content ${contentId}`);
  return data;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to load a single piece of content
 * Query: GET /api/content/:id
 */
export function useContentQuery(
  contentId: string | undefined
): UseQueryResult<ContentDTO> {
  const { setLoading } = useContentStore();

  return useQuery<ContentDTO>({
    queryKey: contentId ? contentQueryKeys.detail(contentId) : ['content-none'],
    queryFn: () => {
      if (!contentId) throw new Error('Content ID is required');
      setLoading(true);
      return fetchContent(contentId);
    },
    enabled: !!contentId,
  } as any);
}

/**
 * Hook to load user's content list
 * Query: GET /api/content
 */
export function useContentListQuery(): UseQueryResult<ContentListItemDTO[]> {
  const { setError } = useContentStore();

  const query = useQuery<ContentListItemDTO[]>({
    queryKey: contentQueryKeys.list('current-user'),
    queryFn: fetchContentList,
  } as any);

  // Handle errors separately
  if (query.isError) {
    const errorMsg = (query.error as any)?.message || 'Failed to load content list';
    setError(errorMsg);
    console.error('[DEBUG] Error loading content list:', errorMsg);
  }

  return query;
}

/**
 * Hook to save new content
 * Mutation: POST /api/content
 */
export function useSaveContentMutation(): UseMutationResult<
  ContentDTO,
  Error,
  SaveContentRequest
> {
  const queryClient = useQueryClient();
  const { setSaving, setError } = useContentStore();

  return useMutation({
    mutationFn: (request: SaveContentRequest) => {
      setSaving(true);
      return saveContent(request);
    },
    onSuccess: (data: ContentDTO) => {
      setSaving(false);
      setError(null);
      // Invalidate content list to refresh it
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.lists(),
      });
      console.debug(`[DEBUG] Content saved successfully: ${data.id}`);
    },
    onError: (error: any) => {
      setSaving(false);
      const errorMsg = error?.message || 'Failed to save content';
      setError(errorMsg);
      console.error('[DEBUG] Error saving content:', errorMsg);
    },
  } as any);
}

/**
 * Hook to update existing content
 * Mutation: PUT /api/content/:id
 */
export function useUpdateContentMutation(): UseMutationResult<
  ContentDTO,
  Error,
  UpdateContentRequest
> {
  const queryClient = useQueryClient();
  const { setSaving, setError } = useContentStore();

  return useMutation({
    mutationFn: (request: UpdateContentRequest) => {
      setSaving(true);
      return updateContent(request);
    },
    onSuccess: (data: ContentDTO) => {
      setSaving(false);
      setError(null);
      // Invalidate specific content and list
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.lists(),
      });
      console.debug(`[DEBUG] Content updated successfully: ${data.id}`);
    },
    onError: (error: any) => {
      setSaving(false);
      const errorMsg = error?.message || 'Failed to update content';
      setError(errorMsg);
      console.error('[DEBUG] Error updating content:', errorMsg);
    },
  } as any);
}

/**
 * Hook to delete content
 * Mutation: DELETE /api/content/:id
 */
export function useDeleteContentMutation(): UseMutationResult<
  void,
  Error,
  string
> {
  const queryClient = useQueryClient();
  const { setSaving, setError } = useContentStore();

  return useMutation({
    mutationFn: (contentId: string) => {
      setSaving(true);
      return deleteContent(contentId);
    },
    onSuccess: () => {
      setSaving(false);
      setError(null);
      // Invalidate content list
      queryClient.invalidateQueries({
        queryKey: contentQueryKeys.lists(),
      });
      console.debug('[DEBUG] Content deleted successfully');
    },
    onError: (error: any) => {
      setSaving(false);
      const errorMsg = error?.message || 'Failed to delete content';
      setError(errorMsg);
      console.error('[DEBUG] Error deleting content:', errorMsg);
    },
  } as any);
}

/**
 * Hook to export content in various formats
 * Mutation: POST /api/content/:id/export
 */
export function useExportContentMutation(): UseMutationResult<
  ExportResponse,
  Error,
  { contentId: string; format: string }
> {
  const { setError } = useContentStore();

  return useMutation({
    mutationFn: ({ contentId, format }: { contentId: string; format: string }) =>
      exportContent(contentId, format),
    onSuccess: (data: ExportResponse) => {
      setError(null);
      console.debug(`[DEBUG] Export successful: format=${data.mimeType}`);
    },
    onError: (error: any) => {
      const errorMsg = error?.message || 'Failed to export content';
      setError(errorMsg);
      console.error('[DEBUG] Error exporting content:', errorMsg);
    },
  } as any);
}

/**
 * Hook to load content version history
 * Query: GET /api/content/:id/versions
 */
export function useContentVersionsQuery(
  contentId: string | undefined
): UseQueryResult<ContentVersionDTO[]> {
  const { setError } = useContentStore();

  const query = useQuery<ContentVersionDTO[]>({
    queryKey: contentId ? contentQueryKeys.version(contentId) : ['versions-none'],
    queryFn: () => {
      if (!contentId) throw new Error('Content ID is required');
      return fetchContentVersions(contentId);
    },
    enabled: !!contentId,
  } as any);

  // Handle errors separately
  if (query.isError) {
    const errorMsg = (query.error as any)?.message || 'Failed to load version history';
    setError(errorMsg);
    console.error('[DEBUG] Error loading versions:', errorMsg);
  }

  return query;
}
