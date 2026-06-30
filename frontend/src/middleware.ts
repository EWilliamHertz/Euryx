import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_HATAKE_NETWORK_KEY_99";
const jwtKey = new TextEncoder().encode(JWT_SECRET);
const HATAKE_COOKIE = "hatake_session";
const HATAKE_LOGIN_URL = "https://hatake.social/login";

export async function middleware(request: NextRequest) {
  const cookie = request.cookies.get(HATAKE_COOKIE)?.value;
  let isAuthenticated = false;

  if (cookie) {
    try {
      await jwtVerify(cookie, jwtKey, { algorithms: ["HS256"] });
      isAuthenticated = true;
    } catch (e) {
      // Invalid token
    }
  }

  const { pathname } = request.nextUrl;

  // Skip API routes here, they handle their own auth checks
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(HATAKE_LOGIN_URL);
  }

  // If authenticated, bypass legacy menus and mount core Game Board (queue)
  const legacyMenus = [
    "/",
    "/dashboard",
    "/login",
    "/signup",
    "/profile",
    "/settings",
    "/tournaments",
    "/vault",
    "/deck-builder"
  ];

  if (legacyMenus.includes(pathname)) {
    return NextResponse.redirect(new URL("/queue", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> Wait, I want to match API to potentially handle it, but it's skipped inside.
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - socket.io (websocket connections)
     */
    '/((?!_next/static|_next/image|favicon.ico|socket.io).*)',
  ],
};
