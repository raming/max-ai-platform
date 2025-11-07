import { generateCorrelationId, ApiError, apiClient } from '../client';

describe('API Client', () => {
  describe('generateCorrelationId', () => {
    it('generates a correlation ID', () => {
      const cid = generateCorrelationId();
      expect(cid).toBeDefined();
      expect(typeof cid).toBe('string');
    });

    it('follows the cid-{timestamp}-{random} format', () => {
      const cid = generateCorrelationId();
      expect(cid).toMatch(/^cid-\d+-[a-z0-9]+$/);
    });

    it('generates unique correlation IDs', () => {
      const cid1 = generateCorrelationId();
      const cid2 = generateCorrelationId();
      expect(cid1).not.toBe(cid2);
    });

    it('uses current timestamp', () => {
      const before = Date.now();
      const cid = generateCorrelationId();
      const after = Date.now();

      const parts = cid.split('-');
      const timestamp = parseInt(parts[1], 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('ApiError', () => {
    it('creates an error with status and message', () => {
      const error = new ApiError(404, 'Not Found');
      expect(error).toBeInstanceOf(Error);
      expect(error.status).toBe(404);
      expect(error.message).toBe('Not Found');
    });

    it('includes code and details', () => {
      const error = new ApiError(500, 'Server Error', 'INTERNAL_ERROR', {
        endpoint: '/api/test',
      });
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.details).toEqual({ endpoint: '/api/test' });
    });

    it('handles missing code gracefully', () => {
      const error = new ApiError(400, 'Bad Request');
      expect(error.code).toBeUndefined();
    });

    it('is properly recognized as Error', () => {
      const error = new ApiError(500, 'Server Error');
      expect(error instanceof Error).toBe(true);
      expect(error.name).toMatch(/ApiError|Error/);
    });
  });

  describe('ApiAdapter', () => {
    describe('initialization', () => {
      it('apiClient is initialized', () => {
        expect(apiClient).toBeDefined();
      });

      it('apiClient has HTTP methods', () => {
        expect(typeof apiClient.get).toBe('function');
        expect(typeof apiClient.post).toBe('function');
        expect(typeof apiClient.patch).toBe('function');
        expect(typeof apiClient.delete).toBe('function');
        expect(typeof apiClient.request).toBe('function');
      });
    });

    describe('methods', () => {
      it('get method exists', () => {
        expect(typeof apiClient.get).toBe('function');
      });

      it('post method exists', () => {
        expect(typeof apiClient.post).toBe('function');
      });

      it('patch method exists', () => {
        expect(typeof apiClient.patch).toBe('function');
      });

      it('delete method exists', () => {
        expect(typeof apiClient.delete).toBe('function');
      });

      it('request method exists', () => {
        expect(typeof apiClient.request).toBe('function');
      });
    });
  });

  describe('apiClient singleton', () => {
    it('exports apiClient instance', () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient).toBe('object');
    });

    it('is accessible and usable', () => {
      expect(apiClient).toBeDefined();
      expect(apiClient !== null).toBe(true);
    });

    it('has HTTP methods', () => {
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.patch).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
      expect(typeof apiClient.request).toBe('function');
    });
  });

  describe('correlation ID generation', () => {
    it('consistently generates valid IDs', () => {
      for (let i = 0; i < 10; i++) {
        const cid = generateCorrelationId();
        expect(cid).toMatch(/^cid-\d+-[a-z0-9]+$/);
      }
    });
  });

  describe('API error handling', () => {
    it('handles 4xx errors', () => {
      const error = new ApiError(404, 'Not Found', 'RESOURCE_NOT_FOUND');
      expect(error.status).toBe(404);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('handles 5xx errors', () => {
      const error = new ApiError(500, 'Internal Server Error', 'SERVER_ERROR');
      expect(error.status).toBe(500);
      expect(error.code).toBe('SERVER_ERROR');
    });

    it('preserves error details', () => {
      const details = { endpoint: '/api/users', method: 'GET' };
      const error = new ApiError(500, 'Server Error', 'UNKNOWN', details);
      expect(error.details).toEqual(details);
    });
  });
});
