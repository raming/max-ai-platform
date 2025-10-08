import { Logger, redactString, redactObject } from '../logger';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('redactString', () => {
  it('redacts JWT tokens', () => {
    const input = `Authorization: Bearer ${jwtToken}`;
    const expected = 'Authorization: Bearer [REDACTED]';
    expect(redactString(input)).toBe(expected);
  });

  it('redacts API keys', () => {
    const input = 'API_KEY: sk-123456789012345678901234567890123456789012345678';
    const expected = 'API_KEY: [REDACTED]';
    expect(redactString(input)).toBe(expected);
  });

  it('redacts emails', () => {
    const input = 'User email: user@example.com';
    const expected = 'User email: [REDACTED]';
    expect(redactString(input)).toBe(expected);
  });

  it('does not redact normal text', () => {
    const input = 'This is a normal message';
    expect(redactString(input)).toBe(input);
  });
});

describe('redactObject', () => {
  it('redacts sensitive values in object', () => {
    const input = {
      user: 'john@example.com',
      token: jwtToken,
      normal: 'value'
    };
    const expected = {
      user: '[REDACTED]',
      token: '[REDACTED]',
      normal: 'value'
    };
    expect(redactObject(input)).toEqual(expected);
  });

  it('redacts in nested objects', () => {
    const input = {
      data: {
        email: 'test@example.com',
        token: jwtToken,
        info: 'normal'
      }
    };
    const expected = {
      data: {
        email: '[REDACTED]',
        token: '[REDACTED]',
        info: 'normal'
      }
    };
    expect(redactObject(input)).toEqual(expected);
  });

  it('redacts in arrays', () => {
    const input = ['normal', 'secret@example.com'];
    const expected = ['normal', '[REDACTED]'];
    expect(redactObject(input)).toEqual(expected);
  });
});

describe('Logger', () => {
  it('creates logger with correlation ID', () => {
    const logger = new Logger('test-corr');
    expect(logger.getCorrelationId()).toBe('test-corr');
  });

  it('generates correlation ID if not provided', () => {
    const logger = new Logger();
    expect(logger.getCorrelationId()).toMatch(/^corr-\d+-[a-z0-9]+$/);
  });

  it('logs with redaction', () => {
    const logger = new Logger('test-corr');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('Test message', { token: jwtToken, email: 'user@example.com' });
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const loggedString = consoleSpy.mock.calls[0][0];
    const loggedObject = JSON.parse(loggedString);
    expect(loggedObject).toEqual({
      timestamp: expect.any(String),
      level: 'info',
      message: 'Test message',
      correlationId: 'test-corr',
      data: { token: '[REDACTED]', email: '[REDACTED]' }
    });
    consoleSpy.mockRestore();
  });
});