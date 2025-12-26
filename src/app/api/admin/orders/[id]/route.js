import { NextResponse } from 'next/server';
import { getDB, saveDB } from '@/utils/db';
import { requireAdmin } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

export async function DELETE(req, { params }) {
  try {
    requireAdmin(req);
    const db = await getDB();
    const id = params.id;

    // ensure order exists
    const stmt = db.prepare('SELECT id FROM orders WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      try { stmt.free(); } catch (e) {}
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    try { stmt.free(); } catch (e) {}

    const del = db.prepare('DELETE FROM orders WHERE id = ?');
    del.run([id]);
    try { del.free(); } catch (e) {}

    // persist DB changes
    saveDB();

    // notify admin UIs to refresh
    try { globalThis.window?.dispatchEvent(new CustomEvent('adminUpdated', { detail: { type: 'order', id } })); } catch (e) {}

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 403 });
  }
}