/**
 * Mock content service for managing user content, profiles, and settings
 * Provides CRUD operations with local storage persistence
 */

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  content: string; // Rich text content
  lastUpdated: string;
  isPublic: boolean;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    dataSharing: boolean;
    analytics: boolean;
  };
  contentPreferences: {
    autoSave: boolean;
    maxContentSize: number; // in characters
    defaultEditorMode: 'rich' | 'plain';
  };
  aboutContent: string; // Rich text content
  termsContent: string; // Rich text content
  lastUpdated: string;
}

export interface ContentValidation {
  isValid: boolean;
  size: number; // in KB
  errors: string[];
  warnings: string[];
}

// Mock data
const mockProfiles: UserProfile[] = [
  {
    id: 'profile-1',
    userId: 'user-1',
    displayName: 'John Doe',
    bio: 'Senior Software Engineer passionate about building great user experiences.',
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    socialLinks: {
      twitter: 'https://twitter.com/johndoe',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe'
    },
    content: '<h2>About Me</h2><p>I\'m a passionate software engineer with over 8 years of experience building web applications. I love working with React, TypeScript, and modern web technologies.</p><h3>Interests</h3><ul><li>Frontend Development</li><li>User Experience Design</li><li>Open Source Contributions</li></ul><p><strong>Let\'s connect!</strong> I\'m always interested in discussing new opportunities and collaborations.</p>',
    lastUpdated: '2025-10-12T10:00:00Z',
    isPublic: true
  },
  {
    id: 'profile-2',
    userId: 'user-2',
    displayName: 'Jane Smith',
    bio: 'Product Manager focused on AI-powered solutions.',
    location: 'New York, NY',
    website: 'https://janesmith.pm',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/janesmith'
    },
    content: '<h2>Hello!</h2><p>I\'m a product manager specializing in AI and machine learning products. With a background in both engineering and business, I bridge the gap between technical innovation and user needs.</p><h3>What I Do</h3><p>I work on products that make AI more accessible and useful for everyday users. My current focus is on conversational AI and natural language processing applications.</p><blockquote>"The best products are those that solve real problems in elegant ways."</blockquote>',
    lastUpdated: '2025-10-11T15:30:00Z',
    isPublic: true
  }
];

const mockSettings: UserSettings[] = [
  {
    id: 'settings-1',
    userId: 'user-1',
    theme: 'system',
    language: 'en-US',
    timezone: 'America/Los_Angeles',
    notifications: {
      email: true,
      push: false,
      marketing: false
    },
    privacy: {
      profileVisibility: 'public',
      dataSharing: false,
      analytics: true
    },
    contentPreferences: {
      autoSave: true,
      maxContentSize: 50000,
      defaultEditorMode: 'rich'
    },
    aboutContent: '<h2>About Our Platform</h2><p>Welcome to our AI-powered platform! We provide cutting-edge tools for developers and businesses to build amazing applications.</p><h3>Our Mission</h3><p>To democratize access to AI technologies and make it easier for everyone to build intelligent applications.</p>',
    termsContent: '<h2>Terms of Service</h2><p>By using our platform, you agree to these terms...</p>',
    lastUpdated: '2025-10-12T09:00:00Z'
  },
  {
    id: 'settings-2',
    userId: 'user-2',
    theme: 'dark',
    language: 'en-US',
    timezone: 'America/New_York',
    notifications: {
      email: true,
      push: true,
      marketing: true
    },
    privacy: {
      profileVisibility: 'public',
      dataSharing: true,
      analytics: true
    },
    contentPreferences: {
      autoSave: false,
      maxContentSize: 25000,
      defaultEditorMode: 'plain'
    },
    aboutContent: '<h2>Product Vision</h2><p>Our platform is designed to make AI accessible to everyone, from individual developers to large enterprises.</p>',
    termsContent: '<h2>Terms of Service</h2><p>By using our platform, you agree to these terms...</p>',
    lastUpdated: '2025-10-11T14:00:00Z'
  }
];

// Local storage keys
const STORAGE_KEYS = {
  profiles: 'mock-user-profiles',
  settings: 'mock-user-settings'
};

// Utility functions
function loadFromStorage<T>(key: string, defaultValue: T[]): T[] {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
}

