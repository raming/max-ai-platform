import React from 'react';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/footer';

describe('Footer', () => {
  it('renders footer content', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('displays current year', () => {
    const currentYear = new Date().getFullYear();
    const { container } = render(<Footer />);
    expect(container.textContent).toContain(String(currentYear));
  });

  it('displays copyright text', () => {
    const { container } = render(<Footer />);
    expect(container.textContent).toContain('MaxAI Platform. All rights reserved.');
  });

  it('renders footer links', () => {
    render(<Footer />);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('links have correct href attributes', () => {
    render(<Footer />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(3);
  });

  it('is responsive with proper styling', () => {
    const { container } = render(<Footer />);
    const footerContent = container.querySelector('.flex');
    expect(footerContent).toHaveClass('flex', 'flex-col', 'items-center', 'justify-between', 'gap-4', 'sm:flex-row');
  });
});
