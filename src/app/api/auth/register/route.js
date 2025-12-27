import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDB, saveDB } from '@/utils/db';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';

export const runtime = 'nodejs';

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function isSuperRequester(req) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.replace('Bearer ', '');
    if (!token) return false;
    const payload = jwt.verify(token, JWT_SECRET);
    return payload?.role === 'super';
  } catch (_e) {
    return false;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password } = body || {};
    const desiredRole = (body && body.role) || 'user';
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const db = await getDB();

    const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const hasRows = await countStmt.step();
    const usersCount = hasRows ? countStmt.getAsObject().count : 0;
    countStmt.free();

    const existsStmt = db.prepare('SELECT 1 FROM users WHERE normalizedEmail = ? OR email = ?');
    existsStmt.bind([normalizedEmail, normalizedEmail]);
    const alreadyExists = await existsStmt.step();
    existsStmt.free();
    if (alreadyExists) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    let roleToInsert = 'user';
    if (usersCount === 0) {
      roleToInsert = 'super'; // bootstrap first user
    } else if (desiredRole === 'super' && isSuperRequester(req)) {
      roleToInsert = 'super';
    }

    const insertStmt = db.prepare(
      'INSERT INTO users (id, name, email, normalizedEmail, password, createdAt, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    await insertStmt.run([id, name || '', email.toLowerCase(), normalizedEmail, hash, createdAt, roleToInsert]);
    insertStmt.free();
    await saveDB();

    const user = { id, name: name || '', email: email.toLowerCase(), role: roleToInsert, createdAt };
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      { ok: true, token, user },
      { status: 201 }
    );
  } catch (err) {
    console.error('[api/auth/register] ERROR', err);
    return NextResponse.json({ error: 'Unable to register right now' }, { status: 500 });
  }
}
