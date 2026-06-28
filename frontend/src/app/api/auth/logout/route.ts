import { NextResponse } from "next/server";
import { clearEuryxSessionCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearEuryxSessionCookie(res);
  return res;
}
