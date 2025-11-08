import React, { useMemo, useRef, useCallback, useState } from 'react';
import ReactQuill from 'react-quill';
import DOMPurify from 'dompurify';
import 'react-quill/dist/quill.snow.css';
import { QuillEditorProps, QuillToolbarProps } from './types';

const defaultToolbar = [
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'font': [] }],
  [{ 'size': ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'script': 'sub' }, { 'script': 'super' }],
  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
  [{ 'indent': '-1' }, { 'indent': '+1' }],
  [{ 'align': [] }],
  ['blockquote', 'code-block'],
  ['link', 'image', 'video'],
  ['clean']
];

const defaultFormats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image', 'video',
  'color', 'background',
  'align', 'script',
  'code-block'
];

export const QuillToolbar: React.FC<QuillToolbarProps> = ({
  id,
  toolbar = defaultToolbar,
  className = ''
}) => {
  // toolbar parameter is used by Quill.js toolbar rendering
  // Disabling the warning for now as it's a Quill configuration
  void toolbar;
  return (
    <div 
      id={id} 
      className={`ql-toolbar ${className}`}
      role="toolbar"
      aria-label="Text formatting toolbar"
    >
      {/* Toolbar is handled by ReactQuill */}
    </div>
  );
};

export const QuillEditor: React.FC<QuillEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Start writing...',
  readOnly = false,
  theme = 'snow',
  toolbar = defaultToolbar,
  formats = defaultFormats,
  className = '',
  style,
  preserveWhitespace = false,
  bounds,
  debug = false,
  onFocus,
  onBlur,
  onKeyPress,
  onKeyDown,
  onKeyUp,
  onSelection,
  tabIndex = 0,
  ariaLabel = 'Rich text editor',
  ariaDescribedBy,
  id
}) => {
  void debug;
  void onKeyPress;
  void onKeyUp;
  void onSelection;
  const quillRef = useRef<ReactQuill>(null);
  const [isFocused, setIsFocused] = useState(false);
  const editorId = id || `quill-editor-${Math.random().toString(36).substr(2, 9)}`;

  // Keyboard event handler for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle keyboard navigation
    if (event.key === 'Tab') {
      // Allow tab to move focus out of editor
      if (event.shiftKey && quillRef.current) {
        // Shift+Tab to move focus to toolbar
        const toolbar = document.querySelector(`[aria-label="Text formatting toolbar"]`);
        if (toolbar instanceof HTMLElement) {
          toolbar.focus();
          event.preventDefault();
        }
      }
    }

    // Handle Ctrl/Cmd+B for bold
    if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
      event.preventDefault();
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const format = editor.getFormat();
        editor.format('bold', !format.bold);
      }
    }

    // Handle Ctrl/Cmd+I for italic
    if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
      event.preventDefault();
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const format = editor.getFormat();
        editor.format('italic', !format.italic);
      }
    }

    // Handle Ctrl/Cmd+U for underline
    if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
      event.preventDefault();
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const format = editor.getFormat();
        editor.format('underline', !format.underline);
      }
    }

    if (onKeyDown) {
      onKeyDown(event);
    }
  }, [onKeyDown]);

  // Sanitize content on change
  const handleChange = (content: string, _delta: unknown, _source: string, _editor: unknown): void => {
    // Sanitize HTML content
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'a', 'img', 'video',
        'span', 'div'
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'src', 'alt', 'width', 'height',
        'style', 'class', 'id'
      ]
    });

    if (onChange) {
      onChange(sanitizedContent);
    }
  };

  const handleFocus = useCallback((_range: unknown, _source: string, _editor: unknown) => {
    setIsFocused(true);
    
    // Announce to screen readers
    const statusDiv = document.getElementById(`${editorId}-status`);
    if (statusDiv) {
      statusDiv.textContent = 'Editor focused';
    }

    if (onFocus) {
      onFocus(_range, _source, _editor);
    }
  }, [onFocus, editorId]);

  const handleBlur = useCallback((_previousRange: unknown, _source: string, _editor: unknown) => {
    setIsFocused(false);

    if (onBlur) {
      onBlur(_previousRange, _source, _editor);
    }
  }, [onBlur]);

  const modules = useMemo((): Record<string, unknown> => ({
    toolbar: toolbar,
    clipboard: {
      matchVisual: false,
    },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: false
    },
    keyboard: {
      bindings: {
        tab: {
          key: 9,
          handler: function (_range: any, _context: any): boolean {
            return true; // Allow default tab behavior
          }
        }
      }
    }
  }), [toolbar]);

  return (
    <div className={`quill-editor-wrapper ${className}`} style={style}>
      <div
        id={editorId}
        role="textbox"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-multiline="true"
        aria-readonly={readOnly}
        className={`quill-editor-container ${isFocused ? 'focused' : ''}`}
        onKeyDown={handleKeyDown}
      >
        <ReactQuill
          ref={quillRef}
          theme={theme}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          readOnly={readOnly}
          modules={modules}
          formats={formats}
          preserveWhitespace={preserveWhitespace}
          bounds={bounds}
          tabIndex={tabIndex}
          className="quill-editor"
        />
      </div>
      {/* Screen reader status announcements */}
      <div 
        id={`${editorId}-status`}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  );
};

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;
