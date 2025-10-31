'use client';

/**
 * Export Modal Component
 * Allows users to export content in multiple formats
 * Reference: /docs/design/content-editing/DEV-UI-08-specification.md
 */

import React, { useState } from 'react';

export interface ExportModalProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
  onExport: (format: string, filename: string) => Promise<void>;
  isLoading?: boolean;
}

export type ExportFormat = 'html' | 'markdown' | 'json' | 'text';

/**
 * Export Modal - provides format selection and export functionality
 */
export const ExportModal = React.memo(
  ({
    isOpen,
    content,
    onClose,
    onExport,
    isLoading = false,
  }: ExportModalProps) => {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('html');
    const [filename, setFilename] = useState('content');
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
      try {
        setError(null);
        await onExport(selectedFormat, filename);
        console.debug(`[DEBUG] Exporting content: format=${selectedFormat}, contentId=${filename}`);
        onClose();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Export failed';
        setError(errorMsg);
        console.error('[DEBUG] Export error:', errorMsg);
      }
    };

    const handleFormatChange = (format: ExportFormat) => {
      setSelectedFormat(format);
    };

    const getPreview = (): string => {
      switch (selectedFormat) {
        case 'markdown':
          // Simple HTML to Markdown-like conversion
          return content
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ')
            .substring(0, 200);
        case 'json':
          return JSON.stringify({ content, format: 'json' }, null, 2).substring(
            0,
            200
          );
        case 'text':
          return content
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .substring(0, 200);
        case 'html':
        default:
          return content.substring(0, 200);
      }
    };

    if (!isOpen) return null;

    return (
      <div className='export-modal-overlay'>
        <div className='export-modal'>
          <div className='modal-header'>
            <h2>Export Content</h2>
            <button
              onClick={onClose}
              className='close-button'
              aria-label='Close modal'
            >
              ✕
            </button>
          </div>

          <div className='modal-content'>
            {/* Format Selection */}
            <div className='format-selector'>
              <label>Select Export Format:</label>
              <div className='format-options'>
                {(['html', 'markdown', 'json', 'text'] as ExportFormat[]).map(
                  (format) => (
                    <label key={format} className='format-option'>
                      <input
                        type='radio'
                        name='format'
                        value={format}
                        checked={selectedFormat === format}
                        onChange={() => handleFormatChange(format)}
                        disabled={isLoading}
                      />
                      <span className='format-label'>
                        {format.charAt(0).toUpperCase() + format.slice(1)}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Filename Input */}
            <div className='filename-input'>
              <label htmlFor='export-filename'>Filename (without extension):</label>
              <input
                id='export-filename'
                type='text'
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder='filename'
                disabled={isLoading}
              />
            </div>

            {/* Preview */}
            <div className='preview-section'>
              <label>Preview:</label>
              <textarea
                className='preview-textarea'
                value={getPreview()}
                readOnly
                rows={5}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className='error-message' role='alert'>
                {error}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className='modal-footer'>
            <button
              onClick={onClose}
              className='btn btn-secondary'
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className='btn btn-primary'
              disabled={isLoading || !filename}
            >
              {isLoading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

ExportModal.displayName = 'ExportModal';

export default ExportModal;
