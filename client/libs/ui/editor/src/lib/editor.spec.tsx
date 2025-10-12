import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { QuillEditor } from './editor';
import { sanitizeHtml, exportContent, validateContentSize, getWordCount } from './utils';

// Mock react-quill
jest.mock('react-quill', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockReactQuill = require('react-quill').default;

describe('QuillEditor', () => {
  beforeEach(() => {
    mockReactQuill.mockImplementation((props: any) => {
      const { value, onChange, placeholder, readOnly } = props;
      return React.createElement('div', {
        'data-testid': 'quill-editor',
        'data-value': value,
        'data-placeholder': placeholder,
        'data-readonly': readOnly,
        onClick: () => {
          if (onChange) onChange('<p>Test content</p>');
        }
      });
    });
  });

  it('should render successfully', () => {
    const { getByTestId } = render(<QuillEditor />);
    expect(getByTestId('quill-editor')).toBeTruthy();
  });

  it('should render with initial value', () => {
    const { getByTestId } = render(<QuillEditor value="<p>Initial content</p>" />);
    const editor = getByTestId('quill-editor');
    expect(editor.getAttribute('data-value')).toBe('<p>Initial content</p>');
  });

  it('should render with placeholder', () => {
    const { getByTestId } = render(<QuillEditor placeholder="Enter text here" />);
    const editor = getByTestId('quill-editor');
    expect(editor.getAttribute('data-placeholder')).toBe('Enter text here');
  });

  it('should render in read-only mode', () => {
    const { getByTestId } = render(<QuillEditor readOnly={true} />);
    const editor = getByTestId('quill-editor');
    expect(editor.getAttribute('data-readonly')).toBe('true');
  });

  it('should call onChange when content changes', async () => {
    const handleChange = jest.fn();
    const { getByTestId } = render(<QuillEditor onChange={handleChange} />);

    fireEvent.click(getByTestId('quill-editor'));

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith('<p>Test content</p>');
    });
  });

  it('should sanitize HTML content', () => {
    const unsafeHtml = '<script>alert("xss")</script><p>Safe content</p><img src="test.jpg" onerror="alert(\'xss\')">';
    const sanitized = sanitizeHtml(unsafeHtml);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).toContain('<p>Safe content</p>');
    expect(sanitized).toContain('<img src="test.jpg">');
  });

  it('should export content in different formats', () => {
    const htmlContent = '<p>Hello <strong>world</strong></p>';

    const htmlExport = exportContent(htmlContent, { format: 'html' });
    expect(htmlExport).toBe(htmlContent);

    const textExport = exportContent(htmlContent, { format: 'text' });
    expect(textExport).toBe('Hello world');

    const jsonExport = exportContent(htmlContent, { format: 'json' });
    expect(jsonExport).toBe(JSON.stringify(htmlContent, null, 2));
  });

  it('should validate content size', () => {
    const smallContent = '<p>Small</p>';
    const largeContent = '<p>' + 'x'.repeat(2000) + '</p>';

    const smallValidation = validateContentSize(smallContent, 1); // 1KB limit
    expect(smallValidation.valid).toBe(true);

    const largeValidation = validateContentSize(largeContent, 1); // 1KB limit
    expect(largeValidation.valid).toBe(false);
    expect(largeValidation.message).toContain('exceeds maximum');
  });

  it('should count words correctly', () => {
    expect(getWordCount('<p>Hello world</p>')).toBe(2);
    expect(getWordCount('<p>One</p><p>Two three</p>')).toBe(3);
    expect(getWordCount('')).toBe(0);
    expect(getWordCount('<p>   </p>')).toBe(0);
  });
});
