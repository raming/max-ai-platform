export type QuillTheme = 'snow' | 'bubble';

export type QuillFormat =
  | 'header'
  | 'font'
  | 'size'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'blockquote'
  | 'list'
  | 'bullet'
  | 'indent'
  | 'link'
  | 'image'
  | 'video'
  | 'color'
  | 'background'
  | 'align'
  | 'script'
  | 'code-block';

export interface QuillToolbarItem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Quill.js toolbar configuration allows flexible object structures
}

export type QuillToolbarConfig = boolean | string[] | QuillToolbarItem[];

export interface QuillModules {
  toolbar?: QuillToolbarConfig;
  clipboard?: {
    matchVisual?: boolean;
  };
  history?: {
    delay?: number;
    maxStack?: number;
    userOnly?: boolean;
  };
  keyboard?: {
    bindings?: Record<string, any>;
  };
}

export interface QuillDelta {
  ops: Array<{
    insert?: string | Record<string, any>;
    delete?: number;
    retain?: number;
    attributes?: Record<string, any>;
  }>;
}

export interface QuillRange {
  index: number;
  length: number;
}

export type ExportFormat = 'html' | 'markdown' | 'json' | 'text';

export interface ExportOptions {
  format: ExportFormat;
  includeStyles?: boolean;
  sanitize?: boolean;
}

export interface QuillEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  theme?: 'snow' | 'bubble';
  toolbar?: boolean | string[] | any[][];
  formats?: string[];
  className?: string;
  style?: React.CSSProperties;
  preserveWhitespace?: boolean;
  bounds?: string | HTMLElement;
  debug?: boolean | 'warn' | 'error' | 'info' | 'log';
  onFocus?: (range: any, source: string, editor: any) => void;
  onBlur?: (previousRange: any, source: string, editor: any) => void;
  onSelection?: (range: any, source: string, editor: any) => void;
  onKeyPress?: (event: any) => void;
  onKeyDown?: (event: any) => void;
  onKeyUp?: (event: any) => void;
  tabIndex?: number;
}

export interface QuillToolbarProps {
  id?: string;
  toolbar?: boolean | string[] | any[][];
  className?: string;
}

export interface QuillEditorRef {
  focus: () => void;
  blur: () => void;
  getEditor: () => unknown;
  getLength: () => number;
  getText: () => string;
  getContents: () => unknown;
  setContents: (delta: unknown) => void;
  setText: (text: string) => void;
}