import React, { useMemo, useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import DOMPurify from 'dompurify';
import 'react-quill/dist/quill.snow.css';
import { QuillModules, QuillDelta, QuillRange, QuillEditorProps, QuillToolbarProps, QuillEditorRef } from './types';

const defaultToolbar = [
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'font': [] }],
  [{ 'size': ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'script': 'sub'}, { 'script': 'super' }],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'indent': '-1'}, { 'indent': '+1' }],
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
  return (
    <div id={id} className={`ql-toolbar ${className}`}>
      {/* Toolbar is handled by ReactQuill */}
    </div>
  );
};

export const QuillEditor = React.forwardRef<QuillEditorRef, QuillEditorProps>(({
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
  tabIndex
}, ref) => {
  const quillRef = useRef<ReactQuill>(null);

  // Sanitize content on change
  const handleChange = (content: string, delta: any, source: string, editor: any) => {
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

  const modules = useMemo(() => ({
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
          handler: function(range: any, context: any) {
            return true; // Allow default tab behavior
          }
        }
      }
    }
  }), [toolbar]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      quillRef.current?.focus();
    },
    blur: () => {
      quillRef.current?.blur();
    },
    getEditor: () => {
      return quillRef.current?.getEditor() as any;
    },
    getLength: () => {
      return quillRef.current?.getEditor()?.getLength() || 0;
    },
    getText: () => {
      return quillRef.current?.getEditor()?.getText() || '';
    },
    getContents: () => {
      return quillRef.current?.getEditor()?.getContents();
    },
    setContents: (delta: any) => {
      quillRef.current?.getEditor()?.setContents(delta);
    },
    setText: (text: string) => {
      quillRef.current?.getEditor()?.setText(text);
    }
  }));

  return (
    <div className={`quill-editor-wrapper ${className}`} style={style}>
      <ReactQuill
        ref={quillRef}
        theme={theme}
        value={value}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyPress={onKeyPress}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
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
  );
});

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;
