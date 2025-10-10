export const FLAGS = {
  RESOURCE_INIT_TOKEN_PROXY: 'resource-init-token-proxy',
} as const;

export function isEnabled(flag: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const flagKey = flag.toUpperCase().replace(/-/g, '_');
  const v = env[flag] ?? env[flagKey];
  if (v == null) return false;
  return ['1', 'true', 'on', 'yes'].includes(String(v).toLowerCase());
}