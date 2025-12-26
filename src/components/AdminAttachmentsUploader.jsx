'use client';

import { useState } from 'react';
import { getToken } from '@/utils/auth';

export default function AdminAttachmentsUploader({ value = [], onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    const token = getToken();
    const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json && json.error ? json.error : 'Upload failed');
    }
    const json = await res.json();
    if (json && json.url) return { url: json.url, mime: file.type, name: file.name };
    throw new Error('Upload did not return url');
  }

  async function onPick(e) {
    setError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const items = [];
      for (let i = 0; i < files.length; i++) {
        const meta = await uploadFile(files[i]);
        items.push(meta);
      }
      onChange([...(value || []), ...items]);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeAt(idx) {
    if (!confirm('Delete this file from server? This will permanently remove the file.')) return;
    const item = (value || [])[idx];
    if (!item) return;
    setBusy(true);
    setError('');
    try {
      // if it's an uploaded file, try to delete on server (enforces ownership)
      if (item && item.url && item.url.startsWith('/uploads/')) {
        const token = getToken();
        const res = await fetch('/api/admin/uploads', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ url: item.url }) });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j && j.error ? j.error : 'Failed to delete file');
        }
      }
      const copy = (value || []).slice();
      copy.splice(idx, 1);
      onChange(copy);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  function renderPreview(item) {
    if (!item || !item.url) return <div className="h-20 w-32 flex items-center justify-center border text-sm">No file</div>;
    const url = item.url;
    if (/\.(png|jpe?g|gif|webp)(?:\?|$)/i.test(url) || (item.mime && item.mime.startsWith('image/'))) {
      return <img src={url} alt={item.name || 'img'} className="h-20 w-32 object-contain border rounded" />;
    }
    if (/\.(mp4|webm|ogg|mov|m4v)(?:\?|$)/i.test(url) || (item.mime && item.mime.startsWith('video/'))) {
      return <video src={url} controls className="h-20 w-32 object-contain border rounded" />;
    }
    // fallback: show file icon + name
    return (
      <div className="h-20 w-32 flex flex-col items-center justify-center border rounded p-2 text-sm">
        <div className="font-bold">{item.name ? item.name.split('.').pop().toUpperCase() : 'FILE'}</div>
        <div className="truncate w-28 text-xs">{item.name || item.url}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {(value || []).map((v, idx) => (
          <div key={idx} className="relative">
            {renderPreview(v)}
            <button type="button" onClick={() => removeAt(idx)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 border">✕</button>
          </div>
        ))}
        {(!value || value.length === 0) && <div className="h-20 w-32 flex items-center justify-center border text-sm text-gray-500">No files</div>}
      </div>

      <div className="flex items-center gap-2">
        <label className="px-3 py-2 border rounded bg-white cursor-pointer">
          <input onChange={onPick} type="file" accept="*/*" multiple className="hidden" />
          {busy ? 'Uploading...' : 'Upload files'}
        </label>
      </div>
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
}
