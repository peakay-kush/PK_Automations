'use client';

import { useState } from 'react';
import AdminAttachmentsUploader from '@/components/AdminAttachmentsUploader';

export default function EditWorkModal({ initial = { title: '', description: '', attachments: [] }, onClose, onSave }) {
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [attachments, setAttachments] = useState(initial.attachments || []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function save() {
    setError('');
    if (!title || title.trim() === '') {
      setError('Title is required');
      return;
    }
    setLoading(true);
    try {
      await onSave({ title: title.trim(), description: description || '', attachments: attachments || [] });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded shadow-lg w-full max-w-2xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">{initial && initial.title ? 'Edit Work' : 'Add Work'}</h3>
          <button onClick={onClose} className="text-gray-600">Close</button>
        </div>
        <div className="p-4 space-y-4">
          {error ? <div className="text-red-600">{error}</div> : null}
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input className="mt-1 w-full rounded border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <div className="mt-1">
              <textarea rows={6} className="w-full rounded border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write description here" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Attachments</label>
            <div className="mt-1">
              <AdminAttachmentsUploader value={attachments} onChange={(v) => setAttachments(v)} />
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button onClick={save} disabled={loading} className="px-4 py-2 rounded bg-accent text-white">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
