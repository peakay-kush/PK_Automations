'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminTutorialForm from '@/components/AdminTutorialForm';
import { getToken, fetchProfile } from '@/utils/auth';
import { useRouter } from 'next/navigation';

export default function TutorialsAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tutorials, setTutorials] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const check = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login?redirect=/admin/tutorials');
        return;
      }
      const profile = await fetchProfile();
      if (!profile || (profile.role !== 'super' && profile.role !== 'admin')) {
        router.push('/');
        return;
      }
      setUser(profile);
      try {
        const res = await fetch('/api/admin/tutorials', { headers: { Authorization: `Bearer ${localStorage.getItem('pkat_token')}` } });
        const data = await res.json();
        setTutorials(data || []);
      } catch (e) {
        setTutorials([]);
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const edit = params.get('edit');
        if (edit) {
          const id = parseInt(edit, 10);
          const t = (data || []).find((x) => x.id === id);
          if (t) setEditing(t);
        }
      } catch (e) {}

      setIsLoading(false);
    };
    check();
  }, [router]);

  async function createTutorial(payload) {
    const token = getToken();
    const res = await fetch('/api/admin/tutorials', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Failed to create');
    const created = await res.json();
    const t = created && created.tutorial ? created.tutorial : created;
    setTutorials((s) => [t, ...s]);
    setEditing(null);
  }

  async function updateTutorial(id, payload) {
    const token = getToken();
    const res = await fetch(`/api/admin/tutorials/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Failed to update');
    const updated = await res.json();
    const t = updated && updated.tutorial ? updated.tutorial : updated;
    setTutorials((s) => s.map((x) => (x.id === t.id ? t : x)));
    setEditing(null);
  }

  async function deleteTutorial(id) {
    const token = getToken();
    if (!confirm('Delete this tutorial?')) return;
    const res = await fetch(`/api/admin/tutorials/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to delete');
    setTutorials((s) => s.filter((x) => x.id !== id));
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <Header />
      <main className="container mx-auto py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-4">Tutorials</h1>
          <button onClick={() => setEditing({})} className="bg-accent text-white px-3 py-2 rounded">New Tutorial</button>
        </div>

        <div className="mt-6">
          {editing ? (
            <AdminTutorialForm initial={editing} onCancel={() => setEditing(null)} onSave={(pl) => (editing.id ? updateTutorial(editing.id, pl) : createTutorial(pl))} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tutorials.map((t) => (
                <div key={t.id} className="border rounded p-4">
                  <h3 className="text-xl font-semibold">{t.title}</h3>
                  <p className="text-sm text-gray-600">{t.category} • {t.author}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setEditing(t)} className="px-3 py-1 rounded border">Edit</button>
                    <button onClick={() => deleteTutorial(t.id)} className="px-3 py-1 rounded border text-red-600">Delete</button>
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
