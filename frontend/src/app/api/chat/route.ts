// Proxy to Hatake.Social /api/chat — messages flow between Hatake and Euryx.
import { NextRequest, NextResponse } from "next/server";
import { forwardToHatake, getSessionFromRequest, HATAKE_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const cookie = getSessionFromRequest(req);
  if (!cookie) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const r = await forwardToHatake("/api/chat", {
    cookieHeader: `${HATAKE_COOKIE}=${cookie}`,
  });
  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "Content-Type": r.headers.get("content-type") || "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const cookie = getSessionFromRequest(req);
  if (!cookie) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.text();
  const r = await forwardToHatake("/api/chat", {
    method: "POST",
    cookieHeader: `${HATAKE_COOKIE}=${cookie}`,
    body,
  });
  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "Content-Type": r.headers.get("content-type") || "application/json" },
  });
}
