# Jaswinder Flag Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome MV3 extension that manages a list of `localStorage` feature flags and applies the selected ones to the active tab, then auto-reloads it.

**Architecture:** A Preact popup persists a flag list to `chrome.storage.local`. Pure modules handle parsing pasted `localStorage.setItem(...)` lines and turning flags into a list of storage operations. On "Apply & Reload", those operations are injected into the active tab via `chrome.scripting.executeScript`, and the tab is reloaded. Pure logic (`parse`, `buildOps`, `mergePairs`) is unit-tested; Chrome API wrappers are kept thin and out of the pure modules so tests need no browser.

**Tech Stack:** Vite + Preact + TypeScript, `@crxjs/vite-plugin` (MV3 manifest + HMR), Vitest, Manifest V3.

**Project root:** `~/Documents/GitHub/jaswinder` (existing git repo; only the spec is committed). All paths below are relative to this root. Run all commands from this root.

---

## File structure (target)

```
jaswinder/
  package.json
  tsconfig.json
  vite.config.ts            # Vite + Preact + crxjs (build/dev)
  vitest.config.ts          # Vitest (node env, no crxjs) — keeps tests isolated
  manifest.config.ts        # MV3 manifest, consumed by crxjs
  index.html                # popup entry → src/popup/main.tsx
  .gitignore
  scripts/
    gen-icons.mjs           # generates icons/*.png from an inline SVG (sharp)
  icons/                    # committed generated PNGs (16/32/48/128)
  src/
    popup/
      main.tsx              # mounts <App/>
      App.tsx               # popup root: list + add + apply, owns state
      components/
        FlagRow.tsx         # one flag: checkbox, label, expand-to-edit, delete
        AddFlags.tsx        # textarea + Parse & Add
        Footer.tsx          # Apply & Reload, select all/none, status line
    lib/
      flags.ts              # types + mergePairs (pure) + chrome.storage helpers
      parse.ts              # parseSetItemLines (pure)
      apply.ts              # buildOps (pure) + applyOpsInPage + applyToActiveTab
    styles.css
  test/
    flags.test.ts           # mergePairs
    parse.test.ts           # parseSetItemLines
    apply.test.ts           # buildOps
  README.md
```

---

## Task 1: Scaffold project and render a blank popup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `manifest.config.ts` (no icons yet — added in Task 2 so the build doesn't fail on missing files)
- Create: `index.html`
- Create: `src/popup/main.tsx`
- Create: `src/popup/App.tsx` (minimal placeholder, replaced in Task 6)
- Create: `src/styles.css` (minimal, expanded in Task 6)
- Create: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "jaswinder",
  "version": "0.1.0",
  "description": "Chrome extension to manage localStorage feature flags and apply them to the active tab.",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "gen-icons": "node scripts/gen-icons.mjs",
    "package": "cd dist && zip -r ../jaswinder.zip . && cd .."
  },
  "dependencies": {
    "preact": "^10.24.0"
  },
  "devDependencies": {
    "@crxjs/vite-plugin": "^2.0.0-beta.23",
    "@preact/preset-vite": "^2.9.0",
    "@types/chrome": "^0.0.270",
    "sharp": "^0.33.5",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "types": ["chrome", "vite/client"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "test", "scripts", "manifest.config.ts", "vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [preact(), crx({ manifest })],
  build: { target: 'esnext' },
});
```

- [ ] **Step 4: Create `vitest.config.ts`** (separate from vite.config so the crxjs plugin doesn't run during tests)

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Create `manifest.config.ts`** (icons added in Task 2)

```ts
import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Jaswinder',
  version: '0.1.0',
  description: 'Manage localStorage feature flags and apply them to the active tab.',
  action: {
    default_popup: 'index.html',
    default_title: 'Jaswinder',
  },
  permissions: ['storage', 'scripting', 'activeTab', 'tabs'],
});
```

- [ ] **Step 6: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Jaswinder</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/popup/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `src/popup/main.tsx`**

```tsx
import { render } from 'preact';
import { App } from './App';
import '../styles.css';

