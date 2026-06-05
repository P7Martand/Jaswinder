import { describe, it, expect } from 'vitest';
import { mergePairs, type Flag } from '../src/lib/flags';

// Deterministic id generator for assertions.
function seqIds() {
  let n = 0;
  return () => `id-${++n}`;
}

describe('mergePairs', () => {
  it('adds new keys as enabled flags that remove on off', () => {
    const out = mergePairs([], [{ key: 'a', value: 'true' }], seqIds());
    expect(out).toEqual([
      { id: 'id-1', key: 'a', onValue: 'true', offBehavior: 'remove', enabled: true },
    ]);
  });

  it('updates onValue of an existing key instead of duplicating', () => {
    const existing: Flag[] = [
      { id: 'x', key: 'a', onValue: 'old', offBehavior: 'remove', enabled: false },
    ];
    const out = mergePairs(existing, [{ key: 'a', value: 'new' }], seqIds());
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'x', key: 'a', onValue: 'new', enabled: false });
  });

  it('does not mutate the input array or its flags', () => {
    const existing: Flag[] = [
      { id: 'x', key: 'a', onValue: 'old', offBehavior: 'remove', enabled: true },
    ];
    mergePairs(existing, [{ key: 'a', value: 'new' }], seqIds());
    expect(existing[0].onValue).toBe('old');
  });

  it('handles a mix of new and existing keys', () => {
    const existing: Flag[] = [
      { id: 'x', key: 'a', onValue: '1', offBehavior: 'remove', enabled: true },
    ];
    const out = mergePairs(existing, [
      { key: 'a', value: '2' },
      { key: 'b', value: '3' },
    ], seqIds());
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ key: 'a', onValue: '2' });
    expect(out[1]).toMatchObject({ id: 'id-1', key: 'b', onValue: '3', enabled: true });
  });
});
