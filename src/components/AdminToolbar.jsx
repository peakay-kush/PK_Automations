'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Edit3, Trash2, ShoppingCart } from 'lucide-react';
import { fetchProfile, getToken } from '@/utils/auth';

export default function AdminToolbar() {
  const [isAdminRole, setIsAdminRole] = useState(false);
  // Default to false on initial render to match server output; update after mount in useEffect to avoid hydration mismatch
  const [editMode, setEditMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await fetchProfile();
        if (mounted && profile && (profile.role === 'super' || profile.role === 'admin')) setIsAdminRole(true);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('pkat_admin_edit', editMode ? '1' : '0');
    window.dispatchEvent(new CustomEvent('adminEditModeChanged', { detail: { editMode } }));
  }, [editMode]);

  if (!isAdminRole) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white border rounded-lg shadow-lg p-3 flex items-center gap-3">
      <button title="Toggle edit mode" onClick={() => setEditMode(!editMode)} className={`px-3 py-1 rounded ${editMode ? 'bg-accent text-white' : 'bg-white text-primary border'}`}>
        <span className="inline-flex items-center gap-2"><Edit3 size={16} /> <span>{editMode ? 'Editing' : 'Edit'}</span></span>
      </button>
      <Link href="/admin" className="px-3 py-1 rounded border flex items-center gap-2">
        <span className="inline-flex items-center gap-2"><User size={16} /> <span>Admin</span></span>
      </Link>
      <Link href="/admin/services" className="px-3 py-1 rounded border flex items-center gap-2">
        <span className="inline-flex items-center gap-2"><User size={16} /> <span>Services</span></span>
      </Link>
      <Link href="/admin/tutorials" className="px-3 py-1 rounded border flex items-center gap-2">
        <span className="inline-flex items-center gap-2"><User size={16} /> <span>Tutorials</span></span>
      </Link>
      <Link href="/admin/shipping" className="px-3 py-1 rounded border flex items-center gap-2">
        <span className="inline-flex items-center gap-2"><User size={16} /> <span>Shipping</span></span>
      </Link>
      <Link href="/admin/users" className="px-3 py-1 rounded border flex items-center gap-2">
        <span className="inline-flex items-center gap-2"><User size={16} /> <span>Users</span></span>
      </Link>
      <Link href="/admin/orders" className="px-3 py-1 rounded border flex items-center gap-2">
        <span className="inline-flex items-center gap-2"><ShoppingCart size={16} /> <span>Orders</span></span>
      </Link>
      <button
        title="Quick logout"
        onClick={() => { localStorage.removeItem('pkat_token'); window.location.reload(); }}
        className="px-3 py-1 rounded border text-red-600"
      >
        Logout
      </button>
    </div>
  );
}
