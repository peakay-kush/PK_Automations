'use client';

import { useEffect, useState } from 'react';
import { Edit3, Trash2, Eye, UploadCloud } from 'lucide-react';
import { getToken } from '@/utils/auth';
import { useRouter } from 'next/navigation';

export default function AdminInlineControls({ type, id, vertical = false, imageOnly = false }) {
  // Start false to match server placeholder; set actual value after mount to avoid hydration mismatch
  const [editMode, setEditMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(null);
  const router = useRouter();

  // choose container layout based on `vertical` prop
  const containerClass = vertical ? 'flex flex-col gap-2 items-start z-50' : 'flex z-50 sm:flex-row flex-col sm:gap-2 gap-1 items-center';

  useEffect(() => {
    const handler = (e) => {
      if (e && e.detail) setEditMode(!!e.detail.editMode);
      else setEditMode(localStorage.getItem('pkat_admin_edit') === '1');
    };
    // set initial state after mount
    handler();
    window.addEventListener('adminEditModeChanged', handler);

    // Validate role and set isAdmin accordingly (do not show controls based on token alone)
    (async () => {
      try {
        const auth = await import('@/utils/auth');
        const profile = await auth.fetchProfile();
        setIsAdmin(!!(profile && (profile.role === 'admin' || profile.role === 'super')));
      } catch (err) {
        setIsAdmin(false);
      }
    })();

    return () => window.removeEventListener('adminEditModeChanged', handler);
  }, []);


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
      // notify others to refresh
      try { window.dispatchEvent(new CustomEvent('adminUpdated', { detail: { type, id } })); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('adminDeleted', { detail: { type, id } })); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Deleted', type: 'success' } })); } catch (e) {}
    } catch (err) {
      alert(String(err));
    }
  }

  function handleEdit() {
    // open inline edit modal via global event
    window.dispatchEvent(new CustomEvent('adminOpenEdit', { detail: { type, id, mode: 'edit' } }));
  }

  function handleView() {
    // If admin edit mode is active, open inline modal for viewing instead of navigating away
    if (type === 'product') {
      if (editMode) window.dispatchEvent(new CustomEvent('adminOpenEdit', { detail: { type, id, mode: 'view' } }));
      else router.push(`/product/${id}`);
    } else if (['service','tutorial','user','team','page'].includes(type)) {
      window.dispatchEvent(new CustomEvent('adminOpenEdit', { detail: { type, id, mode: 'view' } }));
    }
  }

  function handleUpload() {
    // open inline upload modal where upload UI exists
    window.dispatchEvent(new CustomEvent('adminOpenEdit', { detail: { type, id, mode: 'upload' } }));
  }



  // If not an admin and edit mode is not enabled, render a hidden placeholder
  if (!isAdmin && !editMode) return <div data-admin-inline-controls className={containerClass} style={{ visibility: 'hidden', pointerEvents: 'none', width: '40px', height: '40px' }} aria-hidden="true" />;



  // If imageOnly flag is set (used on cards), only show upload/replace image control to avoid heavy modal interactions
  if (imageOnly) {
    return (
      <div onPointerDown={(e) => { e.stopPropagation(); }} className={containerClass}>
        <button onClick={(e) => { e.stopPropagation(); handleUpload(); }} title="Upload/replace image" className="bg-white/95 ring-1 ring-gray-200 p-2 w-10 h-10 rounded-lg flex items-center justify-center hover:shadow-md transition-shadow shadow-sm backdrop-blur-sm text-primary"><UploadCloud size={16} /></button>
      </div>
    );
  }



  async function handleTogglePublish(e) {
    e.stopPropagation();
    const token = getToken();
    if (!token) return alert('Not authorized');
    try {
      // get current state
      const getRes = await fetch(`/api/admin/services/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!getRes.ok) throw new Error('Failed to fetch');
      const obj = await getRes.json();
      const newVal = !obj.publishWork;
      const res = await fetch(`/api/admin/services/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ publishWork: newVal }) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j && j.error ? j.error : 'Failed to update');
      }
      setPublished(newVal);
      window.dispatchEvent(new CustomEvent('adminUpdated', { detail: { type: 'service', id } }));
    } catch (err) {
      alert(String(err));
    }
  }

  return (
    <div onPointerDown={(e) => { e.stopPropagation(); }} className={containerClass}>
      <button onClick={(e) => { e.stopPropagation(); handleView(); }} title="View item" className="bg-white/95 ring-1 ring-gray-200 p-2 w-10 h-10 rounded-lg flex items-center justify-center hover:shadow-md transition-shadow shadow-sm backdrop-blur-sm text-primary"><Eye size={16} /></button>
      <button onClick={(e) => { e.stopPropagation(); handleEdit(); }} title="Edit item" className="bg-white/95 ring-1 ring-gray-200 p-2 w-10 h-10 rounded-lg flex items-center justify-center hover:shadow-md transition-shadow shadow-sm backdrop-blur-sm text-primary"><Edit3 size={16} /></button>
      <button onClick={(e) => { e.stopPropagation(); handleUpload(); }} title="Upload/replace image" className="bg-white/95 ring-1 ring-gray-200 p-2 w-10 h-10 rounded-lg flex items-center justify-center hover:shadow-md transition-shadow shadow-sm backdrop-blur-sm text-primary"><UploadCloud size={16} /></button>



      <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} title="Delete item" className="bg-white/95 ring-1 ring-gray-200 p-2 w-10 h-10 rounded-lg text-red-600 flex items-center justify-center hover:shadow-md transition-shadow shadow-sm backdrop-blur-sm"><Trash2 size={16} /></button>
    </div>
  );
}
