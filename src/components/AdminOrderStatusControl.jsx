'use client';

import { useState } from 'react';
import { getToken } from '@/utils/auth';

export default function AdminOrderStatusControl({ orderId, currentStatus }) {
  const [status, setStatus] = useState(currentStatus || 'created');
  const [loading, setLoading] = useState(false);
  const statuses = ['created','pending','confirmed','dispatched','completed','failed','cancelled'];

  const updateStatus = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify({ status })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Update failed');
      // reload to reflect changes
      window.location.reload();
    } catch (e) {
      alert(String(e.message || e));
      setLoading(false);
    }
  };

  async function handleDelete() {
    if (!orderId) return;
    if (!confirm('Delete this order? This action cannot be undone.')) return;
    try {
      const token = getToken();
      if (!token) return alert('Not authorized');
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || 'Delete failed');
      try { window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Order deleted', type: 'success' } })); } catch (e) {}
      // refresh the page to reflect changes
      window.location.reload();
    } catch (e) {
      alert(String(e.message || e));
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border px-2 py-1 text-sm">
        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button disabled={loading || status === currentStatus} onClick={updateStatus} className="px-2 py-1 rounded bg-accent text-white text-sm">
        {loading ? 'Saving...' : 'Save'}
      </button>
      <button onClick={handleDelete} className="px-2 py-1 rounded border text-red-600 hover:bg-red-50 text-sm">Delete</button>
    </div>
  );
}