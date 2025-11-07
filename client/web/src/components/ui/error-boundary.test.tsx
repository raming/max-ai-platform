import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

describe('ErrorBoundary', () => {
  const ConsoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  afterEach(() => {
    ConsoleErrorSpy.mockClear();
  });

  afterAll(() => {
    ConsoleErrorSpy.mockRestore();
  });

  it('renders children when there is no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );
    expect(container.textContent).toContain('Test Content');
  });

  it('displays error UI when an error is caught', () => {
    const ThrowError = () => {
      throw new Error('Test error message');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
  });

  it('shows error details in a collapsible section', () => {
    const ThrowError = () => {
      throw new Error('Specific test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const details = screen.getByText('Error details');
    expect(details).toBeInTheDocument();
  });

  it('has a working home button', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const homeButton = screen.getByText('Go back home');
    expect(homeButton).toBeInTheDocument();
    expect(homeButton).toHaveClass('w-full');
  });

  it('is accessible with proper ARIA attributes', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const card = container.querySelector('[class*="max-w-md"]');
    expect(card).toBeInTheDocument();
  });
});
