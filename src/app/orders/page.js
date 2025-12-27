'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getToken } from '@/utils/auth';
import { apiFetch } from '@/utils/api';
import OrderStatusClient from '@/components/OrderStatusClient';

function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const params = useSearchParams();
  const [highlight, setHighlight] = useState(null);

  useEffect(() => {
    try { setHighlight(params?.get('highlight') || null); } catch (e) { setHighlight(null); }
  }, [params]);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = getToken();
      if (!token) {
        window.location.href = '/login?redirect=/orders';
        return;
      }
      const res = await apiFetch('/api/orders/my/', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) {
        setOrders([]);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setOrders(json.orders || []);
      setLoading(false);

      // scroll to highlighted order if present
      if (highlight) {
        setTimeout(() => {
          const el = document.getElementById('order-' + highlight);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="py-12">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-primary mb-6">Your Orders</h1>
          {loading ? (
            <div>Loading...</div>
          ) : orders.length === 0 ? (
            <div>No orders yet. <Link href="/shop" className="text-accent">Start shopping</Link></div>
          ) : (
            <div className="space-y-4">
              {orders.map(o => (
                <div id={`order-${o.id}`} key={o.id} className={`bg-white rounded shadow p-4 hover:shadow-md ${highlight === o.id ? 'ring-2 ring-accent bg-yellow-50' : ''}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="font-bold">Reference: <Link href={`/order/${o.id}`} className="text-primary">{o.reference}</Link></div>
                      <div className="text-sm text-gray-600">Placed: {new Date(o.createdAt).toLocaleString()}</div>
                      <div className="text-sm mt-2">Items: <strong>{(o.items || []).length}</strong></div>
                      <div className="text-sm mt-1">Payment: <strong>{o.paymentMethod}</strong></div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold">KSh {Number(o.total).toLocaleString()}</div>
                      <div className="text-sm mt-2">
                        {(() => {
                          const s = (o.status || '').toLowerCase();
                          const cls = s === 'paid' || s === 'completed' || s === 'confirmed' ? 'bg-green-100 text-green-700' : s === 'pending' ? 'bg-yellow-100 text-yellow-700' : s === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';
                          return <span className={`inline-block px-3 py-1 rounded-full text-sm ${cls}`}>{o.status}</span>;
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/order/${o.id}`} className="px-3 py-2 rounded border text-sm">View details</Link>
                      <button onClick={async () => {
                        if (!confirm('Delete this order from your history? This cannot be undone.')) return;
                        try {
                          const token = getToken();
                          if (!token) { window.location.href = '/login?redirect=/orders'; return; }
                          const res = await fetch(`/api/orders/${o.id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
                          const j = await res.json().catch(() => ({}));
                          if (!res.ok) throw new Error(j?.error || 'Delete failed');
                          setOrders(prev => prev.filter(x => x.id !== o.id));
                        } catch (e) { alert(String(e.message || e)); }
                      }} className="px-3 py-2 rounded border text-sm text-red-600 hover:bg-red-50">Delete</button>
                    </div>

                    <div id={`status-${o.id}`} className="hidden w-full md:w-1/2">
                      <OrderStatusClient orderId={o.id} initialOrder={o} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col"><Header /><div className="flex-grow flex items-center justify-center"><div>Loading orders...</div></div><Footer /></div>}>
      <OrdersList />
    </Suspense>
  );
}