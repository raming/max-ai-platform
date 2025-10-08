jest.mock('fs');
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AuditWriter } from '../audit-writer';
import { AuditEventType } from '../../auth/observability';
import fs from 'fs';

const mockedFs = jest.mocked(fs);

describe('AuditWriter', () => {
  let writer: AuditWriter;
  let appendFileSyncSpy: jest.SpiedFunction<typeof fs.appendFileSync>;

  beforeEach(() => {
    writer = new AuditWriter();
    appendFileSyncSpy = jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    appendFileSyncSpy.mockRestore();
  });

  it('writes valid redacted audit event to file', () => {
    const event = {
      id: 'audit-123',
      type: AuditEventType.TOKEN_VERIFIED,
      timestamp: '2025-10-08T12:00:00Z',
      userId: 'user-123',
      result: 'success' as const,
      correlationId: 'corr-123'
    };

    writer.write(event);

    expect(appendFileSyncSpy).toHaveBeenCalledWith(
      '/tmp/audit.log',
      JSON.stringify(event) + '\n'
    );
  });

  it('does not write invalid audit event', () => {
    const invalidEvent = {
      type: AuditEventType.TOKEN_VERIFIED,
      timestamp: '2025-10-08T12:00:00Z',
      userId: 'user-123',
      result: 'success' as const
      // missing id
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    writer.write(invalidEvent as any);

    expect(appendFileSyncSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});