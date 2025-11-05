'use client';

/**
 * Version Sidebar Component
 * Displays content version history and allows restoration
 * Reference: /docs/design/content-editing/DEV-UI-08-specification.md
 */

import React, { useState } from 'react';
import { ContentVersionDTO } from '@/types/content';

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
    const [selectedVersion, setSelectedVersion] = useState<number>(currentVersion);
    const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);

    const handleRestore = async (version: number) => {
      try {
        await onRestore(version);
        setSelectedVersion(version);
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
      <div className='version-sidebar'>
        <div className='sidebar-header'>
          <h3>Version History</h3>
          <span className='version-count'>{versions.length} versions</span>
        </div>

        <div className='version-list'>
          {versions.length === 0 ? (
            <div className='empty-state'>
              <p>No versions yet</p>
            </div>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className={`version-item ${
                  version.version === currentVersion ? 'current' : ''
                } ${version.version === selectedVersion ? 'selected' : ''}`}
              >
                <button
                  onClick={() =>
                    setExpandedVersionId(
                      expandedVersionId === version.id ? null : version.id
                    )
                  }
                  className='version-header-btn'
                  aria-expanded={expandedVersionId === version.id}
                >
                  <div className='version-info'>
                    <span className='version-number'>
                      v{version.version}
                    </span>
                    <span className='version-date'>
                      {formatDate(version.createdAt)}
                    </span>
                    {version.version === currentVersion && (
                      <span className='current-badge'>Current</span>
                    )}
                  </div>
                  <span className='expand-icon'>
                    {expandedVersionId === version.id ? '▼' : '▶'}
                  </span>
                </button>

                {/* Expanded Details */}
                {expandedVersionId === version.id && (
                  <div className='version-details'>
                    <div className='detail-item'>
                      <label>Author:</label>
                      <span>
                        {version.author.name} ({version.author.email})
                      </span>
                    </div>

                    {version.changeNotes && (
                      <div className='detail-item'>
                        <label>Changes:</label>
                        <span>{version.changeNotes}</span>
                      </div>
                    )}

                    <div className='detail-item'>
                      <label>Size:</label>
                      <span>{version.content.length} characters</span>
                    </div>

                    {version.version !== currentVersion && (
                      <button
                        onClick={() => handleRestore(version.version)}
                        className='btn btn-sm btn-secondary'
                        disabled={isLoading}
                      >
                        {isLoading ? 'Restoring...' : 'Restore to this version'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Info Section */}
        <div className='sidebar-info'>
          <p className='info-text'>
            Click a version to see details. Restore previous versions to undo changes.
          </p>
        </div>
      </div>
    );
  }
);

VersionSidebar.displayName = 'VersionSidebar';

export default VersionSidebar;
