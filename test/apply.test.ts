import { describe, it, expect } from 'vitest';
import { buildOps } from '../src/lib/apply';
import type { Flag } from '../src/lib/flags';

const base: Flag = {
  id: '1',
  key: 'k',
  onValue: 'true',
  offBehavior: 'remove',
  enabled: true,
};

describe('buildOps', () => {
  it('enabled flag produces a set op with the onValue', () => {
    expect(buildOps([{ ...base, enabled: true, onValue: 'true' }])).toEqual([
      { action: 'set', key: 'k', value: 'true' },
    ]);
  });

  it('disabled + remove produces a remove op', () => {
    expect(buildOps([{ ...base, enabled: false, offBehavior: 'remove' }])).toEqual([
      { action: 'remove', key: 'k' },
    ]);
  });

  it('disabled + setValue produces a set op with the offValue', () => {
    expect(
      buildOps([{ ...base, enabled: false, offBehavior: 'setValue', offValue: 'false' }]),
    ).toEqual([{ action: 'set', key: 'k', value: 'false' }]);
  });

  it('disabled + setValue with no offValue sets an empty string', () => {
    expect(
      buildOps([{ ...base, enabled: false, offBehavior: 'setValue', offValue: undefined }]),
    ).toEqual([{ action: 'set', key: 'k', value: '' }]);
  });

  it('builds one op per flag, preserving order', () => {
    const ops = buildOps([
      { ...base, key: 'a', enabled: true, onValue: '1' },
      { ...base, key: 'b', enabled: false, offBehavior: 'remove' },
    ]);
    expect(ops).toEqual([
      { action: 'set', key: 'a', value: '1' },
      { action: 'remove', key: 'b' },
    ]);
  });
});
