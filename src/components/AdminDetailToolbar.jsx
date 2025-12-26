'use client';

import { useEffect, useState } from 'react';
import { Plus, FilePlus, Edit3, Trash2 } from 'lucide-react';
import { getToken } from '@/utils/auth';
import { useRouter } from 'next/navigation';

export default function AdminDetailToolbar({ type, id }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e) => {
      if (e && e.detail) setEditMode(!!e.detail.editMode);
      else setEditMode(localStorage.getItem('pkat_admin_edit') === '1');
    };
    handler();
    window.addEventListener('adminEditModeChanged', handler);

    // optimistic token presence
    try { if (localStorage.getItem('pkat_token')) setIsAdmin(true); } catch (e) {}

    (async () => {
      try {
        const auth = await import('@/utils/auth');
        const profile = await auth.fetchProfile();
        if (profile && (profile.role === 'admin' || profile.role === 'super')) setIsAdmin(true);
        else setIsAdmin(false);
      } catch (e) {
        // keep optimistic
      }
    })();

    return () => window.removeEventListener('adminEditModeChanged', handler);
  }, []);

  if (!isAdmin || !editMode) return null;

  function openEdit() {
    window.dispatchEvent(new CustomEvent('adminOpenEdit', { detail: { type, id, mode: 'edit' } }));
  }

  function handleAddTopic() {
    window.dispatchEvent(new CustomEvent('adminOpenEdit', { detail: { type, id, mode: 'edit', action: 'addTopic' } }));
  }

  function handleAddMedia() {
    window.dispatchEvent(new CustomEvent('adminOpenEdit', { detail: { type, id, mode: 'edit', action: 'addMedia' } }));
  }

  async function handleDelete() {
    if (!confirm('Delete this item?')) return;
    const token = getToken();
    if (!token) return alert('Not authorized');
    try {
      const res = await fetch(`/api/admin/${type}s/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j && j.error ? j.error : 'Failed');
      }
      window.dispatchEvent(new CustomEvent('adminUpdated', { detail: { type, id } }));
      // navigate back to list
      router.push(`/${type}s`);
    } catch (err) {
      alert(String(err));
    }
  }

  return (
    <div>
      <button onClick={() => window.dispatchEvent(new CustomEvent('adminAddCourse', { detail: { id } }))} className="bg-accent text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl inline-flex items-center gap-2">
        <Plus size={16} /> Add Course
      </button>
    </div>
  );
}
