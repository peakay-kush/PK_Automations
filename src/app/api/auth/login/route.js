import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '@/utils/db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body || {};
    if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const db = await getDB();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    stmt.bind([email.toLowerCase()]);
    
    let row = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();

    if (!row) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const ok = bcrypt.compareSync(password, row.password);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const payload = { id: row.id, email: row.email, name: row.name, role: row.role || 'user' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({ ok: true, token, user: payload });
  } catch (err) {
    console.error('[api/auth/login] ERROR:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
