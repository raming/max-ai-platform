import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import CustomizeStep from '../customize/page';
import { useOnboardingStore } from '../store';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }));

describe('customize UI', () => {
  beforeEach(() => {
    pushMock.mockClear();
    useOnboardingStore.setState({
      clientComplete: true,
      templateSelected: true,
      customizeComplete: false,
      planReady: false,
    });
  });

  it('saves variables and navigates to plan', () => {
    const { getByLabelText, getByText } = render(<CustomizeStep />);
    fireEvent.change(getByLabelText('business-name'), { target: { value: 'Acme' } });
    fireEvent.change(getByLabelText('greeting'), { target: { value: 'Hello!' } });
    fireEvent.click(getByText('Save and Continue'));

    expect(useOnboardingStore.getState().customizeComplete).toBe(true);
    expect(useOnboardingStore.getState().customizeData).toEqual({ vars: { businessName: 'Acme', greeting: 'Hello!' } });
    expect(pushMock).toHaveBeenCalledWith('/onboarding/plan');
  });
});