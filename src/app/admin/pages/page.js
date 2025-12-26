'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminPageForm from '@/components/AdminPageForm';
import { getToken, fetchProfile } from '@/utils/auth';
import { useRouter } from 'next/navigation';

export default function PagesAdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const check = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login?redirect=/admin/pages');
        return;
      }
      const profile = await fetchProfile();
      if (!profile || (profile.role !== 'super' && profile.role !== 'admin')) {
        router.push('/');
        return;
      }
      setUser(profile);
      try {
        const res = await fetch('/api/admin/pages', { headers: { Authorization: `Bearer ${localStorage.getItem('pkat_token')}` } });
        const data = await res.json();
        setPages(data || []);

        // If there's an ?edit=slug param, open that page in the editor when found
        try {
          const params = new URLSearchParams(window.location.search);
          const edit = params.get('edit');
          if (edit) {
            const p = (data || []).find((x) => x.id === edit);
            if (p) setEditing(p);
          }
        } catch (e) {}
      } catch (e) {
        setPages([]);
      }
      setIsLoading(false);
    };
    check();
  }, [router]);

  async function createPage(payload) {
    const token = getToken();
    const res = await fetch('/api/admin/pages', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j && j.error ? j.error : 'Failed to create');
    }
    const created = await res.json();
    const page = created && created.page ? created.page : created;
    setPages((p) => [page, ...p]);
    setEditing(null);
  }

  async function updatePage(id, payload) {
    const token = getToken();
    const res = await fetch(`/api/admin/pages/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j && j.error ? j.error : 'Failed to update');
    }
    const updated = await res.json();
    const page = updated && updated.page ? updated.page : updated;
    setPages((p) => p.map((x) => (x.id === page.id ? page : x)));
    setEditing(null);
  }

  async function deletePage(id) {
    const token = getToken();
    if (!confirm('Delete this page?')) return;
    const res = await fetch(`/api/admin/pages/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to delete');
    setPages((p) => p.filter((x) => x.id !== id));
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <Header />
      <main className="container mx-auto py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-4">Pages</h1>
          <button onClick={() => setEditing({})} className="bg-accent text-white px-3 py-2 rounded">New Page</button>
        </div>

        <div className="mt-6">
          {editing ? (
            <AdminPageForm initial={editing} onCancel={() => setEditing(null)} onSave={(pl) => (editing.id ? updatePage(editing.id, pl) : createPage(pl))} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pages.map((p) => (
                <div key={p.id} className="border rounded p-4">
                  <h3 className="text-xl font-semibold">{p.title}</h3>
                  <div className="text-sm text-gray-600 mb-3">{p.id}</div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setEditing(p)} className="px-3 py-1 rounded border">Edit</button>
                    <button onClick={() => deletePage(p.id)} className="px-3 py-1 rounded border text-red-600">Delete</button>
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
