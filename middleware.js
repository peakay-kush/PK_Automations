import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret';
const protectedRoutes = ['/student-hub', '/cart'];

export function middleware(request) {
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

  try {
    jwt.verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
    );
  }
}

export const config = {
  matcher: ['/student-hub/:path*', '/cart/:path*']
};
