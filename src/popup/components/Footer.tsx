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
