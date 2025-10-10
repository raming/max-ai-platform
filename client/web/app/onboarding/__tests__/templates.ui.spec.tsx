import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import TemplatesStep from '../templates/page';
import { useOnboardingStore } from '../store';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('templates UI', () => {
  beforeEach(() => {
    useOnboardingStore.setState({
      clientComplete: true,
      templateSelected: false,
      customizeComplete: false,
      planReady: false,
    });
  });

  it('renders templates and selects one', () => {
    const { getByLabelText } = render(<TemplatesStep />);
    const selectBtn = getByLabelText('select-welcome-bot');
    fireEvent.click(selectBtn);
    expect(useOnboardingStore.getState().templateSelected).toBe(true);
    expect(useOnboardingStore.getState().templateData).toEqual(
      expect.objectContaining({ templateId: 'welcome-bot' })
    );
  });
});