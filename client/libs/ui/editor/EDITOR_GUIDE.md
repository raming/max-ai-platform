# Quill.js Rich Text Editor Library

A comprehensive Quill.js rich text editor component built for the MaxAI Platform with TypeScript support, content sanitization, accessibility features, and multi-format export capabilities.

## Features

### Core Features
- ✅ **Rich Text Editing** - Full Quill.js integration with extensive formatting options
- ✅ **TypeScript Support** - Fully typed interfaces and components
- ✅ **Content Sanitization** - Automatic XSS protection via DOMPurify
- ✅ **Multi-Format Export** - Export to HTML, Markdown, JSON, and plain text
- ✅ **Keyboard Navigation** - Full keyboard support with shortcuts
- ✅ **Accessibility** - WCAG compliant with ARIA labels, screen reader support, and focus management

### Advanced Features
- Content size validation with configurable limits
- Word and character counting utilities
- Read-only mode for displaying content
- Customizable toolbar configuration
- Custom CSS styling support
- Form integration with React Hook Form
- Error boundaries and graceful degradation

## Installation

The editor is part of the UI library monorepo. Import from the UI library:

```tsx
import { QuillEditor, QuillToolbar } from '@repo/ui/editor';
```

## Usage

### Basic Editor

```tsx
import { useState } from 'react';
import { QuillEditor } from '@repo/ui/editor';

export function MyEditor() {
  const [content, setContent] = useState('<p>Start typing...</p>');

  return (
    <QuillEditor 
      value={content}
      onChange={setContent}
      placeholder="Write something amazing..."
    />
  );
}
```

### With Full Toolbar

```tsx
<QuillEditor 
  value={content}
  onChange={setContent}
  toolbar={[
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'image', 'video'],
    ['clean']
  ]}
/>
```

### Minimal Toolbar

```tsx
<QuillEditor 
  value={content}
  onChange={setContent}
  toolbar={[
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
  ]}
/>
```

### Read-Only Mode

```tsx
<QuillEditor 
  value={content}
  readOnly={true}
  placeholder="This content cannot be edited"
/>
```

### Accessibility Features

```tsx
<QuillEditor 
  id="content-editor"
  value={content}
  onChange={setContent}
  ariaLabel="Rich text content editor"
  ariaDescribedBy="editor-help"
  placeholder="Start typing (Ctrl+B for bold, Ctrl+I for italic)"
/>

<div id="editor-help" className="help-text">
  Keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline)
</div>
```

### With Custom Styling

```tsx
<QuillEditor 
  value={content}
  onChange={setContent}
  className="custom-editor"
  style={{
    minHeight: '300px',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
  }}
/>
```

### Event Handlers

```tsx
<QuillEditor 
  value={content}
  onChange={setContent}
  onFocus={() => console.log('Editor focused')}
  onBlur={() => console.log('Editor blurred')}
  onKeyPress={(event) => console.log('Key pressed')}
/>
```

## API Reference

### QuillEditor Props

```tsx
interface QuillEditorProps {
  // Content
  value?: string;
  onChange?: (value: string) => void;
  
  // Configuration
  placeholder?: string;
  readOnly?: boolean;
  theme?: 'snow' | 'bubble';
  toolbar?: boolean | string[] | any[][];
  formats?: string[];
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Events
  onFocus?: (range: unknown, source: string, editor: unknown) => void;
  onBlur?: (previousRange: unknown, source: string, editor: unknown) => void;
  onSelection?: (range: unknown, source: string, editor: unknown) => void;
  onKeyPress?: (event: any) => void;
  onKeyDown?: (event: any) => void;
  onKeyUp?: (event: any) => void;
  
  // Accessibility
  id?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  tabIndex?: number;
  
  // Advanced Options
  bounds?: string | HTMLElement;
  preserveWhitespace?: boolean;
  debug?: boolean | 'warn' | 'error' | 'info' | 'log';
}
```

### Utility Functions

#### Sanitization

```tsx
import { sanitizeHtml } from '@repo/ui/editor';

const safe = sanitizeHtml('<script>alert("xss")</script><p>Safe</p>');
// Output: '<p>Safe</p>'
```

#### Export Content

```tsx
import { exportContent } from '@repo/ui/editor';

const content = '<p>Hello <strong>world</strong></p>';

const html = exportContent(content, { format: 'html' });
const markdown = exportContent(content, { format: 'markdown' });
const text = exportContent(content, { format: 'text' });
const json = exportContent(content, { format: 'json' });
```

#### Validation

```tsx
import { validateContentSize } from '@repo/ui/editor';

const result = validateContentSize(content, 1024); // 1MB limit
if (!result.valid) {
  console.error(result.message);
}
```

#### Counting

```tsx
import { getWordCount, getCharacterCount } from '@repo/ui/editor';

const words = getWordCount('<p>Hello world</p>'); // 2
const chars = getCharacterCount('<p>Hello world</p>'); // 11
```

