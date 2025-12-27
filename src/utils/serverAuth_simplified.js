import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';

export function getTokenFromHeaders(req) {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  return token || null;
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    // Log error but don't try to call Sentry at module load time
    console.warn('[auth] token verification failed:', e.message);
    return null;
  }
}

export function requireRole(req, allowed = ['super']) {
  const token = getTokenFromHeaders(req);
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed.includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return payload;
}

export function requireSuper(req) { return requireRole(req, ['super']); }
export function requireAdmin(req) { return requireRole(req, ['super','admin']); }
