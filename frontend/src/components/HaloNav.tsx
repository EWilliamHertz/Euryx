"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, BookOpenCheck, Trophy, LogIn, LogOut, User2, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: Zap, testId: "halo-nav-dashboard-link" },
  { label: "Deck Builder", href: "/deck-builder", icon: BookOpenCheck, testId: "halo-nav-deck-builder-link" },
  { label: "Queue", href: "/queue", icon: Swords, testId: "halo-nav-queue-link" },
  { label: "Tournaments", href: "/tournaments", icon: Trophy, testId: "halo-nav-tournaments-link" },
];

type SessionUser = { id: string; email: string; username: string } | null;

export function HaloNav() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [user, setUser] = useState<SessionUser>(null);
  const [loaded, setLoaded] = useState(false);

  // Hide on the game board for distraction-free play
  const hide = pathname.startsWith("/play/");

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (mounted) {
          setUser(d.user || null);
          setLoaded(true);
        }
      })
      .catch(() => mounted && setLoaded(true));
    return () => {
      mounted = false;
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.push("/login");
  }

  if (hide) return null;

  return (
    <AnimatePresence>
      <motion.nav
        key="halo-nav"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-float"
        data-testid="halo-nav"
      >
        <div
          className="glass-strong rounded-full px-3 py-2 flex items-center gap-1.5"
          style={{ boxShadow: "0 0 35px rgba(0, 240, 255, 0.18), 0 0 70px rgba(255, 0, 255, 0.08)" }}
        >
          <Link
            href="/dashboard"
            data-testid="halo-nav-logo"
            className="px-3 py-1.5 mr-1 flex items-center gap-2 group"
          >
            <span className="relative inline-block w-7 h-7">
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-euryx-cyan to-euryx-fuchsia opacity-90 group-hover:opacity-100 transition" />
              <span className="absolute inset-[3px] rounded-full bg-black flex items-center justify-center font-heading font-black text-[11px] text-white">
                E
              </span>
            </span>
            <span className="font-heading font-black tracking-[0.25em] text-sm text-white neon-cyan">
              EURYX
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={item.testId}
                  className={`relative px-3 py-2 rounded-full flex items-center gap-2 text-xs font-mono uppercase tracking-[0.15em] transition-all
                    ${active ? "text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="halo-nav-active"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-euryx-cyan/20 to-euryx-fuchsia/20 border border-euryx-cyan/40"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {loaded && user ? (
            <div className="flex items-center gap-2 pl-1 pr-1">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
                data-testid="halo-nav-user-chip"
              >
                <User2 className="w-3.5 h-3.5 text-euryx-cyan" />
                <span className="font-mono text-[11px] tracking-wider text-slate-200">
                  {user.username}
                </span>
              </div>
              <button
                onClick={logout}
                data-testid="halo-nav-logout-btn"
                className="p-2 rounded-full hover:bg-euryx-fuchsia/15 transition text-slate-300 hover:text-white"
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              data-testid="halo-nav-login-link"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-euryx-cyan/10 border border-euryx-cyan/30 hover:bg-euryx-cyan/20 transition text-xs font-mono uppercase tracking-[0.15em] text-euryx-cyan"
            >
              <LogIn className="w-3.5 h-3.5" /> Login
            </Link>
          )}
        </div>
      </motion.nav>
    </AnimatePresence>
  );
}
