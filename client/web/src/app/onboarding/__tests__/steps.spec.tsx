import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import ClientStep from '../client/page';
import TemplatesStep from '../templates/page';
import CustomizeStep from '../customize/page';
import PlanStep from '../plan/page';
import { useOnboardingStore } from '../store';

describe('onboarding steps', () => {
  beforeEach(() => {
    useOnboardingStore.setState({
      clientComplete: false,
      templateSelected: false,
      customizeComplete: false,
      planReady: false,
    });
  });

  it('ClientStep marks client complete', () => {
    const { getByText } = render(<ClientStep />);
    fireEvent.click(getByText('Mark Complete'));
    expect(useOnboardingStore.getState().clientComplete).toBe(true);
  });

  it('TemplatesStep marks template selected', () => {
    const { getByText } = render(<TemplatesStep />);
    fireEvent.click(getByText('Select Template'));
    expect(useOnboardingStore.getState().templateSelected).toBe(true);
  });

  it('CustomizeStep marks customize complete', () => {
    const { getByText } = render(<CustomizeStep />);
    fireEvent.click(getByText('Mark Customized'));
    expect(useOnboardingStore.getState().customizeComplete).toBe(true);
  });

  it('PlanStep marks plan ready', () => {
    const { getByText } = render(<PlanStep />);
    fireEvent.click(getByText('Mark Plan Ready'));
    expect(useOnboardingStore.getState().planReady).toBe(true);
  });
});