import type { ParsedPair } from './flags';

export interface ParseResult {
  pairs: ParsedPair[];
  failedLines: string[];
}

// Matches: [window.]localStorage.setItem( <q>key<q> , <q>value<q> ) [;]
// Quote chars: ' " ` . Group 2 = key, group 4 = value.
const SETITEM_SOURCE =
  "(?:window\\.)?localStorage\\.setItem\\(\\s*(['\"`])(.*?)\\1\\s*,\\s*(['\"`])([\\s\\S]*?)\\3\\s*\\)\\s*;?";

export function parseSetItemLines(input: string): ParseResult {
  const pairs: ParsedPair[] = [];
  const failedLines: string[] = [];

  for (const rawLine of input.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const re = new RegExp(SETITEM_SOURCE, 'g');
    let matched = false;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      pairs.push({ key: m[2], value: m[4] });
      matched = true;
    }
    if (!matched) failedLines.push(line);
  }

  return { pairs, failedLines };
}
