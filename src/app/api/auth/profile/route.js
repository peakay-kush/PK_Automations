import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDB } from '@/utils/db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';

export const runtime = 'nodejs';

export async function GET(req) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

    const payload = jwt.verify(token, JWT_SECRET);

    const db = await getDB();
    // Use prepared statement to query by id (SQL.js does not accept params in exec)
    let row = null;
    try {
      const stmt = db.prepare('SELECT id, name, email, phone, profileImage, createdAt, role FROM users WHERE id = ?');
      stmt.bind([payload.id]);
      if (stmt.step()) {
        row = stmt.get();
      }
      stmt.free();
    } catch (e) {
      // Fallback to exec without params (not ideal but prevents throwing in exotic environments)
      const res = db.exec(`SELECT id, name, email, phone, profileImage, createdAt, role FROM users WHERE id = "${payload.id}"`);
      if (res && res[0] && res[0].values && res[0].values[0]) row = res[0].values[0];
    }

    if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const [id, name, email, phone, profileImage, createdAt, role] = row;

    return NextResponse.json({ ok: true, user: { id, name, email, phone, profileImage, createdAt, role } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 401 });
  }
}

export async function PATCH(req) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

    const payload = jwt.verify(token, JWT_SECRET);
    const body = await req.json();
    const { name, email, phone, profileImage } = body || {};
    if (!name && !email && !phone && !profileImage) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    const db = await getDB();

    // Normalize email to lowercase when provided
    let normalized = null;
    if (email) normalized = String(email).trim().toLowerCase();

    // Update only provided fields (use COALESCE with NULL to leave unchanged)
    try {
      const stmt = db.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), profileImage = COALESCE(?, profileImage), normalizedEmail = COALESCE(?, normalizedEmail) WHERE id = ?');
      stmt.bind([name || null, normalized || null, phone || null, profileImage || null, normalized || null, payload.id]);
      stmt.step();
      stmt.free();
    } catch (e) {
      // fallback to non-prepared update (best-effort)
      const updates = [];
      if (name) updates.push(`name = "${String(name).replace(/"/g, '\\"')}"`);
      if (email) updates.push(`email = "${String(email).replace(/"/g, '\\"')}"`);
      if (phone) updates.push(`phone = "${String(phone).replace(/"/g, '\\"')}"`);
      if (profileImage) updates.push(`profileImage = "${String(profileImage).replace(/"/g, '\\"')}"`);
      if (normalized) updates.push(`normalizedEmail = "${String(normalized).replace(/"/g, '\\"')}"`);
      if (updates.length > 0) {
        db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = "${payload.id}"`);
      }
    }

    // Return updated user
    let row = null;
    try {
      const stmt2 = db.prepare('SELECT id, name, email, phone, profileImage, createdAt, role FROM users WHERE id = ?');
      stmt2.bind([payload.id]);
      if (stmt2.step()) row = stmt2.get();
      stmt2.free();
    } catch (e) {
      const res = db.exec(`SELECT id, name, email, phone, profileImage, createdAt, role FROM users WHERE id = "${payload.id}"`);
      if (res && res[0] && res[0].values && res[0].values[0]) row = res[0].values[0];
    }

    if (!row) return NextResponse.json({ error: 'User not found after update' }, { status: 404 });
    const [id, outName, outEmail, outPhone, outProfileImage, createdAt, role] = row;
    return NextResponse.json({ ok: true, user: { id, name: outName, email: outEmail, phone: outPhone, profileImage: outProfileImage, createdAt, role } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}