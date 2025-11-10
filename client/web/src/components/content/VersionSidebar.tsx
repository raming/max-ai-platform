'use client';

/**
 * Version Sidebar Component
 * Displays content version history and allows restoration
 * Reference: /docs/design/content-editing/DEV-UI-08-specification.md
 */

import React, { useState } from 'react';
import { ContentVersionDTO } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, History } from 'lucide-react';

export interface VersionSidebarProps {
  versions: ContentVersionDTO[];
  currentVersion: number;
  onRestore: (version: number) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Version Sidebar - displays version history and allows restoration
 */
export const VersionSidebar = React.memo(
  ({ versions, currentVersion, onRestore, isLoading = false }: VersionSidebarProps) => {
    const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);

    const handleRestore = async (version: number) => {
      try {
        await onRestore(version);
        console.debug(`[DEBUG] Version restored: ${version}`);
      } catch (error) {
        console.error('[DEBUG] Failed to restore version:', error);
      }
    };

    const formatDate = (date: Date): string => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-2">
          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <History className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No versions yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`border rounded-lg transition-all ${
                    version.version === currentVersion
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Version Header - Clickable */}
                  <button
                    onClick={() =>
                      setExpandedVersionId(
                        expandedVersionId === version.id ? null : version.id
                      )
                    }
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors"
                    aria-expanded={expandedVersionId === version.id}
                  >
                    <div className="flex items-center gap-2 flex-1 text-left">
                      {expandedVersionId === version.id ? (
                        <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          v{version.version}
                          {version.version === currentVersion && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(version.createdAt)}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedVersionId === version.id && (
                    <div className="px-3 py-3 border-t space-y-3 bg-gray-50 rounded-b-lg">
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">Author:</span>
                          <p className="text-gray-600">
                            {version.author.name} ({version.author.email})
                          </p>
                        </div>

                        {version.changeNotes && (
                          <div>
                            <span className="font-semibold text-gray-700">Changes:</span>
                            <p className="text-gray-600 line-clamp-2">
                              {version.changeNotes}
                            </p>
                          </div>
                        )}

                        <div>
                          <span className="font-semibold text-gray-700">Size:</span>
                          <p className="text-gray-600">
                            {version.content.length.toLocaleString()} characters
                          </p>
                        </div>
                      </div>

                      {version.version !== currentVersion && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(version.version)}
                          disabled={isLoading}
                          className="w-full"
                        >
                          {isLoading ? 'Restoring...' : 'Restore to this version'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Footer Info */}
        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
          <p>Expand versions to see details and restore previous edits.</p>
        </div>
      </Card>
    );
  }
);

VersionSidebar.displayName = 'VersionSidebar';

export default VersionSidebar;
