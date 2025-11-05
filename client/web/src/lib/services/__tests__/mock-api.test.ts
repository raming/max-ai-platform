/**
 * Mock API Service Tests
 * Tests for mock API endpoints with correlation IDs and delays
 */

import { mockApiClient } from '@/lib/services/mock-api';

describe('Mock API Service', () => {
  describe('Auth Service', () => {
    it('should login with valid credentials', async () => {
      const result = await mockApiClient.auth.login('test@example.com', 'password');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
      expect(result.correlationId).toMatch(/^cid-/);
    });

    it('should reject invalid credentials', async () => {
      await expect(
        mockApiClient.auth.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should logout successfully', async () => {
      const result = await mockApiClient.auth.logout('test-token');
      expect(result.correlationId).toMatch(/^cid-/);
    });

    it('should get current user', async () => {
      const result = await mockApiClient.auth.getCurrentUser('test-token');
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('user-1');
      expect(result.correlationId).toMatch(/^cid-/);
    });
  });

  describe('Dashboard Service', () => {
    it('should fetch dashboard data', async () => {
      const result = await mockApiClient.dashboard.getDashboardData();
      expect(result.data).toBeDefined();
      expect(result.data.totalUsers).toBeGreaterThan(0);
      expect(result.data.stats).toBeDefined();
      expect(result.data.recentActivity.length).toBeGreaterThan(0);
      expect(result.correlationId).toMatch(/^cid-/);
    });
  });

  describe('Content Service', () => {
    it('should get all contents', async () => {
      const result = await mockApiClient.content.getContents();
      expect(result.contents).toBeDefined();
      expect(Array.isArray(result.contents)).toBe(true);
      expect(result.contents.length).toBeGreaterThan(0);
      expect(result.correlationId).toMatch(/^cid-/);
    });

    it('should get single content', async () => {
      const result = await mockApiClient.content.getContent('content-1');
      expect(result.content).toBeDefined();
      expect(result.content.id).toBe('content-1');
      expect(result.content.title).toBeDefined();
      expect(result.correlationId).toMatch(/^cid-/);
    });

    it('should throw when content not found', async () => {
      await expect(mockApiClient.content.getContent('nonexistent')).rejects.toThrow();
    });

    it('should create content', async () => {
      const newContent = {
        title: 'New Content',
        content: '<p>Test content</p>',
        userId: 'user-1',
      };
      const result = await mockApiClient.content.createContent(newContent);
      expect(result.content.id).toBeDefined();
      expect(result.content.title).toBe('New Content');
      expect(result.content.version).toBe(1);
      expect(result.correlationId).toMatch(/^cid-/);
    });

    it('should update content', async () => {
      const updates = { title: 'Updated Title' };
      const result = await mockApiClient.content.updateContent('content-1', updates);
      expect(result.content.title).toBe('Updated Title');
      expect(result.content.version).toBeGreaterThan(1);
      expect(result.correlationId).toMatch(/^cid-/);
    });

    it('should delete content', async () => {
      const result = await mockApiClient.content.deleteContent('content-1');
      expect(result.correlationId).toMatch(/^cid-/);
    });
  });

  describe('Settings Service', () => {
    it('should get settings', async () => {
      const result = await mockApiClient.settings.getSettings();
      expect(result.settings).toBeDefined();
      expect(result.settings.theme).toBeDefined();
      expect(result.correlationId).toMatch(/^cid-/);
    });

    it('should update settings', async () => {
      const updates = { theme: 'dark' };
      const result = await mockApiClient.settings.updateSettings(updates);
      expect(result.settings).toBeDefined();
      expect(result.correlationId).toMatch(/^cid-/);
    });
  });

  describe('Correlation IDs', () => {
    it('should generate unique correlation IDs', async () => {
      const result1 = await mockApiClient.auth.getCurrentUser('token');
      const result2 = await mockApiClient.auth.getCurrentUser('token');
      expect(result1.correlationId).not.toBe(result2.correlationId);
    });
  });

  describe('API Delays', () => {
    it('should include realistic delays', async () => {
      const startTime = Date.now();
      await mockApiClient.dashboard.getDashboardData();
      const duration = Date.now() - startTime;
      // Should take at least ~600ms
      expect(duration).toBeGreaterThanOrEqual(500);
    });
  });
});
