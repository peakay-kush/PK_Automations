import { getDB } from '@/utils/db';
import Header from '@/components/Header';
import Footer from '@/components/Footer';


export default async function OrderReceipt({ params }) {
  const db = await getDB();
  const id = params.id;
  let row = null;
  try {
    const stmt = db.prepare('SELECT id, reference, userId, name, phone, email, items, total, shipping, shippingAddress, shippingLocation, paid, paymentMethod, status, statusHistory, mpesa, mpesaMerchantRequestId, mpesaCheckoutRequestId, lastMpesaUpdateError, createdAt FROM orders WHERE id = ?');
    stmt.bind([id]);
    if (stmt.step()) row = stmt.get();
    try { stmt.free(); } catch (e) {}
  } catch (e) {
    const res = db.exec(`SELECT id, reference, userId, name, phone, email, items, total, shipping, shippingAddress, shippingLocation, paid, paymentMethod, status, statusHistory, mpesa, mpesaMerchantRequestId, mpesaCheckoutRequestId, lastMpesaUpdateError, createdAt FROM orders WHERE id = "${id}"`);
    row = res?.[0]?.values?.[0] || null;
  }

  if (!row) return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto py-24 text-center">Order not found</div>
      <Footer />
    </div>
  );

  const [rid, reference, userId, name, phone, email, itemsRaw, total, shipping, shippingAddressRaw, shippingLocationRaw, paid, paymentMethod, status, statusHistoryRaw, mpesaRaw, mpesaMerchantRequestId, mpesaCheckoutRequestId, lastMpesaUpdateError, createdAt] = row;
  const items = itemsRaw ? JSON.parse(itemsRaw) : [];
  const statusHistory = statusHistoryRaw ? (typeof statusHistoryRaw === 'string' ? JSON.parse(statusHistoryRaw) : statusHistoryRaw) : [];

  let mpesaObj = null;
  try { mpesaObj = mpesaRaw ? (typeof mpesaRaw === 'string' ? JSON.parse(mpesaRaw) : mpesaRaw) : null; } catch (e) { mpesaObj = mpesaRaw; }

  // provide an initial order object to the client status component
  const initialOrder = { id: rid, reference, name, phone, email, items, total: Number(total), shipping: Number(shipping || 0), shippingAddress: shippingAddressRaw ? (typeof shippingAddressRaw === 'string' ? (JSON.parse(shippingAddressRaw)) : shippingAddressRaw) : null, shippingLocation: shippingLocationRaw ? (typeof shippingLocationRaw === 'string' ? (JSON.parse(shippingLocationRaw)) : shippingLocationRaw) : null, paid: Boolean(paid), paymentMethod, status, statusHistory, createdAt, mpesa: mpesaObj, mpesaMerchantRequestId, mpesaCheckoutRequestId, lastMpesaUpdateError };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="py-12">
        <div className="container mx-auto">
          <div className="bg-white rounded-lg p-8 shadow">
            <h1 className="text-2xl font-bold text-primary mb-4">Order Receipt</h1>

            <a href="/orders" className="inline-block mb-4 px-4 py-2 bg-gray-100 rounded border text-sm">← Back to orders</a>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="mb-2">Reference: <strong>{reference}</strong></div>
                <div className="mb-2">Name: {name}</div>
                <div className="mb-2">Phone: {phone}</div>
                <div className="mb-2">Email: {email}</div>
                <div className="mb-2">Payment method: <strong>{paymentMethod}</strong></div>
              </div>

              <div className="text-right">
                <div className="mb-2">Amount: <strong>KSh {Number(total).toLocaleString()}</strong></div>
                <div className="mb-2">Date: <strong>{new Date(createdAt).toLocaleDateString()}</strong></div>
                <div className="mb-2">Time: <strong>{new Date(createdAt).toLocaleTimeString()}</strong></div>
                <div className="mb-2">Status: <strong>{status || (paid ? 'paid' : 'pending')}</strong></div>
              </div>
            </div>

            <h3 className="font-bold mt-6 mb-2">Items</h3>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex justify-between border-b pb-2">
                  <div>
                    <div className="font-bold">{it.name}</div>
                    <div className="text-sm text-gray-600">{it.category}</div>
                    <div className="text-sm">Quantity: {it.quantity || 1}</div>
                  </div>
                  <div className="text-right font-bold">KSh {((it.price || 0) * (it.quantity || 1)).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-right">Shipping: KSh {Number(shipping || 0).toLocaleString()}</div>
            <div className="mt-6 text-right text-lg font-bold">Total: KSh {Number(total).toLocaleString()}</div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}