'use client';

import { useState } from 'react';
import { getToken } from '@/utils/auth';

export default function AdminMultiImageUploader({ value = [], onChange, allowCrop = false }) { // allowCrop is reserved for future per-file crop UI (products should pass allowCrop=false)
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
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFile(files[i]);
        urls.push(url);
      }
      onChange([...(value || []), ...urls]);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeAt(idx) {
    if (!confirm('Delete this image from server? This will permanently remove the file.')) return;
    const url = (value || [])[idx];
    if (!url) return;
    setBusy(true);
    setError('');
    try {
      // if it's an uploaded file, try to delete on server (enforces ownership)
      if (url.startsWith('/uploads/')) {
        const token = getToken();
        const res = await fetch('/api/admin/uploads', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ url }) });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j && j.error ? j.error : 'Failed to delete image');
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

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {(value || []).map((v, idx) => (
          <div key={idx} className="relative">
            <img src={v} alt={`img-${idx}`} className="h-24 w-24 object-contain border rounded" />
            <button type="button" onClick={() => removeAt(idx)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 border">✕</button>
          </div>
        ))}
        {(!value || value.length === 0) && <div className="h-24 w-24 flex items-center justify-center border text-sm text-gray-500">No images</div>}
      </div>

      <div className="flex items-center gap-2">
        <label className="px-3 py-2 border rounded bg-white cursor-pointer">
          <input onChange={onPick} type="file" accept="image/*" multiple className="hidden" />
          {busy ? 'Uploading...' : 'Upload images'}
        </label>
      </div>
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
}
