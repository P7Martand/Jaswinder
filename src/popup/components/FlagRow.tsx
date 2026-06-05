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
