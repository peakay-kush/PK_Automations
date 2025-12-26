import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/utils/db';
import { getTokenFromHeaders, verifyToken } from '@/utils/serverAuth';

export async function GET(req, { params }) {
  try {
    const db = await getDB();
    const id = params.id;
    let row = null;
    try {
      const stmt = db.prepare('SELECT id, reference, userId, name, phone, email, items, total, shipping, shippingAddress, shippingLocation, paid, paymentMethod, status, statusHistory, mpesa, mpesaMerchantRequestId, mpesaCheckoutRequestId, createdAt, lastMpesaUpdateError FROM orders WHERE id = ?');
      stmt.bind([id]);
      if (stmt.step()) row = stmt.get();
      try { stmt.free(); } catch (e) {}
    } catch (e) {
      const res = db.exec(`SELECT id, reference, userId, name, phone, email, items, total, shipping, shippingAddress, shippingLocation, paid, paymentMethod, status, statusHistory, createdAt FROM orders WHERE id = "${id}"`);
      row = res?.[0]?.values?.[0] || null;
    }

    if (!row) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const [rid, reference, userId, name, phone, email, itemsRaw, total, shipping, shippingAddressRaw, shippingLocationRaw, paid, paymentMethod, status, statusHistoryRaw, mpesaRaw, mpesaMerchantRequestId, mpesaCheckoutRequestId, createdAt, lastMpesaUpdateError] = row;
    const mpesa = mpesaRaw ? (typeof mpesaRaw === 'string' ? JSON.parse(mpesaRaw) : mpesaRaw) : null;
    const order = { id: rid, reference, userId, name, phone, email, items: itemsRaw ? JSON.parse(itemsRaw) : [], total: Number(total), shipping: Number(shipping || 0), shippingAddress: shippingAddressRaw ? (typeof shippingAddressRaw === 'string' ? JSON.parse(shippingAddressRaw) : shippingAddressRaw) : null, shippingLocation: shippingLocationRaw ? (typeof shippingLocationRaw === 'string' ? JSON.parse(shippingLocationRaw) : shippingLocationRaw) : null, paid: Boolean(paid), paymentMethod, status, statusHistory: statusHistoryRaw ? (typeof statusHistoryRaw === 'string' ? JSON.parse(statusHistoryRaw) : statusHistoryRaw) : [], mpesa, mpesaMerchantRequestId, mpesaCheckoutRequestId, createdAt, lastMpesaUpdateError: lastMpesaUpdateError || null };

    // Debug: log order retrieval to help trace payment state issues
    try { console.log(`GET /api/orders/${id} => paid:${order.paid} status:${order.status} reference:${order.reference}`); } catch (e) {}

    return NextResponse.json({ ok: true, order });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    console.log('[api/orders/[id] DELETE] called for id', params.id);
    // requireAdmin not statically available here; use payload roles for admin check
    const db = await getDB();
    const id = params.id;

    // find order owner
    const stmt = db.prepare('SELECT id, userId, email, normalizedEmail FROM orders WHERE id = ?');
    stmt.bind([id]);
    let row = null;
    if (stmt.step()) row = stmt.get();
    try { stmt.free(); } catch (e) {}
    if (!row) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const orderUserId = row[1];
    const orderEmail = row[2] || '';
    const orderNormalized = row[3] || '';

    // verify requester
    const token = getTokenFromHeaders(req);
    const payload = verifyToken(token);

    // admins can delete any order
    if (payload && (payload.role === 'admin' || payload.role === 'super')) {
      const del = db.prepare('DELETE FROM orders WHERE id = ?');
      del.run([id]);
      try { del.free(); } catch (e) {}
      await saveDB();
      return NextResponse.json({ ok: true });
    }

    // otherwise ensure the requester matches the order owner (by userId or email)
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const requesterId = payload.id;
    const requesterEmail = (payload.email || '').toLowerCase();

    const ownerMatches = (orderUserId && requesterId && String(orderUserId) === String(requesterId)) || (orderNormalized && String(orderNormalized).toLowerCase() === requesterEmail) || (orderEmail && String(orderEmail).toLowerCase() === requesterEmail);
    if (!ownerMatches) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // perform delete
    const del = db.prepare('DELETE FROM orders WHERE id = ?');
    del.run([id]);
    try { del.free(); } catch (e) {}
    await saveDB();

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}