import { getDB } from '@/utils/db';
import Link from 'next/link';
import AdminOrderStatusControl from '@/components/AdminOrderStatusControl';
import AdminOrderRow from '@/components/AdminOrderRow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const db = await getDB();
  let orders = [];
  try {
    const res = db.exec('SELECT id, reference, name, phone, email, total, shipping, paymentMethod, status, createdAt FROM orders ORDER BY createdAt DESC');
    const vals = res?.[0]?.values || [];
    orders = vals.map(v => ({ id: v[0], reference: v[1], name: v[2], phone: v[3], email: v[4], total: Number(v[5]), shipping: Number(v[6]), paymentMethod: v[7], status: v[8], createdAt: v[9] }));
  } catch (e) {
    orders = [];
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-primary">Orders</h1>
        <div>
          <Link href="/" className="inline-flex items-center gap-2 px-3 py-2 rounded border bg-white hover:bg-gray-50 text-sm">← Back to home</Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-gray-600">No orders yet</div>
      ) : (
        <div className="overflow-auto bg-white rounded shadow">
          <table className="w-full table-auto">
            <thead className="bg-light">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Reference</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Payment</th>
                <th className="p-3 text-left">Shipping</th>
                <th className="p-3 text-left">Actions</th>
                <th className="p-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <AdminOrderRow key={o.id} order={o} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