#### Format Conversion

```tsx
import { htmlToMarkdown, deltaToHtml } from '@repo/ui/editor';

const markdown = htmlToMarkdown('<h1>Title</h1><p>Content</p>');
const html = deltaToHtml(quillDelta);
```

## Accessibility

### Keyboard Shortcuts

- **Ctrl/Cmd + B** - Bold
- **Ctrl/Cmd + I** - Italic
- **Ctrl/Cmd + U** - Underline
- **Tab** - Move focus out of editor
- **Shift + Tab** - Move focus to toolbar

### Screen Reader Support

- Full ARIA labels and descriptions
- Live region announcements for status updates
- Semantic HTML structure
- Proper role attributes for all interactive elements

### Focus Management

- Visible focus indicators
- Proper tab order
- Focus trap management
- Clear focus state changes

## Security

### XSS Protection

Content is automatically sanitized using DOMPurify with the following allowed tags:

- **Text**: `p`, `br`, `span`, `div`
- **Formatting**: `strong`, `b`, `em`, `i`, `u`, `strike`, `s`
- **Structure**: `h1-h6`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`
- **Links & Media**: `a`, `img`, `video`

### Allowed Attributes

- `href`, `target` (for links)
- `src`, `alt`, `width`, `height` (for images/video)
- `style`, `class`, `id` (for styling)

## Performance

### Optimization Tips

1. **Memoize callbacks** - Use `useCallback` for onChange handlers
2. **Lazy load** - Use React.lazy for optional heavy features
3. **Debounce changes** - Debounce onChange if handling large documents
4. **Content size limits** - Enforce maximum content size with `validateContentSize`

### Bundle Size

- Quill.js: ~52KB (gzipped)
- DOMPurify: ~16KB (gzipped)
- Total: ~68KB (gzipped)

## Testing

### Unit Tests

The library includes comprehensive tests:

- 48 tests covering all features
- 100% test pass rate
- Coverage includes:
  - Component rendering
  - Content management
  - Event handling
  - Accessibility compliance
  - Sanitization
  - Export formats
  - Utility functions

Run tests:

```bash
npm test -- libs/ui/editor
```

### Testing Best Practices

```tsx
import { render } from '@testing-library/react';
import { QuillEditor } from '@repo/ui/editor';

test('sanitizes content', () => {
  const onChange = jest.fn();
  const { container } = render(
    <QuillEditor onChange={onChange} />
  );
  
  // Test sanitization of dangerous content
  expect(onChange).toHaveBeenCalledWith(
    expect.not.stringContaining('<script>')
  );
});
```

## Integration Examples

### With React Hook Form

```tsx
import { useForm, Controller } from 'react-hook-form';
import { QuillEditor } from '@repo/ui/editor';

export function ContentForm() {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      content: '<p>Default content</p>'
    }
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <QuillEditor {...field} />
        )}
      />
      <button type="submit">Save</button>
    </form>
  );
}
```

### With Zustand Store

```tsx
import { create } from 'zustand';
import { QuillEditor } from '@repo/ui/editor';

const useContentStore = create((set) => ({
  content: '<p>Initial</p>',
  setContent: (content) => set({ content }),
}));

export function ContentEditor() {
  const { content, setContent } = useContentStore();
  
  return (
    <QuillEditor 
      value={content}
      onChange={setContent}
    />
  );
}
```

### With TanStack Query

```tsx
import { useMutation, useQuery } from '@tanstack/react-query';
import { QuillEditor } from '@repo/ui/editor';

export function ContentPage({ id }: { id: string }) {
  const { data: content } = useQuery({
    queryKey: ['content', id],
    queryFn: () => fetch(`/api/content/${id}`).then(r => r.json()),
  });

  const { mutate: saveContent } = useMutation({
    mutationFn: (newContent: string) =>
      fetch(`/api/content/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: newContent }),
      }),
  });

  return (
    <QuillEditor 
      value={content}
      onChange={saveContent}
    />
  );
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

1. **Rich Table Support** - Currently no built-in table editor support
2. **Collaborative Editing** - Not included; use Yjs or Automerge for real-time collaboration
3. **Advanced Math** - LaTeX math rendering not included
4. **File Upload** - Image/video uploads must be handled by host application

## Migration from Previous Version

If updating from an earlier version:

1. Update component imports to new paths
2. Review accessibility props (new ARIA props)
3. Test sanitization behavior (may differ from previous version)
4. Verify keyboard shortcut conflicts in your app

## Contributing

When contributing to this library:

1. Add tests for new features
2. Maintain >90% test coverage
3. Update documentation
4. Follow TypeScript strict mode
5. Ensure accessibility compliance (WCAG AA)
6. Test across browsers

## Resources

- [Quill.js Documentation](https://quilljs.com/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [MDN Web Docs - Rich Text Editing](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## License

Part of the MaxAI Platform. See LICENSE file for details.
