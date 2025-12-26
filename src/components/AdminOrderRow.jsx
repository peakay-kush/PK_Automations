'use client';

import { useState } from 'react';
import AdminOrderStatusControl from './AdminOrderStatusControl';
import { getToken } from '@/utils/auth';

export default function AdminOrderRow({ order }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  const toggle = async () => {
    if (expanded) { setExpanded(false); return; }
    setLoading(true); setError(null);
    try {
      const token = getToken();
      const res = await fetch(`/api/orders/${order.id}`, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
      if (!res.ok) throw new Error('Failed to fetch order details');
      const j = await res.json();
      if (!j.ok || !j.order) throw new Error('Invalid order details');
      setDetails(j.order);
      setExpanded(true);
    } catch (e) {
      setError(String(e.message || e));
    } finally { setLoading(false); }
  };

  return (
    <>
      <tr key={order.id} className="border-t">
        <td className="p-3">{order.id}</td>
        <td className="p-3">{order.reference}</td>
        <td className="p-3">{order.name}</td>
        <td className="p-3">{order.phone}</td>
        <td className="p-3">KSh {order.total.toLocaleString()}</td>
        <td className="p-3">{order.paymentMethod}</td>
        <td className="p-3">KSh {order.shipping.toLocaleString()}</td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="px-2 py-1 rounded border text-sm bg-blue-50 text-blue-700">{loading ? 'Loading...' : (expanded ? 'Hide' : 'View')}</button>
            <AdminOrderStatusControl orderId={order.id} currentStatus={order.status} />
          </div>
        </td>
        <td className="p-3">{new Date(order.createdAt).toLocaleString()}</td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={9} className="p-4">
            {error ? (
              <div className="text-red-600">{error}</div>
            ) : details ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <div><strong>Reference:</strong> {details.reference}</div>
                    <div><strong>Customer:</strong> {details.name} &nbsp; &lt;{details.email}&gt;</div>
                    <div><strong>Phone:</strong> {details.phone}</div>
                    <div><strong>Payment:</strong> {details.paymentMethod}</div>
                    {details.mpesa && details.mpesa.transaction && <div><strong>Mpesa receipt:</strong> {details.mpesa.transaction.MpesaReceiptNumber || ''}</div>}
                  </div>
                  <div className="text-right">
                    <div><strong>Placed:</strong> {new Date(details.createdAt).toLocaleString()}</div>
                    <div className="mt-2"><strong>Total:</strong> KSh {Number(details.total || 0).toLocaleString()}</div>
                    <div><strong>Shipping:</strong> KSh {Number(details.shipping || 0).toLocaleString()}</div>
                    <div className="mt-2"><strong>Status:</strong> {details.status}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Items</h4>
                  <div className="overflow-auto rounded border bg-white">
                    <table className="w-full table-auto">
                      <thead className="bg-light">
                        <tr>
                          <th className="p-2 text-left">Product</th>
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Unit</th>
                          <th className="p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(details.items || []).map((it, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{it.name || it.title || `Product ${it.id || ''}`}</td>
                            <td className="p-2 text-center">{it.quantity || 1}</td>
                            <td className="p-2 text-right">KSh {Number(it.price || 0).toLocaleString()}</td>
                            <td className="p-2 text-right">KSh {((Number(it.price || 0)) * (Number(it.quantity || 1))).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {details.shippingAddress && (
                  <div>
                    <h4 className="font-semibold mt-2">Delivery Address</h4>
                    <div className="text-sm text-gray-700">{details.shippingAddress.line || ''} {details.shippingAddress.city ? ', ' + details.shippingAddress.city : ''} {details.shippingAddress.county ? ', ' + details.shippingAddress.county : ''}</div>
                  </div>
                )}
              </div>
            ) : (
              <div>Loading details…</div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
