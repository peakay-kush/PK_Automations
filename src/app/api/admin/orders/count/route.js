import { NextResponse } from 'next/server';
import { getDB } from '@/utils/db';
import { getTokenFromHeaders, verifyToken } from '@/utils/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const token = getTokenFromHeaders(req);
    const payload = verifyToken(token);
    if (!payload || !(payload.role === 'admin' || payload.role === 'super')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = await getDB();
    let count = 0;
    try {
      const res = db.exec(`SELECT COUNT(*) as c FROM orders WHERE status IN ('pending','created')`);
      const val = res?.[0]?.values?.[0]?.[0];
      count = Number(val || 0);
    } catch (e) {
      try {
        const stmt = db.prepare('SELECT COUNT(*) FROM orders WHERE status IN (?,?,?)');
        // Use a simple approach with only two statuses we care about
        stmt.bind(['pending','created','pending']);
        if (stmt.step()) count = Number(stmt.get()[0] || 0);
        try { stmt.free(); } catch (err) {}
      } catch (er) {
        console.error('count query failed', er);
        count = 0;
      }
    }

    return NextResponse.json({ ok: true, count });
  } catch (e) {
    console.error('admin orders count error', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
