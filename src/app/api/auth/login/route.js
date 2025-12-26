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
    const res = db.exec('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (res.length === 0 || res[0].values.length === 0) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const row = res[0].values[0];
    const [userId, name, userEmail, hash, createdAt, role] = row;
    const ok = bcrypt.compareSync(password, hash);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const payload = { id: userId, email: userEmail, name, role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({ ok: true, token, user: payload });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