const root = document.getElementById('app');
if (root) render(<App />, root);
```

- [ ] **Step 8: Create `src/popup/App.tsx`** (placeholder — fully implemented in Task 6)

```tsx
export function App() {
  return (
    <div class="app">
      <header class="header">
        <h1>Jaswinder</h1>
        <p class="subtitle">localStorage flag manager</p>
      </header>
    </div>
  );
}
```

- [ ] **Step 9: Create `src/styles.css`** (minimal — expanded in Task 6)

```css
:root {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
}
body {
  margin: 0;
}
.app {
  width: 360px;
  padding: 12px;
}
.header h1 {
  margin: 0;
  font-size: 16px;
}
.subtitle {
  margin: 2px 0 0;
  color: #6b7280;
}
```

- [ ] **Step 10: Create `.gitignore`**

```
node_modules
dist
*.zip
.DS_Store
```

- [ ] **Step 11: Install dependencies**

Run: `npm install`
Expected: completes without errors; `node_modules/` created. (If `@crxjs/vite-plugin@^2.0.0-beta.23` is not resolvable, install the current beta: `npm i -D @crxjs/vite-plugin@beta`, then re-run `npm install`.)

- [ ] **Step 12: Verify the build produces a loadable extension**

Run: `npm run build`
Expected: PASS — a `dist/` directory is created containing `manifest.json`, an `index.html`, and bundled JS. No errors.

- [ ] **Step 13: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS — no TypeScript errors.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: scaffold Jaswinder Preact MV3 extension with blank popup"
```

---

## Task 2: Generate and wire up icons

**Files:**
- Create: `scripts/gen-icons.mjs`
- Create: `icons/16.png`, `icons/32.png`, `icons/48.png`, `icons/128.png` (generated)
- Modify: `manifest.config.ts` (add `icons` and `action.default_icon`)

> Fallback: if `sharp` cannot install/build in your environment, skip Steps 1–3 and do NOT add the icons keys in Step 4. Chrome will use a default icon and the extension still works. Note this in the commit message.

- [ ] **Step 1: Create `scripts/gen-icons.mjs`**

```js
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="24" fill="#2563eb"/>
  <path d="M42 26v76" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
  <path d="M46 30h46l-11 17 11 17H46z" fill="#ffffff"/>
</svg>`;

mkdirSync('icons', { recursive: true });

for (const size of [16, 32, 48, 128]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`icons/${size}.png`);
  console.log(`wrote icons/${size}.png`);
}
```

- [ ] **Step 2: Install `sharp`** (already in devDependencies; ensure it's present)

Run: `npm install`
Expected: `sharp` present under `node_modules/`.

- [ ] **Step 3: Generate the icons**

Run: `npm run gen-icons`
Expected: prints `wrote icons/16.png` … `wrote icons/128.png`; four PNG files exist under `icons/`.

- [ ] **Step 4: Add icons to `manifest.config.ts`**

Replace the entire file contents with:

```ts
import { defineManifest } from '@crxjs/vite-plugin';

const icons = {
  '16': 'icons/16.png',
  '32': 'icons/32.png',
  '48': 'icons/48.png',
  '128': 'icons/128.png',
};

export default defineManifest({
  manifest_version: 3,
  name: 'Jaswinder',
  version: '0.1.0',
  description: 'Manage localStorage feature flags and apply them to the active tab.',
  action: {
    default_popup: 'index.html',
    default_title: 'Jaswinder',
    default_icon: icons,
  },
  icons,
  permissions: ['storage', 'scripting', 'activeTab', 'tabs'],
});
```

- [ ] **Step 5: Verify the build still succeeds with icons referenced**

Run: `npm run build`
Expected: PASS — `dist/` is rebuilt and includes the icon assets; no "file not found" errors for icons.

- [ ] **Step 6: Commit** (commit the generated PNGs so a fresh clone builds without running gen-icons)

```bash
git add -A
git commit -m "feat: add extension icons and generator script"
```

---

## Task 3: Flag types, storage helpers, and `mergePairs` (TDD)

**Files:**
- Create: `src/lib/flags.ts`
- Test: `test/flags.test.ts`

- [ ] **Step 1: Write the failing test** — Create `test/flags.test.ts`

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- flags`
Expected: FAIL — cannot resolve `../src/lib/flags` (module/exports do not exist yet).

