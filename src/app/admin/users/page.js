'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminUserForm from '@/components/AdminUserForm';
import AdminInlineControls from '@/components/AdminInlineControls';
import { getToken, fetchProfile } from '@/utils/auth';
import { useRouter } from 'next/navigation';

export default function UsersAdminPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const check = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login?redirect=/admin/users');
        return;
      }
      const profile = await fetchProfile();
      if (!profile || (profile.role !== 'super' && profile.role !== 'admin')) {
        router.push('/');
        return;
      }

      // check for edit query param
      try {
        const params = new URLSearchParams(window.location.search);
        const edit = params.get('edit');
        if (edit) setEditingUser({ id: edit });
      } catch (e) {}

      await loadUsers();
      setIsLoading(false);
    };
    check();
  }, [router]);

  // when users load and there's an editingUser id, replace it with full object
  useEffect(() => {
    if (editingUser && editingUser.id && users && users.length) {
      const found = users.find((x) => String(x.id) === String(editingUser.id));
      if (found) setEditingUser(found);
    }
  }, [users]);

  async function loadUsers() {
    try {
      const token = localStorage.getItem('pkat_token');
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j && j.error ? j.error : 'Failed to load users');
      }
      const data = await res.json();
      setUsers(data || []);
    } catch (e) {
      console.error('[admin/users] load error', e);
      setUsers([]);
    }
  }

  async function toggleRole(id, currentRole) {
    const token = getToken();
    const newRole = currentRole === 'super' ? 'user' : 'super';
    if (!confirm(`Change role to ${newRole}?`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ role: newRole }) });
    if (!res.ok) return alert('Failed to update role');
    await loadUsers();
  }

  async function toggleDisabled(id, current) {
    const token = getToken();
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ disabled: !current }) });
    if (!res.ok) return alert('Failed to update');
    await loadUsers();
  }

  async function deleteUser(id) {
    const token = getToken();
    if (!confirm('Delete this user?')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return alert('Failed to delete');
    await loadUsers();
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <Header />
      <main className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">Users</h1>

        {editingUser ? (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Editing User</h2>
            <AdminUserForm initial={editingUser} onCancel={() => { setEditingUser(null); loadUsers(); }} onSave={(u) => { setEditingUser(null); loadUsers(); }} />
          </div>
        ) : null}

        <div className="grid gap-4">
          {users.map((u) => (
            <div key={u.id} className="relative p-4 border rounded flex items-center justify-between">
              <div>
                <div className="font-semibold">{u.name || '—'}</div>
                <div className="text-sm text-gray-600">{u.email} • {u.role} {u.disabled ? '• disabled' : ''}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleRole(u.id, u.role)} className="px-3 py-1 rounded border">{u.role === 'super' ? 'Demote' : 'Promote'}</button>
                <button onClick={() => toggleDisabled(u.id, u.disabled)} className="px-3 py-1 rounded border">{u.disabled ? 'Enable' : 'Disable'}</button>
                <button onClick={() => deleteUser(u.id)} className="px-3 py-1 rounded border text-red-600">Delete</button>
              </div>

              {/* inline controls */}
              <AdminInlineControls type="user" id={u.id} />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
