'use client';

import { useEffect, useCallback } from 'react';

/**
 * Performance metrics tracked
 */
interface PerformanceMetric {
  name: string;
  value: number; // milliseconds
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Performance monitoring service
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100;

  /**
   * Record a custom performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only recent metrics to avoid memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${name}: ${value}ms`, metadata);
    }

    // Send to analytics service (in production)
    this.sendToAnalytics(metric);
  }

  /**
   * Measure function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { ...metadata, status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { ...metadata, status: 'error', error: String(error) });
      throw error;
    }
  }

  /**
   * Measure synchronous function execution time
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { ...metadata, status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, { ...metadata, status: 'error', error: String(error) });
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Send metrics to analytics backend (TODO: implement integration)
   */
  private sendToAnalytics(_metric: PerformanceMetric): void {
    // TODO: Send to analytics service (Sentry, DataDog, New Relic, etc.)
    // In production: await apiClient.post('/analytics/metrics', metric);
  }
}

/**
 * Singleton performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook to measure component render time
 */
export function useRenderTime(componentName: string, metadata?: Record<string, unknown>) {
  useEffect(() => {
    // Record when component mounted
    const startTime = performance.now();

    return () => {
      // Record when component unmounted (can calculate render time)
      const endTime = performance.now();
      performanceMonitor.recordMetric(
        `render_${componentName}`,
        endTime - startTime,
        metadata
      );
    };
  }, [componentName, metadata]);
}

/**
 * Hook to measure data fetch performance
 */
export function useFetchMetrics(queryKey: string) {
  return useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      return performanceMonitor.measureAsync(`fetch_${queryKey}`, fn);
    },
    [queryKey]
  );
}

/**
 * Hook to measure mutations
 */
export function useMutationMetrics(mutationName: string) {
  return useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      return performanceMonitor.measureAsync(`mutation_${mutationName}`, fn);
    },
    [mutationName]
  );
}

/**
 * Hook to get performance metrics
 */
export function usePerformanceMetrics() {
  return {
    getMetrics: () => performanceMonitor.getMetrics(),
    recordMetric: (name: string, value: number, metadata?: Record<string, unknown>) =>
      performanceMonitor.recordMetric(name, value, metadata),
  };
}
