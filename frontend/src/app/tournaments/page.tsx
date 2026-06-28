"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Calendar, MapPin, DollarSign, Radio, Lock } from "lucide-react";

type T = {
  id: string;
  name: string;
  format: string;
  status: "upcoming" | "registration" | "live" | "finished";
  startsAt: string;
  registeredCnt: number;
  capacity: number;
  prizePool: string | null;
  region: string | null;
  description: string | null;
  bannerImageUrl: string | null;
};

const TABS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "registration", label: "Open" },
  { key: "upcoming", label: "Upcoming" },
  { key: "finished", label: "Past" },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  live: { bg: "bg-fuchsia-500/20", text: "text-fuchsia-300", ring: "ring-fuchsia-500/50", label: "LIVE" },
  registration: { bg: "bg-euryx-cyan/15", text: "text-euryx-cyan", ring: "ring-euryx-cyan/40", label: "OPEN" },
  upcoming: { bg: "bg-amber-500/15", text: "text-amber-300", ring: "ring-amber-500/40", label: "SOON" },
  finished: { bg: "bg-slate-700/40", text: "text-slate-400", ring: "ring-white/10", label: "DONE" },
};

const REGION_FLAG: Record<string, string> = {
  global: "🌐",
  na: "🇺🇸",
  eu: "🇪🇺",
  jp: "🇯🇵",
  latam: "🌎",
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<T[]>([]);
  const [tab, setTab] = useState<string>("all");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((d) => setTournaments(d.tournaments || []));
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.user || null));
  }, []);

  const filtered = useMemo(() => {
    if (tab === "all") return tournaments;
    return tournaments.filter((t) => t.status === tab);
  }, [tab, tournaments]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tournaments.length };
    for (const t of tournaments) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [tournaments]);

  return (
    <div className="min-h-screen pt-24 px-6 max-w-6xl mx-auto pb-32">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          <span className="text-[11px] font-mono uppercase tracking-[0.35em] text-slate-500">Competitive Circuit</span>
        </div>
        <h1 className="font-heading text-5xl md:text-6xl font-black tracking-tighter text-white" data-testid="tournaments-title">
          Tournaments
        </h1>
        <p className="font-mono text-sm text-slate-400 mt-3 max-w-xl">
          Brackets, cups, regional opens. Sign in with your Hatake account to register.
        </p>
      </motion.div>

      <div className="flex gap-2 mt-8 flex-wrap" data-testid="tournament-tabs">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              data-testid={`tournament-tab-${t.key}`}
              className={`px-4 py-2 rounded-full text-[11px] font-mono uppercase tracking-[0.2em] transition-all border ${
                active
                  ? "bg-euryx-cyan/15 text-euryx-cyan border-euryx-cyan/60"
                  : "bg-slate-900/60 text-slate-400 border-white/10 hover:text-white"
              }`}
            >
              {t.label}
              <span className="ml-2 text-slate-500">({counts[t.key] || 0})</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8" data-testid="tournament-grid">
        {filtered.map((t, i) => {
          const style = STATUS_STYLE[t.status];
          const date = new Date(t.startsAt);
          const fillPct = Math.min(100, (t.registeredCnt / Math.max(1, t.capacity)) * 100);
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              className="relative rounded-2xl overflow-hidden glass border border-white/10 hover:border-euryx-cyan/40 transition-all"
              data-testid={`tournament-${t.id}`}
            >
              <div className="relative h-32 overflow-hidden">
                {t.bannerImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.bannerImageUrl} alt="" className="w-full h-full object-cover opacity-60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-mono font-black tracking-[0.2em] ${style.bg} ${style.text} ring-1 ${style.ring}`}>
                    {t.status === "live" && <Radio className="inline w-3 h-3 mr-1 animate-pulse" />}
                    {style.label}
                  </span>
                  {t.region && (
                    <span className="px-2 py-1 rounded-full text-[10px] font-mono bg-black/50 border border-white/10 text-slate-300">
                      {REGION_FLAG[t.region] || "🌐"} {t.region.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] bg-black/50 border border-white/10 text-slate-300">
                  {t.format}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-heading text-xl font-black text-white">{t.name}</h3>
                {t.description && (
                  <p className="font-mono text-xs text-slate-400 mt-2 leading-relaxed line-clamp-2">{t.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4 text-[11px] font-mono">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-euryx-cyan" />
                    {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-3.5 h-3.5 text-euryx-cyan" />
                    {t.registeredCnt}/{t.capacity}
                  </div>
                  {t.prizePool && (
                    <div className="col-span-2 flex items-center gap-2 text-amber-300/90">
                      <DollarSign className="w-3.5 h-3.5" /> {t.prizePool}
                    </div>
                  )}
                </div>

                <div className="h-1 rounded-full bg-slate-900 mt-3 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-euryx-cyan to-euryx-fuchsia" style={{ width: `${fillPct}%` }} />
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500">
                    {fillPct >= 100 ? "Full" : `${Math.round(100 - fillPct)}% slots open`}
                  </span>
                  {t.status === "registration" && (
                    <button
                      data-testid={`tournament-register-${t.id}`}
                      disabled={!user}
                      className="btn-neon btn-neon-cyan py-1.5 px-3 text-[10px] disabled:opacity-40"
                    >
                      {user ? "Register" : <><Lock className="w-3 h-3" /> Sign in</>}
                    </button>
                  )}
                  {t.status === "live" && (
                    <button data-testid={`tournament-watch-${t.id}`} className="btn-neon btn-neon-fuchsia py-1.5 px-3 text-[10px]">
                      Watch
                    </button>
                  )}
                  {t.status === "upcoming" && (
                    <span className="text-[10px] font-mono text-slate-400">Opens soon</span>
                  )}
                  {t.status === "finished" && (
                    <span className="text-[10px] font-mono text-slate-500">Results</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 text-center text-slate-500 font-mono text-sm" data-testid="tournament-empty">
          No tournaments in this view.
        </div>
      )}
    </div>
  );
}
