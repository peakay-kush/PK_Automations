import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '@/utils/db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';

export const runtime = 'nodejs';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role || 'user' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const db = await getDB();
    const stmt = db.prepare('SELECT id, name, email, password, role FROM users WHERE normalizedEmail = ? OR email = ?');
    stmt.bind([normalizedEmail, normalizedEmail]);

    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();

    if (!row) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, row.password);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = { id: row.id, name: row.name, email: row.email, role: row.role || 'user' };
    const token = signToken(user);

    return NextResponse.json({ ok: true, token, user });
  } catch (err) {
    console.error('[api/auth/login] ERROR:', err);
    return NextResponse.json({ error: 'Unable to login right now' }, { status: 500 });
  }
}
