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
        {loaded && flags.length === 0 && (
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
