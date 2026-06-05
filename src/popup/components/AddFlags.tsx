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
