'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminProductForm from '@/components/AdminProductForm';
import { getToken, fetchProfile } from '@/utils/auth';

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const check = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login?redirect=/admin');
        return;
      }
      const profile = await fetchProfile();
      if (!profile || profile.role !== 'super') {
        router.push('/');
        return;
      }
      setUser(profile);

      // load products
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data || []);
      } catch (err) {
        setProducts([]);
      }

      // check URL for edit query param (e.g. ?edit=product:123)
      try {
        const params = new URLSearchParams(window.location.search);
        const edit = params.get('edit');
        if (edit && edit.startsWith('product:')) {
          const id = parseInt(edit.split(':')[1], 10);
          const p = (data || []).find((x) => x.id === id);
          if (p) setEditing(p);
        }
      } catch (e) {}

      setIsLoading(false);
    };
    check();
  }, [router]);

  async function createProduct(payload) {
    const token = getToken();
    const res = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Failed to create');
    const created = await res.json();
    const product = created && created.product ? created.product : created;
    setProducts((p) => [product, ...p]);
    setEditing(null);
  }

  async function updateProduct(id, payload) {
    const token = getToken();
    const res = await fetch(`/api/admin/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Failed to update');
    const updated = await res.json();
    const product = updated && updated.product ? updated.product : updated;
    setProducts((p) => p.map((x) => (x.id === product.id ? product : x)));
    setEditing(null);
  }

  async function deleteProduct(id) {
    const token = getToken();
    if (!confirm('Delete this product?')) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to delete');
    setProducts((p) => p.filter((x) => x.id !== id));
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <Header />
      <main className="container mx-auto py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
          <button onClick={() => setEditing({})} className="bg-accent text-white px-3 py-2 rounded">New Product</button>
        </div>

        <div className="mt-6">
          {editing ? (
            <AdminProductForm initial={editing} onCancel={() => setEditing(null)} onSave={(pl) => (editing.id ? updateProduct(editing.id, pl) : createProduct(pl))} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((p) => (
                <div key={p.id} className="border rounded p-4">
                  <h3 className="text-xl font-semibold">{p.name}</h3>
                  <p className="text-sm text-gray-600">{p.category} • {typeof p.price === 'number' ? p.price.toLocaleString() : p.price}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setEditing(p)} className="px-3 py-1 rounded border">Edit</button>
                    <button onClick={() => deleteProduct(p.id)} className="px-3 py-1 rounded border text-red-600">Delete</button>
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
