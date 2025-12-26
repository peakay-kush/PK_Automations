'use client';

import { useEffect, useState, useRef } from 'react';

/* mpesa date parser removed (mpesa integration disabled) */

export default function OrderStatusClient({ orderId, initialOrder = null, pollInterval = 5000 }) {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Status ${res.status}`);
      }
      const json = await res.json();
      if (json?.ok && json.order) {
        setOrder(json.order);
        setError(null);
      } else {
        throw new Error(json?.error || 'Unknown error fetching order');
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!order) fetchOrder();
    // start polling
    intervalRef.current = setInterval(() => {
      fetchOrder();
    }, pollInterval);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const onRefresh = async () => {
    await fetchOrder();
  };

  if (loading && !order) return <div>Loading order status...</div>;

  return (
    <div className="bg-white p-4 rounded-md border">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">Reference: <strong>{order?.reference}</strong></div>
          <div className="text-sm">Status: <strong className="text-primary">{order?.status}</strong></div>
          <div className="text-sm">Paid: <strong>{order?.paid ? 'Yes' : 'No'}</strong></div>
          <div className="text-sm">Payment method: <strong>{order?.paymentMethod}</strong></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="px-3 py-1 rounded border text-sm">Refresh</button>
        </div>
      </div>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {/* Mpesa UI removed */}

      {order?.statusHistory && order.statusHistory.length > 0 && (
        <div className="mt-3">
          <div className="font-semibold text-sm">Status history</div>
          <ul className="text-sm mt-2 space-y-1">
            {order.statusHistory.map((h, i) => (
              <li key={i} className="text-gray-700">{new Date(h.changedAt).toLocaleString()} — <strong>{h.status}</strong> {h.by ? `by ${h.by}` : ''}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
