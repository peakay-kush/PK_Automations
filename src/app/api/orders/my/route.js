import { NextResponse } from 'next/server';
import { getDB } from '@/utils/db';
import { getTokenFromHeaders, verifyToken } from '@/utils/serverAuth';

export const runtime = 'nodejs';

export async function GET(req) {
  try {
    const token = getTokenFromHeaders(req);
    const payload = verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Debugging aid: when DEBUG_ORDERS=1 is set, log the verified token payload to help trace missing orders
    if (process.env.DEBUG_ORDERS === '1') console.log('[api/orders/my] token payload', payload);

    const db = await getDB();
    // If user is admin/super, return ALL orders. Otherwise return only orders belonging to the user (userId or matching email)
    const isAdmin = payload.role && (payload.role === 'admin' || payload.role === 'super');
    const results = [];

    if (isAdmin) {
      const stmt = db.prepare('SELECT id, reference, name, email, phone, items, total, shipping, shippingLocation, paid, paymentMethod, status, statusHistory, mpesa, mpesaMerchantRequestId, mpesaCheckoutRequestId, createdAt FROM orders ORDER BY createdAt DESC');
      while (stmt.step()) {
        const row = stmt.get();
        results.push({
          id: row[0],
          reference: row[1],
          name: row[2],
          email: row[3],
          phone: row[4],
          items: row[5] ? JSON.parse(row[5]) : [],
          total: Number(row[6] || 0),
          shipping: Number(row[7] || 0),
          shippingLocation: row[8] ? (typeof row[8] === 'string' ? JSON.parse(row[8]) : row[8]) : null,
          paid: Boolean(row[9]),
          paymentMethod: row[10],
          status: row[11],
          statusHistory: row[12] ? (typeof row[12] === 'string' ? JSON.parse(row[12]) : row[12]) : [],
          mpesa: row[13] ? (typeof row[13] === 'string' ? JSON.parse(row[13]) : row[13]) : null,
          mpesaMerchantRequestId: row[14] || null,
          mpesaCheckoutRequestId: row[15] || null,
          createdAt: row[16]
        });
      }
      try { stmt.free(); } catch (e) {}
    } else {
      const stmt = db.prepare('SELECT id, reference, name, email, phone, items, total, shipping, shippingLocation, paid, paymentMethod, status, statusHistory, mpesa, mpesaMerchantRequestId, mpesaCheckoutRequestId, createdAt FROM orders WHERE userId = ? OR normalizedEmail = lower(?) OR lower(email) = lower(?) ORDER BY createdAt DESC');
      stmt.bind([payload.id, payload.email || '', payload.email || '']);
      while (stmt.step()) {
        const row = stmt.get();
        results.push({
          id: row[0],
          reference: row[1],
          name: row[2],
          email: row[3],
          phone: row[4],
          items: row[5] ? JSON.parse(row[5]) : [],
          total: Number(row[6] || 0),
          shipping: Number(row[7] || 0),
          shippingLocation: row[8] ? (typeof row[8] === 'string' ? JSON.parse(row[8]) : row[8]) : null,
          paid: Boolean(row[9]),
          paymentMethod: row[10],
          status: row[11],
          statusHistory: row[12] ? (typeof row[12] === 'string' ? JSON.parse(row[12]) : row[12]) : [],
          mpesa: row[13] ? (typeof row[13] === 'string' ? JSON.parse(row[13]) : row[13]) : null,
          mpesaMerchantRequestId: row[14] || null,
          mpesaCheckoutRequestId: row[15] || null,
          createdAt: row[16]
        });
      }
      try { stmt.free(); } catch (e) {}
    }
    try { stmt.free(); } catch (e) {}

    return NextResponse.json({ ok: true, orders: results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}