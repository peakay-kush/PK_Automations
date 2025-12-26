'use client';

import { useState } from 'react';
import AdminMultiImageUploader from '@/components/AdminMultiImageUploader';
import AdminMediaEditor from '@/components/AdminMediaEditor';
import AdminTopicsEditor from '@/components/AdminTopicsEditor';

export default function AdminTutorialForm({ initial = {}, onCancel, onSave }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    slug: initial.slug || '',
    summary: initial.summary || '',
    content: initial.content || '',
    category: initial.category || '',
    images: initial.images || (initial.image ? [initial.image] : []),
    thumbnail: initial.thumbnail || initial.image || ((initial.images && initial.images.length > 0) ? initial.images[0] : ''),
    author: initial.author || '',
    // new media array: { type: 'video'|'image', url, title }
    media: initial.media || (initial.video ? [{ type: 'video', url: initial.video, title: initial.title || 'Video' }] : [])
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        media: form.media || [],
        topics: form.topics || [],
        images: form.images && Array.isArray(form.images) ? form.images : (form.images ? [form.images] : []),
        image: (form.images && form.images.length > 0) ? form.images[0] : '',
        thumbnail: form.thumbnail || ((form.images && form.images.length > 0) ? form.images[0] : '')
      };
      await onSave(payload);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="text-red-600">{error}</div>}
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.title} onChange={(e) => update('title', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium">Slug</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.slug} onChange={(e) => update('slug', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium">Summary</label>
        <textarea className="mt-1 w-full rounded border px-3 py-2" value={form.summary} onChange={(e) => update('summary', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium">Content (Markdown/HTML)</label>
        <textarea className="mt-1 w-full rounded border px-3 py-2 h-40" value={form.content} onChange={(e) => update('content', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Category</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.category} onChange={(e) => update('category', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Author</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.author} onChange={(e) => update('author', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Images</label>
        <div className="mt-1">
          <AdminMultiImageUploader value={form.images} onChange={(v) => update('images', v)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Media (videos, images)</label>
        <div className="mt-1">
          <AdminMediaEditor value={form.media} onChange={(v) => update('media', v)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Topics</label>
        <div className="mt-1">
          <AdminTopicsEditor value={form.topics || []} onChange={(v) => update('topics', v)} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="bg-accent text-white px-4 py-2 rounded">{loading ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border">Cancel</button>
      </div>
    </form>
  );
}
