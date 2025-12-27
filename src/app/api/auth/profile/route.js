import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDB, saveDB } from '@/utils/db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';

export const runtime = 'nodejs';

function requireToken(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) throw new Error('Missing token');
  return jwt.verify(token, JWT_SECRET);
}

function normalizeEmail(email) {
  return email ? String(email).trim().toLowerCase() : null;
}

async function loadUserById(db, id) {
  const stmt = db.prepare('SELECT id, name, email, phone, profileImage, createdAt, role FROM users WHERE id = ?');
  stmt.bind([id]);
  const row = stmt.step() ? stmt.get() : null;
  stmt.free();
  if (!row) return null;
  const [userId, name, email, phone, profileImage, createdAt, role] = row;
  return { id: userId, name, email, phone, profileImage, createdAt, role };
}

export async function GET(req) {
  try {
    const payload = requireToken(req);
    const db = await getDB();
    const user = await loadUserById(db, payload.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req) {
  try {
    const payload = requireToken(req);
    const body = await req.json();
    const { name, email, phone, profileImage } = body || {};
    if (!name && !email && !phone && !profileImage) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const db = await getDB();
    const normalized = normalizeEmail(email);

    const stmt = db.prepare(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), profileImage = COALESCE(?, profileImage), normalizedEmail = COALESCE(?, normalizedEmail) WHERE id = ?'
    );
    stmt.bind([name || null, normalized || null, phone || null, profileImage || null, normalized || null, payload.id]);
    stmt.step();
    stmt.free();

    await saveDB();
    const user = await loadUserById(db, payload.id);
    if (!user) return NextResponse.json({ error: 'User not found after update' }, { status: 404 });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Bad request' }, { status: 400 });
  }
}