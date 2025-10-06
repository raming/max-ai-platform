import { FLAGS, isEnabled } from './flags';
import { redactSecret } from './redact';

describe('tokenProxyCore', () => {
  it('flags should read env with variants', () => {
    const env: any = { [FLAGS.RESOURCE_INIT_TOKEN_PROXY]: 'true' };
    expect(isEnabled(FLAGS.RESOURCE_INIT_TOKEN_PROXY, env)).toBe(true);
    env[FLAGS.RESOURCE_INIT_TOKEN_PROXY] = '0';
    expect(isEnabled(FLAGS.RESOURCE_INIT_TOKEN_PROXY, env)).toBe(false);
  });

  it('redacts secrets safely', () => {
    expect(redactSecret('abcd')).toBe('****');
    expect(redactSecret('abcdefgh')).toBe('ab***gh');
    expect(redactSecret('')).toBe('***');
  });
});
