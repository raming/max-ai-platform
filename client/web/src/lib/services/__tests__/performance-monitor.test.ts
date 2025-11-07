import {
  performanceMonitor,
  useRenderTime,
  useFetchMetrics,
  useMutationMetrics,
  usePerformanceMetrics,
} from '../performance-monitor';

describe('Performance Monitor', () => {
  beforeEach(() => {
    // Clear metrics before each test
    performanceMonitor.clear();
  });

  describe('performanceMonitor singleton', () => {
    it('exports performanceMonitor instance', () => {
      expect(performanceMonitor).toBeDefined();
      expect(typeof performanceMonitor).toBe('object');
    });

    it('has monitoring methods', () => {
      expect(typeof performanceMonitor.recordMetric).toBe('function');
      expect(typeof performanceMonitor.measureAsync).toBe('function');
      expect(typeof performanceMonitor.measureSync).toBe('function');
      expect(typeof performanceMonitor.getMetrics).toBe('function');
      expect(typeof performanceMonitor.clear).toBe('function');
    });
  });

  describe('recordMetric', () => {
    it('records a metric', () => {
      performanceMonitor.recordMetric('test-metric', 100);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test-metric');
      expect(metrics[0].value).toBe(100);
    });

    it('records metrics with metadata', () => {
      performanceMonitor.recordMetric('test-metric', 150, {
        endpoint: '/api/test',
      });
      const metrics = performanceMonitor.getMetrics();
      expect(metrics[0].metadata).toEqual({ endpoint: '/api/test' });
    });

    it('adds timestamp to each metric', () => {
      const beforeTime = Date.now();
      performanceMonitor.recordMetric('test-metric', 100);
      const afterTime = Date.now();

      const metrics = performanceMonitor.getMetrics();
      const metricTime = new Date(metrics[0].timestamp).getTime();

      expect(metricTime).toBeGreaterThanOrEqual(beforeTime);
      expect(metricTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('measureSync', () => {
    it('measures synchronous function execution time', () => {
      const result = performanceMonitor.measureSync('sync-test', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBe(499500);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('sync-test');
      expect(metrics[0].value).toBeGreaterThan(0);
    });

    it('records metadata for sync measurements', () => {
      performanceMonitor.measureSync(
        'sync-test',
        () => 42,
        { operation: 'calculation' }
      );

      const metrics = performanceMonitor.getMetrics();
      expect(metrics[0].metadata).toEqual({
        operation: 'calculation',
        status: 'success',
      });
    });
  });

  describe('measureAsync', () => {
    it('measures asynchronous function execution time', async () => {
      const result = await performanceMonitor.measureAsync('async-test', () =>
        Promise.resolve(42)
      );

      expect(result).toBe(42);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('async-test');
      expect(metrics[0].value).toBeGreaterThan(0);
    });

    it('handles async function errors', async () => {
      try {
        await performanceMonitor.measureAsync('error-test', () =>
          Promise.reject(new Error('Test error'))
        );
      } catch {
        // Expected error
      }

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThan(0);
    });

    it('records metadata for async measurements', async () => {
      await performanceMonitor.measureAsync(
        'async-test',
        () => Promise.resolve(42),
        { endpoint: '/api/users' }
      );

      const metrics = performanceMonitor.getMetrics();
      expect(metrics[0].metadata).toEqual({
        endpoint: '/api/users',
        status: 'success',
      });
    });
  });

  describe('getMetrics', () => {
    it('returns empty array initially', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toEqual([]);
    });

    it('returns all recorded metrics', () => {
      performanceMonitor.recordMetric('metric1', 100);
      performanceMonitor.recordMetric('metric2', 200);
      performanceMonitor.recordMetric('metric3', 300);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(3);
    });

    it('returns metrics in order of recording', () => {
      performanceMonitor.recordMetric('first', 100);
      performanceMonitor.recordMetric('second', 200);
      performanceMonitor.recordMetric('third', 300);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics[0].name).toBe('first');
      expect(metrics[1].name).toBe('second');
      expect(metrics[2].name).toBe('third');
    });
  });

  describe('clear', () => {
    it('clears all metrics', () => {
      performanceMonitor.recordMetric('metric1', 100);
      performanceMonitor.recordMetric('metric2', 200);

      expect(performanceMonitor.getMetrics()).toHaveLength(2);

      performanceMonitor.clear();

      expect(performanceMonitor.getMetrics()).toHaveLength(0);
    });
  });

  describe('metric constraints', () => {
    it('enforces maximum metric limit', () => {
      // Record more than 100 metrics
      for (let i = 0; i < 150; i++) {
        performanceMonitor.recordMetric(`metric-${i}`, 100 + i);
      }

      const metrics = performanceMonitor.getMetrics();
      // Should maintain circular buffer of max 100 metrics
      expect(metrics.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance hooks', () => {
    it('useRenderTime is a function', () => {
      expect(typeof useRenderTime).toBe('function');
    });

    it('useFetchMetrics is a function', () => {
      expect(typeof useFetchMetrics).toBe('function');
    });

    it('useMutationMetrics is a function', () => {
      expect(typeof useMutationMetrics).toBe('function');
    });

    it('usePerformanceMetrics is a function', () => {
      expect(typeof usePerformanceMetrics).toBe('function');
    });
  });

  describe('metric object structure', () => {
    it('metrics have required properties', () => {
      performanceMonitor.recordMetric('test', 100);
      const metrics = performanceMonitor.getMetrics();
      const metric = metrics[0];

      expect(metric).toHaveProperty('name');
      expect(metric).toHaveProperty('value');
      expect(metric).toHaveProperty('timestamp');
      expect(typeof metric.name).toBe('string');
      expect(typeof metric.value).toBe('number');
      expect(typeof metric.timestamp).toBe('string');
    });

    it('metric values are always positive numbers', () => {
      performanceMonitor.recordMetric('test1', 100);
      performanceMonitor.recordMetric('test2', 1);
      performanceMonitor.recordMetric('test3', 1000000);

      const metrics = performanceMonitor.getMetrics();
      metrics.forEach((metric) => {
        expect(metric.value).toBeGreaterThanOrEqual(0);
        expect(typeof metric.value).toBe('number');
      });
    });
  });
});
