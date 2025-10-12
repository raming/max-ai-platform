# @max-ai/ui-editor

A React component library providing a rich text editor based on Quill.js with TypeScript support, content sanitization, and export utilities.

## Features

- **Rich Text Editing**: Full-featured WYSIWYG editor with customizable toolbar
- **TypeScript Support**: Complete type definitions for all props and methods
- **Content Sanitization**: Built-in HTML sanitization using DOMPurify
- **Export Utilities**: Convert content to HTML, Markdown, JSON, or plain text
- **React 19 Compatible**: Uses legacy peer deps for compatibility
- **Customizable**: Configurable toolbar, themes, and formatting options

## Installation

```bash
npm install @max-ai/ui-editor
```

## Basic Usage

```tsx
import { QuillEditor } from '@max-ai/ui-editor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <QuillEditor
      value={content}
      onChange={setContent}
      placeholder="Start writing..."
    />
  );
}
```

## Props

### QuillEditorProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | `''` | The HTML content of the editor |
| `onChange` | `(value: string) => void` | - | Callback fired when content changes |
| `placeholder` | `string` | `'Start writing...'` | Placeholder text when editor is empty |
| `readOnly` | `boolean` | `false` | Whether the editor is read-only |
| `theme` | `'snow' \| 'bubble'` | `'snow'` | Quill theme to use |
| `toolbar` | `boolean \| string[] \| any[][]` | `default toolbar` | Toolbar configuration |
| `formats` | `string[]` | `default formats` | Allowed formats |
| `className` | `string` | - | Additional CSS class |
| `style` | `React.CSSProperties` | - | Inline styles |
| `onFocus` | `(range, source, editor) => void` | - | Focus event handler |
| `onBlur` | `(previousRange, source, editor) => void` | - | Blur event handler |
| `onSelection` | `(range, source, editor) => void` | - | Selection change handler |
| `onKeyPress` | `(event) => void` | - | Key press event handler |
| `onKeyDown` | `(event) => void` | - | Key down event handler |
| `onKeyUp` | `(event) => void` | - | Key up event handler |
| `tabIndex` | `number` | - | Tab index for accessibility |

## Ref Methods

The component forwards a ref with the following methods:

```tsx
const editorRef = useRef<QuillEditorRef>(null);

// Focus the editor
editorRef.current?.focus();

// Get editor content length
const length = editorRef.current?.getLength();

// Get plain text content
const text = editorRef.current?.getText();

// Get Quill Delta
const delta = editorRef.current?.getContents();
```

## Export Utilities

```tsx
import { exportContent, sanitizeHtml } from '@max-ai/ui-editor';

// Export content in different formats
const html = exportContent(content, { format: 'html' });
const markdown = exportContent(content, { format: 'markdown' });
const text = exportContent(content, { format: 'text' });

// Sanitize HTML content
const safeHtml = sanitizeHtml(userInput);
```

## Custom Toolbar

```tsx
const customToolbar = [
  ['bold', 'italic', 'underline'],
  [{ 'header': [1, 2, 3, false] }],
  ['link', 'image'],
  ['clean']
];

<QuillEditor toolbar={customToolbar} />
```

## Themes

The component supports Quill's built-in themes:

- **Snow**: Default theme with toolbar
- **Bubble**: Minimal theme with tooltip-based toolbar

```tsx
<QuillEditor theme="bubble" />
```

## Content Validation

```tsx
import { validateContentSize, getWordCount } from '@max-ai/ui-editor';

// Check content size
const isValid = validateContentSize(content, { maxLength: 10000 });

// Get word count
const words = getWordCount(content);
```

## Security

All HTML content is automatically sanitized using DOMPurify to prevent XSS attacks. The sanitization allows common rich text formatting tags while blocking potentially dangerous elements.

## TypeScript Support

The library provides complete TypeScript definitions:

```tsx
import type {
  QuillEditorProps,
  QuillEditorRef,
  QuillModules,
  ExportOptions
} from '@max-ai/ui-editor';
```

## Examples

### Basic Editor
```tsx
<QuillEditor
  value={content}
  onChange={setContent}
  placeholder="Write your story..."
/>
```

### Read-Only Editor
```tsx
<QuillEditor
  value={content}
  readOnly={true}
/>
```

### Custom Styled Editor
```tsx
<QuillEditor
  value={content}
  onChange={setContent}
  className="my-editor"
  style={{ minHeight: '200px' }}
/>
```

### With Event Handlers
```tsx
<QuillEditor
  value={content}
  onChange={setContent}
  onFocus={() => console.log('Editor focused')}
  onBlur={() => console.log('Editor blurred')}
/>
```

## Running Tests

```bash
nx test editor
```

## Dependencies

- React 19+
- Quill.js
- DOMPurify
- TypeScript
