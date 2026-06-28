// Proxy to Hatake's /api/users so the messenger "new chat" username lookup works.
import { NextRequest, NextResponse } from "next/server";
import { forwardToHatake, getSessionFromRequest, HATAKE_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const cookie = getSessionFromRequest(req);
  if (!cookie) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const search = req.nextUrl.search || "";
  const r = await forwardToHatake(`/api/users${search}`, {
    cookieHeader: `${HATAKE_COOKIE}=${cookie}`,
  });
  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "Content-Type": r.headers.get("content-type") || "application/json" },
  });
}
