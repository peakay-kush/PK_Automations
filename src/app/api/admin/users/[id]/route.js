import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/utils/db';
import { requireAdmin } from '@/utils/serverAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const auth = requireAdmin(req);
  if (auth && auth.status && auth.status !== 200) return auth;
  try {
    const id = params.id;
    const db = await getDB();
    const stmt = db.prepare('SELECT id, name, email, createdAt, role, disabled FROM users WHERE id = ?');
    stmt.bind([id]);
    const hasRow = await stmt.step();
    const row = hasRow ? stmt.get() : null;
    stmt.free();
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
      const info = await db.exec("PRAGMA table_info(users);");
      const values = (info[0] && info[0].values) || [];
      const cols = values.map((r) => r[1]);
      if (!cols.includes('disabled')) {
        await db.run("ALTER TABLE users ADD COLUMN disabled INTEGER DEFAULT 0");
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
    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, paramsArr);
    await saveDB();
    const stmt = db.prepare('SELECT id, name, email, createdAt, role, disabled FROM users WHERE id = ?');
    stmt.bind([id]);
    const hasRow = await stmt.step();
    const row = hasRow ? stmt.get() : null;
    stmt.free();
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
    const stmt = db.prepare('SELECT role FROM users WHERE id = ?');
    stmt.bind([id]);
    const hasRow = await stmt.step();
    const roleRow = hasRow ? stmt.get() : null;
    stmt.free();
    if (!roleRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const targetRole = roleRow[0];
    if (targetRole === 'super') {
      // only a super can delete another super
      if (auth.role !== 'super') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      // ensure at least one other super remains
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?');
      countStmt.bind(['super']);
      await countStmt.step();
      const countObj = countStmt.getAsObject();
      countStmt.free();
      const count = countObj ? (countObj.count || 0) : 0;
      if (count <= 1) return NextResponse.json({ error: 'Cannot delete the last super user' }, { status: 400 });
    }
    const delStmt = db.prepare('DELETE FROM users WHERE id = ?');
    await delStmt.run([id]);
    delStmt.free();
    await saveDB();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/users/[id] DELETE] ERROR', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
