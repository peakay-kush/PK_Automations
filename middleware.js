import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';
const protectedRoutes = ['/student-hub', '/cart'];

function base64urlEncode(bytes) {
  let bin = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlDecodeToString(str) {
  let s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function verifyJWT(token, secret) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(String(secret || 'dev-secret')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const data = enc.encode(`${h}.${p}`);
    const sig = await crypto.subtle.sign('HMAC', key, data);
    const computed = base64urlEncode(new Uint8Array(sig));
    if (computed !== s) return null;
    const payloadJson = base64urlDecodeToString(p);
    const payload = JSON.parse(payloadJson);
    // Optional: exp check
    if (payload && typeof payload.exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      if (nowSec >= payload.exp) return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  // Check if route is protected
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  // Get token from headers or cookies
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('pkat_token')?.value;
  const token = authHeader?.replace('Bearer ', '') || cookieToken;

  if (!token) {
    // Redirect to login with return URL
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
    );
  }

  const ok = await verifyJWT(token, JWT_SECRET);
  if (!ok) {
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/student-hub/:path*', '/cart/:path*']
};
