'use client';

import React, { useState } from 'react';
import { QuillEditor } from '@max-ai/ui-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Save,
  FileText,
  Download,
  Eye,
  Edit,
  File
} from 'lucide-react';

export default function ContentPage() {
  const [content, setContent] = useState('<h1>Welcome to the Rich Text Editor</h1><p>This is a demonstration of the <strong>@max-ai/ui-editor</strong> component.</p><ul><li>Rich text editing</li><li>Content sanitization</li><li>Export capabilities</li></ul>');
  const [previewMode, setPreviewMode] = useState(false);
  const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json' | 'text'>('html');

  const handleSave = () => {
    console.log('Saving content:', content);
    // In a real app, this would save to a backend
    alert('Content saved successfully!');
  };

  const handleExport = () => {
    const plainText = content.replace(/<[^>]*>/g, '');
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content.${exportFormat === 'markdown' ? 'md' : exportFormat === 'json' ? 'json' : exportFormat === 'html' ? 'html' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getWordCount = () => {
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML tags
    return text.length;
  };

  const sampleContent = {
    basic: '<p>This is basic text content.</p>',
    formatted: '<h1>Formatted Content</h1><p>This content includes <strong>bold text</strong>, <em>italic text</em>, and <u>underlined text</u>.</p><ul><li>List item 1</li><li>List item 2</li></ul>',
    complex: '<h1>Advanced Features</h1><p>The editor supports:</p><ul><li><strong>Rich formatting</strong> - bold, italic, underline</li><li><em>Lists and headings</em> - organized content</li><li><u>Links and media</u> - interactive elements</li></ul><blockquote><p>This is a blockquote for highlighting important information.</p></blockquote><p>Try the toolbar above to see all available formatting options!</p>'
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Editor</h1>
          <p className="text-muted-foreground">
            Create and edit rich text content with the Quill.js editor
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="flex items-center space-x-1">
            <File className="h-3 w-3" />
            <span>{getWordCount()} characters</span>
          </Badge>
          <Button
            variant={previewMode ? "default" : "outline"}
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <Edit className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      <Tabs className="space-y-6">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="samples">Sample Content</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Rich Text Editor</span>
              </CardTitle>
              <CardDescription>
                Use the toolbar to format your content. Content is automatically sanitized for security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!previewMode ? (
                <div>
                  <QuillEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Start writing your content here..."
                    className="min-h-[400px]"
                  />
                </div>
              ) : (
                <div
                  className="min-h-[400px] p-4 border rounded-md bg-muted/50 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Content
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="samples" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setContent(sampleContent.basic)}>
              <CardHeader>
                <CardTitle className="text-lg">Basic Text</CardTitle>
                <CardDescription>Simple text content without formatting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{ __html: sampleContent.basic }} />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setContent(sampleContent.formatted)}>
              <CardHeader>
                <CardTitle className="text-lg">Formatted Content</CardTitle>
                <CardDescription>Content with basic formatting elements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{ __html: sampleContent.formatted }} />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setContent(sampleContent.complex)}>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Features</CardTitle>
                <CardDescription>Showcase of all editor capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{ __html: sampleContent.complex }} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Export your content in different formats for various use cases.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="export-format">Export Format</Label>
                  <select
                    id="export-format"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'html' | 'markdown' | 'json' | 'text')}
                    className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="html">HTML</option>
                    <option value="markdown">Markdown</option>
                    <option value="json">JSON</option>
                    <option value="text">Plain Text</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="export-filename">Filename</Label>
                  <input
                    id="export-filename"
                    type="text"
                    defaultValue={`content.${exportFormat}`}
                    className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                  />
                </div>
              </div>

              <div>
                <Label>Current Content Preview</Label>
                <Textarea
                  value={content}
                  readOnly
                  className="mt-1 min-h-[200px] font-mono text-sm"
                  placeholder="Your content will appear here..."
                />
              </div>

              <Button onClick={handleExport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download {exportFormat.toUpperCase()}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}