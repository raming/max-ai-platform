import React from 'react';
import { render } from '@testing-library/react';
import { QuillEditor } from './editor';

// Mock react-quill
jest.mock('react-quill', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockReactQuill = require('react-quill').default;

describe('QuillEditor', () => {
  beforeEach(() => {
    mockReactQuill.mockImplementation(() => 
      React.createElement('div', { 'data-testid': 'quill-editor' })
    );
  });

  it('should render successfully', () => {
    const { getByTestId } = render(<QuillEditor />);
    expect(getByTestId('quill-editor')).toBeTruthy();
  });
});