- [ ] **Step 3: Implement `src/lib/flags.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- flags`
Expected: PASS — all four `mergePairs` tests green.

- [ ] **Step 5: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS — no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add flag types, storage helpers, and mergePairs with tests"
```

---

## Task 4: Parse pasted `localStorage.setItem(...)` lines (TDD)

**Files:**
- Create: `src/lib/parse.ts`
- Test: `test/parse.test.ts`

- [ ] **Step 1: Write the failing test** — Create `test/parse.test.ts`

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- parse`
Expected: FAIL — cannot resolve `../src/lib/parse`.

- [ ] **Step 3: Implement `src/lib/parse.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- parse`
Expected: PASS — all five parse tests green.

- [ ] **Step 5: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add localStorage.setItem line parser with tests"
```

---

## Task 5: Build operations and apply to the active tab (TDD for `buildOps`)

**Files:**
- Create: `src/lib/apply.ts`
- Test: `test/apply.test.ts`

- [ ] **Step 1: Write the failing test** — Create `test/apply.test.ts`

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- apply`
Expected: FAIL — cannot resolve `../src/lib/apply`.

- [ ] **Step 3: Implement `src/lib/apply.ts`**

Note: `applyOpsInPage` is serialized and executed in the page by `chrome.scripting.executeScript`. It must be self-contained — it may only use its argument and page globals (`window.localStorage`). Do not reference imports or module-scope variables inside it. `buildOps` and `applyOpsInPage` reference no Chrome APIs at module load, so this file is safe to import in Node tests.

Create the file with exactly these contents:

```ts
import type { Flag } from './flags';

export type Op =
  | { action: 'set'; key: string; value: string }
  | { action: 'remove'; key: string };

export interface ApplyResult {
  ok: boolean;
  message: string;
}

/** Turn the flag list into the storage operations that make the page match it (pure). */
export function buildOps(flags: Flag[]): Op[] {
  return flags.map((f) => {
    if (f.enabled) return { action: 'set', key: f.key, value: f.onValue };
    if (f.offBehavior === 'setValue') {
      return { action: 'set', key: f.key, value: f.offValue ?? '' };
    }
    return { action: 'remove', key: f.key };
  });
}

/** Runs inside the page (injected). Self-contained: only uses `ops` and page globals. */
function applyOpsInPage(ops: Op[]) {
  for (const op of ops) {
    if (op.action === 'remove') {
      window.localStorage.removeItem(op.key);
    } else {
      window.localStorage.setItem(op.key, op.value);
    }
  }
}

export async function applyToActiveTab(flags: Flag[]): Promise<ApplyResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { ok: false, message: 'No active tab found.' };

  const ops = buildOps(flags);

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: applyOpsInPage,
      args: [ops],
    });
  } catch {
    return {
      ok: false,
      message: "Can't apply on this page — open a normal site tab and try again.",
    };
  }

  await chrome.tabs.reload(tab.id);

  const setCount = ops.filter((o) => o.action === 'set').length;
  const removeCount = ops.length - setCount;
  return {
    ok: true,
    message: `Applied ${ops.length} flag(s): ${setCount} set, ${removeCount} removed. Reloaded.`,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- apply`
Expected: PASS — all five `buildOps` tests green.

- [ ] **Step 5: Run the full test suite and typecheck**

Run: `npm test`
Expected: PASS — flags, parse, and apply suites all green.

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add buildOps and applyToActiveTab with tests"
```

---

## Task 6: Popup UI — components and wiring

**Files:**
- Create: `src/popup/components/FlagRow.tsx`
- Create: `src/popup/components/AddFlags.tsx`
- Create: `src/popup/components/Footer.tsx`
- Modify (replace): `src/popup/App.tsx`
- Modify (replace): `src/styles.css`

- [ ] **Step 1: Create `src/popup/components/FlagRow.tsx`**

```tsx
import { useState } from 'preact/hooks';
import type { Flag } from '../../lib/flags';

