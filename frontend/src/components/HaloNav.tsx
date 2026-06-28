"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Swords, Newspaper, Wand2, Layers,
  Trophy, MessageCircle, User, Settings as SettingsIcon, Store,
} from "lucide-react";

type SessionUser = { id: string; username: string; email: string } | null;

// Left + right link sets — keeping the same architecture as
// hatake.social's HaloNav (4 left + center profile + 4 right).
const LEFT = [
  { href: "/dashboard", icon: Newspaper, label: "Lobby", testId: "halo-nav-lobby" },
  { href: "/deck-builder", icon: Layers, label: "Deck", testId: "halo-nav-deck" },
  { href: "/vault", icon: Wand2, label: "Vault", testId: "halo-nav-vault" },
  { href: "/queue", icon: Swords, label: "Arena", testId: "halo-nav-arena" },
];

const RIGHT = [
  { href: "/tournaments", icon: Trophy, label: "Cups", testId: "halo-nav-tournaments" },
  { href: "https://hatake-social-beta.vercel.app/market", external: true, icon: Store, label: "Market", testId: "halo-nav-market" },
  { href: "https://hatake-social-beta.vercel.app/apps", external: true, icon: Wand2, label: "Hatake", testId: "halo-nav-hatake" },
  { href: "/settings", icon: SettingsIcon, label: "Config", testId: "halo-nav-settings" },
];

function NavLink({
  href, icon: Icon, label, active, external, testId,
}: {
  href: string; icon: any; label: string; active: boolean;
  external?: boolean; testId?: string;
}) {
  const cls = `relative flex flex-col items-center gap-1 transition-all duration-300 ${
    active
      ? "text-euryx-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.9)] scale-110"
      : "text-slate-400 hover:text-white hover:scale-105"
  }`;
  const inner = (
    <>
      {active && (
        <motion.span
          layoutId="halo-active-ring"
          className="absolute -inset-x-2 -top-1 -bottom-1 rounded-full bg-euryx-cyan/10 border border-euryx-cyan/40"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <Icon size={20} className="relative z-10" />
      <span className="text-[10px] font-heading font-bold uppercase tracking-[0.18em] relative z-10">{label}</span>
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} data-testid={testId}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} data-testid={testId}>{inner}</Link>
  );
}

export function HaloNav() {
  const pathname = usePathname() || "/";
  const [user, setUser] = useState<SessionUser>(null);

  useEffect(() => {
    let on = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (on) setUser(d.user || null); })
      .catch(() => {});
    return () => { on = false; };
  }, [pathname]);

  // Distraction-free game canvas — HaloNav hides.
  if (pathname.startsWith("/play/")) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center" data-testid="halo-nav">
      <div className="relative w-full max-w-5xl mb-4 pointer-events-auto flex items-end justify-center px-4">
        {/* Ambient glow */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[70%] h-[60px] bg-euryx-cyan/25 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[35%] h-[80px] bg-euryx-fuchsia/20 rounded-full blur-3xl -z-10" />

        {/* The Halo */}
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="relative w-full md:w-[1040px] h-[92px] flex justify-between items-end pb-3 px-5 md:px-14 overflow-visible"
          style={{
            borderRadius: "50% 50% 22px 22px / 70% 70% 22px 22px",
            background:
              "linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(2,6,23,0.78) 100%)",
            backdropFilter: "blur(28px) saturate(160%)",
            WebkitBackdropFilter: "blur(28px) saturate(160%)",
            border: "1px solid rgba(0, 240, 255, 0.25)",
            borderBottom: "1px solid rgba(255, 0, 255, 0.18)",
            boxShadow:
              "inset 0 2px 30px rgba(0, 240, 255, 0.18), inset 0 -10px 30px rgba(255, 0, 255, 0.07), 0 14px 50px rgba(0, 0, 0, 0.65)",
          }}
        >
          {/* Top curved highlight */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-[2px] pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(0,240,255,0.55) 30%, rgba(255,255,255,0.85) 50%, rgba(255,0,255,0.55) 70%, transparent 100%)",
              filter: "blur(0.5px)",
            }}
          />

          {/* Left links */}
          <div className="flex gap-6 md:gap-10 items-center pb-1">
            {LEFT.map((l) => (
              <NavLink
                key={l.href}
                href={l.href}
                icon={l.icon}
                label={l.label}
                testId={l.testId}
                active={pathname === l.href || pathname.startsWith(l.href + "/")}
              />
            ))}
          </div>

          {/* Center floating profile bubble */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-10">
            {user ? (
              <Link href="/profile" className="relative group block" data-testid="halo-nav-profile">
                <div className="absolute inset-0 bg-gradient-to-tr from-euryx-cyan via-white to-euryx-fuchsia opacity-50 rounded-full blur-2xl group-hover:opacity-90 transition-opacity duration-500" />
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  className="relative flex flex-col items-center justify-center w-[96px] h-[96px] rounded-full border-[3px] border-slate-950 text-white"
                  style={{
                    background:
                      "conic-gradient(from 220deg at 50% 50%, #00f0ff 0deg, #ffffff 80deg, #ff00ff 160deg, #00f0ff 280deg, #ff00ff 340deg, #00f0ff 360deg)",
                    boxShadow:
                      "0 0 30px rgba(0,240,255,0.55), 0 0 60px rgba(255,0,255,0.35), inset 0 0 18px rgba(0,0,0,0.4)",
                  }}
                >
                  <div className="absolute inset-[3px] rounded-full bg-slate-950 flex flex-col items-center justify-center">
                    <User size={26} className="mb-0.5 text-white" />
                    <span className="text-[9px] font-heading font-black uppercase tracking-[0.22em] text-white max-w-[80px] truncate px-1">
                      {user.username}
                    </span>
                  </div>
                </motion.div>
              </Link>
            ) : (
              <Link href="/login" className="relative group block" data-testid="halo-nav-login">
                <div className="absolute inset-0 bg-gradient-to-tr from-euryx-cyan to-euryx-fuchsia opacity-50 rounded-full blur-2xl group-hover:opacity-90 transition" />
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="relative flex flex-col items-center justify-center w-[96px] h-[96px] rounded-full border-[3px] border-slate-950 text-white"
                  style={{
                    background: "linear-gradient(135deg, #00f0ff, #ff00ff)",
                    boxShadow: "0 0 30px rgba(0,240,255,0.55), 0 0 60px rgba(255,0,255,0.35)",
                  }}
                >
                  <Sparkles size={28} className="mb-1" />
                  <span className="text-[10px] font-heading font-black uppercase tracking-[0.22em]">Sign In</span>
                </motion.div>
              </Link>
            )}
          </div>

          {/* Right links */}
          <div className="flex gap-6 md:gap-10 items-center pb-1">
            {RIGHT.map((l) => (
              <NavLink
                key={l.href}
                href={l.href}
                icon={l.icon}
                label={l.label}
                testId={l.testId}
                external={l.external}
                active={pathname === l.href || pathname.startsWith(l.href + "/")}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
