import { FEATURES } from '../feature-flags';

describe('Feature Flags', () => {
  describe('FEATURES constant', () => {
    it('exports all feature flags', () => {
      expect(FEATURES).toHaveProperty('BETA_DASHBOARD');
      expect(FEATURES).toHaveProperty('ADVANCED_ANALYTICS');
      expect(FEATURES).toHaveProperty('AI_CONTENT_SUGGESTIONS');
      expect(FEATURES).toHaveProperty('MULTI_LANGUAGE_SUPPORT');
      expect(FEATURES).toHaveProperty('DARK_MODE');
      expect(FEATURES).toHaveProperty('CUSTOM_BRANDING');
      expect(FEATURES).toHaveProperty('WEBHOOKS');
      expect(FEATURES).toHaveProperty('AUDIT_LOG');
      expect(FEATURES).toHaveProperty('SSO');
      expect(FEATURES).toHaveProperty('TWO_FACTOR_AUTH');
    });

    it('has unique feature values', () => {
      const values = Object.values(FEATURES);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });

    it('feature values follow kebab-case convention', () => {
      Object.values(FEATURES).forEach((feat) => {
        expect(feat).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      });
    });
  });

  describe('Feature type', () => {
    it('is defined correctly', () => {
      const testFeat: typeof FEATURES[keyof typeof FEATURES] = FEATURES.BETA_DASHBOARD;
      expect(testFeat).toBeDefined();
      expect(typeof testFeat).toBe('string');
    });
  });

  describe('Feature categorization', () => {
    it('has UI feature flags', () => {
      expect(FEATURES.BETA_DASHBOARD).toBe('beta-dashboard');
      expect(FEATURES.DARK_MODE).toBe('dark-mode');
    });

    it('has analytics feature flags', () => {
      expect(FEATURES.ADVANCED_ANALYTICS).toBe('advanced-analytics');
    });

    it('has content feature flags', () => {
      expect(FEATURES.AI_CONTENT_SUGGESTIONS).toBe('ai-content-suggestions');
    });

    it('has integration feature flags', () => {
      expect(FEATURES.SSO).toBe('sso');
      expect(FEATURES.WEBHOOKS).toBe('webhooks');
    });

    it('has security feature flags', () => {
      expect(FEATURES.TWO_FACTOR_AUTH).toBe('2fa');
    });

    it('has admin feature flags', () => {
      expect(FEATURES.CUSTOM_BRANDING).toBe('custom-branding');
      expect(FEATURES.AUDIT_LOG).toBe('audit-log');
    });
  });

  describe('Feature count', () => {
    it('has exactly 10 features defined', () => {
      const featureCount = Object.keys(FEATURES).length;
      expect(featureCount).toBe(10);
    });
  });
});
