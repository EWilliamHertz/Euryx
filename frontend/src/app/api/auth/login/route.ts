import { NextRequest, NextResponse } from "next/server";
import {
  forwardToHatake,
  extractSessionCookie,
  setEuryxSessionCookie,
  getHatakeUserFromCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const password = body.password || "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const upstream = await forwardToHatake("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const upstreamText = await upstream.text();
    let upstreamJson: any = null;
    try { upstreamJson = JSON.parse(upstreamText); } catch {}

    if (!upstream.ok) {
      return NextResponse.json(
        { error: upstreamJson?.error || "Invalid credentials" },
        { status: upstream.status === 500 ? 401 : upstream.status }
      );
    }

    const sessionCookie = extractSessionCookie(upstream.headers.get("set-cookie"));
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Hatake did not return a session cookie" },
        { status: 502 }
      );
    }

    const res = NextResponse.json({
      success: true,
      user: upstreamJson?.user || null,
    });
    setEuryxSessionCookie(res, sessionCookie);

    // Mirror upstream user → EuryxUser (best-effort, non-blocking).
    getHatakeUserFromCookie(sessionCookie).catch(() => {});

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "login_failed" }, { status: 500 });
  }
}
