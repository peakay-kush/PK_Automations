'use client';

import { useState } from 'react';
import AdminMediaEditor from './AdminMediaEditor';

export default function AdminTopicsEditor({ value = [], onChange }) {
  const [busy, setBusy] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

  function addTopic() {
    const copy = (value || []).slice();
    copy.push({ title: 'New Topic', media: [] });
    onChange(copy);
  }

  function updateTopic(idx, key, val) {
    const copy = (value || []).slice();
    copy[idx] = { ...copy[idx], [key]: val };
    onChange(copy);
  }

  function removeTopic(idx) {
    if (!confirm('Delete this topic?')) return;
    const copy = (value || []).slice();
    copy.splice(idx, 1);
    onChange(copy);
  }

  function moveTopic(idx, dir) {
    const copy = (value || []).slice();
    const swap = idx + dir;
    if (swap < 0 || swap >= copy.length) return;
    const tmp = copy[swap];
    copy[swap] = copy[idx];
    copy[idx] = tmp;
    onChange(copy);
  }

  const total = (value || []).length;
  const visible = (value || []).filter(t => (t && ((t.title && t.title.trim()) || (Array.isArray(t.media) && t.media.length > 0))));
  const hiddenCount = total - visible.length;
  const listToRender = showEmpty ? (value || []) : visible;

  return (
    <div className="space-y-3">
      {hiddenCount > 0 && (
        <div className="text-sm text-gray-500">
          {hiddenCount} empty topic{hiddenCount > 1 ? 's' : ''} hidden. <button onClick={() => setShowEmpty(s => !s)} className="underline">{showEmpty ? 'Hide' : 'Show'} empty</button>
        </div>
      )}

      {listToRender.map((t, idx) => (
        <div key={idx} className="bg-white rounded border p-3">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <input className="w-full rounded border px-2 py-1 mb-2" value={t.title || ''} onChange={(e) => updateTopic(idx, 'title', e.target.value)} placeholder={`Topic ${idx + 1} title`} />
              <div className="mb-2 text-sm text-gray-600">Upload media for this topic (videos, PDFs, images)</div>
              <AdminMediaEditor value={t.media || []} onChange={(m) => updateTopic(idx, 'media', m)} />
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => moveTopic(idx, -1)} className="px-2 py-1 border rounded">↑</button>
              <button type="button" onClick={() => moveTopic(idx, 1)} className="px-2 py-1 border rounded">↓</button>
              <button type="button" onClick={() => removeTopic(idx)} className="px-3 py-1 text-red-600 border rounded">Delete</button>
            </div>
          </div>
        </div>
      ))}

      <div>
        <button type="button" onClick={addTopic} className="px-4 py-2 bg-accent text-white rounded">Add Topic</button>
      </div>
    </div>
  );
}
