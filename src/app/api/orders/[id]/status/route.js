import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getDB, saveDB } from '@/utils/db';
import { getTokenFromHeaders, verifyToken } from '@/utils/serverAuth';

export const runtime = 'nodejs';

const ALLOWED_STATUSES = ['created','pending','confirmed','dispatched','completed','failed','cancelled'];

async function sendOrderEmail(to, subject, html) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL?.replace(/"/g, '')?.trim(), pass: process.env.PASSWORD?.replace(/"/g, '')?.trim() }
  });
  await transporter.sendMail({ from: process.env.EMAIL?.replace(/"/g, '')?.trim(), to, subject, html });
}

export async function POST(req, { params }) {
  try {
    const token = getTokenFromHeaders(req);
    const payload = verifyToken(token);
    if (!payload || !(payload.role === 'admin' || payload.role === 'super')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body || {};
    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 });
    if (!ALLOWED_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const db = await getDB();

    // fetch order (include name and phone for better email content)
    let orderRow = null;
    try {
      const stmt = db.prepare('SELECT id, reference, name, email, phone, status, statusHistory FROM orders WHERE id = ?');
      stmt.bind([params.id]);
      if (stmt.step()) orderRow = stmt.get();
      try { stmt.free(); } catch (e) {}
    } catch (e) {
      const res = db.exec(`SELECT id, reference, name, email, phone, status, statusHistory FROM orders WHERE id = "${params.id}"`);
      orderRow = res?.[0]?.values?.[0] || null;
    }

    if (!orderRow) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const [id, reference, name, email, phone, currentStatus, statusHistoryRaw] = orderRow;
    const history = statusHistoryRaw ? (typeof statusHistoryRaw === 'string' ? JSON.parse(statusHistoryRaw) : statusHistoryRaw) : [];
    const entry = { status, changedAt: new Date().toISOString(), by: payload.email || payload.id || payload.name || 'admin' };
    history.push(entry);

    try {
      const stmt2 = db.prepare('UPDATE orders SET status = ?, statusHistory = ? WHERE id = ?');
      stmt2.run([status, JSON.stringify(history), id]);
      try { stmt2.free(); } catch (e) {}
      await saveDB();
    } catch (e) {
      console.error('db update status failed', e);
      return NextResponse.json({ error: 'Could not update status' }, { status: 500 });
    }

    // build distinct emails for user and admin (no order links in user email)
    const orderObj = { id, reference, name, email, phone };
    const { buildStatusChangeUserEmail, buildStatusChangeAdminEmail } = await import('@/utils/email');
    const userHtml = buildStatusChangeUserEmail(orderObj, status, entry);
    const adminHtml = buildStatusChangeAdminEmail(orderObj, status, entry);

    try {
      // notify user (if email present)
      if (email) await sendOrderEmail(email, `Update on your order ${reference}`, userHtml);
      // always notify admin
      await sendOrderEmail(process.env.EMAIL?.replace(/"/g, '')?.trim(), `Order ${reference} status changed to ${status}`, adminHtml);
    } catch (e) {
      console.error('status change email failed', e);
    }

    return NextResponse.json({ ok: true, id, status, statusHistory: history });
  } catch (e) {
    console.error('status update error', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}