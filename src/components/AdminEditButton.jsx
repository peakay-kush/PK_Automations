'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/utils/auth';

export default function AdminEditButton({ type = 'page', id = '', field = null, label = 'Edit' }) {
  const [isAdmin, setIsAdmin] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const handler = (e) => {
      const val = (e && e.detail && e.detail.editMode) ? !!e.detail.editMode : (localStorage.getItem('pkat_admin_edit') === '1');
      setVisible(val);
    };

    handler();
    window.addEventListener('adminEditModeChanged', handler);

    (async () => {
      try {
        // validate role before showing admin controls
        const auth = await import('@/utils/auth');
        const profile = await auth.fetchProfile();
        if (!mounted) return;
        setIsAdmin(!!(profile && (profile.role === 'admin' || profile.role === 'super')));
      } catch (e) {
        setIsAdmin(false);
      }
    })();

    return () => window.removeEventListener('adminEditModeChanged', handler);
  }, []);

  function openEditor() {
    window.dispatchEvent(new CustomEvent('adminOpenEdit', { detail: { type, id, field, mode: 'edit' } }));
  }

  if (isAdmin !== true) return null; 

  return (
    <button onClick={openEditor} className="px-5 py-3 bg-white text-primary font-bold rounded-lg shadow hover:opacity-95 transition" title="Edit page">
      {label}
    </button>
  );
}
