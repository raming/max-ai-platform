import React from 'react';
import { render } from '@testing-library/react';
import { PreviewPane } from './PreviewPane';

describe('PreviewPane', () => {
  it('renders content with HTML', () => {
    const content = '<h1>Test Title</h1><p>Test paragraph</p>';
    const { container } = render(<PreviewPane content={content} />);

    expect(container.textContent).toContain('Test Title');
    expect(container.textContent).toContain('Test paragraph');
  });

  it('applies prose styling by default', () => {
    const content = '<h1>Test</h1>';
    const { container } = render(<PreviewPane content={content} />);

    const preview = container.querySelector('[class*="prose"]');
    expect(preview).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const content = '<p>Test</p>';
    const { container } = render(
      <PreviewPane content={content} className="custom-class" />
    );

    const preview = container.querySelector('[class*="prose"]');
    expect(preview).toHaveClass('custom-class');
  });

  it('sanitizes HTML content by default', () => {
    const maliciousContent = '<p>Test</p><script>alert("XSS")</script>';
    const { container } = render(<PreviewPane content={maliciousContent} />);

    // Script tags should be removed
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container.textContent).toContain('Test');
    expect(container.textContent).not.toContain('alert');
  });

  it('allows disabling sanitization with sanitize prop', () => {
    const content = '<h1>Test</h1>';
    const { container } = render(
      <PreviewPane content={content} sanitize={false} />
    );

    expect(container.textContent).toContain('Test');
  });

  it('removes dangerous attributes from links', () => {
    const content = '<a href="javascript:alert(\'xss\')">Click me</a>';
    const { container } = render(<PreviewPane content={content} />);

    const link = container.querySelector('a');
    expect(link?.href).not.toContain('javascript');
  });

  it('preserves safe links', () => {
    const content = '<a href="https://example.com">Link</a>';
    const { container } = render(<PreviewPane content={content} />);

    const link = container.querySelector('a');
    expect(link?.href).toBe('https://example.com/');
  });

  it('preserves allowed HTML tags', () => {
    const content = `
      <h1>Title</h1>
      <h2>Subtitle</h2>
      <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
      <ul>
        <li>List item 1</li>
        <li>List item 2</li>
      </ul>
      <blockquote>A quote</blockquote>
    `;
    const { container } = render(<PreviewPane content={content} />);

    expect(container.querySelector('h1')).toBeInTheDocument();
    expect(container.querySelector('h2')).toBeInTheDocument();
    expect(container.querySelector('p')).toBeInTheDocument();
    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(container.querySelector('em')).toBeInTheDocument();
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelector('blockquote')).toBeInTheDocument();
  });

  it('removes style attributes', () => {
    const content = '<p style="color: red;">Styled text</p>';
    const { container } = render(<PreviewPane content={content} />);

    const p = container.querySelector('p');
    expect(p?.getAttribute('style')).toBeNull();
    expect(p?.textContent).toContain('Styled text');
  });

  it('preserves images with allowed attributes', () => {
    const content = '<img src="https://example.com/image.png" alt="Test image">';
    const { container } = render(<PreviewPane content={content} />);

    const img = container.querySelector('img');
    expect(img?.src).toContain('example.com/image.png');
    expect(img?.alt).toBe('Test image');
  });

  it('handles empty content', () => {
    const { container } = render(<PreviewPane content="" />);
    expect(container.querySelector('[class*="prose"]')).toBeInTheDocument();
  });

  it('handles complex nested HTML', () => {
    const content = `
      <h1>Main Title</h1>
      <p>Introduction paragraph</p>
      <ul>
        <li><strong>Item 1:</strong> Description</li>
        <li><em>Item 2:</em> More description</li>
      </ul>
      <blockquote><p>A nested quote</p></blockquote>
      <p>Conclusion</p>
    `;
    const { container } = render(<PreviewPane content={content} />);

    expect(container.textContent).toContain('Main Title');
    expect(container.textContent).toContain('Introduction paragraph');
    expect(container.textContent).toContain('Item 1');
    expect(container.textContent).toContain('A nested quote');
    expect(container.textContent).toContain('Conclusion');
  });

  it('handles code blocks', () => {
    const content = '<pre><code>const x = 1;</code></pre>';
    const { container } = render(<PreviewPane content={content} />);

    expect(container.querySelector('pre')).toBeInTheDocument();
    expect(container.querySelector('code')).toBeInTheDocument();
    expect(container.textContent).toContain('const x = 1;');
  });

  it('removes onclick and other event handlers', () => {
    const content = '<button onclick="alert(\'clicked\')">Click me</button>';
    const { container } = render(<PreviewPane content={content} />);

    // button tag is not in ALLOWED_TAGS, so it should be removed
    const maybeButton = container.querySelector('button');
    // The content might still exist but without the onclick handler
    // Since button is not allowed, it won't render at all
    if (maybeButton) {
      expect(maybeButton.onclick).toBeNull();
    }
  });

  it('applies proper styling classes', () => {
    const content = '<h1>Test</h1>';
    const { container } = render(<PreviewPane content={content} />);

    const preview = container.querySelector('[class*="prose"]');
    expect(preview).toHaveClass('prose');
    expect(preview).toHaveClass('prose-sm');
    expect(preview).toHaveClass('max-w-none');
    expect(preview).toHaveClass('p-4');
    expect(preview).toHaveClass('border');
    expect(preview).toHaveClass('rounded-lg');
    expect(preview).toHaveClass('bg-gray-50');
  });

  it('handles content with special characters', () => {
    const content = '<p>Test &amp; special characters: &lt;tag&gt;</p>';
    const { container } = render(<PreviewPane content={content} />);

    expect(container.textContent).toContain('&');
    expect(container.textContent).toContain('special characters');
  });
});
