import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { initSentry, captureException } from '@/utils/sentry';

// Lazy-load Sentry initialization to avoid module load time issues
let sentryInitialized = false;
function ensureSentryInit() {
  if (!sentryInitialized) {
    try {
      initSentry();
      sentryInitialized = true;
    } catch (e) {
      console.warn('[serverAuth] Failed to initialize Sentry:', e.message);
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';

export function getTokenFromHeaders(req) {
  ensureSentryInit();
  const auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  return token || null;
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    try { ensureSentryInit(); captureException(e, { during: 'verifyToken', token: String(token).slice(0,40) }); } catch (ee) {}
    return null;
  }
}

export function requireRole(req, allowed = ['super']) {
  ensureSentryInit();
  const token = getTokenFromHeaders(req);
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!allowed.includes(payload.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return payload;
}

export function requireSuper(req) { return requireRole(req, ['super']); }
export function requireAdmin(req) { return requireRole(req, ['super','admin']); }
