'use client';

import { useEffect, useState } from 'react';
import { getToken, fetchProfile } from '@/utils/auth';

export default function AdminSectionControls({ type }) {
  const [active, setActive] = useState(false);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const val = (e && e.detail && e.detail.editMode) ? !!e.detail.editMode : (localStorage.getItem('pkat_admin_edit') === '1');
      setActive(val);
    };
    handler();
    window.addEventListener('adminEditModeChanged', handler);
    return () => window.removeEventListener('adminEditModeChanged', handler);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await fetchProfile();
        if (mounted) setIsAdmin(!!(profile && (profile.role === 'admin' || profile.role === 'super')));
      } catch (e) {
        if (mounted) setIsAdmin(false);
      }
    })();

    const fetchItems = async () => {
      if (!active || isAdmin !== true) return;
      setIsLoading(true);
      try {
        const token = getToken();
        if (!token) { setItems([]); setIsLoading(false); return; }
        const res = await fetch(`/api/admin/${type}s`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (mounted) setItems(data || []);
      } catch (e) {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchItems();

    const onUpdated = (e) => {
      // when an item is updated elsewhere, refetch
      fetchItems();
    };

    window.addEventListener('adminUpdated', onUpdated);
    return () => { mounted = false; window.removeEventListener('adminUpdated', onUpdated); };
  }, [active, type, isAdmin]);

  function handleNew() {
    // Open inline create modal instead of routing away
    window.dispatchEvent(new CustomEvent('adminOpenEdit', { detail: { type, id: null, mode: 'new' } }));
  }

  if (!active || isAdmin !== true) return null;

  return (
    <div className="mb-6 p-4 rounded border bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold">Manage {type}s</h4>
        <div className="flex items-center gap-2">
          <button onClick={handleNew} className="px-3 py-1 rounded bg-accent text-white">New</button>
          <button onClick={() => {
            try {
              const newVal = !active;
              if (newVal) localStorage.setItem('pkat_admin_edit', '1'); else localStorage.removeItem('pkat_admin_edit');
              window.dispatchEvent(new CustomEvent('adminEditModeChanged', { detail: { editMode: newVal } }));
              setActive(newVal);
            } catch (e) {}
          }} className="px-3 py-1 rounded border">{active ? 'Done' : 'Manage'}</button>
          {type === 'page' && (
            <button onClick={() => {
              try {
                // Open a focused About editor for quick edits to Story/Mission/Vision/Values
                window.dispatchEvent(new CustomEvent('adminOpenEdit', { detail: { type: 'page', id: 'about', mode: 'edit', field: 'aboutSection' } }));
              } catch (e) {}
            }} className="px-3 py-1 rounded border">Edit About</button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="p-3 text-sm text-gray-600">
          Showing <span className="font-semibold">{items.length}</span> {type}{items.length === 1 ? '' : 's'}. Use the inline controls on each item (top-right of each card) to edit or delete, or click **New** to create a new {type}.
        </div>
      )}
    </div>
  );
}