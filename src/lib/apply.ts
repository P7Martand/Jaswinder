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
