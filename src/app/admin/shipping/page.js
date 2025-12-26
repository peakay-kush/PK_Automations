'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getToken } from '@/utils/auth';
import { useRouter } from 'next/navigation';

export default function AdminShipping() {
  const router = useRouter();
  const [locations, setLocations] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const token = getToken();
      if (!token) return router.push('/login?redirect=/admin/shipping');
      const res = await fetch('/api/admin/shipping', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return setLocations([]);
      const json = await res.json();
      setLocations(json || []);
      setLoading(false);
    };
    check();
  }, [router]);

  async function save(id, payload) {
    const token = getToken();
    if (!token) return;
    let res;
    if (id) res = await fetch(`/api/admin/shipping/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    else res = await fetch('/api/admin/shipping', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Save failed');
    const j = await res.json();
    // refresh list
    const r2 = await fetch('/api/admin/shipping', { headers: { Authorization: `Bearer ${token}` } });
    const j2 = await r2.json();
    setLocations(j2 || []);
    setEditing(null);
  }

  async function remove(id) {
    if (!confirm('Delete this shipping entry?')) return;
    const token = getToken();
    await fetch(`/api/admin/shipping/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setLocations((s) => s.filter(x => x.id !== id));
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Header />
      <main className="container mx-auto py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-4">Shipping Locations</h1>
          <button onClick={() => setEditing({})} className="bg-accent text-white px-3 py-2 rounded">New Location</button>
        </div>

        <div className="mt-6">
          {editing ? (
            <ShippingForm initial={editing} onCancel={() => setEditing(null)} onSave={(pl) => save(editing?.id, pl)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((l) => (
                <div key={l.id} className="border rounded p-4">
                  <h3 className="text-xl font-semibold">{l.name}</h3>
                  <p className="text-sm text-gray-600">Charge: KSh {Number(l.charge || 0).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Matches: {(l.matches || []).join(', ')}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setEditing(l)} className="px-3 py-1 rounded border">Edit</button>
                    <button onClick={() => remove(l.id)} className="px-3 py-1 rounded border text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ShippingForm({ initial = {}, onCancel, onSave }) {
  const [form, setForm] = useState({ name: initial.name || '', charge: initial.charge || 0, matches: (initial.matches || []).join(', '), note: initial.note || '' });
  const [saving, setSaving] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, charge: Number(form.charge || 0), matches: form.matches.split(',').map(s => s.trim()).filter(Boolean), note: form.note };
      await onSave(initial.id, payload);
    } catch (e) { alert('Save failed: ' + String(e)); }
    setSaving(false);
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium">Charge (KSh)</label>
        <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={form.charge} onChange={(e) => setForm(s => ({ ...s, charge: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium">Matches (comma-separated keywords to match county/city)</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.matches} onChange={(e) => setForm(s => ({ ...s, matches: e.target.value }))} />
      </div>
      <div>
        <label className="block text-sm font-medium">Note</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.note} onChange={(e) => setForm(s => ({ ...s, note: e.target.value }))} />
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2 rounded bg-accent text-white">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border">Cancel</button>
      </div>
    </form>
  );
}
