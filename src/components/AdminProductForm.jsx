'use client';

import { useState } from 'react';
import AdminMultiImageUploader from '@/components/AdminMultiImageUploader';

export default function AdminProductForm({ initial = {}, onCancel, onSave }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    price: initial.price || '',
    category: initial.category || '',
    images: initial.images || (initial.image ? [initial.image] : []),
    description: initial.description || '',
    specifications: initial.specifications || '',
    related: (initial.related || []).join(','),
    quantity: typeof initial.quantity !== 'undefined' ? initial.quantity : ''
  });
  
  // import AdminImageUploader dynamically to keep forms light
  
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
        name: form.name,
        price: Number(form.price) || 0,
        category: form.category,
        images: form.images && Array.isArray(form.images) ? form.images : (form.images ? [form.images] : []),
        // fallback for legacy consumers
        image: (form.images && form.images.length > 0) ? form.images[0] : '',
        description: form.description,
        specifications: form.specifications,
        related: form.related ? form.related.split(',').map((s) => Number(s.trim())).filter(Boolean) : [],
        quantity: form.quantity === '' ? undefined : Number(form.quantity || 0)
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
          <AdminMultiImageUploader value={form.images} onChange={(v) => update('images', v)} allowCrop={false} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <div className="mt-1">
          <textarea rows={6} className="mt-1 w-full rounded border px-3 py-2" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Write product description" />
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

      <div>
        <label className="block text-sm font-medium">Quantity (leave blank for unlimited)</label>
        <input type="number" min="0" className="mt-1 w-full rounded border px-3 py-2" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="bg-accent text-white px-4 py-2 rounded">{loading ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border">Cancel</button>
      </div>
    </form>
  );
}