// Initialize data from localStorage or use mock data
const profiles = loadFromStorage(STORAGE_KEYS.profiles, mockProfiles);
const settings = loadFromStorage(STORAGE_KEYS.settings, mockSettings);

// Profile operations
export const profileService = {
  getProfile: (userId: string): UserProfile | null => {
    return profiles.find(profile => profile.userId === userId) || null;
  },

  updateProfile: (userId: string, updates: Partial<UserProfile>): UserProfile => {
    const index = profiles.findIndex(profile => profile.userId === userId);
    if (index === -1) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    profiles[index] = {
      ...profiles[index],
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    saveToStorage(STORAGE_KEYS.profiles, profiles);
    return profiles[index];
  },

  createProfile: (profile: Omit<UserProfile, 'id' | 'lastUpdated'>): UserProfile => {
    const newProfile: UserProfile = {
      ...profile,
      id: `profile-${Date.now()}`,
      lastUpdated: new Date().toISOString()
    };

    profiles.push(newProfile);
    saveToStorage(STORAGE_KEYS.profiles, profiles);
    return newProfile;
  }
};

// Settings operations
export const settingsService = {
  getSettings: (userId: string): UserSettings | null => {
    return settings.find(setting => setting.userId === userId) || null;
  },

  updateSettings: (userId: string, updates: Partial<UserSettings>): UserSettings => {
    const index = settings.findIndex(setting => setting.userId === userId);
    if (index === -1) {
      throw new Error(`Settings not found for user: ${userId}`);
    }

    settings[index] = {
      ...settings[index],
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    saveToStorage(STORAGE_KEYS.settings, settings);
    return settings[index];
  },

  createSettings: (userSettings: Omit<UserSettings, 'id' | 'lastUpdated'>): UserSettings => {
    const newSettings: UserSettings = {
      ...userSettings,
      id: `settings-${Date.now()}`,
      lastUpdated: new Date().toISOString()
    };

    settings.push(newSettings);
    saveToStorage(STORAGE_KEYS.settings, settings);
    return newSettings;
  }
};

// Content validation
export const contentValidation = {
  validateContent: (content: string, maxSizeKB: number = 1024): ContentValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Calculate size in KB
    const sizeKB = new Blob([content]).size / 1024;

    // Check size limits
    if (sizeKB > maxSizeKB) {
      errors.push(`Content size (${sizeKB.toFixed(2)}KB) exceeds maximum allowed size (${maxSizeKB}KB)`);
    }

    // Check for potentially harmful content (basic validation)
    if (content.includes('<script')) {
      errors.push('Content contains potentially unsafe script tags');
    }

    // Warnings for large content
    if (sizeKB > maxSizeKB * 0.8) {
      warnings.push(`Content is ${(sizeKB / maxSizeKB * 100).toFixed(0)}% of maximum size limit`);
    }

    return {
      isValid: errors.length === 0,
      size: sizeKB,
      errors,
      warnings
    };
  },

  validateHtmlContent: (html: string, maxSizeKB: number = 1024): ContentValidation => {
    // Strip HTML tags for size calculation but keep validation
    const textContent = html.replace(/<[^>]*>/g, '');
    return contentValidation.validateContent(textContent, maxSizeKB);
  }
};

// Auto-save functionality
export const autoSaveService = {
  saveDraft: (userId: string, contentType: 'profile' | 'settings', content: string): void => {
    const key = `draft-${userId}-${contentType}`;
    const draft = {
      content,
      timestamp: new Date().toISOString(),
      contentType
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(draft));
      } catch (error) {
        console.warn('Failed to save draft:', error);
      }
    }
  },

  getDraft: (userId: string, contentType: 'profile' | 'settings'): string | null => {
    if (typeof window === 'undefined') return null;

    const key = `draft-${userId}-${contentType}`;
    try {
      const draft = localStorage.getItem(key);
      if (draft) {
        const parsed = JSON.parse(draft);
        // Check if draft is less than 24 hours old
        const draftTime = new Date(parsed.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - draftTime.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          return parsed.content;
        } else {
          // Clean up old draft
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Failed to load draft:', error);
    }

    return null;
  },

  clearDraft: (userId: string, contentType: 'profile' | 'settings'): void => {
    const key = `draft-${userId}-${contentType}`;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};