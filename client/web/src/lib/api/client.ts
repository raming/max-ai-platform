'use client';

import { useAuthStore } from '@/stores';

/**
 * Generate a unique correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  return `cid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * API error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API request configuration
 */
interface ApiRequestConfig {
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  correlationId?: string;
}

/**
 * API adapter for making authenticated requests with correlation IDs
 */
class ApiAdapter {
  private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '/api';
  private timeout: number = 30000; // 30 seconds

  /**
   * Make an authenticated API request
   */
  async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const { getState } = useAuthStore;
    const { user, token } = getState();
    const correlationId = config.correlationId || generateCorrelationId();

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId,
      ...config.headers,
    };

    // Add authorization if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Validate multi-tenant isolation
    if (user?.tenantId) {
      headers['x-tenant-id'] = user.tenantId;
    }

    const url = new URL(path, this.baseUrl).toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.message || `HTTP ${response.status}`,
          errorData.code,
          errorData.details
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(0, 'Network error - unable to connect to server');
      }

      throw new ApiError(500, 'Unknown error occurred', undefined, error);
    }
  }

  /**
   * GET request
   */
  get<T>(path: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>('GET', path, config);
  }

  /**
   * POST request
   */
  post<T>(path: string, body?: unknown, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>('POST', path, { ...config, body });
  }

  /**
   * PATCH request
   */
  patch<T>(path: string, body?: unknown, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>('PATCH', path, { ...config, body });
  }

  /**
   * DELETE request
   */
  delete<T>(path: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>('DELETE', path, config);
  }
}

/**
 * Singleton API adapter instance
 */
export const apiClient = new ApiAdapter();

/**
 * Hook for using API client with automatic auth handling
 */
export function useApiClient() {
  return apiClient;
}
