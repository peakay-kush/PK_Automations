'use client';

import { useEffect, useState } from 'react';

export default function RichTextEditor({ value, onChange, rows = 6, placeholder = '', disabled = false }) {
  // Simplified: plain textarea only (removed formatting toolbar)
  const [local, setLocal] = useState(value || '');

  useEffect(() => setLocal(value || ''), [value]);

  function handleChange(e) {
    setLocal(e.target.value);
    try { onChange && onChange(e.target.value); } catch (err) {}
  }

  return (
    <textarea rows={rows} disabled={disabled} placeholder={placeholder} className="mt-1 w-full rounded border px-3 py-2" value={local} onChange={handleChange} />
  );
}
