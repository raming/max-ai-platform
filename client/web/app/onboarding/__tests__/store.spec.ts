import { useOnboardingStore } from '../store';

describe('onboarding store persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useOnboardingStore.setState({
      clientComplete: false,
      templateSelected: false,
      customizeComplete: false,
      planReady: false,
      clientData: undefined,
      templateData: undefined,
      customizeData: undefined,
      planData: undefined,
    });
  });

  it('persists step completion to localStorage', () => {
    useOnboardingStore.getState().setClientComplete(true, { name: 'Acme' });
    useOnboardingStore.getState().setTemplateSelected(true, { template: 'starter' });

    const raw = window.localStorage.getItem('onboarding-store');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.clientComplete).toBe(true);
    expect(parsed.state.templateSelected).toBe(true);
    expect(parsed.state.clientData).toEqual({ name: 'Acme' });
    expect(parsed.state.templateData).toEqual({ template: 'starter' });
  });

  it('keeps previous data when setters called without data', () => {
    useOnboardingStore.getState().setClientComplete(true, { name: 'Keep' });
    useOnboardingStore.getState().setClientComplete(true);
    expect(useOnboardingStore.getState().clientData).toEqual({ name: 'Keep' });

    useOnboardingStore.getState().setTemplateSelected(true, { template: 't1' });
    useOnboardingStore.getState().setTemplateSelected(true);
    expect(useOnboardingStore.getState().templateData).toEqual({ template: 't1' });

    useOnboardingStore.getState().setCustomizeComplete(true, { vars: { a: 1 } });
    useOnboardingStore.getState().setCustomizeComplete(true);
    expect(useOnboardingStore.getState().customizeData).toEqual({ vars: { a: 1 } });

    useOnboardingStore.getState().setPlanReady(true, { plan: { steps: 1 } });
    useOnboardingStore.getState().setPlanReady(true);
    expect(useOnboardingStore.getState().planData).toEqual({ plan: { steps: 1 } });
  });

  it('reset returns state to initial defaults', () => {
    useOnboardingStore.getState().setClientComplete(true, { name: 'Acme' });
    useOnboardingStore.getState().setTemplateSelected(true, { template: 'starter' });
    useOnboardingStore.getState().setCustomizeComplete(true, { vars: {} });
    useOnboardingStore.getState().setPlanReady(true, { plan: {} });

    useOnboardingStore.getState().reset();

    expect(useOnboardingStore.getState().clientComplete).toBe(false);
    expect(useOnboardingStore.getState().templateSelected).toBe(false);
    expect(useOnboardingStore.getState().customizeComplete).toBe(false);
    expect(useOnboardingStore.getState().planReady).toBe(false);
    expect(useOnboardingStore.getState().clientData).toBeUndefined();
    expect(useOnboardingStore.getState().templateData).toBeUndefined();
    expect(useOnboardingStore.getState().customizeData).toBeUndefined();
    expect(useOnboardingStore.getState().planData).toBeUndefined();
  });
});
