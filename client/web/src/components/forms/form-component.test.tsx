import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormComponent } from '@/components/forms/form-component';

describe('FormComponent', () => {
  it('renders form with all required fields', () => {
    render(<FormComponent />);
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('renders form inputs', () => {
    render(<FormComponent />);
    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('john@example.com');
    const messageTextarea = screen.getByPlaceholderText('Type your message here...');

    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(messageTextarea).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<FormComponent />);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('displays character count for message field', () => {
    render(<FormComponent />);
    const counter = screen.getByText(/0\/500 characters/);
    expect(counter).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<FormComponent />);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<FormComponent />);
    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('john@example.com');
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await userEvent.type(nameInput, 'John Doe');
    await userEvent.type(emailInput, 'invalid-email');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('validates message length', async () => {
    render(<FormComponent />);
    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('john@example.com');
    const messageTextarea = screen.getByPlaceholderText('Type your message here...');
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await userEvent.type(nameInput, 'John Doe');
    await userEvent.type(emailInput, 'john@example.com');
    await userEvent.type(messageTextarea, 'short');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Message must be at least 10 characters')).toBeInTheDocument();
    });
  });

  it('calls onSubmit when form is valid', async () => {
    const mockSubmit = jest.fn();
    render(<FormComponent onSubmit={mockSubmit} />);

    const nameInput = screen.getByPlaceholderText('John Doe');
    const emailInput = screen.getByPlaceholderText('john@example.com');
    const messageTextarea = screen.getByPlaceholderText('Type your message here...');
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await userEvent.type(nameInput, 'John Doe');
    await userEvent.type(emailInput, 'john@example.com');
    await userEvent.type(messageTextarea, 'This is a test message');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'This is a test message',
        })
      );
    });
  });

  it('displays loading state when isLoading prop is true', () => {
    render(<FormComponent isLoading={true} />);
    const submitButton = screen.getByRole('button', { name: /submitting/i });
    expect(submitButton).toBeDisabled();
  });

  it('updates character count dynamically', async () => {
    render(<FormComponent />);
    const messageTextarea = screen.getByPlaceholderText('Type your message here...');

    await userEvent.type(messageTextarea, 'Hello World');

    expect(screen.getByText(/11\/500 characters/)).toBeInTheDocument();
  });

  it('has proper form descriptions', () => {
    render(<FormComponent />);
    expect(screen.getByText('Your full name')).toBeInTheDocument();
    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });
});
