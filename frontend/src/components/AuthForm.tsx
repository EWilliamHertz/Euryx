"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";

type Mode = "login" | "signup";

export default function AuthPage({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body: any = { email, password };
      if (mode === "signup") body.username = username;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auth failed");
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 30%, rgba(0,240,255,0.12), transparent 40%), radial-gradient(circle at 75% 70%, rgba(255,0,255,0.12), transparent 40%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative w-full max-w-md glass-strong rounded-2xl p-8 z-10"
        style={{ boxShadow: "0 0 60px rgba(0,240,255,0.15), 0 0 100px rgba(255,0,255,0.06)" }}
        data-testid={`auth-${mode}-card`}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-euryx-cyan to-euryx-fuchsia" />
            <div className="absolute inset-[3px] rounded-full bg-black flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <div className="font-heading font-black tracking-[0.35em] text-white text-lg neon-cyan">EURYX</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400">Hatake Network</div>
          </div>
        </div>
        <h1 className="font-heading text-3xl font-black tracking-tight text-white mt-6">
          {mode === "login" ? "Sign In, Trainer." : "Forge your Identity."}
        </h1>
        <p className="text-sm font-mono text-slate-400 mt-2">
          {mode === "login"
            ? "Use your Hatake.Social account. One identity across the network."
            : "Create a Hatake.Social account — usable on both Euryx and hatake.social."}
        </p>
        {mode === "signup" && (
          <p className="text-[11px] font-mono text-amber-300/80 mt-3 leading-relaxed border-l-2 border-amber-400/40 pl-3">
            Heads-up: signup writes to the live Hatake user database. If you already have a Hatake account, use Sign in instead.
          </p>
        )}

        <form onSubmit={submit} className="space-y-3 mt-7">
          {mode === "signup" && (
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400">Callsign</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-euryx mt-1"
                placeholder="e.g. RedShard"
                required
                data-testid="auth-username-input"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-euryx mt-1"
              placeholder="trainer@hatake.social"
              required
              data-testid="auth-email-input"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-euryx mt-1"
              placeholder="••••••••"
              required
              minLength={6}
              data-testid="auth-password-input"
            />
          </div>

          {err && (
            <div
              className="text-xs font-mono text-fuchsia-300 bg-fuchsia-950/40 border border-fuchsia-500/40 rounded-md px-3 py-2"
              data-testid="auth-error"
            >
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-neon btn-neon-cyan w-full mt-2"
            data-testid="auth-submit-btn"
          >
            {loading ? "Linking…" : mode === "login" ? "Enter" : "Create Account"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-mono text-slate-500">
          {mode === "login" ? (
            <>
              No account?{" "}
              <Link href="/signup" className="text-euryx-cyan hover:underline" data-testid="auth-switch-signup-link">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Have an account?{" "}
              <Link href="/login" className="text-euryx-cyan hover:underline" data-testid="auth-switch-login-link">
                Sign in
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