interface Props {
  flag: Flag;
  onChange: (id: string, patch: Partial<Flag>) => void;
  onDelete: (id: string) => void;
}

export function FlagRow({ flag, onChange, onDelete }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div class="flag-row">
      <div class="flag-main">
        <label class="flag-toggle">
          <input
            type="checkbox"
            checked={flag.enabled}
            onChange={(e) =>
              onChange(flag.id, { enabled: (e.target as HTMLInputElement).checked })
            }
          />
          <span class="flag-key">{flag.label || flag.key}</span>
        </label>
        <button class="link" onClick={() => setOpen((o) => !o)}>
          {open ? 'Close' : 'Edit'}
        </button>
      </div>

      {open && (
        <div class="flag-edit">
          <label class="field">
            <span>Label</span>
            <input
              type="text"
              value={flag.label ?? ''}
              placeholder={flag.key}
              onInput={(e) => onChange(flag.id, { label: (e.target as HTMLInputElement).value })}
            />
          </label>
          <label class="field">
            <span>Key</span>
            <input
              type="text"
              value={flag.key}
              onInput={(e) => onChange(flag.id, { key: (e.target as HTMLInputElement).value })}
            />
          </label>
          <label class="field">
            <span>On value</span>
            <input
              type="text"
              value={flag.onValue}
              onInput={(e) => onChange(flag.id, { onValue: (e.target as HTMLInputElement).value })}
            />
          </label>

          <fieldset class="offbehavior">
            <legend>When off</legend>
            <label>
              <input
                type="radio"
                name={`off-${flag.id}`}
                checked={flag.offBehavior === 'remove'}
                onChange={() => onChange(flag.id, { offBehavior: 'remove' })}
              />
              Remove key
            </label>
            <label>
              <input
                type="radio"
                name={`off-${flag.id}`}
                checked={flag.offBehavior === 'setValue'}
                onChange={() => onChange(flag.id, { offBehavior: 'setValue' })}
              />
              Set value
            </label>
            {flag.offBehavior === 'setValue' && (
              <input
                type="text"
                class="offvalue"
                placeholder="off value"
                value={flag.offValue ?? ''}
                onInput={(e) =>
                  onChange(flag.id, { offValue: (e.target as HTMLInputElement).value })
                }
              />
            )}
          </fieldset>

          <button class="danger" onClick={() => onDelete(flag.id)}>
            Delete flag
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/popup/components/AddFlags.tsx`**

```tsx
import { useState } from 'preact/hooks';

interface Props {
  onAdd: (text: string) => string;
}

export function AddFlags({ onAdd }: Props) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');

  function handleAdd() {
    if (!text.trim()) {
      setMsg('Paste one or more localStorage.setItem(...) lines.');
      return;
    }
    const result = onAdd(text);
    setMsg(result);
    setText('');
  }

  return (
    <section class="add-flags">
      <textarea
        rows={3}
        placeholder={"localStorage.setItem('config.debug.enable', 'true')"}
        value={text}
        onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
      />
      <div class="add-row">
        <button onClick={handleAdd}>Parse &amp; Add</button>
        {msg && <span class="add-msg">{msg}</span>}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/popup/components/Footer.tsx`**

```tsx
interface Props {
  hasFlags: boolean;
  status: string;
  onApply: () => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

export function Footer({ hasFlags, status, onApply, onSelectAll, onSelectNone }: Props) {
  return (
    <footer class="footer">
      <div class="select-helpers">
        <button class="link" onClick={onSelectAll} disabled={!hasFlags}>
          All
        </button>
        <button class="link" onClick={onSelectNone} disabled={!hasFlags}>
          None
        </button>
      </div>
      <button class="apply" onClick={onApply} disabled={!hasFlags}>
        Apply &amp; Reload
      </button>
      {status && <p class="status">{status}</p>}
    </footer>
  );
}
```

- [ ] **Step 4: Replace `src/popup/App.tsx`** with the full implementation

```tsx
import { useEffect, useState } from 'preact/hooks';
import type { Flag } from '../lib/flags';
import { loadFlags, saveFlags, mergePairs } from '../lib/flags';
import { parseSetItemLines } from '../lib/parse';
import { applyToActiveTab } from '../lib/apply';
import { FlagRow } from './components/FlagRow';
import { AddFlags } from './components/AddFlags';
import { Footer } from './components/Footer';

export function App() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('');

  // Load once on mount.
  useEffect(() => {
    loadFlags().then((f) => {
      setFlags(f);
      setLoaded(true);
    });
  }, []);

  // Persist whenever flags change, but not before the initial load completes.
  useEffect(() => {
    if (loaded) saveFlags(flags);
  }, [flags, loaded]);

  function updateFlag(id: string, patch: Partial<Flag>) {
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function deleteFlag(id: string) {
    setFlags((prev) => prev.filter((f) => f.id !== id));
  }

  function addFromText(text: string): string {
    const { pairs, failedLines } = parseSetItemLines(text);
    if (pairs.length) setFlags((prev) => mergePairs(prev, pairs));

    const parts: string[] = [];
    if (pairs.length) parts.push(`Added/updated ${pairs.length} flag(s).`);
    if (failedLines.length) parts.push(`Skipped ${failedLines.length} unparseable line(s).`);
    return parts.length ? parts.join(' ') : 'Nothing recognized.';
  }

  function setAll(enabled: boolean) {
    setFlags((prev) => prev.map((f) => ({ ...f, enabled })));
  }

  async function apply() {
    setStatus('Applying…');
    const result = await applyToActiveTab(flags);
    setStatus(result.message);
  }

  return (
    <div class="app">
      <header class="header">
        <h1>Jaswinder</h1>
        <p class="subtitle">localStorage flag manager</p>
      </header>

      <section class="flags">
        {flags.length === 0 && (
          <p class="empty">No flags yet. Paste some below to get started.</p>
        )}
        {flags.map((f) => (
          <FlagRow key={f.id} flag={f} onChange={updateFlag} onDelete={deleteFlag} />
        ))}
      </section>

      <AddFlags onAdd={addFromText} />

      <Footer
        hasFlags={flags.length > 0}
        status={status}
        onApply={apply}
        onSelectAll={() => setAll(true)}
        onSelectNone={() => setAll(false)}
      />
    </div>
  );
}
```

- [ ] **Step 5: Replace `src/styles.css`** with the full stylesheet

```css
:root {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  color: #111827;
}
body {
  margin: 0;
}
.app {
  width: 360px;
  padding: 12px;
  box-sizing: border-box;
}

.header h1 {
  margin: 0;
  font-size: 16px;
}
.subtitle {
  margin: 2px 0 10px;
  color: #6b7280;
}

.flags {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}
.empty {
  color: #6b7280;
  font-style: italic;
  margin: 8px 0;
}

.flag-row {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 8px;
}
.flag-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.flag-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  overflow: hidden;
}
.flag-key {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.flag-edit {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.field span {
  color: #6b7280;
  font-size: 11px;
}
.field input,
.offvalue {
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
}
.offbehavior {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.offbehavior legend {
  color: #6b7280;
  font-size: 11px;
}
.offvalue {
  flex: 1 1 100%;
}

button {
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  padding: 4px 8px;
  font-size: 12px;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
.link {
  border: none;
  background: none;
  color: #2563eb;
  padding: 2px 4px;
}
.danger {
  color: #b91c1c;
  border-color: #fca5a5;
  align-self: flex-start;
}

.add-flags {
  margin: 12px 0;
}
.add-flags textarea {
  width: 100%;
  box-sizing: border-box;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  padding: 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  resize: vertical;
}
.add-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.add-msg {
  color: #6b7280;
  font-size: 11px;
}

.footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.select-helpers {
  display: flex;
  gap: 4px;
}
.apply {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
  font-weight: 600;
  padding: 8px;
}
.status {
  margin: 0;
  color: #374151;
  font-size: 12px;
}
```

- [ ] **Step 6: Verify typecheck and build**

Run: `npm run typecheck`
Expected: PASS — no TypeScript errors.

Run: `npm run build`
Expected: PASS — `dist/` rebuilt with the popup bundle.

- [ ] **Step 7: Run the full test suite (no regressions)**

Run: `npm test`
Expected: PASS — flags, parse, apply suites all green.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: implement popup UI (flag list, add flags, apply & reload)"
```

---

## Task 7: README and manual verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

````markdown
# Jaswinder

A Chrome (Manifest V3) extension that manages `localStorage` feature flags and applies
the selected ones to the active tab, then reloads it — replacing the
paste-into-console-then-refresh ritual.

## Develop

```bash
npm install
npm run gen-icons   # once, generates icons/*.png (requires sharp)
npm run dev         # Vite + crxjs dev server with HMR
```

## Build & load unpacked

```bash
npm run build       # outputs dist/
```

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the `dist/` folder.
4. Pin **Jaswinder** and click its toolbar icon to open the popup.

## Usage

- **Add flags:** paste one or more lines like
  `localStorage.setItem('config.debug.enable', 'true')` into the textarea and click
  **Parse & Add**. Existing keys are updated in place; unrecognized lines are reported.
- **Toggle:** check/uncheck flags. Use **All** / **None** to select in bulk.
- **Edit:** click **Edit** on a flag to change its label, key, on-value, and what
  happens when it's off (remove the key, or set a custom off-value). Delete from here.
- **Apply:** click **Apply & Reload**. Each flag's chosen state is written into the
  active tab's `localStorage` (enabled → on-value; disabled → removed or off-value), and
  the tab reloads. The status line reports the result.

Flags are saved in `chrome.storage.local` and persist across sessions.

## Scripts

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Dev server with HMR                      |
| `npm run build`     | Production build to `dist/`              |
| `npm run typecheck` | `tsc --noEmit`                           |
| `npm test`          | Vitest unit tests                        |
| `npm run gen-icons` | Regenerate `icons/*.png` from inline SVG |
| `npm run package`   | Zip `dist/` to `jaswinder.zip`           |

## Tests

Unit tests cover the pure logic: `parseSetItemLines` (parsing pasted lines),
`mergePairs` (add/update/dedup), and `buildOps` (flags → storage operations). Chrome
APIs are not exercised in tests.

## Notes / limitations (v1)

- The popup is a *saved preference* — checkboxes reflect your stored selections, not the
  live contents of the page's `localStorage`.
- Cannot apply on restricted pages (`chrome://`, the Web Store, `about:`); the status
  line will say so and the tab is not reloaded.
- No named profiles, per-site memory, or live-state reading (out of scope for v1).
````

- [ ] **Step 2: Final verification — full suite, typecheck, build**

Run: `npm test && npm run typecheck && npm run build`
Expected: PASS — all tests green, no type errors, `dist/` built.

- [ ] **Step 3: Manual smoke test (human/agent with a Chrome instance)**

1. `npm run build`, then load `dist/` unpacked at `chrome://extensions` (Developer mode on).
2. Open any normal website tab (e.g. `https://example.com`).
3. Open the Jaswinder popup; paste:
   ```
   localStorage.setItem('config.websocketCompression.disable', 'true')
   localStorage.setItem('config.debug.enable', 'true')
   ```
   Click **Parse & Add** → two flags appear, both checked.
4. Click **Apply & Reload**. The tab reloads; status shows "Applied 2 flag(s): 2 set, 0 removed. Reloaded."
5. In DevTools → Application → Local Storage, confirm both keys are present with value `true`.
6. Uncheck `config.debug.enable`, **Apply & Reload** → confirm that key is now removed (its off-behavior is "remove").
7. Open the popup again → the flags and their states persisted.
8. Switch to a `chrome://extensions` tab and click **Apply & Reload** → status shows the "Can't apply on this page" message and no reload occurs.

Expected: all steps behave as described. (This step requires a real browser; if running headless, note it as not executed.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: add README and manual verification steps"
```

---

## Done

At this point the extension is feature-complete per the spec: manage flags, bulk-paste
to add, per-flag off behavior, multi-select, apply to the active tab, and auto-reload —
with unit-tested pure logic and a documented manual verification path.
