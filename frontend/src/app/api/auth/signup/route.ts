import { NextRequest, NextResponse } from "next/server";
import { forwardToHatake, extractSessionCookie, setEuryxSessionCookie, getHatakeUserFromCookie } from "@/lib/auth";

// Hatake upstream signup currently throws on email-verification send AFTER the
// User row has been created. So a 500 from /api/auth/register usually means
// "user created, email send failed". We detect that case and auto-login the
// user so they get a valid session cookie anyway.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const username = (body.username || "").trim();
    const password = body.password || "";
    if (!email || !username || !password) {
      return NextResponse.json({ error: "Email, username and password are required" }, { status: 400 });
    }

    // Attempt 1: upstream register.
    let cookieValue: string | null = null;
    let upstreamUser: any = null;
    let registerStatus = 0;
    let registerError: string | null = null;

    try {
      const reg = await forwardToHatake("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, username, password }),
      });
      registerStatus = reg.status;
      const text = await reg.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch {}
      if (reg.ok) {
        cookieValue = extractSessionCookie(reg.headers.get("set-cookie"));
        upstreamUser = json?.user || null;
      } else {
        registerError = json?.error || `upstream_${reg.status}`;
      }
    } catch (e: any) {
      registerError = e?.message || "register_fetch_failed";
    }

    // Attempt 2: if register failed with a 5xx (likely email-send broke), the
    // user row may have been created anyway. Try to log in.
    if (!cookieValue) {
      // Also retry on 409 with the email already in use — they may already
      // have an account from a previous failed attempt.
      const shouldFallback = registerStatus >= 500 || registerStatus === 409 || registerStatus === 0;
      if (shouldFallback) {
        try {
          const login = await forwardToHatake("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          if (login.ok) {
            cookieValue = extractSessionCookie(login.headers.get("set-cookie"));
            const text = await login.text();
            try { upstreamUser = JSON.parse(text)?.user || null; } catch {}
          } else if (registerStatus === 409) {
            // Already in use AND login failed — wrong password for existing account.
            return NextResponse.json(
              { error: "An account with that email already exists — sign in instead." },
              { status: 409 }
            );
          }
        } catch (e: any) {
          // ignore — handled below
        }
      }
    }

    if (!cookieValue) {
      return NextResponse.json(
        { error: registerError || "Signup failed and recovery login did not succeed." },
        { status: 502 }
      );
    }

    const res = NextResponse.json({ success: true, user: upstreamUser });
    setEuryxSessionCookie(res, cookieValue);
    // Best-effort mirror, fire-and-forget.
    getHatakeUserFromCookie(cookieValue).catch(() => {});
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "signup_failed" }, { status: 500 });
  }
}
