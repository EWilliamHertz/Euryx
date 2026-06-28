"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Swords, Wand2, Trophy, ArrowUpRight, Activity, Globe2, Flame, BookOpenCheck } from "lucide-react";
import { useEffect, useState } from "react";

type Tournament = { id: string; name: string; status: string; startsAt: string; registeredCnt: number; capacity: number; region: string | null };

export default function DashboardPage() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [cardCount, setCardCount] = useState<number | null>(null);
  const [deckCount, setDeckCount] = useState<number>(0);
  const [liveTournaments, setLiveTournaments] = useState<number>(0);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.user || null));
    fetch("/api/pokemon/count")
      .then((r) => r.json())
      .then((d) => { if (typeof d.count === "number" && d.count > 0) setCardCount(d.count); });
    fetch("/api/decks", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setDeckCount((d.decks || []).length))
      .catch(() => {});
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((d) => {
        const tournaments: Tournament[] = d.tournaments || [];
        setLiveTournaments(tournaments.filter((t) => t.status === "live").length);
      });
  }, []);

  const cards = [
    {
      title: "Enter Queue",
      subtitle: "Live ranked matchmaking",
      href: "/queue",
      icon: Swords,
      accent: "from-euryx-cyan/30 to-cyan-500/0",
      border: "border-euryx-cyan/40",
      glow: "shadow-[0_0_30px_rgba(0,240,255,0.25)]",
      badge: "LIVE",
      testId: "lobby-enter-queue-btn",
      primary: true,
    },
    {
      title: "Vault",
      subtitle: deckCount > 0 ? `${deckCount} deck${deckCount === 1 ? "" : "s"} saved` : "Build your first deck",
      href: "/vault",
      icon: Wand2,
      accent: "from-euryx-fuchsia/30 to-fuchsia-600/0",
      border: "border-euryx-fuchsia/40",
      glow: "shadow-[0_0_30px_rgba(255,0,255,0.22)]",
      badge: cardCount ? `${cardCount.toLocaleString()} cards` : "Hatake-powered",
      testId: "lobby-vault-btn",
    },
    {
      title: "Tournaments",
      subtitle: liveTournaments > 0 ? `${liveTournaments} live now` : "Brackets, cups & opens",
      href: "/tournaments",
      icon: Trophy,
      accent: "from-amber-400/20 to-transparent",
      border: "border-amber-400/30",
      glow: "shadow-[0_0_28px_rgba(251,191,36,0.18)]",
      badge: liveTournaments > 0 ? `${liveTournaments} LIVE` : "8 active",
      testId: "lobby-tournaments-btn",
    },
  ];

  return (
    <div className="relative min-h-screen pt-24 pb-24 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1687560466164-1eeddb3b119b?crop=entropy&cs=srgb&fm=jpg&q=85"
          alt=""
          className="w-full h-full object-cover opacity-25 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-euryx-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-euryx-cyan" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-[0.4em] text-slate-400">
              Hatake Network · Online
            </span>
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-black tracking-tighter text-white leading-none" data-testid="dashboard-title">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-euryx-cyan via-white to-euryx-fuchsia text-transparent bg-clip-text">
              {user?.username || "Trainer"}
            </span>
            .
          </h1>
          <p className="font-mono text-slate-400 mt-4 max-w-xl text-sm leading-relaxed">
            Queue for a ranked match, forge a deck in the vault, or jump into an open cup.
            Cards glide. Players don't.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
          {[
            { label: "Vault Cards", value: cardCount ? cardCount.toLocaleString() : "—", icon: Globe2, glow: "text-euryx-cyan" },
            { label: "Your Decks", value: String(deckCount), icon: BookOpenCheck, glow: "text-euryx-cyan" },
            { label: "Live Cups", value: String(liveTournaments), icon: Flame, glow: "text-euryx-fuchsia" },
            { label: "Season", value: "S01", icon: Trophy, glow: "text-amber-400" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="glass rounded-xl p-4 flex items-center justify-between" data-testid={`dashboard-stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500">{s.label}</div>
                  <div className="font-heading font-black text-2xl text-white mt-1">{s.value}</div>
                </div>
                <Icon className={`w-5 h-5 ${s.glow}`} />
              </div>
            );
          })}
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.1, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="group"
              >
                <Link href={c.href} data-testid={c.testId}>
                  <div className={`relative h-72 rounded-2xl border ${c.border} ${c.glow} bg-slate-950/60 backdrop-blur-xl p-6 overflow-hidden card-sheen transition-all hover:bg-slate-950/80`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${c.accent} opacity-60 pointer-events-none`} />
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-start justify-between">
                        <Icon className="w-7 h-7 text-white" />
                        {c.badge && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-[0.25em] border ${c.primary ? "border-euryx-cyan/60 text-euryx-cyan animate-pulse-glow" : "border-white/20 text-slate-300"}`}>
                            {c.badge}
                          </span>
                        )}
                      </div>
                      <div className="mt-auto">
                        <h3 className="font-heading text-3xl font-black text-white tracking-tight">{c.title}</h3>
                        <p className="font-mono text-xs text-slate-400 mt-2 tracking-wider">{c.subtitle}</p>
                        <div className="mt-5 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.25em] text-white opacity-70 group-hover:opacity-100 transition">
                          Enter <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-16 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.3em] text-slate-600 border-t border-white/5 pt-6">
          <span>Euryx · v0.2 · Hatake-bridged</span>
          <span className="text-euryx-cyan/70">/// Powered by Hatake.Social</span>
        </motion.div>
      </div>
    </div>
  );
}
