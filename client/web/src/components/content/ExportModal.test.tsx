import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportModal } from './ExportModal';

describe('ExportModal', () => {
  const mockOnClose = jest.fn();
  const mockOnExport = jest.fn();
  const testContent = '<h1>Test Content</h1><p>This is test content.</p>';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ExportModal
        isOpen={false}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );
    expect(container.querySelector('[class*="dialog"]')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );
    expect(screen.getByText('Export Content')).toBeInTheDocument();
    expect(screen.getByText('Choose a format and download your content')).toBeInTheDocument();
  });

  it('displays all export format options', () => {
    render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );
    expect(screen.getByLabelText('HTML (.html)')).toBeInTheDocument();
    expect(screen.getByLabelText('Markdown (.md)')).toBeInTheDocument();
    expect(screen.getByLabelText('JSON (.json)')).toBeInTheDocument();
    expect(screen.getByLabelText('Plain Text (.txt)')).toBeInTheDocument();
  });

  it('allows format selection', async () => {
    render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    const markdownRadio = screen.getByLabelText('Markdown (.md)') as HTMLInputElement;
    fireEvent.click(markdownRadio);

    await waitFor(() => {
      expect(markdownRadio.checked).toBe(true);
    });
  });

  it('updates filename input', async () => {
    render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    const filenameInput = screen.getByPlaceholderText('filename') as HTMLInputElement;
    fireEvent.change(filenameInput, { target: { value: 'my-document' } });

    await waitFor(() => {
      expect(filenameInput.value).toBe('my-document');
    });
  });

  it('shows appropriate file extension based on format', async () => {
    render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('.html')).toBeInTheDocument();

    const markdownRadio = screen.getByLabelText('Markdown (.md)') as HTMLInputElement;
    fireEvent.click(markdownRadio);

    await waitFor(() => {
      expect(screen.getByText('.md')).toBeInTheDocument();
    });
  });

  it('displays preview content that updates with format selection', async () => {
    render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    const previewArea = screen.getByDisplayValue((content) =>
      content.includes('Test Content')
    ) as HTMLTextAreaElement;
    expect(previewArea).toBeInTheDocument();

    // Change format to markdown
    const markdownRadio = screen.getByLabelText('Markdown (.md)') as HTMLInputElement;
    fireEvent.click(markdownRadio);

    // Preview should update to remove HTML tags
    await waitFor(() => {
      expect(previewArea.value).toContain('Test Content');
      expect(previewArea.value).not.toContain('<');
    });
  });

  it('calls onExport with correct format and filename', async () => {
    mockOnExport.mockResolvedValue(undefined);

    render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    const filenameInput = screen.getByPlaceholderText('filename') as HTMLInputElement;
    fireEvent.change(filenameInput, { target: { value: 'test-doc' } });

    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledWith('html', 'test-doc');
    });
  });

  it('closes modal after successful export', async () => {
    mockOnExport.mockResolvedValue(undefined);

    render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    const filenameInput = screen.getByPlaceholderText('filename') as HTMLInputElement;
    fireEvent.change(filenameInput, { target: { value: 'test' } });

    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays error message on export failure', async () => {
    const errorMessage = 'Export failed due to network error';
    mockOnExport.mockRejectedValue(new Error(errorMessage));

    render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    const filenameInput = screen.getByPlaceholderText('filename') as HTMLInputElement;
    fireEvent.change(filenameInput, { target: { value: 'test' } });

    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables export button when filename is empty', () => {
    render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    const filenameInput = screen.getByPlaceholderText('filename') as HTMLInputElement;
    fireEvent.change(filenameInput, { target: { value: '' } });

    const exportButton = screen.getByRole('button', { name: /Export/i }) as HTMLButtonElement;
    expect(exportButton.disabled).toBe(true);
  });

  it('disables all controls when isLoading is true', () => {
    render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
        isLoading={true}
      />
    );

    const filenameInput = screen.getByPlaceholderText('filename') as HTMLInputElement;
    const htmlRadio = screen.getByLabelText('HTML (.html)') as HTMLInputElement;
    const cancelButton = screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement;

    expect(filenameInput.disabled).toBe(true);
    expect(htmlRadio.disabled).toBe(true);
    expect(cancelButton.disabled).toBe(true);
  });

  it('calls onClose when cancel button is clicked', async () => {
    render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('closes modal when isOpen changes to false', async () => {
    const { rerender } = render(
      <ExportModal
        isOpen={true}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('Export Content')).toBeInTheDocument();

    // Close modal
    rerender(
      <ExportModal
        isOpen={false}
        content={testContent}
        onClose={mockOnClose}
        onExport={mockOnExport}
      />
    );

    // Modal content should not be in DOM
    expect(screen.queryByText('Export Content')).not.toBeInTheDocument();
  });
});
