export type Background =
  | 'checkerboard'
  | 'editor'
  | 'transparent'
  | 'white'
  | 'black';

export const BACKGROUND_VALUES: readonly Background[] = [
  'checkerboard',
  'editor',
  'transparent',
  'white',
  'black',
] as const;

export const DEFAULT_DEBOUNCE_MS = 150;
export const MIN_DEBOUNCE_MS = 0;
export const MAX_DEBOUNCE_MS = 2000;
export const DEFAULT_BACKGROUND: Background = 'checkerboard';

const NONCE_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function isSvgFileName(fileName: string): boolean {
  if (typeof fileName !== 'string' || fileName.length === 0) return false;
  const lower = fileName.toLowerCase();
  return lower.endsWith('.svg');
}

export function isSvgLanguageId(languageId: string | undefined): boolean {
  return languageId === 'svg' || languageId === 'xml';
}

export function generateNonce(length = 32): string {
  if (!Number.isFinite(length) || length <= 0) length = 32;
  let s = '';
  for (let i = 0; i < length; i++) {
    s += NONCE_CHARS.charAt(Math.floor(Math.random() * NONCE_CHARS.length));
  }
  return s;
}

export function buildContentSecurityPolicy(
  cspSource: string,
  nonce: string,
): string {
  return [
    `default-src 'none'`,
    `img-src ${cspSource} data: blob:`,
    `style-src ${cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
    `font-src ${cspSource}`,
  ].join('; ');
}

export function clampDebounceMs(value: unknown, fallback = DEFAULT_DEBOUNCE_MS): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  if (typeof value === 'boolean') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < MIN_DEBOUNCE_MS) return MIN_DEBOUNCE_MS;
  if (n > MAX_DEBOUNCE_MS) return MAX_DEBOUNCE_MS;
  return Math.floor(n);
}

export function coerceBackground(value: unknown, fallback: Background = DEFAULT_BACKGROUND): Background {
  if (typeof value !== 'string') return fallback;
  return (BACKGROUND_VALUES as readonly string[]).includes(value)
    ? (value as Background)
    : fallback;
}

export function stripScriptTags(svg: string): string {
  if (typeof svg !== 'string') return '';
  return svg.replace(/<script[\s\S]*?<\/script>/gi, '');
}
