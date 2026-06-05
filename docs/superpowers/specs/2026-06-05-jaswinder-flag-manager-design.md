# Jaswinder — localStorage Flag Manager (Chrome Extension)

**Date:** 2026-06-05
**Status:** Approved design
**Type:** Greenfield Chrome MV3 extension

## Problem

Debugging certain behaviors in a web app requires setting `localStorage` feature
flags, then refreshing the tab so they take effect (e.g. visible in Network logs).
Today this is done by pasting into the DevTools console every time:

```js
localStorage.setItem('config.websocketCompression.disable', 'true')
localStorage.setItem('config.debug.enable', 'true')
```

This is repetitive and error-prone. **Jaswinder** is a Chrome extension that lets a
user keep a managed list of these flags, toggle several at once, apply them to the
active tab's `localStorage`, and auto-reload the tab — replacing the manual ritual.

## Goals

- Manage a list of localStorage flags as on/off toggles.
- Select multiple flags and apply them together to the active tab.
- Auto-reload the active tab after applying.
- Add new flags by pasting one or many `localStorage.setItem('key','value')` lines.
- Per-flag control over what "off" means.

## Non-goals (v1)

- Named profiles / flag groups.
- Per-site memory of which flags are on.
- Reading live page state to reflect what is currently active.
- Drag-to-reorder.
- Chrome Web Store publishing.

## Tech stack

- **Manifest V3** Chrome extension.
- **Vite + Preact + TypeScript** (Preact chosen for React-like JSX familiarity and a
  ~3KB runtime; swap to Svelte is possible but not planned).
- **`@crxjs/vite-plugin`** for MV3 manifest generation + HMR during development.
- **Vitest** for unit tests.

## Data model

Flags are stored in `chrome.storage.local` under a single key `flags`.
(`chrome.storage.sync` is a one-line switch if roaming across machines is wanted;
`local` is the default to avoid sync quotas.)

```ts
interface Flag {
  id: string;                        // stable unique id (crypto.randomUUID)
  key: string;                       // localStorage key, e.g. 'config.debug.enable'
  onValue: string;                   // value written when enabled, e.g. 'true'
  offBehavior: 'remove' | 'setValue';
  offValue?: string;                 // value written when disabled, if offBehavior === 'setValue'
  enabled: boolean;                  // saved selection (this is a preference, not live page state)
  label?: string;                    // optional friendly name; UI falls back to `key`
}

interface StoredState {
  flags: Flag[];
}
```

**State model:** the popup is a *saved preference*. The checkboxes reflect the stored
`enabled` value, **not** the live contents of the page's `localStorage`. Applying is an
explicit action.

## Popup UI

A single popup (`action.default_popup`). Sections top to bottom:

1. **Header** — product name "Jaswinder" and a one-line subtitle.
2. **Flag list** — one row per flag:
   - Checkbox bound to `enabled`.
   - Label (or `key`) shown; `key` rendered monospace.
   - Expandable/edit affordance revealing editable fields: `label`, `onValue`,
     `offBehavior` (radio: *remove key* / *set value*), `offValue` (shown only when
     *set value*), and a **Delete** button.
3. **Add flags** — a `<textarea>` plus a **Parse & Add** button. Accepts one or many
   `localStorage.setItem('key','value')` lines.
4. **Footer** — **Apply & Reload** (primary button), a **select all / none** helper,
   and a **status line** showing the result of the last action.

Toggling a checkbox or editing a field persists immediately to `chrome.storage.local`.
Applying is a separate, explicit step.

## Paste parsing (`src/lib/parse.ts`)

Parse the textarea content into zero or more `{ key, value }` pairs, then into flags.

- Recognizes `localStorage.setItem(...)` and `window.localStorage.setItem(...)`.
- Accepts single quotes, double quotes, or backticks around key and value.
- Tolerates surrounding whitespace, trailing semicolons, and multiple statements
  (one per line or several lines).
- Returns both successful parses and a list of lines that failed to parse, so the UI
  can report which lines were ignored while still adding the good ones.
- **Dedup:** if a parsed `key` already exists in the stored flags, that flag's
  `onValue` is updated in place (and it is left enabled/disabled as-is) rather than
  creating a duplicate. New keys are appended with `offBehavior: 'remove'`,
  `enabled: true`.

