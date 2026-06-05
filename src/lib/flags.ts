export type OffBehavior = 'remove' | 'setValue';

export interface Flag {
  id: string;
  key: string;
  onValue: string;
  offBehavior: OffBehavior;
  offValue?: string;
  enabled: boolean;
  label?: string;
}

export interface StoredState {
  flags: Flag[];
}

export interface ParsedPair {
  key: string;
  value: string;
}

const STORAGE_KEY = 'flags';

/**
 * Merge parsed key/value pairs into an existing flag list (pure).
 * - Existing key → update its onValue, keep everything else.
 * - New key → append, enabled, offBehavior 'remove'.
 * Does not mutate the input array.
 */
export function mergePairs(
  existing: Flag[],
  pairs: ParsedPair[],
  idGen: () => string = () => crypto.randomUUID(),
): Flag[] {
  const result = existing.map((f) => ({ ...f }));
  for (const { key, value } of pairs) {
    const found = result.find((f) => f.key === key);
    if (found) {
      found.onValue = value;
    } else {
      result.push({
        id: idGen(),
        key,
        onValue: value,
        offBehavior: 'remove',
        enabled: true,
      });
    }
  }
  return result;
}

export async function loadFlags(): Promise<Flag[]> {
  const data = (await chrome.storage.local.get(STORAGE_KEY)) as Partial<StoredState>;
  return data.flags ?? [];
}

export async function saveFlags(flags: Flag[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: flags });
}
