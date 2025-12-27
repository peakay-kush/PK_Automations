import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/utils/db';
import { requireAdmin } from '@/utils/serverAuth';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;
  try {
    const db = await getDB();
    // ensure disabled column exists
    try {
      const info = db.exec("PRAGMA table_info(users);")[0]?.values || [];
      const cols = info.map((r) => r[1]);
      if (!cols.includes('disabled')) {
        db.run("ALTER TABLE users ADD COLUMN disabled INTEGER DEFAULT 0");
      }
    } catch (e) {}

    const res = db.exec('SELECT id, name, email, createdAt, role, disabled FROM users');
    const values = (res[0] && res[0].values) || [];
    const users = values.map((row) => ({ id: row[0], name: row[1], email: row[2], createdAt: row[3], role: row[4], disabled: !!row[5] }));
    return NextResponse.json(users);
  } catch (err) {
    console.error('[api/admin/users] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = requireSuper(req);
  if (auth && auth.status && auth.status !== 200) return auth;
  try {
    const body = await req.json();
    const { name, email, password, role } = body || {};
    if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const db = await getDB();
    // check existing
    let exists = [];
    try {
      const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
      stmt.bind([email.toLowerCase()]);
      while (stmt.step()) exists.push(stmt.get());
      stmt.free();
    } catch (e) {
      try {
        const raw = db.exec(`SELECT id FROM users WHERE email = "${email.toLowerCase()}"`);
        if (raw && raw[0] && raw[0].values) exists = raw[0].values;
      } catch (e2) {}
    }
    if (exists.length > 0) return NextResponse.json({ error: 'User already exists' }, { status: 409 });

    const hash = bcrypt.hashSync(password, 8);
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    const roleToInsert = role === 'super' ? 'super' : 'user';
    db.run('INSERT INTO users (id, name, email, password, createdAt, role) VALUES (?, ?, ?, ?, ?, ?)', [id, name || '', email.toLowerCase(), hash, createdAt, roleToInsert]);
    await saveDB();
    return NextResponse.json({ ok: true, user: { id, name: name || '', email: email.toLowerCase(), role: roleToInsert } }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/users POST] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
