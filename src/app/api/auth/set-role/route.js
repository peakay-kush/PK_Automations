import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDB, saveDB } from '@/utils/db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 });

    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || payload.role !== 'super') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { userId, email, role } = body || {};
    if (!userId && !email) return NextResponse.json({ error: 'Missing userId/email' }, { status: 400 });
    if (!role) return NextResponse.json({ error: 'Missing role' }, { status: 400 });

    const db = await getDB();

    if (userId) {
      db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    } else {
      db.run('UPDATE users SET role = ? WHERE email = ?', [role, email.toLowerCase()]);
    }

    await saveDB();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
