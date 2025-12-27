import nodemailer from 'nodemailer';
import { getDB, saveDB } from '@/utils/db';
import { getTokenFromHeaders, verifyToken } from '@/utils/serverAuth';
import { normalizeKenyanPhone, isValidKenyanPhone } from '@/utils/helpers';

export const runtime = 'nodejs';

async function sendOrderEmail(to, subject, html) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL?.replace(/\"/g, '')?.trim(), pass: process.env.PASSWORD?.replace(/\"/g, '')?.trim() }
  });

  await transporter.sendMail({ from: process.env.EMAIL?.replace(/\"/g, '')?.trim(), to, subject, html });
}

function makeTimestamp() {
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function getMpesaToken() {
  try {
    const creds = `${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`;
    const res = await fetch(`${process.env.BASE_URL}oauth/v1/generate?grant_type=client_credentials`, {
      headers: { 'Authorization': `Basic ${Buffer.from(creds).toString('base64')}` }
    });
    if (!res.ok) throw new Error('failed to fetch mpesa token');
    const json = await res.json();
    return json.access_token;
  } catch (e) {
    console.warn('getMpesaToken error', e);
    throw e;
  }
}

function mpesaPassword(shortcode, passkey, timestamp) {
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString('base64');
}

async function sendStkPush({ amount, phoneNumber, reference, orderId }) {
  const token = await getMpesaToken();
  const ts = makeTimestamp();
  const password = mpesaPassword(process.env.SHORTCODE, process.env.PASSKEY, ts);
  const body = {
    BusinessShortCode: process.env.SHORTCODE,
    Password: password,
    Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.max(1, Math.round(Number(amount || 0))),
    PartyA: phoneNumber,
    PartyB: process.env.SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: (process.env.CALLBACK_URL ? `${process.env.CALLBACK_URL.replace(/\/$/, '')}/api/mpesa/callback` : `${process.env.NGROK_URL.replace(/\/$/, '')}/api/mpesa/callback`),
    AccountReference: reference,
    TransactionDesc: `Payment for order ${reference}`
  };

  const res = await fetch(`${process.env.BASE_URL}mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  return json;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, phone, paymentMethod, items, total, subtotal, shipping } = body;
    // use let email so we can override for logged-in users
    let email = (body.email || '').trim();

    if (!name || !phone || !items || !Array.isArray(items)) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const db = await getDB();

    // attempt to resolve user from token when available
    let userId = null;
    const token = getTokenFromHeaders(req);
    const payload = verifyToken(token);
    if (payload && payload.id) userId = payload.id;

    // If user is logged in, enforce account email:
    const accountEmail = payload && payload.email ? String(payload.email).toLowerCase() : null;
    if (accountEmail) {
      // If frontend sent a different email, reject to avoid accidental customer mismatches
      if (email && String(email).toLowerCase() !== accountEmail) {
        return new Response(JSON.stringify({ error: 'When logged in, please use your account email' }), { status: 400 });
      }
      // Auto-fill email with account email and normalize it
      email = accountEmail;
    }

    const id = Date.now().toString(36);
    const reference = `PK${Date.now().toString(36).toUpperCase()}`;
    const createdAt = new Date().toISOString();
    const paid = 0;
    const status = 'created';
    const shippingAmt = Number(shipping || 0);
    const orderTotal = Number(total || (Number(subtotal || 0) + shippingAmt));

    // normalize phone server-side and validate
    const normalizedPhone = normalizeKenyanPhone(phone);
    if (!normalizedPhone) {
      return new Response(JSON.stringify({ error: 'Invalid phone' }), { status: 400 });
    }
    // store normalized email (lowercase) so guest orders match when a user later logs in
    const normalizedEmail = (email || '').toLowerCase();
    // Mpesa-specific phone validation removed (integration disabled)
    // Snapshot items (restore product name/price) and insert order into DB (include shippingAddress and shippingLocation if provided)
    // declare itemsSnapshot in outer scope so it's always accessible
    let itemsSnapshot = Array.isArray(items) ? items.map(it => ({ ...it })) : [];
    try {
      // try to hydrate items with product snapshots so emails reflect what was purchased
      try {
        const fs = await import('fs');
        const path = await import('path');
        const dataPath = path.join(process.cwd(), 'src', 'data', 'products.json');
        if (fs.existsSync(dataPath)) {
          const raw = fs.readFileSync(dataPath, 'utf8');
          const json = JSON.parse(raw);
          const products = json.products || [];
          itemsSnapshot = itemsSnapshot.map(it => {
            const prod = products.find(p => Number(p.id) === Number(it.id) || String(p.id) === String(it.id));
            const unitPrice = (typeof it.price !== 'undefined' ? Number(it.price) : (prod ? Number(prod.price || 0) : 0));
            return {
              id: it.id,
              name: it.name || (prod ? prod.name : (it.title || 'Unknown product')),
              price: unitPrice,
              quantity: Number(it.quantity || 1),
              image: it.image || (prod ? prod.image : null)
            };
          });
        } else {
          // fallback: ensure minimal fields
          itemsSnapshot = itemsSnapshot.map(it => ({ id: it.id, name: it.name || it.title || 'Unknown product', price: Number(it.price || 0), quantity: Number(it.quantity || 1), image: it.image || null }));
        }
      } catch (e) { console.warn('failed to hydrate product snapshots for order', e); itemsSnapshot = itemsSnapshot.map(it => ({ id: it.id, name: it.name || it.title || 'Unknown product', price: Number(it.price || 0), quantity: Number(it.quantity || 1), image: it.image || null })); }

      // defensive fallback: ensure itemsSnapshot exists to avoid ReferenceError in edge cases
      if (!Array.isArray(itemsSnapshot)) {
        itemsSnapshot = Array.isArray(items) ? items.map(it => ({ id: it.id, name: it.name || it.title || 'Unknown product', price: Number(it.price || 0), quantity: Number(it.quantity || 1), image: it.image || null })) : [];
      }

      const shippingAddrStr = body.shippingAddress ? JSON.stringify(body.shippingAddress) : null;
      const shippingLocStr = body.shippingLocation ? JSON.stringify(body.shippingLocation) : null;
      const stmt = db.prepare('INSERT INTO orders (id, reference, userId, name, email, normalizedEmail, phone, items, total, shipping, shippingAddress, shippingLocation, paid, paymentMethod, status, statusHistory, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
      const initHistory = JSON.stringify([{ status, changedAt: createdAt, by: userId || name || 'system' }]);
      // store normalized phone and normalized email (lowercase) and snapshot items
      console.log('[api/checkout] Inserting order:', { id, reference, userId, email: normalizedEmail, phone: normalizedPhone, paymentMethod });
      await stmt.run([id, reference, userId, name, normalizedEmail, normalizedEmail, normalizedPhone, JSON.stringify(itemsSnapshot), orderTotal, shippingAmt, shippingAddrStr, shippingLocStr, paid, paymentMethod, status, initHistory, createdAt]);
      try { stmt.free(); } catch (e) {}
      console.log('[api/checkout] Order inserted, calling saveDB()');
      await saveDB();
      console.log('[api/checkout] Order saved successfully');
    } catch (e) {
      console.error('[api/checkout] db insert failed:', e.message || e, e.stack);
      return new Response(JSON.stringify({ error: 'Could not save order' }), { status: 500 });
    }

    const order = { id, reference, userId, name, phone: normalizedPhone, email: normalizedEmail, items: itemsSnapshot || items, total: Number(total || 0), shipping: shippingAmt, shippingAddress: body.shippingAddress || null, shippingLocation: body.shippingLocation || null, paid: Boolean(paid), paymentMethod, status, createdAt };
    // persist stock reductions for products (if quantity is managed)
    try {
      const fs = await import('fs');
      const path = await import('path');
      const dataPath = path.join(process.cwd(), 'src', 'data', 'products.json');
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, 'utf8');
        const json = JSON.parse(raw);
        const products = json.products || [];
        let changed = false;
        for (const it of items) {
          const prod = products.find(p => p.id === it.id);
          if (prod && typeof prod.quantity === 'number') {
            const used = Number(it.quantity || 1);
            const prev = prod.quantity;
            prod.quantity = Math.max(0, (prod.quantity - used));
            if (prod.quantity !== prev) changed = true;
          }
        }
        if (changed) fs.writeFileSync(dataPath, JSON.stringify({ products }, null, 2));
      }
    } catch (e) { console.warn('failed to persist product stock', e); }
    // Send confirmation email to admin + customer with distinct templates
    const { buildOrderCreatedUserEmail, buildOrderCreatedAdminEmail } = await import('@/utils/email');
    const userHtml = buildOrderCreatedUserEmail(order);
    const adminHtml = buildOrderCreatedAdminEmail(order);

    try {
      // send admin notification always
      await sendOrderEmail(process.env.EMAIL?.replace(/\"/g, '')?.trim(), `New order ${order.reference}`, adminHtml);
      // send customer thank-you email (do not include direct links)
      try { await sendOrderEmail(order.email, `Thank you — Order ${order.reference} received`, userHtml); } catch (e) { console.warn('failed to send customer invoice', e); }
    } catch (e) {
      // don't fail checkout if email fails — record error on the order for debugging
      console.error('email error', e);
      try {
        const stmtErr = db.prepare('UPDATE orders SET lastEmailError = ? WHERE id = ?');
        await stmtErr.run([String(e && e.message ? e.message : e), id]);
        try { stmtErr.free(); } catch (ee) {}
        await saveDB();
      } catch (ee) {
        console.warn('failed to persist email error', ee);
      }
    }

    // If Mpesa payment selected, attempt to initiate STK push and save Mpesa request ids
    if (paymentMethod === 'mpesa') {
      try {
        // validate phone before attempting STK push
        if (!isValidKenyanPhone(normalizedPhone)) {
          throw new Error('Invalid Kenyan phone number for Mpesa');
        }
        const stkResp = await sendStkPush({ amount: orderTotal, phoneNumber: normalizedPhone, reference, orderId: id });
        const mpesaObj = { initiatedAt: new Date().toISOString(), request: stkResp };
        const merchantRequestId = stkResp?.MerchantRequestID || stkResp?.merchantRequestId || null;
        const checkoutRequestId = stkResp?.CheckoutRequestID || stkResp?.checkoutRequestId || null;

        // append pending to history
        let hist = [];
        try { hist = initHistory ? JSON.parse(initHistory) : []; } catch (e) { hist = []; }
        hist.push({ status: 'pending', changedAt: new Date().toISOString(), by: 'mpesa-stk' });

        const upd = db.prepare('UPDATE orders SET mpesa = ?, mpesaMerchantRequestId = ?, mpesaCheckoutRequestId = ?, status = ?, statusHistory = ? WHERE id = ?');
        await upd.run([JSON.stringify(mpesaObj), merchantRequestId, checkoutRequestId, 'pending', JSON.stringify(hist), id]);
        try { upd.free(); } catch (e) {}
        await saveDB();

        // return order + mpesa initiation info
        return new Response(JSON.stringify({ ok: true, order: { ...order, mpesa: mpesaObj, mpesaMerchantRequestId: merchantRequestId, mpesaCheckoutRequestId: checkoutRequestId }, mpesaInitiated: true, checkoutRequestId }), { status: 200 });
      } catch (e) {
        console.error('Mpesa STK initiation failed', e);
        try {
          const stmtErr = db.prepare('UPDATE orders SET lastMpesaUpdateError = ? WHERE id = ?');
          await stmtErr.run([String(e && e.message ? e.message : e), id]);
          try { stmtErr.free(); } catch (ee) {}
          await saveDB();
        } catch (ee) { console.warn('failed to persist mpesa initiation error', ee); }

        return new Response(JSON.stringify({ ok: true, order, error: 'Mpesa STK initiation failed' }), { status: 200 });
      }
    }

    // default return for non-Mpesa payments
    return new Response(JSON.stringify({ ok: true, order }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