Reference regex (global, multiline):
```
/(?:window\.)?localStorage\.setItem\(\s*(['"`])(.*?)\1\s*,\s*(['"`])([\s\S]*?)\3\s*\)\s*;?/g
```
Capture group 2 = key, group 4 = value.

## Apply & Reload (`src/lib/apply.ts`)

The core action, triggered by **Apply & Reload**:

1. Resolve the active tab: `chrome.tabs.query({ active: true, currentWindow: true })`.
2. Build one operation per flag from the stored list:
   - `enabled` → `{ action: 'set', key, value: onValue }`
   - `!enabled && offBehavior === 'remove'` → `{ action: 'remove', key }`
   - `!enabled && offBehavior === 'setValue'` → `{ action: 'set', key, value: offValue ?? '' }`
3. Inject and run via `chrome.scripting.executeScript({ target: { tabId }, func, args: [ops] })`.
   The injected function iterates `ops` and calls `window.localStorage.setItem` /
   `removeItem` accordingly. (`localStorage` is origin-scoped and accessible from the
   injected function.)
4. `chrome.tabs.reload(tabId)`.
5. Update the status line: e.g. "Applied 3 flags (2 set, 1 removed), reloaded".

**Apply makes the active tab match the popup exactly.** A disabled `remove` flag is a
harmless no-op when the key is absent.

The ops-builder (flags → operations) is a pure function, separated from the Chrome API
calls so it can be unit-tested without a browser.

## Permissions & edge cases

`manifest.json` permissions: `storage`, `scripting`, `activeTab`, `tabs`.

- **Restricted pages** (`chrome://*`, `https://chrome.google.com/webstore/*`,
  `about:*`, `edge://*`, view-source, etc.): `executeScript` will reject. Catch the
  error, show a friendly status ("Can't apply on this page — open the site tab first"),
  and do **not** reload.
- **No flags defined** / **empty selection with nothing to remove**: show a hint, no-op.
- **Malformed paste**: report which lines were skipped; add the valid ones.

## Project structure

```
jaswinder/
  manifest.config.ts          # MV3 manifest, consumed by @crxjs/vite-plugin
  vite.config.ts
  package.json
  tsconfig.json
  index.html                  # popup entry → src/popup/main.tsx
  src/
    popup/
      main.tsx                # mounts <App/>
      App.tsx                 # popup root: list + add + apply
      components/
        FlagRow.tsx           # one flag: checkbox, label, expand-to-edit, delete
        AddFlags.tsx          # textarea + Parse & Add
        Footer.tsx            # Apply & Reload, select all/none, status line
    lib/
      flags.ts                # Flag/StoredState types + chrome.storage load/save helpers
      parse.ts                # parse setItem lines → flags (pure)
      apply.ts                # buildOps (pure) + applyToActiveTab (chrome APIs)
    styles.css
  public/
    icons/{16,32,48,128}.png  # simple flag icon
  test/
    parse.test.ts
    apply.test.ts             # buildOps cases
  README.md
```

## Testing

- **`parse.test.ts`** — multi-line input, single/double/backtick quotes,
  `window.localStorage` prefix, trailing semicolons, malformed lines (reported, not
  thrown), dedup against existing keys.
- **`apply.test.ts`** — `buildOps`: enabled → set onValue; disabled+remove → remove;
  disabled+setValue → set offValue (and offValue undefined → empty string).
- Chrome APIs are mocked in tests; only the pure functions are exercised directly.
- **README** documents the manual check: `npm run build`, load `dist/` unpacked at
  `chrome://extensions`, open a site, toggle flags, Apply & Reload, confirm in DevTools
  Application → Local Storage and Network logs.

## NPM scripts

- `npm run dev` — Vite dev server with `@crxjs/vite-plugin` HMR.
- `npm run build` — production build to `dist/` (load unpacked).
- `npm run test` — Vitest unit tests.
- `npm run package` — zip `dist/` for sharing.

## Build order (for the implementation plan)

1. Scaffold: package.json, vite/tsconfig, manifest.config, index.html, icons, empty popup that renders.
2. `lib/flags.ts`: types + storage helpers.
3. `lib/parse.ts` + tests (TDD).
4. `lib/apply.ts` buildOps + tests (TDD), then `applyToActiveTab`.
5. UI components wired to storage + apply.
6. Edge-case handling + status line.
7. README + manual verification.
