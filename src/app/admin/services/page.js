'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminServiceForm from '@/components/AdminServiceForm';
import { getToken, fetchProfile } from '@/utils/auth';
import { useRouter } from 'next/navigation';

export default function ServicesAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const check = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login?redirect=/admin/services');
        return;
      }
      const profile = await fetchProfile();
      if (!profile || (profile.role !== 'super' && profile.role !== 'admin')) {
        router.push('/');
        return;
      }
      setUser(profile);
      try {
        const res = await fetch('/api/admin/services', { headers: { Authorization: `Bearer ${localStorage.getItem('pkat_token')}` } });
        const data = await res.json();
        setServices(data || []);
      } catch (e) {
        setServices([]);
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const edit = params.get('edit');
        if (edit) {
          const id = parseInt(edit, 10);
          const s = (data || []).find((x) => x.id === id);
          if (s) setEditing(s);
        }
      } catch (e) {}

      setIsLoading(false);
    };
    check();
  }, [router]);

  async function createService(payload) {
    const token = getToken();
    const res = await fetch('/api/admin/services', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Failed to create');
    const created = await res.json();
    const service = created && created.service ? created.service : created;
    setServices((s) => [service, ...s]);
    setEditing(null);
  }

  async function updateService(id, payload) {
    const token = getToken();
    const res = await fetch(`/api/admin/services/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Failed to update');
    const updated = await res.json();
    const service = updated && updated.service ? updated.service : updated;
    setServices((s) => s.map((x) => (x.id === service.id ? service : x)));
    setEditing(null);
  }

  async function deleteService(id) {
    const token = getToken();
    if (!confirm('Delete this service?')) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to delete');
    setServices((s) => s.filter((x) => x.id !== id));
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <Header />
      <main className="container mx-auto py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-4">Services</h1>
          <button onClick={() => setEditing({})} className="bg-accent text-white px-3 py-2 rounded">New Service</button>
        </div>

        <div className="mt-6">
          {editing ? (
            <AdminServiceForm initial={editing} onCancel={() => setEditing(null)} onSave={(pl) => (editing.id ? updateService(editing.id, pl) : createService(pl))} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((s) => (
                <div key={s.id} className="border rounded p-4">
                  <h3 className="text-xl font-semibold">{s.name}</h3>
                  <p className="text-sm text-gray-600">{s.category} • {typeof s.price === 'number' ? s.price.toLocaleString() : s.price}</p>
                  <div className="mt-3 flex gap-2 items-center">
                    <button onClick={() => setEditing(s)} className="px-3 py-1 rounded border">Edit</button>
                    <button onClick={() => deleteService(s.id)} className="px-3 py-1 rounded border text-red-600">Delete</button>
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
