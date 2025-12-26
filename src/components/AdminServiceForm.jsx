'use client';

import { useState } from 'react';
import AdminMultiImageUploader from '@/components/AdminMultiImageUploader';
import AdminAttachmentsUploader from '@/components/AdminAttachmentsUploader';

export default function AdminServiceForm({ initial = {}, onCancel, onSave }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    price: initial.price || '',
    category: initial.category || 'Services',
    images: initial.images || (initial.image ? [initial.image] : []),
    works: Array.isArray(initial.works) ? initial.works : (initial.works ? initial.works : []),
    specifications: initial.specifications || '',
    related: (initial.related || []).join(',')
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

    // Validate that all works have titles
    if ((form.works || []).some((w) => !w.title || w.title.trim() === '')) {
      setError('All works must have a title.');
      setLoading(false);
      return;
    }

    try {
      // Preserve non-numeric price strings (e.g., 'Quotation based' or 'KSh 3,000+')
      let priceVal = form.price;
      if (priceVal !== '' && !isNaN(Number(priceVal))) priceVal = Number(priceVal);

      const payload = {
        name: form.name,
        price: priceVal,
        category: form.category,
        images: form.images && Array.isArray(form.images) ? form.images : (form.images ? [form.images] : []),
        image: (form.images && form.images.length > 0) ? form.images[0] : '',
        works: Array.isArray(form.works) ? form.works : (form.works ? form.works : []),
        specifications: form.specifications,
        related: form.related ? form.related.split(',').map((s) => Number(s.trim())).filter(Boolean) : []
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
        <label className="block text-sm font-medium">Name</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.name} onChange={(e) => update('name', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Price</label>
          <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={form.price} onChange={(e) => update('price', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Category</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.category} onChange={(e) => update('category', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Images</label>
        <div className="mt-1">
          <AdminMultiImageUploader value={form.images} onChange={(v) => update('images', v)} />
        </div>
      </div>


      <div>
        <label className="block text-sm font-medium">Works (click title to expand)</label>
        <div className="mt-2 space-y-3">
          {(form.works || []).map((w, idx) => (
            <div key={idx} className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <input className="flex-1 border p-2 rounded" placeholder="Work title" value={w.title || ''} onChange={(e) => update('works', (form.works || []).map((x,i) => i === idx ? Object.assign({}, x, { title: e.target.value }) : x))} />
                <button type="button" onClick={() => update('works', (form.works || []).filter((_,i) => i !== idx))} className="px-3 py-1 rounded border text-red-600">Remove</button>
              </div>
              <textarea rows={3} className="w-full border p-2 rounded mb-2" placeholder="Work description/content" value={w.description || ''} onChange={(e) => update('works', (form.works || []).map((x,i) => i === idx ? Object.assign({}, x, { description: e.target.value }) : x))} />
              <div>
                <label className="block text-sm font-medium mb-1">Attachments for this work</label>
                <AdminAttachmentsUploader value={w.attachments || []} onChange={(v) => update('works', (form.works || []).map((x,i) => i === idx ? Object.assign({}, x, { attachments: v }) : x))} />
              </div>
            </div>
          ))}
          <div>
            <button type="button" onClick={() => update('works', [...(form.works || []), { title: '', description: '', attachments: [] }])} className="px-3 py-1 rounded border">Add Work</button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Specifications</label>
        <textarea className="mt-1 w-full rounded border px-3 py-2" value={form.specifications} onChange={(e) => update('specifications', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium">Related (comma-separated IDs)</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.related} onChange={(e) => update('related', e.target.value)} />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="bg-accent text-white px-4 py-2 rounded">{loading ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border">Cancel</button>
      </div>
    </form>
  );
}
