'use client';

import { useEffect, useState } from 'react';

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const d = (e && e.detail) || {};
      const id = Date.now() + Math.random().toString(36).slice(2, 8);
      const toast = { id, message: d.message || 'Saved', type: d.type || 'success', duration: d.duration || 3000 };
      setToasts((s) => [...s, toast]);
      // auto-dismiss
      setTimeout(() => setToasts((s) => s.filter(t => t.id !== id)), toast.duration);
    };
    const clearHandler = () => setToasts([]);
    window.addEventListener('toast', handler);
    window.addEventListener('toastClear', clearHandler);
    return () => { window.removeEventListener('toast', handler); window.removeEventListener('toastClear', clearHandler); };
  }, []);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div key={t.id} className={`max-w-xs px-4 py-2 rounded shadow-lg text-sm text-white ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'} animate-fade-in`}>{t.message}</div>
      ))}
    </div>
  );
}
