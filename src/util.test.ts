import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKGROUND_VALUES,
  DEFAULT_BACKGROUND,
  DEFAULT_DEBOUNCE_MS,
  MAX_DEBOUNCE_MS,
  MIN_DEBOUNCE_MS,
  buildContentSecurityPolicy,
  clampDebounceMs,
  coerceBackground,
  generateNonce,
  isSvgFileName,
  isSvgLanguageId,
  stripScriptTags,
} from './util';

describe('isSvgFileName', () => {
  it('matches lowercase .svg', () => {
    assert.equal(isSvgFileName('foo.svg'), true);
    assert.equal(isSvgFileName('/abs/path/icon.svg'), true);
  });

  it('matches case-insensitively', () => {
    assert.equal(isSvgFileName('icon.SVG'), true);
    assert.equal(isSvgFileName('icon.Svg'), true);
  });

  it('rejects non-svg extensions', () => {
    assert.equal(isSvgFileName('foo.svgx'), false);
    assert.equal(isSvgFileName('foo.svg.bak'), false);
    assert.equal(isSvgFileName('foo.png'), false);
    assert.equal(isSvgFileName('foo'), false);
  });

  it('rejects empty / non-string input', () => {
    assert.equal(isSvgFileName(''), false);
    assert.equal(isSvgFileName(null as unknown as string), false);
    assert.equal(isSvgFileName(undefined as unknown as string), false);
  });
});

describe('isSvgLanguageId', () => {
  it('accepts svg and xml', () => {
    assert.equal(isSvgLanguageId('svg'), true);
    assert.equal(isSvgLanguageId('xml'), true);
  });

  it('rejects others', () => {
    assert.equal(isSvgLanguageId('plaintext'), false);
    assert.equal(isSvgLanguageId('html'), false);
    assert.equal(isSvgLanguageId(undefined), false);
  });
});

describe('generateNonce', () => {
  it('produces a 32-char string by default', () => {
    const n = generateNonce();
    assert.equal(n.length, 32);
    assert.match(n, /^[A-Za-z0-9]+$/);
  });

  it('honors custom length', () => {
    assert.equal(generateNonce(8).length, 8);
    assert.equal(generateNonce(64).length, 64);
  });

  it('falls back to 32 for invalid lengths', () => {
    assert.equal(generateNonce(0).length, 32);
    assert.equal(generateNonce(-5).length, 32);
    assert.equal(generateNonce(NaN).length, 32);
  });

  it('returns a different value across calls (overwhelmingly likely)', () => {
    const a = generateNonce();
    const b = generateNonce();
    assert.notEqual(a, b);
  });
});

describe('buildContentSecurityPolicy', () => {
  const csp = buildContentSecurityPolicy('vscode-resource:', 'TESTNONCE');

  it('contains required directives', () => {
    assert.match(csp, /default-src 'none'/);
    assert.match(csp, /img-src vscode-resource: data: blob:/);
    assert.match(csp, /style-src vscode-resource: 'unsafe-inline'/);
    assert.match(csp, /script-src 'nonce-TESTNONCE'/);
    assert.match(csp, /font-src vscode-resource:/);
  });

  it('joins with semicolons', () => {
    assert.equal(csp.split(';').length, 5);
  });
});

describe('clampDebounceMs', () => {
  it('returns the value when within range', () => {
    assert.equal(clampDebounceMs(150), 150);
    assert.equal(clampDebounceMs(0), 0);
    assert.equal(clampDebounceMs(2000), 2000);
  });

  it('clamps below MIN', () => {
    assert.equal(clampDebounceMs(-10), MIN_DEBOUNCE_MS);
  });

  it('clamps above MAX', () => {
    assert.equal(clampDebounceMs(99999), MAX_DEBOUNCE_MS);
  });

  it('floors fractional values', () => {
    assert.equal(clampDebounceMs(150.9), 150);
  });

  it('falls back to default for non-numeric', () => {
    assert.equal(clampDebounceMs(undefined), DEFAULT_DEBOUNCE_MS);
    assert.equal(clampDebounceMs(null), DEFAULT_DEBOUNCE_MS);
    assert.equal(clampDebounceMs('abc'), DEFAULT_DEBOUNCE_MS);
    assert.equal(clampDebounceMs(NaN), DEFAULT_DEBOUNCE_MS);
  });

  it('coerces numeric strings', () => {
    assert.equal(clampDebounceMs('200'), 200);
  });

  it('honors custom fallback', () => {
    assert.equal(clampDebounceMs(undefined, 42), 42);
  });
});

describe('coerceBackground', () => {
  it('passes through known values', () => {
    for (const v of BACKGROUND_VALUES) {
      assert.equal(coerceBackground(v), v);
    }
  });

  it('falls back for unknown / wrong-typed values', () => {
    assert.equal(coerceBackground('rainbow'), DEFAULT_BACKGROUND);
    assert.equal(coerceBackground(undefined), DEFAULT_BACKGROUND);
    assert.equal(coerceBackground(123), DEFAULT_BACKGROUND);
    assert.equal(coerceBackground(null), DEFAULT_BACKGROUND);
  });

  it('honors a custom fallback', () => {
    assert.equal(coerceBackground('nonsense', 'black'), 'black');
  });
});

describe('stripScriptTags', () => {
  it('removes a single script block', () => {
    const input = '<svg><script>alert(1)</script><circle/></svg>';
    const out = stripScriptTags(input);
    assert.equal(out.includes('<script>'), false);
    assert.equal(out.includes('alert'), false);
    assert.equal(out.includes('<circle/>'), true);
  });

  it('removes multiple script blocks (case-insensitive)', () => {
    const input = '<svg><Script>x</Script><g/><SCRIPT>y</SCRIPT></svg>';
    const out = stripScriptTags(input);
    assert.equal(/<script/i.test(out), false);
    assert.equal(out.includes('<g/>'), true);
  });

  it('removes script with attributes', () => {
    const input = '<svg><script type="text/ecmascript">x</script></svg>';
    assert.equal(/<script/i.test(stripScriptTags(input)), false);
  });

  it('preserves SVG without scripts', () => {
    const input = '<svg><rect width="10" height="10"/></svg>';
    assert.equal(stripScriptTags(input), input);
  });

  it('handles non-string input', () => {
    assert.equal(stripScriptTags(undefined as unknown as string), '');
    assert.equal(stripScriptTags(null as unknown as string), '');
  });
});
