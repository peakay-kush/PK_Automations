'use client';

import { useState } from 'react';
import { getToken } from '@/utils/auth';
import { File as FileIcon, Image as ImageIcon, Play } from 'lucide-react';

export default function AdminMediaEditor({ value = [], onChange }) {
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
    if (json && json.url) return json.url;
    throw new Error('Upload did not return url');
  }

  async function onPick(e) {
    setError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const out = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const url = await uploadFile(f);
        const type = f.type && f.type.startsWith && f.type.startsWith('video') ? 'video' : 'image';
        out.push({ type, url, title: f.name });
      }
      onChange([...(value || []), ...out]);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function removeAt(idx) {
    if (!confirm('Delete this media from server? This will permanently remove the file.')) return;
    const item = (value || [])[idx];
    if (!item) return;
    setBusy(true);
    setError('');
    try {
      if (item.url && item.url.startsWith('/uploads/')) {
        const token = getToken();
        const res = await fetch('/api/admin/uploads', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ url: item.url }) });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j && j.error ? j.error : 'Failed to delete media');
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

  function updateTitle(idx, title) {
    const copy = (value || []).slice();
    copy[idx] = { ...copy[idx], title };
    onChange(copy);
  }

  function move(idx, dir) {
    const copy = (value || []).slice();
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= copy.length) return;
    const tmp = copy[swapIdx];
    copy[swapIdx] = copy[idx];
    copy[idx] = tmp;
    onChange(copy);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
{(value || []).filter(m => m && (m.type === 'video' || m.type === 'image')).map((m, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-white rounded border p-3">
            <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded">
              {m.type === 'video' ? <Play size={18} /> : <ImageIcon size={18} />} 
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600 font-bold">{m.type.toUpperCase()}</div>
              <input className="mt-1 w-full rounded border px-2 py-1" value={m.title || ''} onChange={(e) => updateTitle(idx, e.target.value)} placeholder="Title (optional)" />
              <div className="text-xs text-gray-500 mt-1 truncate">{m.url}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(idx, -1)} className="px-2 py-1 border rounded text-sm">↑</button>
                <button type="button" onClick={() => move(idx, 1)} className="px-2 py-1 border rounded text-sm">↓</button>
              </div>
              <div>
                <button type="button" onClick={() => removeAt(idx)} className="px-3 py-1 text-red-600 border rounded">Delete</button>
              </div>
            </div>
          </div>
        ))}

        {(!value || value.length === 0) && <div className="text-sm text-gray-500">No media added yet</div>}
      </div>

      <div className="flex items-center gap-2">
        <label className="px-3 py-2 border rounded bg-white cursor-pointer">
          <input onChange={onPick} type="file" accept="image/*,video/*" multiple className="hidden" />
          {busy ? 'Uploading...' : 'Upload media (images, videos)'}
        </label>
      </div>
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
}
