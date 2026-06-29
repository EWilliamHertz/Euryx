"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  User, Sparkles, Newspaper, Layers, Wand2, Swords, Trophy, Store, Settings as SettingsIcon
} from "lucide-react";

type SessionUser = { id: string; username: string; email: string } | null;

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  external?: boolean;
  testId?: string;
};

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

  // Euryx specific routes mapped into the new layout
  const leftIcons: NavItem[] = [
    { href: "/dashboard", label: "Lobby", Icon: Newspaper, testId: "halo-nav-lobby" },
    { href: "/deck-builder", label: "Deck", Icon: Layers, testId: "halo-nav-deck" },
    { href: "/vault", label: "Vault", Icon: Wand2, testId: "halo-nav-vault" },
    { href: "/queue", label: "Arena", Icon: Swords, testId: "halo-nav-arena" },
  ];
  
  const rightIcons: NavItem[] = [
    { href: "/tournaments", label: "Cups", Icon: Trophy, testId: "halo-nav-tournaments" },
    { href: "https://hatake-social-beta.vercel.app/market", label: "Market", Icon: Store, external: true, testId: "halo-nav-market" },
    { href: "https://hatake-social-beta.vercel.app/apps", label: "Hatake", Icon: Wand2, external: true, testId: "halo-nav-hatake" },
    { href: "/settings", label: "Config", Icon: SettingsIcon, testId: "halo-nav-settings" },
  ];

  // ─── Arc geometry ─────────────────────────────────────────────────────────
  // Icons follow the inner dashed line path of the SVG arc:
  //   M 60 190 A 440 148 0 0 1 940 190
  const leftAngles = [-78, -55, -34, -14];
  const rightAngles = [14, 34, 55, 78];
  const rx = 44;       // % of container width
  const ry = 148;      // px
  const cx = 50;       // % (horizontal center)
  const cy = 190;      // px (bottom anchor of the arc)

  const computePos = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + rx * Math.sin(rad),
      y: cy - ry * Math.cos(rad),
    };
  };

  const positions = [
    ...leftAngles.map(computePos),
    ...rightAngles.map(computePos),
  ];
  const allIcons = [...leftIcons, ...rightIcons];

  const isActive = (item: NavItem) =>
    !item.external && (pathname === item.href || pathname.startsWith(item.href + "/"));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center select-none" data-testid="halo-nav">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="relative w-full max-w-5xl h-48 mb-2 pointer-events-auto"
      >
        {/* ─── Ambient glow ─────────────────────────────────────────────── */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 flex items-end justify-center">
          <div className="w-[88%] h-[150px] rounded-t-[100%] bg-cyan-500/15 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 flex items-end justify-center">
          <div className="w-[60%] h-[130px] rounded-t-[100%] bg-fuchsia-500/20 blur-3xl" />
        </div>

        {/* ─── The half-halo arc (SVG) ──────────────────────────────────── */}
        <svg
          className="absolute inset-x-0 bottom-0 w-full h-48 overflow-visible"
          viewBox="0 0 1000 190"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="haloStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="22%" stopColor="#06b6d4" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="78%" stopColor="#d946ef" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="haloSoft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
            </linearGradient>
            <filter id="haloGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Wide soft glow underlay */}
          <path
            d="M 40 190 A 460 160 0 0 1 960 190"
            fill="none"
            stroke="url(#haloSoft)"
            strokeWidth="16"
            filter="url(#haloGlow)"
          />
          {/* Main halo stroke */}
          <path
            d="M 40 190 A 460 160 0 0 1 960 190"
            fill="none"
            stroke="url(#haloStroke)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#haloGlow)"
          />
        </svg>

        {/* ─── Icons positioned along the arc ───────────────────────────── */}
        {allIcons.map((item, i) => {
          const pos = positions[i];
          const active = isActive(item);
          const className = `group flex flex-col items-center gap-1 transition-all duration-300 ${
            active
              ? "text-cyan-300 scale-110 drop-shadow-[0_0_10px_rgba(6,182,212,0.9)]"
              : "text-slate-400 hover:text-white hover:scale-110"
          }`;
          
          const inner = (
            <>
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                  active
                    ? "bg-cyan-500/20 border-cyan-400/70 shadow-[0_0_18px_rgba(6,182,212,0.7)]"
                    : "bg-slate-950/85 border-white/10 group-hover:border-cyan-400/40 group-hover:shadow-[0_0_14px_rgba(6,182,212,0.4)]"
                }`}
              >
                <item.Icon size={18} />
              </div>
              <span className="text-[9px] font-heading font-bold uppercase tracking-widest whitespace-nowrap">
                {item.label}
              </span>
            </>
          );
          
          const style: React.CSSProperties = {
            position: "absolute",
            left: `${pos.x}%`,
            top: `${pos.y}px`,
            transform: "translate(-50%, -50%)",
          };
          
          if (item.external) {
            return (
              <a
                key={item.href + i}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                style={style}
                className={className}
                data-testid={item.testId}
              >
                {inner}
              </a>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              style={style}
              className={className}
              data-testid={item.testId}
            >
              {inner}
            </Link>
          );
        })}

        {/* ─── Center Login / Profile bubble at apex of halo ────────────── */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: "-32px" }}
        >
          {user ? (
            <Link href="/profile" data-testid="halo-nav-profile" className="relative group block">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-white to-fuchsia-500 opacity-50 rounded-full blur-2xl group-hover:opacity-90 transition-opacity duration-500" />
              <motion.div
                whileHover={{ rotate: 8, scale: 1.08 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
                className="relative flex items-center justify-center w-[96px] h-[96px] rounded-full border-[3px] border-slate-950 text-white"
                style={{
                  background:
                    "conic-gradient(from 220deg at 50% 50%, #06b6d4 0deg, #ffffff 80deg, #d946ef 160deg, #06b6d4 280deg, #d946ef 340deg, #06b6d4 360deg)",
                  boxShadow:
                    "0 0 30px rgba(6,182,212,0.55), 0 0 60px rgba(217,70,239,0.35), inset 0 0 18px rgba(0,0,0,0.4)",
                }}
              >
                <div className="absolute inset-[3px] rounded-full bg-slate-950 flex flex-col items-center justify-center px-2">
                  <User size={22} className="mb-1 text-white" />
                  {(() => {
                    const name = user.username;
                    const trimmed = name.trim();
                    let top = trimmed;
                    let bottom = "";
                    const spaceIdx = trimmed.indexOf(" ");
                    
                    if (spaceIdx > 0) {
                      top = trimmed.slice(0, spaceIdx);
                      bottom = trimmed.slice(spaceIdx + 1);
                    } else if (trimmed.length > 5) {
                      const mid = Math.ceil(trimmed.length / 2);
                      top = trimmed.slice(0, mid);
                      bottom = trimmed.slice(mid);
                    }
                    
                    return (
                      <div className="flex flex-col items-center leading-[1.05] text-white max-w-[78px]">
                        <span className="text-[10px] font-heading font-black uppercase tracking-[0.15em] truncate w-full text-center">
                          {top}
                        </span>
                        {bottom && (
                          <span className="text-[10px] font-heading font-black uppercase tracking-[0.15em] truncate w-full text-center">
                            {bottom}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            </Link>
          ) : (
            <Link href="/login" data-testid="halo-nav-login" className="relative group block">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-fuchsia-500 opacity-50 rounded-full blur-2xl group-hover:opacity-90 transition" />
              <motion.div
                whileHover={{ scale: 1.08 }}
                className="relative flex flex-col items-center justify-center w-[96px] h-[96px] rounded-full border-[3px] border-slate-950 text-white"
                style={{
                  background: "linear-gradient(135deg, #06b6d4, #d946ef)",
                  boxShadow: "0 0 30px rgba(6,182,212,0.55), 0 0 60px rgba(217,70,239,0.35)",
                }}
              >
                <Sparkles size={28} className="mb-1" />
                <span className="text-[10px] font-heading font-black uppercase tracking-[0.22em]">Sign In</span>
              </motion.div>
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}
