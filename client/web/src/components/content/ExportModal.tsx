'use client';

/**
 * Export Modal Component
 * Allows users to export content in multiple formats
 * Reference: /docs/design/content-editing/DEV-UI-08-specification.md
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download } from 'lucide-react';

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
        console.debug(`[DEBUG] Exporting content: format=${selectedFormat}, filename=${filename}`);
        onClose();
        setFilename('content');
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Export failed';
        setError(errorMsg);
        console.error('[DEBUG] Export error:', errorMsg);
      }
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

    const getFileExtension = (): string => {
      switch (selectedFormat) {
        case 'markdown':
          return 'md';
        case 'json':
          return 'json';
        case 'text':
          return 'txt';
        case 'html':
        default:
          return 'html';
      }
    };

    const handleClose = () => {
      setError(null);
      setFilename('content');
      setSelectedFormat('html');
      onClose();
    };

    const formatOptions: Array<{ value: ExportFormat; label: string }> = [
      { value: 'html', label: 'HTML (.html)' },
      { value: 'markdown', label: 'Markdown (.md)' },
      { value: 'json', label: 'JSON (.json)' },
      { value: 'text', label: 'Plain Text (.txt)' },
    ];

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Content</DialogTitle>
            <DialogDescription>
              Choose a format and download your content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Export Format</Label>
              <div className="space-y-2">
                {formatOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`format-${option.value}`}
                      name="export-format"
                      value={option.value}
                      checked={selectedFormat === option.value}
                      onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                      disabled={isLoading}
                      className="h-4 w-4 cursor-pointer"
                    />
                    <Label htmlFor={`format-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filename Input */}
            <div className="space-y-2">
              <Label htmlFor="export-filename">Filename</Label>
              <div className="flex gap-2 items-end">
                <Input
                  id="export-filename"
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="filename"
                  disabled={isLoading}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">
                  .{getFileExtension()}
                </span>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label htmlFor="export-preview">Preview</Label>
              <Textarea
                id="export-preview"
                value={getPreview()}
                readOnly
                rows={4}
                className="text-sm resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isLoading || !filename}
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? 'Exporting...' : 'Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ExportModal.displayName = 'ExportModal';

export default ExportModal;
