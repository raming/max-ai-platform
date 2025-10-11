import { getFirstIncompleteStep, OnboardingState } from '../store';

describe('getFirstIncompleteStep', () => {
  it('returns client when client is incomplete', () => {
    const state = {
      clientComplete: false,
      templateSelected: false,
      customizeComplete: false,
      planReady: false,
    } as OnboardingState;
    expect(getFirstIncompleteStep(state)).toBe('client');
  });

  it('returns templates when client complete but template not selected', () => {
    const state = {
      clientComplete: true,
      templateSelected: false,
      customizeComplete: false,
      planReady: false,
    } as OnboardingState;
    expect(getFirstIncompleteStep(state)).toBe('templates');
  });

  it('returns customize when template selected but customize incomplete', () => {
    const state = {
      clientComplete: true,
      templateSelected: true,
      customizeComplete: false,
      planReady: false,
    } as OnboardingState;
    expect(getFirstIncompleteStep(state)).toBe('customize');
  });

  it('returns plan when all before are complete', () => {
    const state = {
      clientComplete: true,
      templateSelected: true,
      customizeComplete: true,
      planReady: false,
    } as OnboardingState;
    expect(getFirstIncompleteStep(state)).toBe('plan');
  });

  it('returns plan when all steps are complete (terminal step)', () => {
    const state = {
      clientComplete: true,
      templateSelected: true,
      customizeComplete: true,
      planReady: true,
    } as OnboardingState;
    expect(getFirstIncompleteStep(state)).toBe('plan');
  });
});
