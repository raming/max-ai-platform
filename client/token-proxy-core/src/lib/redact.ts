// Redact secret-like values for logs. Keeps first/last 2 chars when long enough.
export function redactSecret(value: string | undefined | null): string {
  if (!value) return '***';
  if (value.length <= 4) return '*'.repeat(value.length);
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}