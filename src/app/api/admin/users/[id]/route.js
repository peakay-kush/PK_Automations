import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/utils/db';
import { requireAdmin } from '@/utils/serverAuth';
export const dynamic = 'force-dynamic';
export async function GET(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;
  try {
    const id = params.id;
    const db = await getDB();
    const raw = db.exec('SELECT id, name, email, createdAt, role, disabled FROM users WHERE id = "' + id + '"');
    const row = (raw[0] && raw[0].values && raw[0].values[0]) || null;
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const user = { id: row[0], name: row[1], email: row[2], createdAt: row[3], role: row[4], disabled: !!row[5] };
    return NextResponse.json(user);
  } catch (err) {
    console.error('[api/admin/users/[id] GET] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;
  try {
    const id = params.id;
    const body = await req.json();
    const db = await getDB();
    // ensure disabled column exists
    try {
      const info = db.exec("PRAGMA table_info(users);")[0]?.values || [];
      const cols = info.map((r) => r[1]);
      if (!cols.includes('disabled')) {
        db.run("ALTER TABLE users ADD COLUMN disabled INTEGER DEFAULT 0");
      }
    } catch (e) {}

    // only allow role='super' changes when requester is super; allow admin changes to 'admin' when requester is admin or super
    const updates = [];
    const paramsArr = [];
    if (typeof body.role !== 'undefined') {
      const requested = String(body.role);
      const allowedRoles = ['user','admin','super'];
      if (!allowedRoles.includes(requested)) return NextResponse.json({ error: 'Invalid role' }, { status: 422 });
      if (requested === 'super' && auth.role !== 'super') return NextResponse.json({ error: 'Forbidden to assign super' }, { status: 403 });
      updates.push('role = ?');
      paramsArr.push(requested);
    }
    if (typeof body.disabled !== 'undefined') {
      updates.push('disabled = ?');
      paramsArr.push(body.disabled ? 1 : 0);
    }
    if (updates.length === 0) return NextResponse.json({ error: 'No changes provided' }, { status: 400 });

    paramsArr.push(id);
    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, paramsArr);
    await saveDB();
    const raw = db.exec('SELECT id, name, email, createdAt, role, disabled FROM users WHERE id = "' + id + '"');
    const row = (raw[0] && raw[0].values && raw[0].values[0]) || null;
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const user = { id: row[0], name: row[1], email: row[2], createdAt: row[3], role: row[4], disabled: !!row[5] };
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error('[api/admin/users/[id] PUT] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;
  try {
    const id = params.id;
    const db = await getDB();
    // get role of target
    const raw = db.exec('SELECT role FROM users WHERE id = "' + id + '"');
    const roleRow = (raw[0] && raw[0].values && raw[0].values[0]) || null;
    if (!roleRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const targetRole = roleRow[0];
    if (targetRole === 'super') {
      // only a super can delete another super
      if (auth.role !== 'super') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      // ensure at least one other super remains
      const res = db.exec('SELECT COUNT(*) FROM users WHERE role = "super"');
      const count = (res[0] && res[0].values && res[0].values[0] && res[0].values[0][0]) || 0;
      if (count <= 1) return NextResponse.json({ error: 'Cannot delete the last super user' }, { status: 400 });
    }
    db.run('DELETE FROM users WHERE id = "' + id + '"');
    await saveDB();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/users/[id] DELETE] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
