import { NextRequest, NextResponse } from "next/server";
import { forwardToHatake, extractSessionCookie, setEuryxSessionCookie, getHatakeUserFromCookie } from "@/lib/auth";

// Hatake's register endpoint lives at /api/auth/register; we forward to it.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const username = (body.username || "").trim();
    const password = body.password || "";
    if (!email || !username || !password) {
      return NextResponse.json({ error: "Email, username and password are required" }, { status: 400 });
    }

    const upstream = await forwardToHatake("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
    });

    const text = await upstream.text();
    let upstreamJson: any = null;
    try { upstreamJson = JSON.parse(text); } catch {}

    if (!upstream.ok) {
      return NextResponse.json(
        { error: upstreamJson?.error || "Signup failed upstream" },
        { status: upstream.status === 500 ? 400 : upstream.status }
      );
    }

    const sessionCookie = extractSessionCookie(upstream.headers.get("set-cookie"));
    const res = NextResponse.json({ success: true, user: upstreamJson?.user || null });
    if (sessionCookie) {
      setEuryxSessionCookie(res, sessionCookie);
      getHatakeUserFromCookie(sessionCookie).catch(() => {});
    }
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "signup_failed" }, { status: 500 });
  }
}
