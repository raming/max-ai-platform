/**
 * Mock API Service
 * Provides realistic mock endpoints with delays and correlation IDs
 * Simulates real API behavior for development and testing
 * Reference: /docs/design/ui-framework-spec.md - Section 5
 */

import { DashboardData } from '@/stores/dashboardStore';
import { ContentDTO } from '@/types/content';
import { User } from '@/stores/authStore';

/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId(): string {
  return `cid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simulate network delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock API error response
 */
export interface MockErrorResponse {
  error: string;
  correlationId: string;
  timestamp: string;
}

/**
 * Mock authentication service
 */
export const mockAuthService = {
  /**
   * Mock login endpoint
   */
  async login(email: string, password: string): Promise<{ user: User; token: string; correlationId: string }> {
    const correlationId = generateCorrelationId();
    console.debug('[Mock API] login', { correlationId, email });
    
    await delay(800); // Simulate network delay

    if (email === 'test@example.com' && password === 'password') {
      return {
        correlationId,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          tenantId: 'tenant-1',
          roles: ['admin', 'editor'],
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
          lastLogin: new Date(),
        },
        token: 'mock-jwt-token-' + Date.now(),
      };
    }

    throw new Error('Invalid credentials');
  },

  /**
   * Mock logout endpoint
   */
  async logout(): Promise<{ correlationId: string }> {
    const correlationId = generateCorrelationId();
    console.debug('[Mock API] logout', { correlationId });
    await delay(300);
    return { correlationId };
  },

  /**
   * Mock get current user endpoint
   */
  async getCurrentUser(): Promise<{ user: User; correlationId: string }> {
    const correlationId = generateCorrelationId();
    console.debug('[Mock API] getCurrentUser', { correlationId });
    await delay(200);

    return {
      correlationId,
      user: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        tenantId: 'tenant-1',
        roles: ['admin', 'editor'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
        lastLogin: new Date(),
      },
    };
  },
};

/**
 * Mock dashboard service
 */
export const mockDashboardService = {
  /**
   * Mock get dashboard data endpoint
   */
  async getDashboardData(): Promise<{ data: DashboardData; correlationId: string }> {
    const correlationId = generateCorrelationId();
    console.debug('[Mock API] getDashboardData', { correlationId });
    await delay(600);

    return {
      correlationId,
      data: {
        totalUsers: 152,
        totalContents: 47,
        totalSettings: 12,
        stats: {
          contentCreatedToday: 3,
          usersActiveToday: 28,
          settingsChangedToday: 2,
        },
        recentActivity: [
          {
            id: 'activity-1',
            type: 'content',
            title: 'Created: Q4 Marketing Campaign',
            timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          },
          {
            id: 'activity-2',
            type: 'user',
            title: 'Added: john.doe@company.com',
            timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
          },
          {
            id: 'activity-3',
            type: 'setting',
            title: 'Updated: Email notification settings',
            timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
          },
          {
            id: 'activity-4',
            type: 'content',
            title: 'Modified: Product Release Notes',
            timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
          },
          {
            id: 'activity-5',
            type: 'user',
            title: 'Removed: jane.smith@company.com',
            timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
          },
        ],
      },
    };
  },
};

/**
 * Mock content service
 */
export const mockContentService = {
  /**
   * Mock get all contents endpoint
   */
  async getContents(): Promise<{ contents: ContentDTO[]; correlationId: string }> {
    const correlationId = generateCorrelationId();
    console.debug('[Mock API] getContents', { correlationId });
    await delay(700);

    return {
      correlationId,
      contents: [
        {
          id: 'content-1',
          title: 'Welcome to MaxAI Platform',
          content: '<h1>Welcome</h1><p>Start your AI journey here</p>',
          sanitizedContent: '<h1>Welcome</h1><p>Start your AI journey here</p>',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          version: 2,
          userId: 'user-1',
        },
        {
          id: 'content-2',
          title: 'Getting Started Guide',
          content: '<h1>Getting Started</h1><p>Follow these steps...</p>',
          sanitizedContent: '<h1>Getting Started</h1><p>Follow these steps...</p>',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          version: 1,
          userId: 'user-1',
        },
        {
          id: 'content-3',
          title: 'API Documentation',
          content: '<h1>API Docs</h1><p>Complete API reference...</p>',
          sanitizedContent: '<h1>API Docs</h1><p>Complete API reference...</p>',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          version: 3,
          userId: 'user-1',
        },
      ],
    };
  },

  /**
   * Mock get single content endpoint
   */
  async getContent(id: string): Promise<{ content: ContentDTO; correlationId: string }> {
    const correlationId = generateCorrelationId();
    console.debug('[Mock API] getContent', { correlationId, id });
    await delay(400);

    const contentMap: Record<string, ContentDTO> = {
      'content-1': {
        id: 'content-1',
        title: 'Welcome to MaxAI Platform',
        content: '<h1>Welcome</h1><p>Start your AI journey here</p>',
        sanitizedContent: '<h1>Welcome</h1><p>Start your AI journey here</p>',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        version: 2,
        userId: 'user-1',
      },
    };

    const content = contentMap[id];
    if (!content) {
      throw new Error(`Content with id ${id} not found`);
    }

    return { correlationId, content };
  },

  /**
   * Mock update content endpoint
   */
  async updateContent(
    id: string,
    updates: Partial<Omit<ContentDTO, 'id' | 'userId'>>
  ): Promise<{ content: ContentDTO; correlationId: string }> {
    const correlationId = generateCorrelationId();
    console.debug('[Mock API] updateContent', { correlationId, id });
    await delay(500);

    return {
      correlationId,
      content: {
        id,
        title: updates.title || 'Updated Content',
        content: updates.content || '',
        sanitizedContent: updates.sanitizedContent || updates.content || '',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        version: (updates.version || 1) + 1,
        userId: 'user-1',
      },
    };
  },

  /**
   * Mock create content endpoint
   */
  async createContent(data: Omit<ContentDTO, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'sanitizedContent'>): Promise<{
    content: ContentDTO;
    correlationId: string;
  }> {
    const correlationId = generateCorrelationId();
    console.debug('[Mock API] createContent', { correlationId });
    await delay(600);

    return {
      correlationId,
      content: {
        ...data,
        id: `content-${Date.now()}`,
        sanitizedContent: data.content,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
    };
  },

  /**
   * Mock delete content endpoint
   */
  async deleteContent(id: string): Promise<{ correlationId: string }> {
    const correlationId = generateCorrelationId();
    console.debug('[Mock API] deleteContent', { correlationId, id });
    await delay(300);
    return { correlationId };
  },
};

/**
 * Mock settings service
 */
export const mockSettingsService = {
  /**
   * Mock get settings endpoint
   */
  async getSettings(): Promise<{ settings: Record<string, string | number | boolean | Record<string, boolean>>; correlationId: string }> {
    const correlationId = generateCorrelationId();
    console.debug('[Mock API] getSettings', { correlationId });
    await delay(300);

    return {
      correlationId,
      settings: {
        theme: 'light',
        locale: 'en-US',
        notifications: {
          email: true,
          push: false,
        },
      },
    };
  },

  /**
   * Mock update settings endpoint
   */
  async updateSettings(settings: Record<string, string | number | boolean | Record<string, boolean>>): Promise<{ settings: Record<string, string | number | boolean | Record<string, boolean>>; correlationId: string }> {
    const correlationId = generateCorrelationId();
    console.debug('[Mock API] updateSettings', { correlationId });
    await delay(400);

    return {
      correlationId,
      settings,
    };
  },
};

/**
 * Centralized mock API client
 */
export const mockApiClient = {
  auth: mockAuthService,
  dashboard: mockDashboardService,
  content: mockContentService,
  settings: mockSettingsService,
};
