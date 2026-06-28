// Server-side bridge to Hatake.Social authentication.
// Euryx is a sister-app; users sign in with ONE Hatake account everywhere.
//
// Flow:
//   1. Browser POSTs /api/auth/login on Euryx with {email,password}.
//   2. We forward to https://www.hatake.social/api/auth/login (or beta mirror).
//   3. Upstream sets-cookie `hatake_session=<jwt>` — we re-emit it on the
//      Euryx response so the browser stores it on the Euryx domain.
//   4. /api/auth/me forwards the cookie back to upstream and returns its user.
//   5. We upsert an EuryxUser mirror row keyed by the same id so Euryx's
//      decks/settings FKs continue to work.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const HATAKE_AUTH_BASE =
  process.env.HATAKE_AUTH_BASE ||
  process.env.HATAKE_AUTH_URL ||
  "https://hatake-social-beta.vercel.app";

export const HATAKE_COOKIE = "hatake_session";

/** Forward a Hatake API request server-side; relays the session cookie. */
export async function forwardToHatake(
  path: string,
  init: RequestInit & { cookieHeader?: string } = {}
): Promise<Response> {
  const url = `${HATAKE_AUTH_BASE}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.cookieHeader) headers["Cookie"] = init.cookieHeader;
  if (init.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const res = await fetch(url, {
    method: init.method || "GET",
    headers,
    body: init.body,
    redirect: "follow",
  });
  return res;
}

/** Extract the `hatake_session` cookie from a Set-Cookie header (multi-value safe). */
export function extractSessionCookie(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) return null;
  // Multiple cookies may arrive separated by commas — split on `, <name>=`
  const cookies = setCookieHeader.split(/,(?=\s*[a-zA-Z0-9_]+=)/g);
  for (const raw of cookies) {
    const m = raw.match(/(?:^|;\s*)hatake_session=([^;]+)/);
    if (m) return m[1];
  }
  return null;
}

/** Re-emit `hatake_session` on the Euryx domain. */
export function setEuryxSessionCookie(res: NextResponse, value: string) {
  res.cookies.set(HATAKE_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/** Clear our local mirror cookie. */
export function clearEuryxSessionCookie(res: NextResponse) {
  res.cookies.set(HATAKE_COOKIE, "", { maxAge: 0, path: "/" });
}

export function getSessionFromRequest(req: NextRequest): string | null {
  return req.cookies.get(HATAKE_COOKIE)?.value || null;
}

/** Read current user from upstream `/api/auth/me`, mirror to local EuryxUser. */
export async function getHatakeUserFromCookie(cookie: string | null) {
  if (!cookie) return null;
  try {
    const r = await forwardToHatake("/api/auth/me", {
      cookieHeader: `${HATAKE_COOKIE}=${cookie}`,
    });
    if (!r.ok) return null;
    const data = await r.json();
    const user = data?.user;
    if (!user || !user.id || !user.email || !user.username) return null;

    // Upsert mirror — silently best-effort.
    try {
      await prisma.euryxUser.upsert({
        where: { id: user.id },
        update: { email: user.email, username: user.username },
        create: { id: user.id, email: user.email, username: user.username, passwordHash: null },
      });
    } catch (e) {
      // Possible username/email uniqueness collision with a legacy local-only row.
      // Ignore — downstream code still has the user object from upstream.
      console.warn("[auth-bridge] upsert mirror failed:", (e as Error).message);
    }
    return user as { id: string; email: string; username: string };
  } catch {
    return null;
  }
}
