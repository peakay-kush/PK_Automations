import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB, saveDB } from '@/utils/db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password } = body || {};
    const desiredRole = (body && body.role) || 'user';
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const db = await getDB();
    // Determine if the request is coming from an existing superuser
    let isRequesterSuper = false;
    try {
      const auth = req.headers.get('authorization') || '';
      const token = auth.replace('Bearer ', '');
      if (token) {
        const payload = jwt.verify(token, JWT_SECRET);
        if (payload && payload.role === 'super') isRequesterSuper = true;
      }
    } catch (e) { }

    // If there are no users yet, allow the first user to be super
    const countRes = db.exec('SELECT COUNT(*) FROM users');
    const usersCount = (countRes[0] && countRes[0].values && countRes[0].values[0] && countRes[0].values[0][0]) || 0;
    // Check if user exists using a prepared statement (SQL.js doesn't accept params in exec)
    let checkRes = [];
    try {
      const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
      stmt.bind([email.toLowerCase()]);
      while (stmt.step()) {
        checkRes.push(stmt.get());
      }
      stmt.free();
    } catch (e) {
      // Fallback to exec (no params) - not ideal but prevents hard failures
      try {
        const raw = db.exec(`SELECT id FROM users WHERE email = "${email.toLowerCase()}"`);
        if (raw && raw[0] && raw[0].values) checkRes = raw[0].values;
      } catch (e2) {
        // ignore
      }
    }
    if (checkRes.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hash = bcrypt.hashSync(password, 8);
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    // Only allow assigning 'super' role when creating first user or if requester is super
    let roleToInsert = 'user';
    if (usersCount === 0) {
      roleToInsert = desiredRole === 'super' ? 'super' : 'super'; // first user becomes super by default
    } else if (desiredRole === 'super' && isRequesterSuper) {
      roleToInsert = 'super';
    }

    db.run('INSERT INTO users (id, name, email, password, createdAt, role) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name || '', email.toLowerCase(), hash, createdAt, roleToInsert]);
    await saveDB();

    return NextResponse.json({ ok: true, user: { id, name: name || '', email: email.toLowerCase(), role: roleToInsert } }, { status: 201 });
  } catch (err) {
    console.error('[api/auth/register] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
