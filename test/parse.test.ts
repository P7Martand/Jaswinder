import { describe, it, expect } from 'vitest';
import { parseSetItemLines } from '../src/lib/parse';

describe('parseSetItemLines', () => {
  it('parses a single line with single quotes', () => {
    const r = parseSetItemLines("localStorage.setItem('config.debug.enable', 'true')");
    expect(r.pairs).toEqual([{ key: 'config.debug.enable', value: 'true' }]);
    expect(r.failedLines).toEqual([]);
  });

  it('parses multiple lines', () => {
    const input = [
      "localStorage.setItem('config.websocketCompression.disable', 'true')",
      "localStorage.setItem('config.debug.enable', 'true')",
    ].join('\n');
    const r = parseSetItemLines(input);
    expect(r.pairs).toEqual([
      { key: 'config.websocketCompression.disable', value: 'true' },
      { key: 'config.debug.enable', value: 'true' },
    ]);
    expect(r.failedLines).toEqual([]);
  });

  it('accepts double quotes, the window prefix, and trailing semicolons', () => {
    const r = parseSetItemLines('window.localStorage.setItem("k", "v");');
    expect(r.pairs).toEqual([{ key: 'k', value: 'v' }]);
    expect(r.failedLines).toEqual([]);
  });

  it('accepts backtick-quoted key and value', () => {
    const r = parseSetItemLines('localStorage.setItem(`k`, `v`)');
    expect(r.pairs).toEqual([{ key: 'k', value: 'v' }]);
    expect(r.failedLines).toEqual([]);
  });

  it('reports unparseable lines while keeping the good ones', () => {
    const input = ["localStorage.setItem('good', '1')", 'this is not a flag'].join('\n');
    const r = parseSetItemLines(input);
    expect(r.pairs).toEqual([{ key: 'good', value: '1' }]);
    expect(r.failedLines).toEqual(['this is not a flag']);
  });

  it('ignores blank lines', () => {
    const r = parseSetItemLines("\n\nlocalStorage.setItem('k','v')\n\n");
    expect(r.pairs).toEqual([{ key: 'k', value: 'v' }]);
    expect(r.failedLines).toEqual([]);
  });
});
