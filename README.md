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
