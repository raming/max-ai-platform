import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { OnboardingGuard } from '../Guard';
import { useOnboardingStore } from '../store';

const replaceMock = jest.fn();
let currentPath = '/onboarding/customize';
jest.mock('next/navigation', () => {
  return {
    usePathname: () => currentPath,
    useRouter: () => ({ replace: replaceMock, push: jest.fn() }),
  };
});

describe('OnboardingGuard', () => {
  beforeEach(() => {
    useOnboardingStore.setState({
      clientComplete: false,
      templateSelected: false,
      customizeComplete: false,
      planReady: false,
    });
    replaceMock.mockClear();
    window.localStorage.clear();
  });

  it('redirects to first incomplete step when navigating ahead', async () => {
    render(
      <OnboardingGuard>
        <div>child</div>
      </OnboardingGuard>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/onboarding/client');
    });
  });

  it('does not redirect when steps up to current are complete', async () => {
    useOnboardingStore.setState({ clientComplete: true, templateSelected: true, customizeComplete: false, planReady: false });
    currentPath = '/onboarding/customize';

    render(
      <OnboardingGuard>
        <div>child</div>
      </OnboardingGuard>
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('redirects to templates when client is complete but template not selected', async () => {
    useOnboardingStore.setState({ clientComplete: true, templateSelected: false, customizeComplete: false, planReady: false });
    currentPath = '/onboarding/customize';

    render(
      <OnboardingGuard>
        <div>child</div>
      </OnboardingGuard>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/onboarding/templates');
    });
  });

  it('does not redirect when already on the first incomplete step', async () => {
    useOnboardingStore.setState({ clientComplete: false, templateSelected: false, customizeComplete: false, planReady: false });
    currentPath = '/onboarding/client';

    render(
      <OnboardingGuard>
        <div>child</div>
      </OnboardingGuard>
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('redirects unknown onboarding subpath to first incomplete', async () => {
    useOnboardingStore.setState({ clientComplete: false, templateSelected: false, customizeComplete: false, planReady: false });
    currentPath = '/onboarding/unknown';

    render(
      <OnboardingGuard>
        <div>child</div>
      </OnboardingGuard>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/onboarding/client');
    });
  });

  it('does nothing for non-onboarding routes', async () => {
    currentPath = '/';

    render(
      <OnboardingGuard>
        <div>child</div>
      </OnboardingGuard>
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
