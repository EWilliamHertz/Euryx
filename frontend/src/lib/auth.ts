// Server-side bridge to Hatake.Social authentication.
//
// Optimisation in iter-2.1: since Euryx shares `JWT_SECRET` with hatakesocialbeta
// (both apps signed by the same HS256 key), we can decode the cookie LOCALLY
// using `jose` instead of round-tripping to upstream `/api/auth/me` on every
// page load. The upstream call is kept as a fallback only.

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const HATAKE_AUTH_BASE =
  process.env.HATAKE_AUTH_BASE ||
  process.env.HATAKE_AUTH_URL ||
  "https://hatake-social-beta.vercel.app";

export const HATAKE_COOKIE = "hatake_session";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_HATAKE_NETWORK_KEY_99";
const jwtKey = new TextEncoder().encode(JWT_SECRET);

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
    signal: AbortSignal.timeout(8000),
  });
  return res;
}

export function extractSessionCookie(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) return null;
  const cookies = setCookieHeader.split(/,(?=\s*[a-zA-Z0-9_]+=)/g);
  for (const raw of cookies) {
    const m = raw.match(/(?:^|;\s*)hatake_session=([^;]+)/);
    if (m) return m[1];
  }
  return null;
}

export function setEuryxSessionCookie(res: NextResponse, value: string) {
  res.cookies.set(HATAKE_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearEuryxSessionCookie(res: NextResponse) {
  res.cookies.set(HATAKE_COOKIE, "", { maxAge: 0, path: "/" });
}

export function getSessionFromRequest(req: NextRequest): string | null {
  return req.cookies.get(HATAKE_COOKIE)?.value || null;
}

type HatakeUser = { id: string; email: string; username: string };

/** Decode the Hatake JWT locally — same secret, same algorithm. */
async function decodeLocal(token: string): Promise<HatakeUser | null> {
  try {
    const { payload } = await jwtVerify(token, jwtKey, { algorithms: ["HS256"] });
    const id = payload.id as string | undefined;
    const email = payload.email as string | undefined;
    const username = payload.username as string | undefined;
    if (!id || !email || !username) return null;
    return { id, email, username };
  } catch {
    return null;
  }
}

/** Best-effort, async mirror upsert — never blocks the caller. */
function mirrorAsync(user: HatakeUser) {
  prisma.euryxUser
    .upsert({
      where: { id: user.id },
      update: { email: user.email, username: user.username },
      create: { id: user.id, email: user.email, username: user.username, passwordHash: null },
    })
    .catch((e) => console.warn("[auth-mirror]", (e as Error).message));
}

/** Resolve current user strictly using local JWT decode of the hatake_session cookie. */
export async function getHatakeUserFromCookie(cookie: string | null): Promise<HatakeUser | null> {
  if (!cookie) return null;

  // Strict local decode using JWT_SECRET.
  const local = await decodeLocal(cookie);
  if (local) {
    mirrorAsync(local);
    return local;
  }
  return null;
}
