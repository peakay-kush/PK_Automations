import { NextResponse } from 'next/server';

// Lazy-load crypto libraries to avoid CommonJS interop issues on Vercel
let jwt = null;
let initSentry = null;
let captureException = null;

async function loadDeps() {
  if (jwt) return;
  try {
    jwt = (await import('jsonwebtoken')).default || (await import('jsonwebtoken'));
    const sentryUtils = await import('@/utils/sentry');
    initSentry = sentryUtils.initSentry;
    captureException = sentryUtils.captureException;
    initSentry();
  } catch (e) {
    console.error('[serverAuth] Failed to load dependencies:', e.message);
  }
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';

export function getTokenFromHeaders(req) {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  return token || null;
}

export async function verifyToken(token) {
  if (!token) return null;
  try {
    await loadDeps();
    if (!jwt || !jwt.verify) {
      console.warn('[serverAuth] JWT library not available');
      return null;
    }
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    try { 
      await loadDeps();
      if (captureException) captureException(e, { during: 'verifyToken', token: String(token).slice(0,40) });
    } catch (ee) {}
    return null;
  }
}

export async function requireRole(req, allowed = ['super']) {
  const token = getTokenFromHeaders(req);
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed.includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return payload;
}

export function requireSuper(req) { return requireRole(req, ['super']); }
export function requireAdmin(req) { return requireRole(req, ['super','admin']); }
